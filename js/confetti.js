/* Tiny confetti engine — earthy colours, paper-like flutter. */
(function () {
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  const colours = ["#8a9a7b", "#c9d1bd", "#b89b6a", "#b8754f", "#e9d8c4", "#d9b8a8", "#4f5d47"];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let pieces = [];
  let running = false;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
  }
  addEventListener("resize", resize);
  resize();

  function make(x, y, angle, spread, power) {
    const a = angle + (Math.random() - 0.5) * spread;
    const v = power * (0.5 + Math.random() * 0.7);
    return {
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      w: 6 + Math.random() * 7,
      h: 4 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      flip: Math.random() * Math.PI,
      vf: 0.05 + Math.random() * 0.12,
      colour: colours[(Math.random() * colours.length) | 0],
      round: Math.random() < 0.25,
      life: 0
    };
  }

  function loop() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter(p => p.y < innerHeight + 40 && p.life < 600);
    for (const p of pieces) {
      p.life++;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.16;          // gravity
      p.x += p.vx + Math.sin(p.life / 12) * 0.6; // flutter
      p.y += p.vy;
      p.rot += p.vr;
      p.flip += p.vf;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.flip));
      ctx.fillStyle = p.colour;
      ctx.globalAlpha = Math.min(1, (600 - p.life) / 60);
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (pieces.length) requestAnimationFrame(loop);
    else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  window.Confetti = {
    /* A little pop from a point (e.g. a button). */
    burst({ x = innerWidth / 2, y = innerHeight / 2, count = 60, power = 9 } = {}) {
      if (reduced) count = Math.min(count, 15);
      for (let i = 0; i < count; i++) pieces.push(make(x, y, -Math.PI / 2, Math.PI * 1.1, power));
      start();
    },
    /* The big celebration: two cannons from the bottom corners. */
    celebrate() {
      const n = reduced ? 20 : 110;
      for (let i = 0; i < n; i++) {
        pieces.push(make(0, innerHeight, -Math.PI / 3.2, 0.7, 19));
        pieces.push(make(innerWidth, innerHeight, -Math.PI + Math.PI / 3.2, 0.7, 19));
      }
      start();
    },
    fromElement(el, count) {
      const r = el.getBoundingClientRect();
      this.burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count });
    }
  };
})();
