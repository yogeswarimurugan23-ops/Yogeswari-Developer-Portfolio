// ===== Setup =====
const $ = (s, c = document) => c.querySelector(s);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches && matchMedia("(hover: hover)").matches;
const navLinks = $("#navLinks"), menuBtn = $("#menuToggle");

// ===== 1. Hero name: animated with CSS only (nameIn keyframes in style.css) =====

// ===== 2. Mobile menu =====
menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
}));

// ===== 3. Scroll reveal + hackathon counter =====
function runCounter() {
  const el = $("#hackCount"), to = +el.dataset.to;
  if (reduceMotion) return;
  const t0 = performance.now();
  (function step(t) {
    const p = Math.min((t - t0) / 1200, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("visible");
    if (e.target.id === "hackCard") runCounter();
    io.unobserve(e.target);
  }), { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));
} else revealEls.forEach((el) => el.classList.add("visible"));

// ===== 4. Active nav link, sliding indicator, progress bar, back-to-top =====
const sections = [...document.querySelectorAll("main section[id]")];
const links = [...navLinks.querySelectorAll("a")];
const indicator = $("#indicator"), progress = $("#progress"), toTop = $("#toTop");
let ticking = false;
function onScroll() {
  let current = sections[0].id;
  sections.forEach((s) => { if (scrollY >= s.offsetTop - 140) current = s.id; });
  let active = null;
  links.forEach((a) => { const on = a.getAttribute("href") === "#" + current; a.classList.toggle("active", on); if (on) active = a; });
  if (active) { indicator.style.width = active.offsetWidth + "px"; indicator.style.transform = `translateX(${active.offsetLeft}px)`; }
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  toTop.classList.toggle("show", scrollY > 600);
  ticking = false;
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener("resize", onScroll);
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
onScroll();

// ===== 5. Card glow follows pointer; project cards tilt in 3D =====
document.querySelectorAll(".glass").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    card.style.setProperty("--px", x + "px"); card.style.setProperty("--py", y + "px");
    if (card.classList.contains("tilt") && e.pointerType === "mouse" && !reduceMotion) {
      card.style.setProperty("--ry", ((x / r.width - 0.5) * 9).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y / r.height) * 9).toFixed(2) + "deg");
    }
  });
  card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
});

// ===== 6. Futuristic cursor: dot + radar ring + glowing trail + sparks =====
// Only for real mouse devices and when motion is allowed. Touch keeps the normal cursor.
if (finePointer && !reduceMotion) {
  document.documentElement.classList.add("has-cursor");
  const ring = $("#curRing"), dot = $("#curDot"), cv = $("#fx"), ctx = cv.getContext("2d");
  const m = { x: innerWidth / 2, y: innerHeight / 2 }, r = { x: m.x, y: m.y };
  const trail = [], sparks = [];
  let w, h, last = { x: m.x, y: m.y };
  function size() {
    const d = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  size(); addEventListener("resize", size);

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    m.x = e.clientX; m.y = e.clientY;
    ring.classList.add("on"); dot.classList.add("on");
    trail.push({ x: m.x, y: m.y, life: 1 }); if (trail.length > 26) trail.shift();
    if (Math.hypot(m.x - last.x, m.y - last.y) > 14 && sparks.length < 36) {
      last = { x: m.x, y: m.y };
      sparks.push({ x: m.x, y: m.y, vx: (Math.random() - .5) * 1.6, vy: (Math.random() - .5) * 1.6, life: 1, c: Math.random() > .5 ? "196,181,253" : "168,85,247" });
    }
  }, { passive: true });
  document.addEventListener("pointerleave", () => { ring.classList.remove("on"); dot.classList.remove("on"); });
  addEventListener("pointerdown", () => ring.classList.add("down"));
  addEventListener("pointerup", () => ring.classList.remove("down"));
  // Ring grows over links, buttons and project cards
  document.addEventListener("pointerover", (e) => ring.classList.toggle("hover", !!e.target.closest("a, button, .tilt")));

  let running = true;
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) loop(); });
  function loop() {
    if (!running) return;
    r.x += (m.x - r.x) * 0.16; r.y += (m.y - r.y) * 0.16;
    dot.style.transform = `translate(${m.x}px, ${m.y}px)`;
    ring.style.transform = `translate(${r.x}px, ${r.y}px)`;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (let i = trail.length - 1; i >= 0; i--) {
      const t = trail[i]; t.life -= 0.045;
      if (t.life <= 0) { trail.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(168,85,247,${t.life * 0.4})`;
      ctx.beginPath(); ctx.arc(t.x, t.y, 1.5 + t.life * 6, 0, 6.283); ctx.fill();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.life -= 0.03;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(${s.c},${s.life * 0.9})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.4, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(loop);
  }
  loop();

  // Magnetic buttons: pull slightly toward the pointer
  document.querySelectorAll(".btn").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const q = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - q.left - q.width / 2) * 0.22}px ${(e.clientY - q.top - q.height / 2) * 0.3}px`;
    });
    b.addEventListener("pointerleave", () => { b.style.translate = "0 0"; });
  });
}

