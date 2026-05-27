"""End-to-end test for the preview-overrides router.

Walks through:
  1. Public + admin endpoints return empty when no overrides exist.
  2. Non-admin user can hit the public endpoint, gets 403 on the admin
     endpoints (skipped here since require_admin already covers it
     via deps; we focus on the data-shape contract).
  3. Admin sets an override for "hero" → public + admin endpoints
     both surface it.
  4. Type mismatch is rejected (can't set a comparison-table section
     as the hero preview).
  5. Unknown section_id is 404'd.
  6. Setting `section_id=null` clears the override.
  7. If the underlying library section is deleted, the public
     endpoint silently drops the stale pointer; the admin endpoint
     surfaces it as "(section deleted)".

Run with:
    cd /app/backend && bash -c 'set -a; source .env; set +a; \\
      python tests_preview_overrides.py'
"""
import asyncio
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException

from db import db
from deps import User
from routers.preview_overrides import (
    OverrideUpdate,
    get_public_preview_overrides,
    list_overrides,
    set_override,
)


async def _seed_section(section_type: str, name: str, user_id: str) -> str:
    sid = f"sec_{uuid.uuid4().hex[:8]}"
    await db.sections.insert_one(
        {
            "section_id": sid,
            "name": name,
            "type": section_type,
            "config": {"title": f"Preview · {name}"},
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
    )
    return sid


def fake_admin(uid="u_admin", email="admin@test.local") -> User:
    return User(
        user_id=uid,
        email=email,
        name="Admin",
        created_at=datetime.now(timezone.utc),
        is_admin=True,
    )


async def run() -> int:
    test_user_id = f"u_{uuid.uuid4().hex[:8]}"
    admin = fake_admin(test_user_id, "admin@test.local")
    # Use a private collection key under a unique settings key so
    # parallel test runs and the live app's overrides don't collide.
    # The router hardcodes `_id="preview_overrides"`, so we snapshot &
    # restore the live doc to keep this test repeatable.
    settings_backup = await db.app_settings.find_one({"_id": "preview_overrides"})
    await db.app_settings.delete_one({"_id": "preview_overrides"})

    # Seed the admin user doc so `list_overrides`' email lookup works.
    await db.users.insert_one(
        {
            "user_id": admin.user_id,
            "email": admin.email,
            "name": admin.name,
            "created_at": datetime.now(timezone.utc),
            "is_active": True,
        }
    )

    pass_count = 0
    fail_count = 0

    def assert_eq(label, actual, expected):
        nonlocal pass_count, fail_count
        if actual == expected:
            print(f"PASS · {label}")
            pass_count += 1
        else:
            print(f"FAIL · {label} — expected={expected!r} actual={actual!r}")
            fail_count += 1

    def assert_true(label, cond, detail=""):
        nonlocal pass_count, fail_count
        if cond:
            print(f"PASS · {label}")
            pass_count += 1
        else:
            print(f"FAIL · {label}{(' — ' + detail) if detail else ''}")
            fail_count += 1

    seeded_ids: list[str] = []
    try:
        # 1. Empty state.
        pub = await get_public_preview_overrides()
        assert_eq("public endpoint returns {} when empty", pub, {})
        adm = await list_overrides(admin)
        assert_eq("admin endpoint returns [] when empty", adm, [])

        # 2. Seed two sections — one hero, one comparison-table.
        hero_sid = await _seed_section("hero", "Brand homepage hero", test_user_id)
        seeded_ids.append(hero_sid)
        compare_sid = await _seed_section(
            "comparison-table", "Why us vs them", test_user_id
        )
        seeded_ids.append(compare_sid)

        # 3. Admin sets the hero override.
        result = await set_override(
            "hero", OverrideUpdate(section_id=hero_sid), admin
        )
        assert_true("set_override returns the saved entry", result is not None)
        assert_eq("saved entry points at the right section",
                  result.section_id, hero_sid)
        assert_eq("saved entry records the admin user_id",
                  result.set_by, admin.user_id)

        pub = await get_public_preview_overrides()
        assert_true("public endpoint surfaces 'hero' override",
                    "hero" in pub, f"keys={list(pub.keys())}")
        snap = pub.get("hero")
        assert_eq("public snapshot type matches",
                  snap.type if snap else None, "hero")
        assert_eq("public snapshot section_id matches",
                  snap.section_id if snap else None, hero_sid)
        assert_true("public snapshot includes config",
                    bool(snap and snap.config), f"snap={snap}")

        adm = await list_overrides(admin)
        assert_eq("admin list has one row", len(adm), 1)
        assert_eq("admin row name matches seeded section",
                  adm[0].name, "Brand homepage hero")
        assert_eq("admin row set_by_email matches",
                  adm[0].set_by_email, "admin@test.local")

        # 4. Type mismatch.
        try:
            await set_override(
                "hero", OverrideUpdate(section_id=compare_sid), admin
            )
            assert_true("type mismatch raises", False,
                        "expected HTTPException 400")
        except HTTPException as e:
            assert_eq("type mismatch returns 400", e.status_code, 400)
            assert_true("type mismatch error mentions both types",
                        "hero" in e.detail and "comparison-table" in e.detail)

        # 5. Unknown section_id.
        try:
            await set_override(
                "hero", OverrideUpdate(section_id="sec_does_not_exist"), admin
            )
            assert_true("unknown section_id raises", False,
                        "expected HTTPException 404")
        except HTTPException as e:
            assert_eq("unknown section_id returns 404", e.status_code, 404)

        # 6. Clear the override.
        cleared = await set_override(
            "hero", OverrideUpdate(section_id=None), admin
        )
        assert_eq("clearing returns None", cleared, None)
        pub = await get_public_preview_overrides()
        assert_eq("public endpoint is empty after clear", pub, {})

        # 7. Stale pointer — set then delete the underlying section.
        await set_override(
            "comparison-table",
            OverrideUpdate(section_id=compare_sid),
            admin,
        )
        await db.sections.delete_one({"section_id": compare_sid})

        pub = await get_public_preview_overrides()
        assert_true(
            "public endpoint silently drops stale pointer",
            "comparison-table" not in pub,
            f"unexpectedly returned {pub}",
        )
        adm = await list_overrides(admin)
        stale = next(
            (r for r in adm if r.section_type == "comparison-table"), None
        )
        assert_true("admin endpoint surfaces stale pointer",
                    stale is not None)
        assert_eq("stale pointer surfaces sentinel name",
                  stale.name if stale else None, "(section deleted)")

    finally:
        # Restore the original app_settings doc (if any) so the live
        # app isn't perturbed by this test run.
        await db.app_settings.delete_one({"_id": "preview_overrides"})
        if settings_backup:
            settings_backup.pop("_id", None)
            await db.app_settings.update_one(
                {"_id": "preview_overrides"},
                {"$set": settings_backup},
                upsert=True,
            )
        # Tidy up seeded sections (the second one is already gone).
        for sid in seeded_ids:
            await db.sections.delete_one({"section_id": sid})
        await db.users.delete_one({"user_id": admin.user_id})

    print(f"\n{pass_count} passed, {fail_count} failed")
    return 1 if fail_count else 0


if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(run()))
