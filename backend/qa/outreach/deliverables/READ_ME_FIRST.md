# Automatic NaviiGo pilot outreach

Prepared for **NaviiGo24@gmail.com** with this offer: **free during the pilot**.
There is no payment request or automatic future charge in the invitation.

## What the three workflows do

1. **1_send_pilot_invitations.json** reads your approved outreach rows, prepares
   one personalised invitation, records a claim, sends from your Gmail account
   and stores Gmail's message/thread receipt.
2. **2_classify_business_replies.json** matches the sender AND saved Gmail thread,
   reads the new reply, records findings and marks the message handled.
3. **3_daily_findings_report.json** emails an internal report to
   **NaviiGo24@gmail.com** with Yes, No, Contact, Question, Needs review,
   Unsubscribe, Out of office, Awaiting reply and unreconciled sends.

All workflows are inactive. Invitations and reporting default to preview mode.
No business list, credential, password, access token or real recipient is embedded.
These are importable workflow files; they have not been executed in your n8n account.

## Start here — no coding needed

1. In Google Sheets, import `business_outreach_template.csv` and name the tab
   **Outreach**. Paste your actual business contact list here when it is ready.
   Keep the existing column names. The prior 90-place research queue is not this list.
2. Give each business a unique `business_id`, such as `BIZ-001`. Fill in its name,
   email and the public HTTPS contact-page URL used to verify that email.
3. Only after your team has reviewed the address and invitation recipient, set
   `email_verified=TRUE`, `outreach_approved=TRUE`, `opt_out=FALSE` and
   `delivery_state=Ready`. Keep delivery receipts and reply fields empty initially.
   Outreach approval means permission to contact; it does not mean listing approval.
4. In n8n, import the three JSON files. Connect Google Sheets to your team sheet
   and select the **Outreach** tab in every Google Sheets node. Replace the
   `SET_GOOGLE_SHEET_ID` placeholder with its document ID.
5. Connect the Gmail nodes, Gmail Trigger and HTTP Request profile check using
   the **same NaviiGo24@gmail.com Gmail OAuth credential**. The profile check stops
   invitations/reports if the wrong mailbox is connected. Do not paste passwords
   into any Code node. Use the same credential for all Gmail-related nodes.
6. In Gmail, create a label named **NaviiGoHandled**. Select that label in the
   reply workflow's **Mark reply handled** node, replacing the placeholder label ID.
7. Run workflow 1 manually with `live:false` in **Campaign settings**. Inspect the
   **Prepare invite** output. Its sending gate will stop before sending or claiming
   anything. Read the actual invitation in `INVITATION_DRAFT.txt` too.
8. For the first live test, use a second mailbox you control as the only Ready row.
   Verify that address and give it an actual HTTPS contact-source URL under your
   control. Set `live:true`, then run once. Confirm one email arrived and the row
   became Sent with a Gmail thread ID. Do not use the sender mailbox as the recipient.
9. Enable workflow 2 and reply from the test recipient with Yes, No, a question
   and an unsubscribe request. Check the sheet. Test a referred contact: it must
   be recorded for review and must not receive an automatic invitation.
10. Once the test works, use your approved business rows. Enable the disabled
    schedule in workflow 1 and publish it. It is configured for one candidate per
    15-minute run, 09:00–18:45, with a default maximum of 20 sent emails per India
    calendar day. Keep the timezone **Asia/Kolkata**. Do not run it manually while
    the scheduled sender is executing.
11. Preview workflow 3. Set its separate `live:true` only when you want internal
    report emails, then enable its 18:30 schedule and publish.

n8n supports workflow JSON import, Gmail sending and received-message triggers.
Sources: [Import workflows](https://docs.n8n.io/build/manage-workflows/export-and-import.md),
[Gmail node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail),
[Gmail Trigger](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.gmailtrigger),
[Scheduling](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger).

## Meaning of the reply labels

| Label | What happens next |
|---|---|
| Yes | Your team follows up with onboarding and verifies listing details. |
| No | Further pilot invitations to that record are suppressed. |
| Contact | Suggested email is recorded; your team verifies it before outreach. |
| Question | Your team answers the question. |
| Unsubscribe | Further outreach is suppressed. |
| Out of office | Your team reviews the return date; no automatic resend. |
| Needs review | The wording is unclear; a person reads the reply. |
| No reply | Awaiting a response; it is never counted as No. |

Classification uses conservative English text rules and strips common quoted
email history. It is triage, not a perfect AI interpretation. Replies in other
languages, unusual formatting, phone-only referrals and ambiguous intent need
manual review. No whole inbox is sent to a model. No reply approves a public listing.

## Failed sends and duplicates

The sender claims the row as Sending BEFORE calling Gmail. A network failure or
missing receipt leaves the row there. Do not reset it to Ready until you search
Gmail Sent using the business ID in the subject and reconcile what happened.
The sender deliberately does not automatically retry claimed addresses.

Use one sender execution at a time. Google Sheets does not provide an atomic
transaction for checking and claiming a row, so simultaneous sender executions
can race. This starter does not promise exactly-once delivery. For multiple
workers/high volume, replace the sheet claim with a database unique delivery key
and atomic claim. Separate report/reply workflows can run alongside the sender.

Unmatched replies, bounces from mailer-daemon addresses and changed-subject
messages that miss the trigger filter need manual reconciliation. A Gmail send
receipt confirms provider acceptance, not delivery or a verified business owner.
If the reply workflow fails, check its execution and label before retrying; saved
reply IDs prevent the same reply from changing its findings twice.

## What has been checked

29 local business-logic checks passed. All 10 exported Code nodes compile, node
connections resolve, preview mode stops before sending and sheet writes use RAW
values. Gmail credentials, live n8n imports, actual delivery, reply parsing in your
account and the separate business contact list still need the setup/test above.
