"""End-to-end test for the collections router.

Walks through:
  1. List empty → []
  2. Create two collections → list returns them alphabetically
  3. Update name + colour
  4. Create a section and move it into a collection
  5. Section's collection_id reflects the move; section list still
     returns it (collection-filtering is a frontend concern)
  6. Move section back to null (unfile)
  7. Attempt to move into a collection that doesn't exist → 422
  8. Attempt to move into another user's collection → 422
  9. Delete a collection → sections that pointed at it become unfiled
 10. Cleanup

Run with:
    cd /app/backend && bash -c 'set -a; source .env; set +a; python tests_collections_flow.py'
"""
import asyncio
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException

from db import db
from deps import User
from routers.collections import (
    CollectionIn,
    MoveItemRequest,
    create_collection,
    delete_collection,
    list_collections,
    move_section,
    update_collection,
)
from routers.sections import SectionIn, create_section, get_section


def fake_user(email: str) -> User:
    return User(
        user_id=str(uuid.uuid4()),
        email=email,
        name="test",
        picture=None,
        created_at=datetime.now(timezone.utc),
        last_login_at=datetime.now(timezone.utc),
        is_active=True,
        is_admin=False,
    )


passed = 0
failed = 0


def check(label: str, cond: bool, extra: str = ""):
    global passed, failed
    if cond:
        print(f"PASS · {label}")
        passed += 1
    else:
        suffix = f" — {extra}" if extra else ""
        print(f"FAIL · {label}{suffix}")
        failed += 1


async def run():
    user = fake_user(f"colltest+{uuid.uuid4().hex[:8]}@example.test")
    other = fake_user(f"colltest+{uuid.uuid4().hex[:8]}@example.test")

    # 1. Empty list
    listed = await list_collections(user)
    check("Empty list returns []", listed == [])

    # 2. Create two collections; verify alphabetical sort.
    arc = await create_collection(CollectionIn(name="Arcserve", color="red"), user)
    q4 = await create_collection(CollectionIn(name="Q4 campaign", color="sky"), user)
    listed = await list_collections(user)
    names = [c.name for c in listed]
    check(
        "Two collections listed alphabetically",
        names == ["Arcserve", "Q4 campaign"],
        f"got {names}",
    )
    check("Created colour stored verbatim (red)", arc.color == "red")
    check("Created colour stored verbatim (sky)", q4.color == "sky")

    # 3. Update name + colour.
    updated = await update_collection(
        arc.collection_id,
        CollectionIn(name="Arcserve Cyber", color="emerald"),
        user,
    )
    check("Rename + recolour returns updated doc",
          updated.name == "Arcserve Cyber" and updated.color == "emerald")

    # 4 + 5. Create section, move it into a collection.
    sec = await create_section(
        SectionIn(name="Test section", type="hero", config={"slides": []}), user
    )
    check("Section starts unfiled (collection_id is None)", sec.collection_id is None)
    await move_section(
        sec.section_id, MoveItemRequest(collection_id=arc.collection_id), user
    )
    refreshed = await get_section(sec.section_id, user)
    check(
        "After move_section, section reports the new collection_id",
        refreshed.collection_id == arc.collection_id,
        f"got {refreshed.collection_id}",
    )

    # 6. Move back to null.
    await move_section(sec.section_id, MoveItemRequest(collection_id=None), user)
    refreshed = await get_section(sec.section_id, user)
    check("Move to null unfiles the section", refreshed.collection_id is None)

    # 7. Non-existent collection → 422.
    try:
        await move_section(
            sec.section_id, MoveItemRequest(collection_id="col_doesnotexist"), user
        )
        check("Move to non-existent collection raises", False, "no exception")
    except HTTPException as e:
        check(
            "Move to non-existent collection raises 422",
            e.status_code == 422,
            f"got {e.status_code}",
        )

    # 8. Cross-tenant move → 422 (other user owns the collection).
    other_coll = await create_collection(
        CollectionIn(name="Other user folder", color="violet"), other
    )
    try:
        await move_section(
            sec.section_id,
            MoveItemRequest(collection_id=other_coll.collection_id),
            user,
        )
        check("Move to other user's collection raises", False, "no exception")
    except HTTPException as e:
        check(
            "Cross-tenant move raises 422",
            e.status_code == 422,
            f"got {e.status_code}",
        )

    # 9. Delete collection → previously-filed sections become unfiled.
    await move_section(
        sec.section_id, MoveItemRequest(collection_id=arc.collection_id), user
    )
    await delete_collection(arc.collection_id, user)
    refreshed = await get_section(sec.section_id, user)
    check(
        "Delete cascade nulls collection_id on filed sections",
        refreshed.collection_id is None,
        f"got {refreshed.collection_id}",
    )
    listed = await list_collections(user)
    check(
        "After delete the collection is removed from list",
        all(c.collection_id != arc.collection_id for c in listed),
    )

    # 10. Create-time collection_id: a new section should land directly
    # inside the target collection (skip the move-after-create step).
    arc2 = await create_collection(
        CollectionIn(name="Arcserve 2", color="amber"), user
    )
    sec2 = await create_section(
        SectionIn(
            name="Pre-filed section",
            type="hero",
            config={"slides": []},
            collection_id=arc2.collection_id,
        ),
        user,
    )
    check(
        "create_section honours payload.collection_id (pre-filed)",
        sec2.collection_id == arc2.collection_id,
        f"got {sec2.collection_id}",
    )

    # 11. Create-time collection_id pointing at a non-existent / other
    # user's collection → 422 (mirrors move endpoint contract).
    try:
        await create_section(
            SectionIn(
                name="Should fail",
                type="hero",
                config={"slides": []},
                collection_id="col_doesnotexist",
            ),
            user,
        )
        check("create_section rejects unknown collection_id", False, "no exception")
    except HTTPException as e:
        check(
            "create_section rejects unknown collection_id (422)",
            e.status_code == 422,
            f"got {e.status_code}",
        )

    # 12. Cleanup the extras.
    await db.sections.delete_one({"section_id": sec.section_id})
    await db.sections.delete_one({"section_id": sec2.section_id})
    await db.collections.delete_many({"user_id": user.user_id})
    await db.collections.delete_many({"user_id": other.user_id})

    print(f"\n{passed} passed, {failed} failed")
    return failed


if __name__ == "__main__":
    code = asyncio.run(run())
    raise SystemExit(0 if code == 0 else 1)
