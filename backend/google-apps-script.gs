/**
 * =====================================================================
 *  Wedding site — RSVP spreadsheet + email notifications
 * ---------------------------------------------------------------------
 *  Paste this whole file into Extensions → Apps Script in your Google
 *  Sheet, then Deploy → New deployment → Web app (see README.md).
 *
 *  What it does:
 *   • Every RSVP becomes a new row on the "RSVPs" tab, and you get an email.
 *   • Every scrapbook upload becomes a row on the "Scrapbook" tab, and you
 *     get an email with a link to it.
 * =====================================================================
 */

// Where notifications go. Leave blank to use the Google account that owns this script.
const NOTIFY_EMAIL = "";

const RSVP_HEADERS = ["Received", "Name", "Attending", "Plus-ones", "Total guests", "Dietary", "Other dietary notes", "Note for the couple"];
const UPLOAD_HEADERS = ["Received", "Type", "From", "Caption", "Link"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000); // stops two RSVPs arriving at once from tripping over each other
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    if (data.website) return json({ ok: true }); // spam bot filled the hidden field — ignore quietly

    if (data.type === "rsvp") handleRsvp(data);
    else if (data.type === "upload") handleUpload(data);
    else return json({ ok: false, error: "Unknown request" });

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web-app link in a browser just confirms it's alive.
function doGet() {
  return ContentService.createTextOutput("The wedding RSVP service is running. 🌿");
}

/* ------------------------------------------------------------------ */

function handleRsvp(d) {
  const going = d.attending === "Yes";
  const plus = going ? Math.max(0, Math.min(20, parseInt(d.plusOnes, 10) || 0)) : 0;
  const total = going ? 1 + plus : 0;
  const sheet = tab("RSVPs", RSVP_HEADERS);
  sheet.appendRow([
    new Date(),
    clean(d.name, 120),
    going ? "Yes" : "No",
    plus,
    total,
    clean(d.dietary, 200),
    clean(d.dietOther, 200),
    clean(d.note, 1000)
  ]);

  // Running totals for the email
  const rows = sheet.getDataRange().getValues().slice(1);
  const yesRows = rows.filter(r => r[2] === "Yes");
  const headcount = yesRows.reduce((sum, r) => sum + (Number(r[4]) || 0), 0);
  const noCount = rows.filter(r => r[2] === "No").length;

  // e.g. "Oom Kobus is coming, plus one, no nuts."  /  "Tannie Sannie can't make it."
  const diets = going ? String(d.dietary || "").split(",").map(x => x.trim()).filter(x => x && x !== "eats anything") : [];
  const plusText = plus === 0 ? "" : plus === 1 ? "plus one" : `plus ${plus}`;
  const subject = going
    ? [`${clean(d.name, 60)} is coming`, plusText].concat(diets).filter(Boolean).join(", ") + "."
    : `${clean(d.name, 60)} can't make it.`;
  const body = [
    `Name: ${clean(d.name, 120)}`,
    `Attending: ${going ? "Yes" : "No"}`,
    going ? `Plus-ones: ${plus}  (total in party: ${total})` : "",
    going && d.dietary ? `Dietary: ${clean(d.dietary, 200)}` : "",
    going && d.dietOther ? `Other dietary notes: ${clean(d.dietOther, 200)}` : "",
    d.note ? `\nNote for the couple:\n${clean(d.note, 1000)}` : "",
    "",
    "———",
    `Running total: ${headcount} guests confirmed across ${yesRows.length} replies · ${noCount} declined.`,
    `Spreadsheet: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`,
    "(If someone replies twice, the newest row is their latest answer.)"
  ].filter(Boolean).join("\n");

  MailApp.sendEmail(recipient(), subject, body);
}

function handleUpload(d) {
  const kind = d.kind === "video" ? "Video" : "Photo";
  tab("Scrapbook", UPLOAD_HEADERS).appendRow([
    new Date(), kind, clean(d.guestName, 80), clean(d.caption, 200), clean(d.url, 500)
  ]);
  const subject = kind === "Video"
    ? `🎥 New sealed video message from ${clean(d.guestName, 60)}`
    : `📷 ${clean(d.guestName, 60)} pinned a photo to the scrapbook`;
  const body = [
    `From: ${clean(d.guestName, 80)}`,
    d.caption ? `Caption: ${clean(d.caption, 200)}` : "",
    `Link: ${clean(d.url, 500)}`,
    "",
    kind === "Video" ? "Shh — this one is for the honeymoon reel." : "If it's too cheeky, you can delete it in Supabase → Table editor → uploads."
  ].filter(Boolean).join("\n");
  MailApp.sendEmail(recipient(), subject, body);
}

/* ------------------------------------------------------------------ */

function tab(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e6ecdf");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim, cap the length, and stop text that starts with "=" being run as a spreadsheet formula.
function clean(value, max) {
  let s = String(value == null ? "" : value).trim().slice(0, max || 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function recipient() {
  return NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor (select it, press ▶ Run) to grant permissions and send yourself a test email.
function testSetup() {
  handleRsvp({ name: "Test Tannie", attending: "Yes", plusOnes: 1, dietary: "no-nuts", note: "Testing, testing!" });
}
