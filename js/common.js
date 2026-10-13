/* =====================================================================
   Shared by the invitation and the scrapbook page:
   names & words from config.js, the photo lightbox, fade-in-on-scroll.
   ===================================================================== */
(function () {
  const S = window.SITE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // "{0}" → groom's first name, "{1}" → bride's first name
  window.fmt = str => String(str).replace(/\{(\d)\}/g, (_, i) => S.names[i] || "");
  const get = path => path.split(".").reduce((o, k) => (o == null ? o : o[k]), S);

  $$("[data-name]").forEach(el => (el.textContent = S.names[+el.dataset.name]));
  $$("[data-surname]").forEach(el => (el.textContent = (S.surnames || [])[+el.dataset.surname] || ""));
  $$("[data-fill]").forEach(el => (el.textContent = fmt(get(el.dataset.fill) ?? "")));

  /* ---------- lightbox: tap a photo to see it whole ---------- */
  const lb = $("#lightbox");
  if (lb) {
    window.openLightbox = (src, caption, name) => {
      $("img", lb).src = src;
      $("figcaption", lb).textContent = [caption, name && (caption ? "— " + name : name)].filter(Boolean).join(" ");
      lb.hidden = false;
      $(".lightbox__close", lb).focus();
    };
    const close = () => { lb.hidden = true; $("img", lb).src = ""; };
    lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lightbox__close")) close(); });
    addEventListener("keydown", e => { if (e.key === "Escape" && !lb.hidden) close(); });
  }

  /* ---------- gentle fade-in as things scroll into view ---------- */
  let io;
  window.startReveals = () => {
    if (io) return;
    io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(el => io.observe(el));
  };
})();