// ===== 7. Three.js hero: AI brain, circuit board, network nodes, code symbols, particles =====
(function initScene() {
  const wrap = $("#scene"), canvas = $("#three");
  if (!window.THREE) { wrap.classList.add("nogl"); return; }   // library not loaded: show CSS fallback
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); } catch (e) { wrap.classList.add("nogl"); return; }
  const small = innerWidth < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.6, 12.8);
  const root = new THREE.Group(); scene.add(root);
  const ADD = THREE.AdditiveBlending, VIOLET = 0x8b5cf6, NEON = 0xa855f7, LAV = 0xc4b5fd;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mkGeo = (arr) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3)); return g; };
  const dots = (arr, c, s, o) => new THREE.Points(mkGeo(arr), new THREE.PointsMaterial({ color: c, size: s, transparent: true, opacity: o, blending: ADD, depthWrite: false }));
  const segs = (arr, c, o) => new THREE.LineSegments(mkGeo(arr), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o, blending: ADD }));

  // --- AI brain: a displaced sphere with a groove between two hemispheres ---
  const brain = new THREE.Group(); root.add(brain);
  const bg = new THREE.IcosahedronGeometry(1.5, small ? 3 : 4), bp = bg.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), l = Math.hypot(x, y, z);
    const nx = x / l, ny = y / l, nz = z / l;
    let r = 1.75 * (1 + 0.09 * Math.sin(nx * 13 + ny * 5) * Math.sin(nz * 11 + ny * 4) + 0.05 * Math.sin(ny * 17 + nz * 6));
    if (Math.abs(nx) < 0.12) r *= 0.84 + 0.16 * (Math.abs(nx) / 0.12);   // deep groove between hemispheres
    bp.setXYZ(i, nx * r * 1.05, ny * r * 0.85, nz * r * 1.22);
  }
  brain.add(new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: 0x12091f, transparent: true, opacity: 0.6 })));
  brain.add(new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: VIOLET, wireframe: true, transparent: true, opacity: 0.5, blending: ADD })));
  // neurons + synapse links on the brain surface
  const nPts = [];
  for (let i = 0; i < (small ? 40 : 70); i++) { const k = Math.floor(Math.random() * bp.count); nPts.push(new THREE.Vector3(bp.getX(k), bp.getY(k), bp.getZ(k)).multiplyScalar(1.015)); }
  const nArr = [], lArr = [];
  nPts.forEach((p, i) => { nArr.push(p.x, p.y, p.z); for (let j = i + 1; j < nPts.length; j++) if (p.distanceTo(nPts[j]) < 1.0) lArr.push(p.x, p.y, p.z, nPts[j].x, nPts[j].y, nPts[j].z); });
  brain.add(dots(nArr, LAV, 0.1, 1));
  const synapses = segs(lArr, NEON, 0.7); brain.add(synapses);

  // --- Neon rings ---
  const rings = [[2.9, VIOLET, 1.2, 0.2], [3.3, NEON, 0.5, 0.9], [3.7, LAV, 1.5, 0.4]].map(([r, c, rx, ry]) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 160), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75, blending: ADD }));
    m.rotation.set(rx, ry, 0); root.add(m); return m;
  });

  // --- Circuit board under the brain: right-angle traces + via dots ---
  const board = new THREE.Group(); board.position.y = -2.7; root.add(board);
  const tr = [], vias = [], traces = small ? 24 : 40;
  for (let i = 0; i < traces; i++) {
    const a = (i / traces) * 6.283;
    let x = Math.cos(a) * 1.8, z = Math.sin(a) * 1.8, axis = Math.random() > 0.5 ? 0 : 1;
    for (let s = 0; s < 4; s++) {
      const len = rnd(0.3, 0.8) * (Math.random() > 0.5 ? 1 : -1), nx = axis ? x : x + len, nz = axis ? z + len : z;
      if (Math.hypot(nx, nz) > 4.3) break;
      tr.push(x, 0, z, nx, 0, nz); x = nx; z = nz; axis = 1 - axis;
    }
    vias.push(x, 0, z);
  }
  board.add(segs(tr, VIOLET, 0.65), dots(vias, LAV, 0.14, 1));
  const bring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.012, 6, 100), new THREE.MeshBasicMaterial({ color: NEON, transparent: true, opacity: 0.8, blending: ADD }));
  bring.rotation.x = Math.PI / 2; board.add(bring);
  const beams = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; beams.push(Math.cos(a) * 1.8, 0, Math.sin(a) * 1.8, Math.cos(a) * 1.8, 1.0, Math.sin(a) * 1.8); }
  board.add(segs(beams, NEON, 0.35));   // data beams rising from the board

  // --- Digital network nodes (floating web of connected points) ---
  const net = new THREE.Group(); root.add(net);
  const np = [];
  for (let i = 0; i < (small ? 26 : 44); i++) { const r = rnd(3.0, 4.2), a = rnd(0, 6.283), b = Math.acos(rnd(-1, 1)); np.push(new THREE.Vector3(r * Math.sin(b) * Math.cos(a), r * Math.cos(b) * 0.7, r * Math.sin(b) * Math.sin(a))); }
  const na = [], nl = [];
  np.forEach((p, i) => { na.push(p.x, p.y, p.z); for (let j = i + 1; j < np.length; j++) if (p.distanceTo(np[j]) < 1.9) nl.push(p.x, p.y, p.z, np[j].x, np[j].y, np[j].z); });
  net.add(dots(na, NEON, 0.13, 1), segs(nl, VIOLET, 0.35));

  // --- Floating programming symbols (glowing text sprites) ---
  function label(txt) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    g.font = "700 44px Consolas, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = "#a855f7"; g.shadowBlur = 18; g.fillStyle = "#efe7ff"; g.fillText(txt, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  const syms = ["</>", "{ }", "01", "AI", "Py", "SQL", "( )", "10", "ML", "Git"].map((t, i, arr) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: label(t), transparent: true, opacity: 0.9, depthWrite: false, blending: ADD }));
    s.scale.setScalar(0.95);
    s.userData = { a: (i / arr.length) * 6.283, r: rnd(3.0, 3.7), y: rnd(-1.4, 1.8), sp: rnd(0.12, 0.26), ph: rnd(0, 6) };
    root.add(s); return s;
  });

  // --- Particles ---
  const pc = small ? 350 : 800, pa = [];
  for (let i = 0; i < pc; i++) { const r = rnd(4.5, 8), a = rnd(0, 6.283), b = Math.acos(rnd(-1, 1)); pa.push(r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a)); }
  const particles = dots(pa, LAV, 0.04, 0.8); scene.add(particles);

  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); addEventListener("resize", resize);

  const target = { x: 0, y: 0 };   // mouse parallax target
  addEventListener("pointermove", (e) => { target.x = (e.clientX / innerWidth - 0.5) * 2; target.y = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });

  function update(t, still) {
    const e = still ? 1 : 1 - Math.pow(1 - Math.min(t / 1.5, 1), 3);   // entrance
    root.scale.setScalar(Math.max(e, 0.001));
    brain.rotation.y = t * 0.25; brain.scale.setScalar(1 + Math.sin(t * 1.6) * 0.015);
    synapses.material.opacity = 0.45 + Math.sin(t * 2) * 0.25;
    rings.forEach((r, i) => { r.rotation.z = t * 0.25 * (i + 1) * 0.5; });
    net.rotation.y = -t * 0.07; particles.rotation.y = t * 0.03;
    syms.forEach((s) => { const d = s.userData, a = d.a + t * d.sp; s.position.set(Math.cos(a) * d.r, d.y + Math.sin(t + d.ph) * 0.2, Math.sin(a) * d.r); });
    root.position.y = Math.sin(t * 1.1) * 0.1;
    root.rotation.y += (target.x * 0.55 - root.rotation.y) * 0.05;
    root.rotation.x += (target.y * 0.3 - root.rotation.x) * 0.05;
    renderer.render(scene, camera);
  }
  if (reduceMotion) { update(3, true); return; }   // one still frame, no animation loop

  let visible = true, running = false;
  const t0 = performance.now();
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    update((now - t0) / 1000, false);
    requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) start(); }).observe(wrap);   // pause when off screen
  document.addEventListener("visibilitychange", () => { if (!document.hidden && visible) start(); });
  start();
})();

