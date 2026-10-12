# Out of Nature — a wedding invitation website 🌿

A surprise invitation site: elegant on the outside, cheeky underneath.

| Screen | What happens |
|---|---|
| 1 · Arrival | Names, photo, date, *Out of Nature*, gentle fade-in, one button |
| 2 · The gate | "Will you come?" — the **No** button runs away until they click **Yes** → confetti |
| 3 · Quiz | Six questions, one per card, confetti for right answers, teasing for wrong ones |
| 4 · Details | Date, time, venue, map, directions, dress code, live countdown |
| 5 · RSVP | Name, yes/no, plus-ones, dietary needs, note → **spreadsheet + email to you** |
| 6 · Scrapbook | Guests upload photos (tilted, taped, on the wall) and 15-second video messages (sealed) → **email to you** |
| `montage.html` | Password-locked farewell reel of all the video messages, for the honeymoon |

Returning guests get a "Skip to the details" link, so they don't have to pass the gate every time.

---

## What's in this folder

```
index.html              ← the invitation (screens 1–6)
montage.html            ← the secret honeymoon reel
css/style.css           ← colours, fonts, animations
js/config.js            ← ✏️  ALL the words, names, quiz and settings — edit this one
js/app.js               ← screens, gate, quiz, RSVP behaviour
js/scrapbook.js         ← uploads and the photo wall
js/montage.js           ← the reel player/recorder
js/confetti.js          ← confetti
js/backend.js           ← talks to Google and Supabase
images/                 ← put the couple's photo here as couple.jpg
backend/google-apps-script.gs   ← paste into Google (RSVPs + emails)
backend/supabase-setup.sql      ← paste into Supabase (scrapbook storage + reel password)
```

**Before you set anything up, the site already works in "demo mode."** Every screen works, but RSVPs and uploads aren't saved. Follow the steps below to switch on the real thing.

---

## Step 0 · Personalise it (10 minutes)

