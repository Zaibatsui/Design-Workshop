import { useState } from "react";
import { Loader2, MessageSquare, Send, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

/**
 * TicketThread — renders a ticket's reply conversation + a turn-taking
 * reply composer, shared by AdminTickets and MyTickets.
 *
 * Turn-taking rules are enforced server-side (POST /tickets/{id}/replies
 * returns 409 when it's not the caller's turn). The UI mirrors the
 * rule by disabling the composer + showing a helper line when
 * `ticket.next_turn` doesn't match the `viewerRole`.
 *
 * Props:
 *   ticket     — full TicketOut payload from /tickets or /tickets/mine
 *   viewerRole — "admin" | "reporter"
 *   onReplied  — called with the fresh ticket payload after a successful
 *                reply so the parent can swap it into local state
 */
export default function TicketThread({ ticket, viewerRole, onReplied }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const replies = ticket.replies || [];
  const canReply = ticket.next_turn === viewerRole;

  const fmt = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const submit = async (e) => {
    e?.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    if (!canReply) {
      toast.error("It's not your turn yet", {
        description:
          viewerRole === "admin"
            ? "You've already replied — wait for the reporter to come back."
            : "You've already replied — wait for the admin to come back.",
      });
      return;
    }
    setSending(true);
    try {
      const updated = await api.replyTicket(ticket.id, trimmed);
      setBody("");
      onReplied?.(updated);
      toast.success("Reply posted");
    } catch (err) {
      // 409 = turn-taking violation. Server is authoritative — surface
      // its detail so the user understands without us having to map
      // status codes here.
      toast.error("Could not post reply", { description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="pl-11 mt-4 border-t border-slate-100 pt-4"
      data-testid={`ticket-thread-${ticket.id}`}
    >
      {/* Conversation */}
      {replies.length === 0 ? (
        <p
          className="text-xs text-slate-400 italic flex items-center gap-1.5 mb-3"
          data-testid={`ticket-thread-empty-${ticket.id}`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          No replies yet.
        </p>
      ) : (
        <ul className="space-y-3 mb-4">
          {replies.map((r) => {
            const isAdmin = r.author === "admin";
            return (
              <li
                key={r.id}
                data-testid={`ticket-reply-${r.id}`}
                data-author={r.author}
                className={`flex gap-2.5 ${isAdmin ? "" : "flex-row-reverse"}`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                    isAdmin
                      ? "bg-slate-900 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                  aria-hidden="true"
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div
                  className={`flex-1 min-w-0 px-3.5 py-2.5 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isAdmin
                      ? "bg-slate-50 border-slate-200 text-slate-800"
                      : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {isAdmin ? "Admin" : r.author_name || "You"}
                    </span>
                    <span>·</span>
                    <span>{fmt(r.created_at)}</span>
                  </div>
                  {r.body}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Composer */}
      <form onSubmit={submit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!canReply || sending}
          placeholder={
            canReply
              ? viewerRole === "admin"
                ? "Reply to the reporter…"
                : "Reply to the admin…"
              : "Waiting for the other side to respond…"
          }
          rows={3}
          maxLength={8000}
          data-testid={`ticket-reply-input-${ticket.id}`}
          className="resize-none text-sm"
        />
        <div className="flex items-center justify-between gap-3">
          <p
            className="text-[11px] text-slate-500"
            data-testid={`ticket-reply-hint-${ticket.id}`}
          >
            {canReply
              ? "One reply per turn — wait for a response before posting again."
              : viewerRole === "admin"
              ? "You've replied — waiting for the reporter."
              : "You've replied — waiting for the admin."}
          </p>
          <Button
            type="submit"
            size="sm"
            disabled={!canReply || sending || !body.trim()}
            data-testid={`ticket-reply-send-${ticket.id}`}
            className="bg-[#E01839] hover:bg-[#c81532] text-white"
          >
            {sending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
