"""End-to-end test for the tickets router covering the new
reject/notification/per-side-delete flow.

Walks through:
  1. Reporter files a ticket → admin lists it, count=1, reporter notif=0
  2. Admin rejects → reporter notif=1, /mine shows status=rejected + unread
  3. Reporter visits /mine (auto seen) → notif=0
  4. Admin re-opens → reporter notif=0 (open status does NOT notify)
  5. Admin marks complete → reporter notif=1
  6. Reporter deletes (soft-hide) → /mine drops it, admin still sees it
  7. Admin deletes (soft-hide) → ticket is hard-deleted from MongoDB

Run with:
    cd /app/backend && bash -c 'set -a; source .env; set +a; python tests_tickets_flow.py'
"""
import asyncio
import uuid
from datetime import datetime, timezone

from db import db
from routers.tickets import (
    TicketCreate,
    TicketReplyCreate,
    TicketStatusUpdate,
    create_ticket,
    delete_ticket,
    list_my_tickets,
    list_tickets,
    mark_admin_tickets_seen,
    mark_my_tickets_seen,
    my_ticket_notifications,
    reply_to_ticket,
    ticket_count,
    update_ticket,
)
from deps import User, ADMIN_EMAILS


def fake_user(email: str, name: str, is_admin: bool = False) -> User:
    return User(
        user_id=str(uuid.uuid4()),
        email=email,
        name=name,
        picture=None,
        created_at=datetime.now(timezone.utc),
        last_login_at=datetime.now(timezone.utc),
        is_active=True,
        is_admin=is_admin,
    )


ADMIN_EMAIL = next(iter(ADMIN_EMAILS))
REPORTER_EMAIL = f"tickettest+{uuid.uuid4().hex[:8]}@example.test"

passed = 0
failed = 0


def check(label: str, cond: bool, extra: str = ""):
    global passed, failed
    if cond:
        print(f"PASS · {label}")
        passed += 1
    else:
        print(f"FAIL · {label}{(' — ' + extra) if extra else ''}")
        failed += 1


