/* =====================================================================
   SIX · the scrapbook — uploads, the photo wall, sealed video messages.
   Photos are public on the wall. Videos are stored privately and only
   appear in the password-locked montage (montage.html).
   ===================================================================== */
(function () {
  const S = window.SITE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const form = $("#uploadForm");
  const input = $("#fileInput");
  const drop = $("#drop");
  const preview = $("#dropPreview");
  const wall = $("#wall");
  const errEl = $("#uploadError");
  const okEl = $("#uploadOk");
  const bar = $("#uploadProgress");
  const maxSec = S.scrapbook.maxVideoSeconds;
  const maxBytes = S.scrapbook.maxFileMB * 1024 * 1024;

  let kind = "photo";
  let chosen = null;       // the File the guest picked
  let previewUrl = null;
  let sealedCount = 0;

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15);
        return (c === "x" ? r : (r & 3) | 8).toString(16);
      }));
  const randomTilt = () => (Math.random() < 0.5 ? -1 : 1) * (1.2 + Math.random() * 2.8);

  /* ---------- photo / video tabs ---------- */
  form.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
    kind = tab.dataset.kind;
    form.querySelectorAll(".tab").forEach(t => {
      t.classList.toggle("tab--on", t === tab);
      t.setAttribute("aria-selected", t === tab);
    });
    input.accept = kind === "photo" ? "image/*" : "video/*";
    $("#dropText").innerHTML = kind === "photo"
      ? "Tap to choose a photo<br><small>or drag one in here</small>"
      : `Tap to record or choose a video<br><small>${maxSec} seconds max — think toast, not speech</small>`;
    clearFile();
  }));

  /* ---------- choosing a file ---------- */
  ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, () => drop.classList.add("is-over")));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove("is-over")));

  function clearFile() {
    chosen = null;
    input.value = "";
    preview.innerHTML = "";
    drop.classList.remove("has-file");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    errEl.textContent = "";
  }

  function videoDuration(url) {
    return new Promise(resolve => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.onloadedmetadata = () => {
        // Some phones report Infinity until you nudge the playhead.
        if (v.duration === Infinity) {
          v.currentTime = 1e7;
          v.ontimeupdate = () => { v.ontimeupdate = null; resolve(v.duration); };
        } else resolve(v.duration);
      };
      v.onerror = () => resolve(NaN);
      v.src = url;
    });
  }

  input.addEventListener("change", async () => {
    const file = input.files[0];
    errEl.textContent = okEl.textContent = "";
    if (!file) return;
    const isImg = file.type.startsWith("image/");
    const isVid = file.type.startsWith("video/");
    if (kind === "photo" && !isImg) { clearFile(); errEl.textContent = "That doesn't look like a photo. Nice try."; return; }
    if (kind === "video" && !isVid) { clearFile(); errEl.textContent = "That's not a video. Switch to the Photo tab for pictures."; return; }
    if (file.size > maxBytes * (isImg ? 3 : 1)) { // big photos get shrunk, so allow more headroom
      clearFile();
      errEl.textContent = `That file is a bit hefty (over ${S.scrapbook.maxFileMB} MB). Try a shorter clip or a smaller photo.`;
      return;
    }

    previewUrl = URL.createObjectURL(file);
    if (isVid) {
      const secs = await videoDuration(previewUrl);
      if (secs > maxSec + 0.6) {
        clearFile();
        errEl.textContent = `That's ${Math.round(secs)} seconds — we said ${maxSec}! The couple love you, but they're on honeymoon. Trim it down and try again.`;
        return;
      }
      preview.innerHTML = '<video muted playsinline controls></video>';
    } else {
      preview.innerHTML = '<img alt="Your photo">';
    }
    preview.firstElementChild.src = previewUrl;
    drop.classList.add("has-file");
    chosen = file;
  });

  /* Shrink big photos before upload: faster for guests on farm signal, kinder to storage. */
  async function shrinkPhoto(file) {
    if (file.type === "image/gif") return file;
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * scale);
      c.height = Math.round(bmp.height * scale);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.85));
      return blob && blob.size < file.size ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
    } catch (_) {
      return file; // browser couldn't read it (e.g. some HEIC) — send the original
    }
  }

  function extFor(file) {
    const fromName = (file.name.split(".").pop() || "").toLowerCase();
    if (/^[a-z0-9]{2,5}$/.test(fromName) && fromName !== file.name.toLowerCase()) return fromName;
    const fromType = (file.type.split("/")[1] || "").replace("quicktime", "mov").replace("jpeg", "jpg");
    return /^[a-z0-9]{2,5}$/.test(fromType) ? fromType : "bin";
  }

  /* ---------- submitting ---------- */
  form.addEventListener("submit", async e => {
    e.preventDefault();
    errEl.textContent = okEl.textContent = "";
    const guestName = form.guestName.value.trim();
    const caption = form.caption.value.trim();
    if (!chosen) { errEl.textContent = kind === "photo" ? "Choose a photo first — the wall can't read minds." : "Choose a video first."; return; }
    if (!guestName) { errEl.textContent = "Add your name, so the couple know who to thank (or blame)."; form.guestName.focus(); return; }

    const btn = $("#uploadSubmit");
    btn.disabled = true;
    btn.textContent = "Pinning…";
    const tilt = +randomTilt().toFixed(2);

    try {
      if (!Backend.hasStorage()) {
        // Demo mode: show it on screen only.
        kind === "photo"
          ? addPhoto({ src: previewUrl, guest_name: guestName, caption, tilt }, true)
          : addSealed(guestName, true);
        previewUrl = null; // the card now owns the preview
        okEl.textContent = "Demo mode: this is only on your screen — storage isn't connected yet.";
      } else {
        const file = kind === "photo" ? await shrinkPhoto(chosen) : chosen;
        const path = `${kind}s/${uuid()}.${extFor(file)}`;
        bar.hidden = false;
        await Backend.uploadFile(path, file, p => ($("span", bar).style.width = Math.round(p * 100) + "%"));
        await Backend.addUploadRecord({ kind, path, guest_name: guestName, caption: caption || null, tilt });
        // Ping the organiser. If email fails, the upload is still safe, so don't bother the guest.
        Backend.notify({ type: "upload", kind, guestName, caption, url: Backend.publicUrl(path) }).catch(() => {});
        kind === "photo"
          ? addPhoto({ src: Backend.publicUrl(path), guest_name: guestName, caption, tilt }, true)
          : addSealed(guestName, true);
        okEl.textContent = kind === "photo"
          ? "Pinned! Scroll down to admire your handiwork."
          : "Sealed and saved. Not even the couple can watch it until the honeymoon. 🤫";
      }
      Confetti.fromElement(btn, 50);
      form.caption.value = "";
      clearFile();
    } catch (ex) {
      errEl.textContent = "Eish, that didn't upload. Check your signal and try again. (" + ex.message + ")";
    } finally {
      btn.disabled = false;
      btn.textContent = "Pin it to the scrapbook";
      setTimeout(() => { bar.hidden = true; $("span", bar).style.width = "0"; }, 600);
    }
  });

  /* ---------- the wall ---------- */
  function placeCard(card, fresh) {
    $("#wallEmpty").hidden = true;
    if (fresh) {
      wall.prepend(card);
      setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    } else wall.append(card);
  }

  function addPhoto(row, fresh, index = 0) {
    const fig = document.createElement("figure");
    fig.className = "snap";
    const tilt = row.tilt || randomTilt();
    fig.style.setProperty("--tilt", tilt + "deg");
    fig.style.setProperty("--tape", (-tilt * 1.5).toFixed(1) + "deg");
    fig.style.setProperty("--delay", fresh ? "0s" : Math.min(index * 0.08, 1.2) + "s");
    fig.innerHTML = '<img loading="lazy" alt=""><figcaption><span></span><small></small></figcaption>';
    const img = $("img", fig);
    img.src = row.src;
    if (row.focus) img.style.objectPosition = row.focus;
    img.alt = row.caption || "A photo from " + row.guest_name;
    $("figcaption span", fig).textContent = row.caption || "";
    $("figcaption small", fig).textContent = "— " + row.guest_name;
    fig.addEventListener("click", () => openLightbox(row.src, row.caption, row.guest_name));
    placeCard(fig, fresh);
  }

  function addSealed(guestName, fresh) {
    const fig = document.createElement("figure");
    fig.className = "snap snap--sealed";
    fig.style.setProperty("--tilt", randomTilt() + "deg");
    fig.innerHTML = '<div class="envelope"><span><b>✉</b>A video message,<br>sealed until the honeymoon</span></div><figcaption><span></span><small></small></figcaption>';
    $("figcaption span", fig).textContent = "Top secret";
    $("figcaption small", fig).textContent = "— " + guestName;
    placeCard(fig, fresh);
    sealedCount++;
    updateSealed();
  }

  function updateSealed() {
    $("#sealedCount").textContent = sealedCount
      ? `🎞 ${sealedCount} sealed video message${sealedCount === 1 ? "" : "s"} waiting for the honeymoon.`
      : "";
  }

  async function loadWall() {
    // The "family archives" go up first, so the wall never starts empty.
    const fmt = str => String(str).replace(/\{(\d)\}/g, (_, i) => S.names[i] || "");
    (S.scrapbook.pinned || []).forEach((p, i) =>
      addPhoto({ src: p.src, focus: p.focus, tilt: p.tilt, caption: fmt(p.caption), guest_name: p.from }, false, i));
    if (!Backend.hasStorage()) return;
    try {
      const rows = await Backend.listPhotos();
      rows.forEach((r, i) => addPhoto({ ...r, src: Backend.publicUrl(r.path) }, false, i));
    } catch (ex) {
      console.warn("Scrapbook wall didn't load:", ex);
    }
    try {
      sealedCount = await Backend.rpc("sealed_video_count");
      updateSealed();
    } catch (_) {}
  }
  document.addEventListener("main:shown", loadWall, { once: true });

  /* ---------- lightbox ---------- */
  const lb = $("#lightbox");
  function openLightbox(src, caption, name) {
    $("img", lb).src = src;
    $("figcaption", lb).textContent = (caption ? caption + " " : "") + "— " + name;
    lb.hidden = false;
    $(".lightbox__close", lb).focus();
  }
  window.openLightbox = (src, caption, name) => {
    $("img", lb).src = src;
    $("figcaption", lb).textContent = [caption, name && (caption ? "— " + name : name)].filter(Boolean).join(" ");
    lb.hidden = false;
    $(".lightbox__close", lb).focus();
  };
  const closeLb = () => { lb.hidden = true; $("img", lb).src = ""; };
  lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lightbox__close")) closeLb(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !lb.hidden) closeLb(); });
})();
