/* =====================================================================
   The bridge between the website and the behind-the-scenes services:
   - Google Apps Script → RSVP spreadsheet + email notifications
   - Supabase           → scrapbook file storage + database
   If a service isn't set up yet, the site quietly runs in demo mode.
   ===================================================================== */
(function () {
  const cfg = window.SITE.backend;
  const sbUrl = (cfg.supabaseUrl || "").replace(/\/+$/, "");

  function sbHeaders(extra) {
    const h = { apikey: cfg.supabaseKey, ...extra };
    // Older Supabase "anon" keys are JWTs and also go in the Authorization header.
    if (cfg.supabaseKey && cfg.supabaseKey.startsWith("eyJ")) h.Authorization = "Bearer " + cfg.supabaseKey;
    return h;
  }

  async function sbError(res) {
    let msg = res.status + " " + res.statusText;
    try { const j = await res.json(); msg = j.message || j.error || j.msg || msg; } catch (_) {}
    const err = new Error(msg);
    err.status = res.status;
    return err;
  }

  window.Backend = {
    hasSheet: () => Boolean(cfg.googleScriptUrl),
    hasStorage: () => Boolean(sbUrl && cfg.supabaseKey),

    /* Send a message to the Google Apps Script (RSVP or upload notice).
       Sent as plain text so the browser doesn't need special permission. */
    async notify(payload) {
      if (!cfg.googleScriptUrl) return { ok: true, demo: true };
      const res = await fetch(cfg.googleScriptUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: "follow"
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || "The spreadsheet didn't answer.");
      return data;
    },

    publicUrl(path) {
      return `${sbUrl}/storage/v1/object/public/${cfg.bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
    },

    /* Upload a file with a progress callback (XHR, because fetch can't report upload progress). */
    uploadFile(path, file, onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${sbUrl}/storage/v1/object/${cfg.bucket}/${path}`);
        const h = sbHeaders({ "Content-Type": file.type || "application/octet-stream", "x-upsert": "false", "cache-control": "31536000" });
        Object.entries(h).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        xhr.upload.onprogress = e => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) return resolve();
          let msg = "Upload failed (" + xhr.status + ")";
          try { const j = JSON.parse(xhr.responseText); msg = j.message || j.error || msg; } catch (_) {}
          reject(new Error(msg));
        };
        xhr.onerror = () => reject(new Error("Network hiccup — check your signal and try again."));
        xhr.send(file);
      });
    },

    async addUploadRecord(row) {
      const res = await fetch(`${sbUrl}/rest/v1/uploads`, {
        method: "POST",
        headers: sbHeaders({ "Content-Type": "application/json", Prefer: "return=minimal" }),
        body: JSON.stringify(row)
      });
      if (!res.ok) throw await sbError(res);
    },

    async listPhotos() {
      const res = await fetch(`${sbUrl}/rest/v1/uploads?select=id,path,guest_name,caption,tilt,created_at&kind=eq.photo&order=created_at.desc&limit=300`, {
        headers: sbHeaders()
      });
      if (!res.ok) throw await sbError(res);
      return res.json();
    },

    async rpc(name, args) {
      const res = await fetch(`${sbUrl}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: sbHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(args || {})
      });
      if (!res.ok) throw await sbError(res);
      return res.json();
    }
  };
})();
