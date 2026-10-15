# Your first n8n workflow: internal pilot email digest

Think of n8n as a sequence: a trigger starts it, a source supplies rows, a filter
chooses what matters, and an action prepares or sends the notification.

## 1. Preview it with no accounts connected

1. Open n8n and create a workflow.
2. Use **Import from File** to load `n8n_internal_digest_preview.json`.
3. Run **Preview manually**.
4. Open the output of **Build internal digest**. Inspect `subject` and `body_text`.

The flow is Manual Trigger → Research snapshot → Build internal digest.
The snapshot contains the 90 supplied research references. Current output is 89
pending reviews, one excluded reference, and zero assigned/due follow-ups. Zero
due tasks is expected: owners and deadlines have not been supplied.

The workflow is inactive and contains no mail node, credentials or recipient.
Its JavaScript was executed locally against the actual records and synthetic
exclusion, duplicate-ID and same-day reminder cases. Import and execution inside
your n8n account have not been tested.

n8n supports importing workflow JSON and running JavaScript Code nodes in
“Run Once for All Items” mode. [Import/export](https://docs.n8n.io/build/manage-workflows/export-and-import.md),
[Code node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code).

## 2. Let your team maintain the live sheet

Import `place_review_queue.csv` into Google Sheets. Preserve these exact headers:

`candidate_id`, `region`, `place_name`, `approval_status`, `owner`, `follow_up_at`,
`last_notified_at`.

Other columns keep your contact-verification evidence and original source. Use
`Unreviewed`, `Approved`, `Rejected` or `Excluded` for status. Use `YYYY-MM-DD`
for dates; keep the follow-up column as plain text so the format stays consistent.
Every row needs a unique, stable ID. Assign a person and follow-up date to a few
Unreviewed rows for a first test. Excluded references must remain excluded unless
a deliberate, evidence-backed review changes the underlying decision.

Replace **Research snapshot** with **Google Sheets → Get Row(s)** and select that
document/tab. Connect its output to **Build internal digest**. Store the Google
login in n8n Credentials. Do not paste tokens or API keys into the sheet or code.
[Google Sheets node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets).

## 3. Prepare one internal email

Add **Gmail → Draft → Create** after the digest. Connect the team's mailbox in
n8n Credentials. Set **To** to your chosen internal team address. Map the subject
to `{{ $json.subject }}` and the plain-text body to `{{ $json.body_text }}`.

Run once and inspect the actual draft in Gmail. Check the recipient, totals and
task owners before choosing a Send operation. The supplied preview does not
create a Gmail draft or send any messages. [Gmail operations](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail).

## 4. Schedule it after the manual test

Add **Schedule Trigger**, once a day at 09:00. Set the workflow timezone to
`Asia/Kolkata`. Connect it to Google Sheets in place of the Manual Trigger. Save
and publish only after the sheet and notification step are configured.
[Schedule Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger).

Before automatic sending, add durable delivery tracking. Store the digest date,
recipient, digest key and provider message ID in a separate delivery log. Only
after a confirmed send should you update `last_notified_at` on the included
candidate IDs. Do not mark a draft as sent. Failed sends must not mark tasks as
notified. A Gmail send followed by a failed sheet update can duplicate a retry;
reconcile the provider message ID before retrying ambiguous sends. The preview's
same-day filter alone is not an exactly-once delivery guarantee.

The daily digest can include review backlog totals even when no task is due.
If you prefer reminders only, add an IF node requiring `due_count > 0` before
Gmail. For a one-email-per-day policy, enforce that policy in the delivery log,
not just with the changing list of due candidate IDs.

## 5. Later workflows worth adding

- Approval changed → internal reviewer notification and onboarding task.
- Partner owner assigned → internal assignment notification.
- Follow-up overdue → outreach lead digest.
- Source/contact verification expired → re-review queue.

Keep public publishing behind a reviewed backend action. Keep wallet balances,
payment verification and refund decisions in the backend ledger; n8n can notify
about their confirmed outcomes. Do not let a sheet edit issue wallet credit.

When you share the separate partner approval workbook, replace the research
source with that reviewed partner list and define the notification policy for
each actual status. No prospective partner or traveler is contacted by this pack.