1. Open **`js/config.js`**. The couple's names (`names` and `surnames`) are already filled in — Jean-Pierre Grobler & Juan-Marie Van Zyl.
2. The **quiz** is filled in. Each answer has its own `reply`; the right one(s) are marked `right: true` (a question can have more than one). Wrong answers tease and let the guest try again. `{0}` and `{1}` are swapped for the groom's and bride's first names. **Pug photo:** save a picture of Lily & Peanut as `images/pugs.jpg` — it drops in as a polaroid when guests get the dogs question right. No photo, no polaroid (nothing breaks).
3. Check the venue blurb, directions, dress code, the RSVP deadline (`rsvpBy`), the **order of the day** (`schedule` — times are a rough guide until confirmed), **staying over** (`stay` — the lodge's phone, email and website) and **gifts** (`gifts`). The directions are based on what's published online about Out of Nature Country Lodge — please double-check them with the venue.
4. ⚠️ **Replace `images/couple.jpg`** with a real photo of Jean-Pierre & Juan-Marie — the one there now is a stand-in of strangers. Same for `pugs.jpg` (the dogs-question polaroid) and `pug-bum.jpg` (shown to guests who decline) if you have real ones of Lily & Peanut. The two "family archives" photos pinned to the scrapbook (`archive-1.jpg`, `archive-2.jpg`) are stand-ins too — swap in real childhood photos of Juan-Marie (ask her mom!) and adjust the captions in `scrapbook.pinned` in `js/config.js`. (Venue photos are already in as `venue-1.jpg` to `venue-4.jpg`). A portrait (taller than wide) looks best in the arch frame.

---

## Step 1 · RSVPs → Google Sheet + email (15 minutes)

**What this is:** a Google Sheet with a small script attached. The script gets its own private web address. The website sends each RSVP to that address, the script adds a row to the sheet and emails you. It's free and uses your normal Google account.

1. Go to [sheets.google.com](https://sheets.google.com) and create a **blank spreadsheet**. Name it something like *Wedding Guest List*.
2. In the menu, click **Extensions → Apps Script**. A code editor opens in a new tab.
3. Delete everything in the editor. Open `backend/google-apps-script.gs` from this folder, copy **all** of it, and paste it in.
   - The emails go to the Google account you're signed in with. To send them somewhere else, put that address between the quotes on the line `const NOTIFY_EMAIL = "";`.
4. Click the 💾 **Save** icon.
5. **Test it and give permission:** in the dropdown at the top (next to ▶ Run), choose **`testSetup`**, then click **▶ Run**.
   - Google will ask you to authorise it. Click through. If you see *"Google hasn't verified this app"*, click **Advanced → Go to (project name) (unsafe)**. That's normal for scripts you write yourself; "unsafe" only means Google hasn't reviewed it.
   - Check your email for a "Test Tannie is coming" message, and check the sheet for an **RSVPs** tab. 🎉 You can delete that test row.
6. **Put it online:** click **Deploy → New deployment**. Click the ⚙️ gear next to "Select type" and choose **Web app**. Set:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone** (this lets the website send to it; nobody can read your sheet through it)
7. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
8. Paste it into `js/config.js`, in the `googleScriptUrl` line, between the quotes.

> If you ever edit the script later, use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. That keeps the same URL.

**Reading the sheet:** each reply is a row. "Total guests" = the person + their plus-ones. To get your headcount, click the column header for Total guests and look at the **Sum** in the bottom-right corner (or rely on the running total in each email). If someone replies twice, the newest row is their latest answer.

---

## Step 2 · Scrapbook storage → Supabase (15 minutes)

**What this is:** Supabase is a free online service that gives you a database (a smart spreadsheet that websites can talk to) and file storage (like a Dropbox folder). The photos and videos live there.

**How the secrecy works:** photos are public on the wall. Video files get random 36-character names, and the database refuses to hand out the list of them unless the honeymoon password is given. So guests can't peek, and the password is never written in the website code.

1. Go to [supabase.com](https://supabase.com), sign up (free), and click **New project**. Give it a name and a database password (save it somewhere; you won't need it for this site). Pick the region closest to Namibia (e.g. *South Africa* or *West EU*). Wait a minute or two while it's created.
2. In the left sidebar, open **SQL Editor** and click **New query**.
3. Open `backend/supabase-setup.sql` from this folder and copy **all** of it.
4. **Choose the honeymoon password:** in the copied text, find `CHANGE-ME-honeymoon` and replace it with your secret word (keep the single quotes around it).
5. Paste it into the SQL editor and click **Run**. You should see "Success. No rows returned."
6. In the sidebar, open **Project Settings → API** (on newer dashboards it's **Project Settings → API Keys** and **Data API**). Copy:
   - the **Project URL** (looks like `https://abcdefgh.supabase.co`) → paste into `supabaseUrl` in `js/config.js`
   - the **anon public** key (or the **publishable** key) → paste into `supabaseKey`

   ⚠️ **Never** use the `service_role` / **secret** key. That one is a master key and must not go on a website. The anon/publishable key is designed to be public.

**Email on every upload:** this is automatic once Step 1 is done. The website sends the Google script a note after each upload, and you get an email with a link.

**Removing something too cheeky:** in Supabase, open **Table Editor → uploads**, find the row, and delete it. That hides it from the wall. To delete the file itself too, go to **Storage → scrapbook**. You'll need the file path from the row, because the folder can't be browsed by guests (or by the site).

**Changing the reel password later:** run just these lines in the SQL editor, with your new word:
```sql
update public.reel_secret set pw_hash = extensions.crypt('new-password', extensions.gen_salt('bf')) where id = 1;
```

**Free tier note:** Supabase's free plan includes 1 GB of storage. That's roughly 500 photos plus about 100 short videos, plenty for a wedding. Free projects pause after a week with no visitors. If that happens, log in and click **Restore**. Check in occasionally before the big day.

---

## Step 3 · Put it online (10 minutes)

The site is just files, so any free static host works. Two easy options:

**Option A — Netlify Drop (easiest):** go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag this whole folder onto the page. You'll get a link immediately. Make a free account to keep it and to choose a nicer name (e.g. `outofnature-wedding.netlify.app`). To update the site later, drag the folder in again.

**Option B — GitHub Pages (this repository):** on GitHub, open the repo → **Settings → Pages** → *Source: Deploy from a branch* → choose the branch and `/ (root)` → **Save**. After a minute your site is at `https://<your-username>.github.io/<repo-name>/`. Note: on a free GitHub plan the repository must be **public** for Pages to work. That means anyone could read the files, including the quiz answers, though not the reel password, which lives in Supabase.

The montage is at the same address + `/montage.html`. It's not linked from the invitation, so keep that link for the honeymoon.

---

## Step 4 · Test before you send it

1. Open the site on your phone **and** a computer. Go through every screen.
2. Send a test RSVP → check the sheet and your inbox.
3. Upload a test photo → it should appear on the wall, and you should get an email.
4. Upload a short test video → it should appear as a sealed envelope.
5. Open `montage.html`, enter your password → your test video should play in the reel.
6. Delete your test rows in the Google Sheet and in Supabase (**Table Editor → uploads**).

---

## Notes on the farewell reel

- **Play the reel** plays every message back-to-back on one screen. Each clip gets a title card (who it's from and their caption), with soft fades between clips, an opening card and a closing *Baie geluk*.
- **Save as a video file** records that reel into one downloadable file as it plays, so it takes as long as the reel itself. Keep the tab open and in front. It works best in **Chrome on a laptop**. The file is `.webm` in Chrome/Firefox, or `.mp4` in Safari. Both play fine in VLC, Chrome, and on WhatsApp/Google Drive.
- iPhone videos are sometimes in a format (HEVC) that older Windows computers can't play. If a clip is skipped, try on a Mac or iPhone.

## Privacy

- Every page tells search engines not to list it (`noindex`), so it won't show up on Google.
- Anyone with the link can view the invitation and upload to the scrapbook. That's what a shared invitation needs, so only share the link with guests.