async def main():
    admin = fake_user(ADMIN_EMAIL, "Admin", is_admin=True)
    reporter = fake_user(REPORTER_EMAIL, "Reporter", is_admin=False)

    # Clean slate for this reporter.
    await db.tickets.delete_many({"created_by_email": REPORTER_EMAIL})

    # 1. Reporter files a ticket.
    payload = TicketCreate(
        type="bug",
        title=f"Test bug {uuid.uuid4().hex[:6]}",
        description="Body of the bug",
        screenshots=[],
    )
    created = await create_ticket(payload, reporter)
    tid = created.id
    check("create: status defaults to open", created.status == "open")

    admin_list = await list_tickets(admin)
    ours = [t for t in admin_list if t.id == tid]
    check("admin list: reporter ticket visible", len(ours) == 1)

    my = await list_my_tickets(reporter)
    check("mine list: own ticket visible", any(t.id == tid for t in my))
    own = next(t for t in my if t.id == tid)
    check("mine list: unread=False on fresh ticket", own.unread is False)

    notif = await my_ticket_notifications(reporter)
    check(
        "notifications: 0 on fresh ticket (reporter_seen=True)",
        notif.count == 0,
    )

    # 2. Admin rejects.
    await update_ticket(tid, TicketStatusUpdate(status="rejected"), admin)
    notif = await my_ticket_notifications(reporter)
    check("notifications: 1 after admin reject", notif.count == 1, f"got {notif.count}")
    my = await list_my_tickets(reporter)
    own = next(t for t in my if t.id == tid)
    check("mine list: status=rejected", own.status == "rejected")
    check("mine list: unread=True after admin reject", own.unread is True)

    # 3. Reporter clears notifications.
    await mark_my_tickets_seen(reporter)
    notif = await my_ticket_notifications(reporter)
    check("notifications: 0 after mark seen", notif.count == 0)
    my = await list_my_tickets(reporter)
    own = next(t for t in my if t.id == tid)
    check("mine list: unread=False after mark seen", own.unread is False)

    # 4. Admin reopens (open should NOT raise a notification).
    await update_ticket(tid, TicketStatusUpdate(status="open"), admin)
    notif = await my_ticket_notifications(reporter)
    check(
        "notifications: 0 after admin re-open (no notify on 'open')",
        notif.count == 0,
        f"got {notif.count}",
    )

    # 5. Admin marks complete — notify again.
    await update_ticket(tid, TicketStatusUpdate(status="complete"), admin)
    notif = await my_ticket_notifications(reporter)
    check("notifications: 1 after admin complete", notif.count == 1, f"got {notif.count}")

    # 6. Reporter soft-deletes — drops from /mine, admin still sees it.
    res = await delete_ticket(tid, reporter)
    check("reporter delete: hard_deleted=False", res.get("hard_deleted") is False)
    my = await list_my_tickets(reporter)
    check("mine list: hidden after reporter delete", all(t.id != tid for t in my))
    admin_list = await list_tickets(admin)
    check(
        "admin list: still visible after reporter-only delete",
        any(t.id == tid for t in admin_list),
    )

    # 7. Admin deletes too → hard delete from DB.
    res = await delete_ticket(tid, admin)
    check("admin delete after reporter hid: hard_deleted=True", res.get("hard_deleted") is True)
    doc = await db.tickets.find_one({"id": tid}, {"_id": 0})
    check("DB: document removed after mutual hide", doc is None)

    # 8. Ticket count excludes admin-hidden — extra safety: create another
    # ticket, admin hides, the count should return to its prior baseline
    # (admin-hidden tickets do not contribute to the badge).
    baseline_count = (await ticket_count(admin))["open"]
    other = await create_ticket(
        TicketCreate(type="feature", title="Hidden", description="x"), reporter
    )
    after_create = (await ticket_count(admin))["open"]
    await delete_ticket(other.id, admin)  # admin soft-hides
    count = await ticket_count(admin)
    admin_list2 = await list_tickets(admin)
    check(
        "admin count + list exclude admin-hidden tickets",
        all(t.id != other.id for t in admin_list2)
        and count["open"] == baseline_count
        and after_create == baseline_count + 1,
        f"baseline={baseline_count} after_create={after_create} after_hide={count['open']} "
        f"hidden_in_list={any(t.id == other.id for t in admin_list2)}",
    )
    # Cleanup: reporter also hides → hard delete.
    await delete_ticket(other.id, reporter)
    doc2 = await db.tickets.find_one({"id": other.id})
    check("cleanup: hidden-then-hidden hard-deletes", doc2 is None)

    # 9. Reply thread + strict turn-taking enforcement.
    fresh = await create_ticket(
        TicketCreate(type="bug", title="Reply test", description="initial body"),
        reporter,
    )
    rid = fresh.id
    check(
        "fresh ticket: next_turn=admin (reporter just submitted)",
        fresh.next_turn == "admin",
    )
    check("fresh ticket: replies=[]", fresh.replies == [])
    # Count reflects the fresh ticket as unread for admin.
    count = await ticket_count(admin)
    check("count: unread bumps for new ticket", count["unread"] >= 1)

    # Reporter cannot reply yet — it's the admin's turn.
    from fastapi import HTTPException

    try:
        await reply_to_ticket(rid, TicketReplyCreate(body="too soon"), reporter)
        check("reporter cannot reply on their own turn", False, "expected 409")
    except HTTPException as e:
        check(
            "reporter cannot reply on their own turn (409)",
            e.status_code == 409,
            f"got {e.status_code}",
        )

    # Admin replies → turn flips to reporter, reporter_seen flips to False.
    after_admin = await reply_to_ticket(
        rid, TicketReplyCreate(body="thanks for the report"), admin
    )
    check("after admin reply: next_turn=reporter", after_admin.next_turn == "reporter")
    check(
        "after admin reply: 1 reply, author=admin",
        len(after_admin.replies) == 1 and after_admin.replies[0].author == "admin",
    )
    notif = await my_ticket_notifications(reporter)
    check(
        "after admin reply: reporter notif=1 (reporter_seen False)",
        notif.count == 1,
        f"got {notif.count}",
    )

    # Admin cannot post a second time without reporter going first.
    try:
        await reply_to_ticket(rid, TicketReplyCreate(body="bumping"), admin)
        check("admin cannot double-reply", False, "expected 409")
    except HTTPException as e:
        check(
            "admin cannot double-reply (409)",
            e.status_code == 409,
            f"got {e.status_code}",
        )

    # Reporter replies → turn flips back to admin, admin_seen flips to False.
    await mark_admin_tickets_seen(admin)
    count = (await ticket_count(admin))["unread"]
    after_reporter = await reply_to_ticket(
        rid, TicketReplyCreate(body="any update?"), reporter
    )
    check(
        "after reporter reply: next_turn=admin",
        after_reporter.next_turn == "admin",
    )
    check(
        "after reporter reply: 2 replies in order admin/reporter",
        [r.author for r in after_reporter.replies] == ["admin", "reporter"],
    )
    new_count = (await ticket_count(admin))["unread"]
    check(
        "after reporter reply: admin unread badge bumps",
        new_count == count + 1,
        f"was {count} now {new_count}",
    )

    # Reporter cannot post a second reply now — turn flipped to admin.
    try:
        await reply_to_ticket(rid, TicketReplyCreate(body="another"), reporter)
        check("reporter cannot double-reply", False, "expected 409")
    except HTTPException as e:
        check(
            "reporter cannot double-reply (409)",
            e.status_code == 409,
            f"got {e.status_code}",
        )

    # A non-admin, non-reporter user can never reply.
    stranger = fake_user("stranger@example.test", "Stranger", is_admin=False)
    try:
        await reply_to_ticket(rid, TicketReplyCreate(body="hi"), stranger)
        check("stranger cannot reply", False, "expected 403")
    except HTTPException as e:
        check(
            "stranger cannot reply (403)",
            e.status_code == 403,
            f"got {e.status_code}",
        )

    # Admin clears their badge → unread drops to baseline.
    await mark_admin_tickets_seen(admin)
    after_seen = (await ticket_count(admin))["unread"]
    check(
        "mark_admin_tickets_seen clears unread",
        after_seen < new_count,
        f"was {new_count} now {after_seen}",
    )

    # Cleanup.
    await delete_ticket(rid, reporter)
    await delete_ticket(rid, admin)

    print(f"\n{passed} passed, {failed} failed")
    return failed


if __name__ == "__main__":
    code = asyncio.run(main())
    raise SystemExit(0 if code == 0 else 1)
