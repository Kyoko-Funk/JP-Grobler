/* =====================================================================
   The Farewell Reel — unlocks with a password (checked by the database,
   never stored in this page), then plays every video message back-to-back
   on one canvas with title cards and soft fades. The same canvas can be
   recorded into a single downloadable video file.
   ===================================================================== */
(function () {
  const S = window.SITE;
  const $ = s => document.querySelector(s);
  const fmt = str => String(str).replace(/\{(\d)\}/g, (_, i) => S.names[i] || "");
  document.querySelectorAll("[data-name]").forEach(el => (el.textContent = S.names[+el.dataset.name]));
  document.querySelectorAll("[data-fill]").forEach(el => (el.textContent = S[el.dataset.fill]));

  const canvas = $("#stage");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const status = $("#status");
  const C = { cream: "#f6f1e7", paper: "#fbf8f2", ink: "#3b382f", sage: "#4f5d47", gold: "#b89b6a", soft: "#6d685b" };
  const FADE = 600; // ms

  let clips = [];
  let busy = false;
  let stopRequested = false;
  let audio = null; // { ctx, dest }

  /* ---------- unlocking ---------- */
  $("#lockForm").addEventListener("submit", async e => {
    e.preventDefault();
    const pw = $("#pw").value;
    const btn = $("#unlockBtn");
    $("#lockError").textContent = "";
    btn.disabled = true;
    btn.textContent = "Checking…";
    try {
      if (!Backend.hasStorage()) {
        clips = [];
        status.textContent = "Demo mode: storage isn't connected yet, so the reel only has its title cards.";
      } else {
        clips = await Backend.rpc("get_reel", { pw });
      }
      Confetti.celebrate();
      $("#lockScreen").classList.remove("screen--active");
      $("#reelScreen").classList.add("screen--active");
      renderList();
      drawTitle(fmt("For {0} & {1}"), `${clips.length} message${clips.length === 1 ? "" : "s"} from the people who love you`, 1);
    } catch (ex) {
      $("#lockError").textContent = /password/i.test(ex.message)
        ? "Wrong password. Are you sure you're on honeymoon?"
        : "Couldn't open the vault: " + ex.message;
      $("#pw").select();
    } finally {
      btn.disabled = false;
      btn.textContent = "Unlock";
    }
  });

  function renderList() {
    const list = $("#clipList");
    list.innerHTML = "";
    clips.forEach((c, i) => {
      const li = document.createElement("li");
      li.innerHTML = "<span><strong></strong> <em></em></span><button type=button>Play this one</button>";
      li.querySelector("strong").textContent = c.guest_name;
      li.querySelector("em").textContent = c.caption ? "— " + c.caption : "";
      li.querySelector("button").addEventListener("click", () => run([clips[i]], { intro: false }));
      list.append(li);
    });
  }

  /* ---------- drawing ---------- */
  function wrap(text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawTitle(title, subtitle, alpha) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.textAlign = "center";
    ctx.fillStyle = C.sage;
    ctx.font = '84px "Pinyon Script", cursive';
    wrap(title, W - 240).forEach((l, i, arr) => ctx.fillText(l, W / 2, H / 2 - (arr.length - 1) * 45 + i * 90 - 10));
    if (subtitle) {
      ctx.fillStyle = C.soft;
      ctx.font = 'italic 34px "Cormorant Garamond", serif';
      wrap(subtitle, W - 300).forEach((l, i) => ctx.fillText(l, W / 2, H / 2 + 90 + i * 44));
    }
    ctx.restore();
  }

  function drawFrame(video, clip, alpha) {
    const vw = video.videoWidth || 16, vh = video.videoHeight || 9;
    ctx.save();
    ctx.fillStyle = "#1f1d18";
    ctx.fillRect(0, 0, W, H);
    // soft, blurred "cover" background so portrait phone videos don't float in black bars
    const cover = Math.max(W / vw, H / vh);
    ctx.globalAlpha = alpha * 0.55;
    if ("filter" in ctx) ctx.filter = "blur(28px)";
    ctx.drawImage(video, (W - vw * cover) / 2, (H - vh * cover) / 2, vw * cover, vh * cover);
    ctx.filter = "none";
    // the video itself, fully visible
    const fit = Math.min(W / vw, H / vh);
    ctx.globalAlpha = alpha;
    ctx.drawImage(video, (W - vw * fit) / 2, (H - vh * fit) / 2, vw * fit, vh * fit);
    // a gentle name ribbon
    ctx.globalAlpha = alpha * 0.9;
    const grad = ctx.createLinearGradient(0, H - 150, 0, H);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - 150, W, 150);
    ctx.fillStyle = "#fbf8f2";
    ctx.textAlign = "left";
    ctx.font = 'italic 36px "Cormorant Garamond", serif';
    ctx.fillText("— " + clip.guest_name, 56, H - 48);
    ctx.restore();
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => requestAnimationFrame(r));

  async function showTitle(title, subtitle, ms) {
    const start = performance.now();
    while (!stopRequested) {
      const t = performance.now() - start;
      if (t >= ms) break;
      const a = Math.min(1, t / FADE, (ms - t) / FADE);
      drawTitle(title, subtitle, Math.max(0, a));
      await frame();
    }
  }

  function playClip(clip) {
    return new Promise(resolve => {
      const v = document.createElement("video");
      v.crossOrigin = "anonymous"; // needed so the canvas can be recorded
      v.playsInline = true;
      v.preload = "auto";
      v.src = Backend.publicUrl(clip.path);
      let done = false;
      const finish = () => { if (!done) { done = true; v.pause(); v.removeAttribute("src"); v.load(); resolve(); } };
      v.onerror = () => { status.textContent = `Skipped ${clip.guest_name}'s clip — this device couldn't play it.`; finish(); };
      v.onended = finish;
      v.oncanplay = async () => {
        v.oncanplay = null;
        if (audio) {
          const src = audio.ctx.createMediaElementSource(v);
          src.connect(audio.ctx.destination);
          src.connect(audio.dest);
        }
        try { await v.play(); } catch (_) { return finish(); }
        while (!done && !stopRequested) {
          const t = v.currentTime * 1000, d = (v.duration || 15) * 1000;
          drawFrame(v, clip, Math.max(0, Math.min(1, t / FADE, (d - t) / FADE + 0.05)));
          await frame();
        }
        finish();
      };
    });
  }

  /* ---------- running the reel ---------- */
  async function run(list, { intro = true, record = false } = {}) {
    if (busy) { stopRequested = true; return; }
    busy = true;
    stopRequested = false;
    $("#playBtn").textContent = "Stop";
    $("#saveBtn").disabled = true;

    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      const actx = new AC();
      audio = { ctx: actx, dest: actx.createMediaStreamDestination() };
    }
    await audio.ctx.resume();

    let recorder = null, chunks = [], mime = "";
    if (record) {
      mime = ["video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
        .find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
      if (!canvas.captureStream || !window.MediaRecorder) {
        status.textContent = "This browser can't record the reel. Try Chrome or Firefox on a laptop.";
        busy = false; $("#playBtn").textContent = "Play the reel"; $("#saveBtn").disabled = false;
        return;
      }
      const stream = canvas.captureStream(30);
      audio.dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5e6 } : undefined);
      recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
      recorder.start(1000);
      status.textContent = "Recording… keep this tab open and in front until the reel finishes.";
    } else status.textContent = "";

    if (intro) await showTitle(fmt("For {0} & {1}"), "A few words from the people who love you", 4000);
    for (let i = 0; i < list.length && !stopRequested; i++) {
      const c = list[i];
      await showTitle(c.guest_name, c.caption || "", 2600);
      if (stopRequested) break;
      await playClip(c);
    }
    if (intro && !stopRequested) {
      await showTitle("Baie geluk", "Now put the phone down and go enjoy your honeymoon.", 5000);
    }
    drawTitle(fmt("For {0} & {1}"), "Press play to watch again", 1);

    if (recorder) {
      await wait(300);
      recorder.stop();
      await new Promise(r => (recorder.onstop = r));
      if (!stopRequested) {
        const type = (mime || "video/webm").split(";")[0];
        const blob = new Blob(chunks, { type });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `farewell-reel.${type.includes("mp4") ? "mp4" : "webm"}`;
        a.className = "btn btn--primary";
        a.textContent = "Download the reel";
        status.textContent = "";
        status.append(a);
      } else status.textContent = "Recording cancelled.";
    }
    busy = false;
    stopRequested = false;
    $("#playBtn").textContent = "Play the reel";
    $("#saveBtn").disabled = false;
  }

  $("#playBtn").addEventListener("click", () => run(clips));
  $("#saveBtn").addEventListener("click", () => run(clips, { record: true }));
  $("#fullBtn").addEventListener("click", () => {
    const el = $("#stageWrap");
    (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
  });

  // Draw once fonts are ready so the first card isn't in a fallback font.
  const fontsReady = document.fonts
    ? Promise.all(['84px "Pinyon Script"', 'italic 34px "Cormorant Garamond"'].map(f => document.fonts.load(f))).catch(() => {})
    : Promise.resolve();
  fontsReady.then(() => drawTitle(fmt("For {0} & {1}"), "", 1));
})();
