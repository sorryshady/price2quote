# Conversations Page: Email Read Status & Badge Logic

## Simplified Badge Logic

The system now only shows badges for **inbound emails** (emails from clients to you).

## Inbound Emails (Client → User)

- When a client replies, the email is saved as `direction: 'inbound'`, `isRead: false`.
- The conversation card shows an **"Unread"** badge until you open the conversation.
- In the conversation detail page (`src/app/(protected)/conversations/[conversationId]/page.tsx`):
  - When you open the conversation, all unread inbound emails are marked as read in the DB.
  - The "Unread" badge is then removed for that conversation.

## Toast Logic (Unread Count)

- After every sync, the system:
  - Waits briefly for backend to process new emails.
  - Fetches the latest conversations data.
  - Counts all emails where `direction === 'inbound' && !isRead`.
  - Shows a toast:
    - If count > 0: "X unread incoming emails found."
    - If count === 0: "No new emails."
- Only inbound emails are included in the toast unread count.

## Key Code Locations

- **Sync logic:** `src/lib/email-sync.ts` (`syncCompanyEmails`)
- **Conversation card badge logic:** `src/app/(protected)/conversations/page.tsx`
- **Marking inbound emails as read:** `src/app/(protected)/conversations/[conversationId]/page.tsx`
- **Toast unread count logic:** `src/app/(protected)/conversations/page.tsx` (handleManualSync)

## Debugging Tips

- If badges or toast counts are wrong, log the `direction` and `isRead` status of emails after sync and after opening a conversation.
- Ensure inbound emails are only marked as read when you (the user) open the conversation.

---

**This README summarizes the simplified workflow and logic for email read status, badges, and toast notifications in the conversations feature.**