// ===== 8. Copy email button =====
const copyBtn = $("#copyEmail"), status = $("#copyStatus");
copyBtn.addEventListener("click", async () => {
  const email = "yogeswarimurugan23@gmail.com";
  try { await navigator.clipboard.writeText(email); }
  catch (e) {
    const t = document.createElement("textarea"); t.value = email; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch (err) { /* ignore */ }
    t.remove();
  }
  status.textContent = "Email copied to clipboard";
  setTimeout(() => (status.textContent = ""), 2500);
});

// ===== 8b. Project images =====
// Each card uses the real file (assets/projects/NAME.svg). If a browser cannot load that file for any reason
// (file not copied, wrong folder, blocked), the same artwork embedded in index.html is shown instead.
document.querySelectorAll(".p-media img").forEach((img) => {
  const useEmbedded = () => {
    if (!img.isConnected) return;
    const src = img.getAttribute("src"), tpl = document.getElementById("art-" + src.split("/").pop().replace(".svg", ""));
    console.warn("Could not load " + src + ". Showing embedded artwork. Check that the file is inside the assets/projects folder.");
    if (tpl) img.replaceWith(tpl.content.firstElementChild.cloneNode(true));
  };
  img.addEventListener("error", useEmbedded);
  if (img.complete && img.naturalWidth === 0) useEmbedded();
});

