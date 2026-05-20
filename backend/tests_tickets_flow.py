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
import os
import uuid
from datetime import datetime, timedelta, timezone

from db import db
from routers.tickets import (
    TicketCreate,
    TicketStatusUpdate,
    create_ticket,
    delete_ticket,
    list_my_tickets,
    list_tickets,
    mark_my_tickets_seen,
    my_ticket_notifications,
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
    # ticket, admin hides, count should not include it.
    other = await create_ticket(
        TicketCreate(type="feature", title="Hidden", description="x"), reporter
    )
    await delete_ticket(other.id, admin)  # admin soft-hides
    count = await ticket_count(admin)
    admin_list2 = await list_tickets(admin)
    check(
        "admin count + list exclude admin-hidden tickets",
        all(t.id != other.id for t in admin_list2)
        and count["open"] == 0,
        f"count={count}, hidden_ticket_in_list={any(t.id == other.id for t in admin_list2)}",
    )
    # Cleanup: reporter also hides → hard delete.
    await delete_ticket(other.id, reporter)
    doc2 = await db.tickets.find_one({"id": other.id})
    check("cleanup: hidden-then-hidden hard-deletes", doc2 is None)

    print(f"\n{passed} passed, {failed} failed")
    return failed


if __name__ == "__main__":
    code = asyncio.run(main())
    raise SystemExit(0 if code == 0 else 1)
