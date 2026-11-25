# Fix song requests, shout-outs and the contact form

## Findings (checked in code and database)
- Saving works: `song_requests` holds 1 row and `contact_submissions` holds 19 (latest 13 Oct).
- **Main reason the owner sees nothing: no owner account exists.** There are 0 accounts and 0 admin roles, so nobody can open the Admin page. The first account created at `/admin` automatically becomes the owner.
- Requests form: song and artist are always required, so a shout-out on its own can't be sent. Name-only fields have no `name` attribute. The success message only shows after a confirmed save (this part is correct).
- Admin page: approve and delete ignore errors, and every entry is shown as "requests song – artist".
- Contact form: the save happens first, then the server waits for the email send with no time limit. On a slow phone connection the button can stay on "Sending…" for a long time. Taps during "busy" are blocked, but nothing stops the wait.

## Changes
1. **Database (one small, additive change):** add a `kind` column to `song_requests` ('request' or 'shoutout', default 'request'). Song and artist get an empty-text default. A check trigger requires song and artist only for requests. Current permissions stay as they are: the public can only add unapproved entries and only read approved ones.
2. **Requests page:** add a "Song request / Shout-out" toggle. Song and artist are required only for requests; a shout-out requires a message. Errors are shown clearly, and the button is locked while sending.
3. **Shout wall and admin:** show each entry correctly by type, and add a type label in the admin list. Approve and delete report failures and refresh only after they succeed.
4. **Contact form:** add a 15-second time limit on the email step on the server and a 25-second limit in the browser, so "Sending…" always ends in success or a clear error. If the email fails, the message still counts as saved and the visitor sees "received" with a note. Add a guard against double sending. Enquiries keep going into `contact_submissions` and keep using the already connected free-tier Resend, with no new paid service.

## Testing
- Send a test request, a shout-out and a contact enquiry in a phone-sized browser. Confirm each saves in the database and the right message appears.
- Admin approve and delete can only be tested once the owner account exists.

## Setup needed from you
- The client creates the owner account at `/admin` and confirms the email. This is the only way to see entries.