// ===== 8c. Enlarge project images (lightbox) =====
(function lightbox() {
  const box = $("#lightbox"), media = $("#lbMedia"), cap = $("#lbCap"), close = $("#lbClose");
  let opener = null;
  function open(card) {
    const img = card.querySelector("img"), art = card.querySelector("svg.p-art");
    const el = (img || art).cloneNode(true);
    el.removeAttribute("width"); el.removeAttribute("height"); el.removeAttribute("loading");
    media.replaceChildren(el);
    cap.textContent = card.closest(".project").querySelector("h3").textContent + " - Illustrative Mockup with sample data (not a real screenshot)";
    opener = card; box.hidden = false; document.body.style.overflow = "hidden"; close.focus();
  }
  function shut() { box.hidden = true; media.replaceChildren(); document.body.style.overflow = ""; if (opener) opener.focus(); }
  document.querySelectorAll(".p-media").forEach((card) => {
    card.addEventListener("click", () => open(card));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(card); } });
  });
  close.addEventListener("click", shut);
  box.addEventListener("click", (e) => { if (e.target === box) shut(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden) shut(); });
})();

// ===== 8d. Contact form: sends the visitor's message to my Gmail inbox through FormSubmit =====
(function contactForm() {
  const form = $("#contactForm"); if (!form) return;
  const btn = $("#sendBtn"), out = $("#formStatus");
  const ENDPOINT = "https://formsubmit.co/ajax/yogeswarimurugan23@gmail.com";   // no secret keys are needed or stored here
  const checks = {
    name: (v) => v.length >= 2 || "Please enter your name.",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "Please enter a valid email address.",
    subject: (v) => v.length >= 3 || "Please enter a subject.",
    message: (v) => v.length >= 10 || "Please write a message of at least 10 characters.",
  };
  let sending = false;
  function show(kind, text, withMail) {
    out.className = "form-status " + kind; out.textContent = text;
    if (withMail) { const a = document.createElement("a"); a.href = "mailto:yogeswarimurugan23@gmail.com"; a.textContent = "yogeswarimurugan23@gmail.com"; out.append(" ", a, "."); }
  }
  function validate() {
    let first = null;
    Object.keys(checks).forEach((key) => {
      const el = form.elements[key], res = checks[key](el.value.trim());
      $("#err-" + key).textContent = res === true ? "" : res;
      el.setAttribute("aria-invalid", res === true ? "false" : "true");
      if (res !== true && !first) first = el;
    });
    return first;
  }
  form.addEventListener("input", (e) => { const k = e.target.name; if (checks[k] && e.target.getAttribute("aria-invalid") === "true" && checks[k](e.target.value.trim()) === true) { $("#err-" + k).textContent = ""; e.target.setAttribute("aria-invalid", "false"); } });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;                                // prevents duplicate submissions
    if (form.elements._honey.value) return;             // hidden spam-trap field: real visitors leave it empty
    out.className = "form-status"; out.textContent = "";
    const bad = validate(); if (bad) { bad.focus(); return; }
    sending = true; btn.disabled = true; btn.textContent = "Sending...";
    const v = (k) => form.elements[k].value.trim();
    const body = { name: v("name"), email: v("email"), subject: v("subject"), message: v("message"), _subject: "Portfolio message: " + v("subject"), _template: "table" };
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
    try {
      const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
      let data = {}; try { data = await res.json(); } catch (_) { /* not JSON */ }
      const ok = res.ok && (data.success === true || data.success === "true");
      if (ok && /activat/i.test(String(data.message || ""))) { show("err", "The message form is not activated yet, so your message was not delivered. Please email me directly at", true); }
      else if (ok) { show("ok", "Thank you! Your message was sent successfully. I will reply to your email address soon."); form.reset(); }
      else throw new Error("Submission was not accepted");
    } catch (err) { show("err", "Sorry, your message could not be sent. Please try again in a moment, or email me directly at", true); }
    finally { clearTimeout(timer); sending = false; btn.disabled = false; btn.textContent = "Send Message"; }
  });
})();

// ===== 9. Footer year =====
$("#year").textContent = new Date().getFullYear();
