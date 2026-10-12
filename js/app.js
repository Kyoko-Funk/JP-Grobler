/* =====================================================================
   The invitation's behaviour: screens, the gate, the quiz, details, RSVP.
   ===================================================================== */
(function () {
  const S = window.SITE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fmt = str => String(str).replace(/\{(\d)\}/g, (_, i) => S.names[i] || "");
  const get = path => path.split(".").reduce((o, k) => (o == null ? o : o[k]), S);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };
  const PASSED_KEY = "wedding-passed";

  /* ---------- fill words from config.js ---------- */
  $$("[data-name]").forEach(el => (el.textContent = S.names[+el.dataset.name]));
  $$("[data-surname]").forEach(el => (el.textContent = (S.surnames || [])[+el.dataset.surname] || ""));
  $$("[data-fill]").forEach(el => (el.textContent = fmt(get(el.dataset.fill) ?? "")));
  document.title = `${S.names[0]} & ${S.names[1]} · ${S.venueNickname}`;

  // Use the real couple photo if it exists; otherwise keep the elegant placeholder.
  const probe = new Image();
  probe.onload = () => ($("#couplePhoto").src = S.photo);
  probe.src = S.photo;

  /* ---------- moving between screens ---------- */
  let current = $("#arrival");
  function go(id) {
    const next = document.getElementById(id);
    const prev = current;
    prev.classList.add("screen--leaving");
    prev.classList.remove("screen--active");
    setTimeout(() => {
      prev.classList.remove("screen--leaving");
      next.classList.add("screen--active");
      window.scrollTo({ top: 0 });
      current = next;
      if (id === "main") startMain();
      if (id === "quiz") startQuiz();
    }, 650);
  }

  /* ---------- ONE · arrival ---------- */
  $("#beginBtn").addEventListener("click", e => {
    Confetti.fromElement(e.currentTarget, 30);
    go("gate");
  });
  if (store.get(PASSED_KEY)) {
    $("#skipBtn").hidden = false;
    $("#skipBtn").addEventListener("click", () => go("main"));
  }

  /* ---------- TWO · the gate ---------- */
  const arena = $("#gateArena");
  const yes = $("#yesBtn");
  const no = $("#noBtn");
  const whisper = $("#gateWhisper");
  yes.textContent = S.gate.yes;
  no.textContent = S.gate.no;
  let dodges = 0;

  let lastTaunt = 0;
  function dodge(px, py) {
    // Change the words first (once every ~half second, so each taunt gets read),
    // then measure, so a longer taunt never pokes out of the card.
    const now = Date.now();
    if (now - lastTaunt > 450) {
      lastTaunt = now;
      dodges++;
      const taunts = S.gate.noTaunts;
      no.textContent = taunts[Math.min(dodges, taunts.length - 1)];
      no.style.transform = `scale(${Math.max(0.65, 1 - dodges * 0.04)})`;
      yes.style.transform = `scale(${Math.min(1.25, 1 + dodges * 0.03)})`;
    }
    const a = arena.getBoundingClientRect();
    if (!no.classList.contains("is-loose")) {
      const b0 = no.getBoundingClientRect();
      no.style.left = b0.left - a.left + "px";
      no.style.top = b0.top - a.top + "px";
      no.classList.add("is-loose");
    }
    const bw = no.offsetWidth, bh = no.offsetHeight; // unscaled size: the safe bound
    const y = yes.getBoundingClientRect();
    const maxX = Math.max(0, a.width - bw);
    const maxY = Math.max(0, a.height - bh);
    let best = null;
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * maxX, yy = Math.random() * maxY;
      const cx = a.left + x + bw / 2, cy = a.top + yy + bh / 2;
      const fromPointer = Math.hypot(cx - px, cy - py);
      const overlapsYes = cx + bw / 2 > y.left - 12 && cx - bw / 2 < y.right + 12 && cy + bh / 2 > y.top - 12 && cy - bh / 2 < y.bottom + 12;
      const score = overlapsYes ? -1 : fromPointer;
      if (!best || score > best.score) best = { x, y: yy, score };
      if (!overlapsYes && fromPointer > 160) break;
    }
    no.style.left = best.x + "px";
    no.style.top = best.y + "px";
  }

  arena.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    const b = no.getBoundingClientRect();
    const near = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
    if (near < Math.max(b.width, b.height) * 0.9) dodge(e.clientX, e.clientY);
  });
  // Touch screens can't hover, so the button leaps away the moment it's touched.
  let lastPress = 0;
  no.addEventListener("pointerdown", e => {
    e.preventDefault();
    lastPress = Date.now();
    dodge(e.clientX, e.clientY);
  });
  // Somebody managed it (probably with the keyboard). Respect.
  no.addEventListener("click", e => {
    e.preventDefault();
    if (Date.now() - lastPress < 1000) return; // a tap/click already made it dodge; only the keyboard "catches" it
    whisper.textContent = S.gate.noCaught;
  });
  yes.addEventListener("click", () => {
    whisper.textContent = S.gate.afterYes;
    whisper.style.color = "var(--sage-deep)";
    Confetti.celebrate();
    yes.disabled = no.disabled = true;
    setTimeout(() => go("quiz"), 1800);
  });

  /* ---------- THREE · the quiz ---------- */
  const stage = $("#quizStage");
  const bar = $("#quizBar");
  let qi = 0, quizStarted = false;

  function startQuiz() {
    if (quizStarted) return;
    quizStarted = true;
    renderQuestion();
  }

  function swapCard(el) {
    const old = stage.firstElementChild;
    if (!old) { stage.append(el); return; }
    old.classList.add("is-out");
    setTimeout(() => { old.remove(); stage.append(el); }, 450);
  }

  function renderQuestion() {
    const item = S.quiz[qi];
    bar.style.width = (qi / S.quiz.length) * 100 + "%";
    const card = document.createElement("div");
    card.className = "card qcard";
    card.innerHTML = `
      <p class="qcard__num"></p>
      <h3></h3>
      <div class="options"></div>
      <p class="qcard__reply"></p>`;
    const num = `${String(qi + 1).padStart(2, "0")} / ${String(S.quiz.length).padStart(2, "0")}`;
    $(".qcard__num", card).textContent = item.tag ? `${num} · ${item.tag}` : num;
    $("h3", card).textContent = fmt(item.q);
    const reply = $(".qcard__reply", card);
    // Two short answers sit side by side, like a proper yes/no.
    if (item.options.length === 2) $(".options", card).classList.add("options--pair");

    item.options.forEach(opt => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "option";
      b.textContent = fmt(opt.text);
      b.addEventListener("click", () => {
        if (opt.right) {
          b.classList.add("is-right");
          $$(".option", card).forEach(o => (o.disabled = true));
          reply.className = "qcard__reply";
          reply.textContent = fmt(opt.reply);
          Confetti.fromElement(b, 30); // a small puff, not the full celebration
          const next = document.createElement("button");
          next.className = "btn btn--ghost";
          next.style.marginTop = "1rem";
          next.textContent = qi + 1 < S.quiz.length ? "Next question" : "And the verdict is…";
          next.addEventListener("click", () => {
            qi++;
            qi < S.quiz.length ? renderQuestion() : renderEnd();
          });
          card.append(next);
          setTimeout(() => next.focus({ preventScroll: true }), 50);
        } else {
          b.classList.add("is-wrong");
          b.disabled = true;
          const tease = fmt(opt.reply);
          reply.className = "qcard__reply is-tease";
          reply.textContent = /try again/i.test(tease) ? tease : tease + " Try again.";
          card.classList.remove("shake");
          void card.offsetWidth; // restart the wiggle
          card.classList.add("shake");
        }
      });
      $(".options", card).append(b);
    });
    swapCard(card);
  }

  function renderEnd() {
    bar.style.width = "100%";
    const end = S.quizEnd;
    const card = document.createElement("div");
    card.className = "card qcard verdict";
    card.innerHTML = `
      <p class="eyebrow"></p>
      <p class="script"></p>
      <p class="lede"></p>
      <button class="btn btn--primary" style="margin-top:2rem"></button>`;
    $(".eyebrow", card).textContent = end.eyebrow;
    $(".script", card).textContent = end.title;
    $(".lede", card).textContent = end.text;
    $("button", card).textContent = end.button;
    $("button", card).addEventListener("click", () => { Confetti.celebrate(); go("main"); });
    swapCard(card);
    setTimeout(() => Confetti.celebrate(), 500);
  }

  /* ---------- FOUR · details ---------- */
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(S.venue.mapsQuery);
  $("#mapsLink").href = mapsUrl;
  S.venue.directions.forEach(t => { const li = document.createElement("li"); li.textContent = t; $("#directionsList").append(li); });
  S.dressCode.lines.forEach(t => { const li = document.createElement("li"); li.textContent = t; $("#dressList").append(li); });

  let mainStarted = false;
  function startMain() {
    store.set(PASSED_KEY, "1");
    if (mainStarted) return;
    mainStarted = true;
    $("#mapFrame").src = "https://www.google.com/maps?q=" + encodeURIComponent(S.venue.mapsQuery) + "&output=embed";
    observeReveals();
    tick();
    setInterval(tick, 1000);
    document.dispatchEvent(new CustomEvent("main:shown"));
  }

  function observeReveals() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(el => io.observe(el));
    window.observeReveal = el => io.observe(el);
  }

  function tick() {
    const ms = new Date(S.dateISO) - new Date();
    const el = $("#countdown");
    if (ms <= 0) { el.innerHTML = '<p class="lede">It\'s happening. Put your phone down and go dance.</p>'; return; }
    const parts = [
      [Math.floor(ms / 864e5), "days"],
      [Math.floor(ms / 36e5) % 24, "hours"],
      [Math.floor(ms / 6e4) % 60, "minutes"],
      [Math.floor(ms / 1e3) % 60, "seconds"]
    ];
    el.innerHTML = parts.map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join("");
  }

  /* ---------- FIVE · RSVP ---------- */
  const form = $("#rsvpForm");
  const plus = $("#plusOnes");
  for (let i = 0; i <= S.rsvp.maxPlusOnes; i++) {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = i === 0 ? "Just me, flying solo" : i === 1 ? "1 — my plus-one" : `${i} — we travel as a herd`;
    plus.append(o);
  }
  S.rsvp.dietary.forEach(d => {
    const l = document.createElement("label");
    l.className = "check";
    l.innerHTML = `<input type="checkbox" name="diet"><span></span>`;
    $("input", l).value = d.value;
    $("span", l).textContent = d.label;
    $("#dietChecks").append(l);
  });
  // "Nothing" and the other options cancel each other out.
  $("#dietChecks").addEventListener("change", e => {
    if (e.target.name !== "diet" || !e.target.checked) return;
    $$('input[name="diet"]', form).forEach(c => {
      if (c !== e.target && (c.value === "none" || e.target.value === "none")) c.checked = false;
    });
  });
  form.addEventListener("change", e => {
    if (e.target.name === "attending") $("#ifAttending").hidden = e.target.value !== "yes";
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const err = $("#rsvpError");
    err.textContent = "";
    const fd = new FormData(form);
    const name = (fd.get("name") || "").trim();
    const attending = fd.get("attending");
    if (!name) { err.textContent = "We'll need a name — “Anonymous” is not on the guest list."; return form.elements.name.focus(); }
    if (!attending) { err.textContent = "Coming or not? Don't leave us hanging."; return; }

    const going = attending === "yes";
    const dietValues = going ? fd.getAll("diet") : [];
    const payload = {
      type: "rsvp",
      name,
      attending: going ? "Yes" : "No",
      plusOnes: going ? Number(fd.get("plusOnes") || 0) : 0,
      dietary: dietValues.join(", "),
      dietOther: going ? (fd.get("dietOther") || "").trim() : "",
      note: (fd.get("note") || "").trim(),
      website: fd.get("website") || ""
    };

    const btn = $("#rsvpSubmit");
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      const res = payload.website ? { ok: true } : await Backend.notify(payload);
      $("#rsvpThanksText").textContent = going ? S.rsvp.thanksYes : S.rsvp.thanksNo;
      $("#rsvpThanks .demo-note")?.remove();
      if (res.demo) {
        const p = document.createElement("p");
        p.className = "demo-note";
        p.textContent = "(Demo mode: the spreadsheet isn't connected yet, so this reply wasn't saved.)";
        $("#rsvpThanks").append(p);
      }
      form.hidden = true;
      $("#rsvpThanks").hidden = false;
      $("#rsvpThanks").classList.add("is-in");
      $("#rsvpThanks").scrollIntoView({ behavior: "smooth", block: "center" });
      if (going) Confetti.celebrate();
    } catch (ex) {
      err.textContent = "Eish, that didn't go through. Please try again in a moment. (" + ex.message + ")";
    } finally {
      btn.disabled = false;
      btn.textContent = "Send my RSVP";
    }
  });
  $("#rsvpAgain").addEventListener("click", () => {
    $("#rsvpThanks").hidden = true;
    form.hidden = false;
  });
})();
