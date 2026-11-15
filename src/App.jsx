import React, { useState, useEffect, useMemo, useRef } from "react";
import { Rocket, Zap, Leaf, ShieldCheck, FlaskConical, Radio, Sun, Moon, Award, Printer, RotateCcw, ChevronRight, AlertTriangle, Satellite, Settings, Info, Volume2, VolumeX } from "lucide-react";

/* ---------- Colors ---------- */
const C = { bg: "#0B1120", panel: "#131C31", edge: "#243049", power: "#38BDF8", life: "#34D399", safe: "#FBBF24", sci: "#A78BFA", text: "#E8EEFB", dim: "#9AA8C7" };

/* ---------- Plain-English glossary (tap or hover) ---------- */
const TERMS = {
  sol: "A Sol is one day on Mars: 24 hours 39 minutes long, a little longer than an Earth day.",
  sols: "Sols are Martian days. Each one is 24 hours 39 minutes long.",
  "radiation dose": "How much space radiation your body soaks up. It is measured in mSv (millisieverts).",
  msv: "mSv means millisievert, a tiny unit for measuring radiation dose.",
  "coronal mass ejection": "A giant cloud of charged particles that the Sun burps into space. It is also called a CME.",
  cme: "Coronal Mass Ejection: a giant cloud of charged particles the Sun burps into space.",
  "solar flare": "A sudden flash of light and energy from the Sun. Flares are ranked C (small), M (medium) and X (biggest).",
  hydroponics: "Growing plants in water with nutrients instead of soil. It is how astronauts grow fresh food.",
  "radio delay": "Radio signals take time to travel. The wait before a message arrives is the radio delay.",
  micrometeoroids: "Tiny space rocks, often smaller than a grain of sand, that zoom through space super fast.",
  micrometeoroid: "A tiny space rock, often smaller than a grain of sand, that zooms through space super fast.",
  "closed-loop life support": "A system that cleans and reuses the same water and air again and again.",
  regolith: "Regolith is the loose dusty soil and broken rock that covers the Moon and Mars.",
  "comms delay": "Radio signals take time to travel. The wait before a message arrives is the comms delay.",
  "water-wall": "Walls filled with water. Water blocks a lot of radiation, so it makes a great shield.",
  airlock: "A small sealed room between the inside and outside of a base.",
  telemetry: "Measurements sent back by sensors and spacecraft, like a robot's report card.",
  donki: "DONKI is NASA's Space Weather Database. It records solar flares and CMEs.",
  osdr: "NASA's Open Science Data Repository. It shares real space biology experiment results with everyone.",
  microgravity: "Almost no gravity, so things and people float. It makes bones and muscles weaker.",
  "power pool": "All of the electricity your base can use today, shared between its machines.",
};
const TERM_RE = new RegExp("\\b(" + Object.keys(TERMS).sort((a, b) => b.length - a.length).join("|") + ")\\b", "gi");

function Term({ k, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="border-b-2 border-dotted font-semibold" style={{ borderColor: C.power, color: C.power }}>{children}</button>
      {open && <span role="tooltip" className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1 w-56 rounded-lg p-2 text-xs font-normal text-left shadow-xl" style={{ background: "#fff", color: "#0B1120" }}>{TERMS[k]}</span>}
    </span>
  );
}
function Rich({ text }) {
  return <>{String(text).split(TERM_RE).map((p, i) => (i % 2 ? <Term key={i} k={p.toLowerCase()}>{p}</Term> : <React.Fragment key={i}>{p}</React.Fragment>))}</>;
}

/* ---------- Synthesized sound (Web Audio, no audio files). Silent until the player turns it on. ---------- */
const Snd = {
  on: false, ctx: null, h: null,
  c() { if (!this.on) return null; try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === "suspended") this.ctx.resume(); return this.ctx; } catch (e) { return null; } },
  tone(f, d = 0.12, type = "sine", v = 0.05, at = 0) {
    const x = this.c(); if (!x) return;
    const o = x.createOscillator(), g = x.createGain(), t = x.currentTime + at;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(x.destination); o.start(t); o.stop(t + d + 0.02);
  },
  click() { this.tone(660, 0.05, "square", 0.025); },
  count(f) { this.tone(f, 0.2, "triangle", 0.07); },
  ok() { this.tone(523, 0.1, "sine", 0.06); this.tone(784, 0.18, "sine", 0.06, 0.1); },
  warn() { [0, 0.3].forEach((a) => { this.tone(880, 0.2, "square", 0.035, a); this.tone(660, 0.2, "square", 0.035, a + 0.12); }); },
  pad(f) { this.tone(f, 0.3, "triangle", 0.07); this.tone(f / 2, 0.3, "sine", 0.03); },
  zap() {
    const x = this.c(); if (!x) return;
    const o = x.createOscillator(), g = x.createGain(), t = x.currentTime;
    o.type = "sawtooth"; o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(220, t + 0.16);
    g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(x.destination); o.start(t); o.stop(t + 0.2);
  },
  hum(level) {
    const x = this.c();
    if (level == null) { if (this.h) { try { this.h.g.gain.setTargetAtTime(0.0001, this.h.x.currentTime, 0.05); this.h.o.stop(this.h.x.currentTime + 0.25); } catch (e) { /* already stopped */ } this.h = null; } return; }
    if (!x) return;
    if (!this.h) { const o = x.createOscillator(), g = x.createGain(); o.type = "sawtooth"; g.gain.value = 0.02; o.connect(g); g.connect(x.destination); o.start(); this.h = { o, g, x }; }
    this.h.o.frequency.setTargetAtTime(90 + level * 220, x.currentTime, 0.05);
  },
  radio() {
    const x = this.c(); if (!x) return;
    const n = Math.floor(x.sampleRate * 0.25), b = x.createBuffer(1, n, x.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = x.createBufferSource(), f = x.createBiquadFilter(), g = x.createGain();
    s.buffer = b; f.type = "bandpass"; f.frequency.value = 1800; g.gain.value = 0.12; s.connect(f); f.connect(g); g.connect(x.destination); s.start();
    this.tone(1200, 0.06, "sine", 0.04, 0.27);
  },
};

/* ---------- Sites (facts checked against NASA sources: Artemis IV targeted for 2028; ESCAPADE en route to Mars) ---------- */
const SITES = {
  moon: { name: "Moon: Artemis IV Base", place: "Shackleton Crater, Lunar South Pole", short: "Moon", icon: Moon, solar: 14, rad: 3, delay: "1.3 seconds", sky: "#94A3B8", tag: "Artemis IV base camp",
    ctx: "Get the surface base ready for NASA's planned Artemis IV crew landing, targeted for 2028. Sunlight hits the crater rims almost all the time, but ice craters stay near -230°C. There is no air. The radio delay is 1.3 seconds." },
  mars: { name: "Mars: Jezero Crater Outpost", place: "Jezero Crater", short: "Mars", icon: Sun, solar: 11, rad: 2, delay: "about 14 minutes", sky: "#FB923C", tag: "Perseverance rover site",
    ctx: "Run a prototype habitat near NASA's Perseverance rover. NASA's twin ESCAPADE spacecraft are on their way to study how the Sun's wind hits Mars. Thin CO2 air, dust storms that dim solar panels, and a radio delay of about 14 minutes." },
};

/* ---------- Curated NASA reference data (shown in the UI) ---------- */
const DATASETS = [
  "Curiosity RAD (Mars surface): about 0.64 mSv of radiation per day. Earth averages roughly 0.007 mSv per day.",
  "LRO CRaTER (NASA Lunar Reconnaissance Orbiter): measures Moon radiation. The Moon has no air or magnetic field to help.",
  "NASA OSDR / Human Research Program: astronauts can lose about 1 to 1.5% of bone mass per month in microgravity without exercise.",
  "NASA DONKI: flare class, date and time come from NASA's space weather database.",
];
const ARCHIVE = { cls: "X8.7", date: "2024-05-14", name: "NOAA/NASA DONKI Archive: May 2024 X8.7 Solar Flare Event" };

const rankFlare = (c) => ({ X: 3, M: 2, C: 1, B: 0, A: 0 }[c?.[0]] ?? 0) * 100 + (parseFloat(c?.slice(1)) || 0);

/* ---------- Quiet Sols (2 and 4): no radio call. Step C shows a real NASA science takeaway instead. ---------- */
const QUIET = {
  moon: { 2: "Some peaks near the Moon's south pole get sunlight almost all the time, so solar panels there can run for long stretches.", 4: "NASA's Lunar Reconnaissance Orbiter has mapped the Moon's south pole in detail to help pick safe landing sites." },
  mars: { 2: "Curiosity's radiation detector (RAD) measured about 0.64 mSv of radiation per day on Mars, which helps NASA plan how to protect crews.", 4: "NASA's Perseverance rover explores Jezero Crater, an ancient lake bed, searching for signs of past life." },
};

/* ---------- Step B: teammate radio trade-offs on Sols 1, 3 and 5 only. Every choice costs something. ---------- */
function buildEvents(site, flare) {
  const delay = SITES[site].delay;
  return {
    1: { who: "Flight Engineer Maya", icon: Radio, title: "Glitching Drill Sensor", nasa: "Radio Delay",
      text: `Commander, a rock-drill sensor is glitching near the ridge! Do we wait for Earth Mission Control to verify the diagnostics, or run our onboard override?`,
      takeaway: "Because radio messages take time, real crews and rovers must be able to make smart choices on their own.",
      choices: [
        { t: "Wait for Earth Verification", now: { s: 8, sci: -6 }, pro: "Crew Safety +8%", con: "Science Data -6: a lost research window", focus: "Crew Safety", over: "Science Output" },
        { t: "Run Local Override", now: { sci: 10, p: -8 }, pro: "Science Data +10: fast data", con: "Power Budget -8%: a big power spike", focus: "Science Output", over: "Power" } ] },
    3: { who: "Science Officer Leo", icon: Satellite, title: "Solar Flare Alert!", nasa: "NASA DONKI", flare: true,
      text: `Alert! NASA's DONKI space weather sensors just flagged a ${flare.cls} solar flare (${flare.date}) heading our way! Radiation levels are climbing fast. How do we protect the crew?`,
      takeaway: `Space weather matters: NASA's DONKI database tracks flares like this ${flare.cls} so crews can take cover in time.`,
      choices: [
        { t: "Boost Water-Wall Shields", now: { s: 14, p: -12, l: -6 }, pro: "Crew Safety +14%", con: "Diverts power and water: Power -12%, Life Support -6%", focus: "Crew Safety", over: "Power" },
        { t: "Shelter in Airlock & Pause Lab", now: { p: 8, sci: -8, l: -6 }, pro: "Power Budget +8%", con: "Science Data -8, and crowded air scrubbers cost Life Support -6%", focus: "Power", over: "Science Output" } ] },
    5: { who: "Botanist Sam", icon: Leaf, title: "One Last Push", nasa: "NASA OSDR",
      text: "NASA OSDR health logs show crew bone and muscle fatigue from low gravity, and we only have enough reserve energy for one final push before debrief!",
      takeaway: "NASA OSDR data shows astronauts in microgravity can lose about 1 to 1.5% of bone mass each month, which is why they exercise about 2 hours a day.",
      choices: [
        { t: "Full Crew Recovery & Exercise Protocol", now: { s: 12, l: 6, sci: -10 }, pro: "Crew Safety +12% and Life Support +6%", con: "Science Data -10: no time for research", focus: "Crew Safety", over: "Science Output" },
        { t: "Final Deep-Core Expedition", now: { sci: 16, s: -12, p: -8 }, pro: "Science Data +16: a big payoff", con: "Crew Safety -12% and Power -8%: an exhausting trip", focus: "Science Output", over: "Crew Safety" } ] },
  };
}

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
const sgn = (n) => (n > 0 ? "+" : "") + n;
const sumD = (lines) => lines.reduce((t, x) => ({ p: t.p + (x.d.p || 0), l: t.l + (x.d.l || 0), s: t.s + (x.d.s || 0), sci: t.sci + (x.d.sci || 0) }), { p: 0, l: 0, s: 0, sci: 0 });

/* ---------- Small UI pieces ---------- */
function Chip({ label, v, color }) {
  if (!v) return null;
  return <span className="inline-block rounded-full px-2 py-0.5 text-xs font-bold mr-1" style={{ background: color + "22", color }}>{sgn(v)}% {label}</span>;
}
function Deltas({ d }) {
  return <>{[["Power", d.p, C.power], ["Life", d.l, C.life], ["Safety", d.s, C.safe], ["Science", d.sci, C.sci]].map(([l, v, c]) => <Chip key={l} label={l} v={v} color={c} />)}</>;
}
function Meter({ label, v, color, icon: Icon, hint }) {
  return (
    <div className="rounded-xl p-2" style={GL}>
      <div className="flex items-center justify-between text-xs font-bold" style={{ color }}>
        <span className="flex items-center gap-1"><Icon size={14} />{label}</span><span>{v}%</span>
      </div>
      <div className="h-3 rounded-full mt-1 overflow-hidden" style={{ background: "#0B1120" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: v + "%", background: color }} />
      </div>
      <div className="text-[10px] mt-1" style={{ color: C.dim }}>{hint}</div>
    </div>
  );
}
function Wave() {
  return (
    <span className="inline-flex items-end gap-0.5 h-5" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, i) => <span key={i} className="w-1 rounded wave" style={{ background: C.power, animationDelay: i * 70 + "ms" }} />)}
    </span>
  );
}
function Badge({ status }) {
  const live = status === "live", wait = status === "loading";
  const col = live ? "#22C55E" : wait ? C.dim : C.safe;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ border: `1px solid ${col}`, color: col }}>
      <span className={`w-2 h-2 rounded-full ${live ? "bpulse" : ""}`} style={{ background: col }} />
      {live ? "LIVE NASA DONKI TELEMETRY" : wait ? "CONNECTING TO NASA DONKI..." : "ARCHIVED NASA DONKI DATASET"}
    </span>
  );
}
const Btn = ({ children, onClick, color = C.power, disabled }) => (
  <button onClick={onClick} disabled={disabled} className="rounded-xl px-5 py-3 text-base font-extrabold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition" style={{ background: color, color: "#0B1120" }}>{children}</button>
);
const Ghost = ({ children, onClick, pressed }) => (
  <button onClick={onClick} aria-pressed={pressed} className="rounded-lg px-3 py-2 text-sm font-bold" style={{ border: `1px solid ${C.power}`, color: C.text, minHeight: 40 }}>{children}</button>
);

/* ---------- Step A: planet-specific morning outpost task, every Sol ---------- */
const MORNING = {
  radar: { title: "Micrometeoroid Radar Defense", btn: "START RADAR",
    desc: () => "Micrometeoroids are tiny, super-fast space rocks. 5 of them are drifting toward the habitat! Tap each rock to zap it with the laser before it reaches the center. You have 9 seconds. (On a keyboard, press Space to zap the closest rock.)",
    stakes: [["Zap all 5 rocks", { s: 6, sci: 3 }], ["Any rock hits the habitat", { p: -6, s: -4 }]],
    note: "Because the Moon has virtually no atmosphere to burn up incoming space debris, lunar habitats need radar tracking and rapid thermal hull heaters." },
  drill: { title: "Lunar Ice-Core Sample Drill", btn: "START DRILL",
    desc: (sol) => `Watch the drill console flash ${sol >= 4 ? 4 : 3} pads, then tap the same pads in the same order to drill through the Moon's regolith (loose dusty soil) down to buried ice. You can replay the pattern once.`,
    stakes: [["Match the whole pattern", { sci: 10, l: 6 }], ["Press a wrong pad", { p: -6, s: -4 }]],
    note: "Permanently shadowed craters near Shackleton Crater stay around -230°C and trap ancient water ice that Artemis astronauts can harvest for water, oxygen and rocket fuel." },
  pump: { title: "Hydroponic Water & Oxygen Pump", btn: "START PUMP",
    desc: (sol) => `The water-recycling tank feeds our hydroponic plant garden. Press and HOLD the button to fill it, then let go inside the green zone (${sol <= 2 ? "65% to 85%" : "70% to 84%"}). You only get one fill! (On a keyboard, hold Space.)`,
    stakes: [["Release in the green zone", { l: 8, sci: 3 }], ["Overfill the tank", { p: -6 }], ["Stop short", { l: -6 }]],
    note: "Martian bases cannot rely on frequent water deliveries from Earth, so closed-loop life support systems recycle wastewater to grow oxygen-producing crops." },
};

/* Moon, Sols 1/3/5: 5 micrometeoroids drift toward the dome during a 9-second countdown. Tap to zap. */
function Radar({ onEnd }) {
  const SPAWN = [0.2, 1.7, 3.1, 4.5, 5.9], DUR = 2.8, R0 = 140, R1 = 36, LIMIT = 9, BURST = 0.4;
  const sim = useRef({ t: 0, done: false, flash: [], rocks: SPAWN.map((t0, i) => ({ id: i, a: Math.random() * 360, t0, st: "in" })) });
  const [, tick] = useState(0);
  const posOf = (r) => { const p = Math.max(0, Math.min(1, (sim.current.t - r.t0) / DUR)), rad = R0 - (R0 - R1) * p, a = (r.a * Math.PI) / 180; return { p, x: 150 + rad * Math.cos(a), y: 150 + rad * Math.sin(a) }; };
  const zap = (id) => {
    const S = sim.current, r = S.rocks[id];
    if (S.done || r.st !== "in" || S.t < r.t0) return;
    r.st = "zap"; const { x, y } = posOf(r); S.flash.push({ x, y, t: S.t }); Snd.zap(); tick((n) => n + 1);
  };
  useEffect(() => {
    let raf, last = performance.now();
    const loop = (now) => {
      const S = sim.current; if (S.done) return;
      S.t += Math.min(now - last, 100) / 1000; last = now; /* pauses while the tab is hidden */
      S.rocks.forEach((r) => { if (r.st === "in" && S.t >= r.t0 + DUR) { r.st = "hit"; Snd.warn(); } });
      S.flash = S.flash.filter((f) => S.t - f.t < BURST);
      tick((n) => n + 1);
      if (S.rocks.every((r) => r.st !== "in") || S.t >= LIMIT + 0.3) { S.done = true; const all = S.rocks.every((r) => r.st === "zap"); setTimeout(() => onEnd(all), 800); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const key = (e) => {
      if (e.code !== "Space" && e.key !== "Enter") return;
      e.preventDefault();
      const S = sim.current, c = S.rocks.filter((r) => r.st === "in" && S.t >= r.t0).sort((a, b) => posOf(b).p - posOf(a).p)[0];
      if (c) zap(c.id);
    };
    window.addEventListener("keydown", key);
    return () => { cancelAnimationFrame(raf); sim.current.done = true; window.removeEventListener("keydown", key); };
  }, []);
  const S = sim.current, zapped = S.rocks.filter((r) => r.st === "zap").length, hits = S.rocks.filter((r) => r.st === "hit").length;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex justify-between w-full text-sm font-bold" style={{ maxWidth: 320, fontFamily: "ui-monospace,Consolas,monospace" }}>
        <span style={{ color: C.life }}>Zapped {zapped}/5</span><span style={{ color: hits ? C.safe : C.dim }}>Hits {hits}</span><span style={{ color: C.power }}>{Math.max(0, LIMIT - S.t).toFixed(1)}s</span>
      </div>
      <svg viewBox="0 0 300 300" style={{ width: "100%", maxWidth: 320, minWidth: 280, touchAction: "none" }} role="img" aria-label="Radar screen with the lunar habitat in the center. Tap the space rocks to zap them.">
        <circle cx="150" cy="150" r="146" fill="#0A1220" stroke={C.power} strokeOpacity=".5" strokeWidth="2" />
        {[104, 70].map((r) => <circle key={r} cx="150" cy="150" r={r} fill="none" stroke={C.power} strokeOpacity=".22" />)}
        <line x1="4" y1="150" x2="296" y2="150" stroke={C.power} strokeOpacity=".15" /><line x1="150" y1="4" x2="150" y2="296" stroke={C.power} strokeOpacity=".15" />
        <g className="sweep"><path d="M150 150 L150 6 A144 144 0 0 1 199 15 Z" fill={C.power} opacity=".2" /></g>
        <circle cx="150" cy="150" r="36" fill="none" stroke={C.safe} strokeWidth="2" strokeDasharray="4 4" />
        <path d="M128 164 A22 22 0 0 1 172 164 Z" fill="#E2E8F0" /><rect x="124" y="164" width="52" height="6" rx="2" fill="#94A3B8" /><circle cx="150" cy="150" r="4" fill={C.power} />
        {S.rocks.filter((r) => r.st === "hit").map((r) => { const { x, y } = posOf(r); return <circle key={r.id} cx={x} cy={y} r="9" fill="#EF4444" opacity=".7" />; })}
        {S.flash.map((f, i) => {
          const age = (S.t - f.t) / BURST;
          return (
            <g key={i}>
              <line x1="150" y1="150" x2={f.x} y2={f.y} stroke={C.power} strokeWidth="3" strokeLinecap="round" opacity={Math.max(0, 1 - age * 2.5)} />
              {[0, 1, 2, 3, 4, 5].map((j) => <circle key={j} cx={f.x + Math.cos(j * 1.047) * 26 * age} cy={f.y + Math.sin(j * 1.047) * 26 * age} r={3 * (1 - age) + 0.5} fill="#fff" opacity={1 - age} />)}
            </g>
          );
        })}
        {S.rocks.map((r) => {
          if (r.st !== "in" || S.t < r.t0) return null;
          const { x, y } = posOf(r);
          return <g key={r.id} onPointerDown={() => zap(r.id)} style={{ cursor: "crosshair" }}><circle cx={x} cy={y} r="22" fill="transparent" /><circle cx={x} cy={y} r="7" fill="#CBD5E1" stroke={C.safe} strokeWidth="2" /></g>;
        })}
      </svg>
    </div>
  );
}

/* Moon, Sols 2/4: Ice-Core Drill. Watch a 3 (Sol 2) or 4 (Sol 4) pad pattern, then tap it back. */
const PADS = [{ n: "Cyan", c: "#38BDF8", f: 392 }, { n: "Emerald", c: "#34D399", f: 494 }, { n: "Amber", c: "#FBBF24", f: 587 }, { n: "Violet", c: "#A78BFA", f: 659 }];
function Drill({ sol, onEnd }) {
  const L = sol >= 4 ? 4 : 3;
  const [seq] = useState(() => Array.from({ length: L }, () => Math.floor(Math.random() * 4)));
  const [phase, setPhase] = useState("watch"), [lit, setLit] = useState(-1), [n, setN] = useState(0), [replayed, setReplayed] = useState(false);
  const T = useRef([]), done = useRef(false);
  const later = (fn, ms) => T.current.push(setTimeout(fn, ms));
  const play = () => {
    T.current.forEach(clearTimeout); T.current = []; setPhase("watch"); setN(0);
    seq.forEach((p, i) => { later(() => { setLit(p); Snd.pad(PADS[p].f); }, 600 + i * 650); later(() => setLit(-1), 600 + i * 650 + 450); });
    later(() => setPhase("input"), 600 + seq.length * 650);
  };
  useEffect(() => { play(); return () => { T.current.forEach(clearTimeout); done.current = true; }; }, []);
  const tap = (p) => {
    if (phase !== "input" || done.current) return;
    setLit(p); later(() => setLit(-1), 220); Snd.pad(PADS[p].f);
    if (p === seq[n]) { const k = n + 1; setN(k); if (k === L) { done.current = true; setPhase("done"); later(() => onEnd(true), 800); } }
    else { done.current = true; setPhase("done"); later(() => onEnd(false), 900); }
  };
  const status = phase === "watch" ? "WATCH PATTERN..." : phase === "input" ? "YOUR TURN: TAP IN ORDER!" : n === L ? "CORE REACHED!" : "DRILL JAMMED!";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-lg font-extrabold text-center" style={{ color: phase === "input" ? C.life : phase === "done" && n < L ? C.safe : C.power, fontFamily: "ui-monospace,Consolas,monospace" }} role="status">{status}</div>
      <div className="flex items-stretch gap-4">
        <div className="flex flex-col items-center" aria-label={`Core depth ${Math.round((n / L) * 100)} percent`}>
          <div className="relative rounded-lg overflow-hidden" style={{ width: 30, height: 210, background: "#0A1220", border: `2px solid ${C.edge}` }}>
            <div className="absolute left-0 right-0 bottom-0 transition-all duration-500" style={{ height: (n / L) * 100 + "%", background: `linear-gradient(0deg,${C.power},${C.life})` }} />
          </div>
          <div className="text-[10px] mt-1 font-bold" style={{ color: C.dim }}>CORE DEPTH<br />{Math.round((n / L) * 100)}%</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PADS.map((p, i) => (
            <button key={p.n} onClick={() => tap(i)} aria-label={`${p.n} pad`} className="rounded-2xl font-extrabold text-sm" style={{ width: "min(30vw,120px)", height: "min(30vw,120px)", background: lit === i ? p.c : p.c + "33", border: `3px solid ${p.c}`, color: lit === i ? "#0B0F19" : p.c, boxShadow: lit === i ? `0 0 28px ${p.c}` : "none", transition: "background .1s" }}>{p.n}</button>
          ))}
        </div>
      </div>
      {phase === "input" && !replayed && n === 0 && <Ghost onClick={() => { setReplayed(true); play(); }}>Replay Pattern</Ghost>}
    </div>
  );
}

/* Mars, Sols 1-5: hold to fill the bio-tank, release inside the green zone (tighter on Sols 3-5). */
function Pump({ sol, onEnd }) {
  const lo = sol <= 2 ? 65 : 70, hi = sol <= 2 ? 85 : 84;
  const [fill, setFill] = useState(0), [holding, setHolding] = useState(false);
  const st = useRef({ fill: 0, hold: false, done: false });
  const finish = () => {
    const S = st.current; if (S.done) return;
    S.done = true; S.hold = false; setHolding(false); Snd.hum(null);
    const f = S.fill; setTimeout(() => onEnd(f >= lo && f <= hi ? "perfect" : f > hi ? "over" : "short"), 800);
  };
  useEffect(() => {
    let raf, last = performance.now(), el = 0;
    const loop = (now) => {
      const S = st.current; if (S.done) return;
      const dt = Math.min(now - last, 100) / 1000; last = now; el += dt;
      if (S.hold) { S.fill = Math.min(100, S.fill + 25 * dt); setFill(S.fill); Snd.hum(S.fill / 100); if (S.fill >= 100) { finish(); return; } }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); st.current.done = true; Snd.hum(null); };
  }, []);
  const press = () => { if (!st.current.done) { st.current.hold = true; setHolding(true); } };
  const release = () => { const S = st.current; if (!S.done && S.hold) finish(); };
  const keyOk = (e) => e.code === "Space" || e.key === "Enter";
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-2xl overflow-hidden" style={{ width: 150, height: 240, background: "rgba(10,18,32,.6)", border: `3px solid ${C.power}` }} role="img" aria-label={`Water tank ${Math.round(fill)} percent full. The green zone is ${lo} to ${hi} percent.`}>
        <div className="absolute left-0 right-0" style={{ bottom: lo + "%", height: hi - lo + "%", background: "rgba(52,211,153,.22)", borderTop: `2px solid ${C.life}`, borderBottom: `2px solid ${C.life}` }} />
        <div className="absolute right-1 text-[10px] font-bold" style={{ bottom: `calc(${hi}% + 3px)`, color: C.life }}>GREEN ZONE</div>
        <div className="absolute left-0 right-0 bottom-0" style={{ height: fill + "%", background: "linear-gradient(180deg,rgba(52,211,153,.85),rgba(8,145,178,.95))" }}>
          <svg className="wavex" viewBox="0 0 200 12" preserveAspectRatio="none" style={{ position: "absolute", top: -9, left: 0, width: "200%", height: 12 }} aria-hidden="true"><path d="M0 6 Q25 0 50 6 T100 6 T150 6 T200 6 V12 H0Z" fill="#34D399" /></svg>
          {[12, 34, 56, 78].map((l, i) => <span key={i} className="bub" style={{ left: l + "%", animationDelay: i * 0.6 + "s" }} />)}
        </div>
      </div>
      <button onPointerDown={press} onPointerUp={release} onPointerCancel={release} onPointerLeave={release} onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => { if (keyOk(e) && !e.repeat) { e.preventDefault(); press(); } }} onKeyUp={(e) => { if (keyOk(e)) release(); }}
        className="rounded-2xl px-6 py-5 text-xl font-extrabold" style={{ background: "linear-gradient(180deg,#7DD3FC,#38BDF8 55%,#0EA5E9)", color: "#0B0F19", touchAction: "none", userSelect: "none", transform: holding ? "scale(.97)" : "none", minWidth: 260 }}>HOLD TO PUMP WATER</button>
    </div>
  );
}

function Morning({ site, sol, hasEvent, onDone }) {
  const kind = site === "moon" ? (sol % 2 === 1 ? "radar" : "drill") : "pump";
  const [phase, setPhase] = useState("intro"), [res, setRes] = useState(null), info = MORNING[kind];
  const end = (r) => { if (r.ok) Snd.ok(); else Snd.warn(); setRes(r); setPhase("result"); };
  const radarEnd = (all) => end(all
    ? { ok: true, label: "Radar Defense: all 5 rocks zapped", d: { s: 6, sci: 3 }, msg: "Perimeter Clear!" }
    : { ok: false, label: "Radar Defense: a rock hit the habitat", d: { p: -6, s: -4 }, msg: "Micrometeoroid Impact! Patch heaters activated." });
  const drillEnd = (ok) => end(ok
    ? { ok: true, label: "Ice-Core Drill: pure water-ice core", d: { sci: 10, l: 6 }, msg: "Pure Water-Ice Core Extracted!" }
    : { ok: false, label: "Ice-Core Drill: drill bit jammed", d: { p: -6, s: -4 }, msg: "Drill Bit Jammed in Bedrock! Reverse motors engaged." });
  const pumpEnd = (k) => end({
    perfect: { ok: true, label: "Water Pump: optimal flow", d: { l: 8, sci: 3 }, msg: "Optimal Hydroponic Flow!" },
    over: { ok: false, label: "Water Pump: tank overflow", d: { p: -6 }, msg: "Tank Overflow! Water scrubbers running overtime." },
    short: { ok: false, label: "Water Pump: low irrigation", d: { l: -6 }, msg: "Low Irrigation! Greenhouse crops stressed." },
  }[k]);
  return (
    <section className="rounded-2xl p-4" style={GL}>
      <div className="flex items-center gap-2 mb-1"><Wave /><span className="font-bold text-sm" style={{ color: C.power }}>Morning outpost task</span></div>
      <h2 className="text-xl font-extrabold mb-1">Step A: {info.title}</h2>
      {phase === "intro" && (
        <>
          <p className="text-sm mb-3"><Rich text={info.desc(sol)} /></p>
          <div className="rounded-xl p-3 mb-3 text-sm" style={{ background: C.bg }}>
            <div className="font-bold mb-1">What's at stake</div>
            {info.stakes.map(([l, d]) => <div key={l} className="flex flex-wrap items-center justify-between gap-1 py-0.5"><span>{l}</span><span><Deltas d={d} /></span></div>)}
          </div>
          <Btn onClick={() => setPhase("play")}>{info.btn} <ChevronRight size={18} /></Btn>
        </>
      )}
      {phase === "play" && (kind === "radar" ? <Radar onEnd={radarEnd} /> : kind === "drill" ? <Drill sol={sol} onEnd={drillEnd} /> : <Pump sol={sol} onEnd={pumpEnd} />)}
      {phase === "result" && res && (
        <>
          <p className="text-lg font-extrabold mb-2" style={{ color: res.ok ? C.life : C.safe }}>{res.msg}</p>
          <div className="mb-3"><Deltas d={res.d} /></div>
          <div className="rounded-xl p-3 mb-3 text-sm" style={{ background: C.bg }}>
            <div className="font-bold mb-1" style={{ color: C.power }}>Real NASA science</div><Rich text={info.note} />
          </div>
          <p className="text-xs mb-3" style={{ color: C.dim }}>This result is added to today's telemetry log.</p>
          <Btn onClick={() => onDone(res)}>{hasEvent ? "Radio check-in" : "Continue"} <ChevronRight size={18} /></Btn>
        </>
      )}
    </section>
  );
}

/* ---------- Planetary backdrop: all inline SVG + CSS, no image files ---------- */
const GL = { background: "rgba(2,6,23,.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.15)", boxShadow: "0 25px 50px -12px rgba(0,0,0,.55)" };
const mkRnd = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const BG_R = mkRnd(2026);
const BG_STARS = Array.from({ length: 48 }, () => ({ x: BG_R() * 100, y: BG_R() * 64, s: 1 + BG_R() * 1.5, d: 2 + BG_R() * 4, dl: -BG_R() * 6, o: 0.5 + BG_R() * 0.5 }));
const BG_MOTES = Array.from({ length: 12 }, () => ({ x: 12 + BG_R() * 52, y: 68 + BG_R() * 18, s: 2 + BG_R() * 1.5, d: 9 + BG_R() * 7, dl: -BG_R() * 9 }));
const BG_DUST = Array.from({ length: 18 }, () => ({ y: 8 + BG_R() * 82, s: 3 + BG_R() * 3, d: 16 + BG_R() * 16, dl: -BG_R() * 32 }));

const MoonTerrain = () => (
  <svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 w-full" style={{ height: "35%" }}>
    <defs>
      <linearGradient id="bgRidge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#475569" /><stop offset="1" stopColor="#334155" /></linearGradient>
      <linearGradient id="bgCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBBF24" stopOpacity=".5" /><stop offset="1" stopColor="#FBBF24" stopOpacity="0" /></linearGradient>
    </defs>
    <path d="M0 150 L90 110 L170 135 L260 80 L340 120 L430 95 L520 140 L620 100 L720 130 L820 75 L910 120 L1010 105 L1110 140 L1220 90 L1320 125 L1440 100 V320 H0Z" fill="url(#bgRidge)" />
    <path d="M0 150 L90 110 L170 135 L260 80 L340 120 L430 95 L520 140 L620 100 L720 130 L820 75 L910 120 L1010 105 L1110 140 L1220 90 L1320 125 L1440 100" fill="none" stroke="#CBD5E1" strokeWidth="1" />
    <path d="M0 218 Q240 190 480 208 T960 204 T1440 210 V320 H0Z" fill="#1E293B" />
    {/* Artemis IV lander */}
    <polygon points="611,150 570,214 655,214" fill="url(#bgCone)" opacity=".7" />
    <rect x="600" y="128" width="22" height="72" rx="9" fill="#0F172A" stroke="#475569" strokeWidth=".8" />
    <line x1="602" y1="190" x2="586" y2="208" stroke="#475569" strokeWidth="2" /><line x1="620" y1="190" x2="636" y2="208" stroke="#475569" strokeWidth="2" />
    <rect x="581" y="206" width="10" height="3" fill="#475569" /><rect x="631" y="206" width="10" height="3" fill="#475569" />
    <circle cx="611" cy="146" r="2.5" fill="#22D3EE" /><circle cx="611" cy="158" r="2" fill="#22D3EE" opacity=".7" />
    {/* comms dish */}
    <line x1="690" y1="207" x2="690" y2="170" stroke="#64748B" strokeWidth="3" />
    <g transform="rotate(-25 690 166)"><path d="M666 158 Q690 184 714 158 Q690 168 666 158Z" fill="#94A3B8" stroke="#CBD5E1" strokeWidth=".6" /><line x1="690" y1="170" x2="690" y2="150" stroke="#64748B" strokeWidth="1.5" /><circle cx="690" cy="149" r="2" fill="#22D3EE" /></g>
    {/* habitat dome + module */}
    <path d="M752 207 A38 38 0 0 1 828 207Z" fill="#0F172A" stroke="#64748B" strokeWidth="1.2" />
    {[[772, 192], [790, 185], [808, 192]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.8" fill="#22D3EE" />)}
    <rect x="828" y="194" width="36" height="13" rx="3" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
    <circle cx="840" cy="200" r="2" fill="#22D3EE" /><circle cx="852" cy="200" r="2" fill="#22D3EE" />
    {/* floodlight */}
    <line x1="884" y1="207" x2="884" y2="168" stroke="#64748B" strokeWidth="2.5" />
    <polygon points="884,170 842,214 930,214" fill="url(#bgCone)" />
    <rect x="878" y="164" width="12" height="6" rx="1.5" fill="#FBBF24" />
    <path d="M0 270 Q150 256 300 272 T620 268 T960 274 T1300 262 L1440 270 V320 H0Z" fill="#0A0E17" />
    {[[220, 302, 90, 12], [700, 308, 110, 10], [1120, 300, 80, 11]].map(([x, y, rx, ry]) => <g key={x}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#05070C" /><ellipse cx={x} cy={y - 2} rx={rx} ry={ry} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1.5" /></g>)}
  </svg>
);

const MarsTerrain = () => (
  <svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 w-full" style={{ height: "35%" }}>
    <defs>
      <linearGradient id="bgHaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FB923C" stopOpacity=".32" /><stop offset="1" stopColor="#FB923C" stopOpacity="0" /></linearGradient>
      <linearGradient id="bgGH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34D399" stopOpacity=".6" /><stop offset="1" stopColor="#065F46" stopOpacity=".95" /></linearGradient>
    </defs>
    <path d="M0 160 H120 L140 120 H300 L320 150 H420 L450 105 H640 L665 140 H760 L780 125 H980 L1000 150 H1120 L1145 110 H1330 L1350 145 H1440 V320 H0Z" fill="#5C2218" />
    <rect x="0" y="100" width="1440" height="110" fill="url(#bgHaze)" />
    <path d="M0 222 Q180 192 380 214 T760 210 T1140 202 T1440 216 V320 H0Z" fill="#3F150E" />
    <ellipse cx="545" cy="210" rx="52" ry="12" fill="#3F150E" />
    {/* Perseverance-style rover */}
    <rect x="525" y="194" width="36" height="9" rx="2" fill="#1A0A07" stroke="#7C2D12" strokeWidth=".8" />
    {[531, 543, 555].map((x) => <circle key={x} cx={x} cy="206" r="4.5" fill="#0F0403" stroke="#7C2D12" strokeWidth=".6" />)}
    <line x1="554" y1="194" x2="554" y2="176" stroke="#7C2D12" strokeWidth="1.6" /><rect x="549" y="171" width="11" height="6" rx="2" fill="#1A0A07" stroke="#7C2D12" strokeWidth=".6" />
    <circle cx="560" cy="174" r="5.5" fill="#67E8F9" opacity=".25" /><circle cx="560" cy="174" r="2.5" fill="#67E8F9" />
    <line x1="527" y1="196" x2="513" y2="189" stroke="#7C2D12" strokeWidth="1.6" />
    {/* habitat dome */}
    <path d="M662 211 A38 38 0 0 1 738 211Z" fill="#2A0E0A" stroke="#9A3412" strokeWidth="1.2" /><circle cx="700" cy="196" r="3.2" fill="#FBBF24" /><circle cx="684" cy="202" r="2" fill="#FBBF24" opacity=".7" />
    {/* greenhouse tunnels */}
    {[752, 822].map((x) => <g key={x}><path d={`M${x} 212 V200 Q${x} 182 ${x + 30} 182 Q${x + 60} 182 ${x + 60} 200 V212Z`} fill="url(#bgGH)" stroke="#34D399" strokeOpacity=".7" strokeWidth="1" />{[15, 30, 45].map((d) => <line key={d} x1={x + d} y1="184" x2={x + d} y2="212" stroke="#34D399" strokeOpacity=".35" />)}</g>)}
    {/* solar array wing */}
    <line x1="950" y1="212" x2="950" y2="172" stroke="#9A3412" strokeWidth="2" />
    <polygon points="915,160 995,152 1005,182 925,190" fill="#1E3A5F" stroke="#60A5FA" strokeOpacity=".7" strokeWidth="1" />
    <line x1="942" y1="157" x2="952" y2="187" stroke="#60A5FA" strokeOpacity=".45" /><line x1="968" y1="155" x2="978" y2="185" stroke="#60A5FA" strokeOpacity=".45" />
    <path d="M0 275 Q120 262 260 274 T540 270 T820 278 T1100 266 T1440 276 V320 H0Z" fill="#1C0806" />
    {[[60, 300, 22, 9], [380, 306, 30, 10], [760, 302, 18, 7], [1010, 308, 34, 11], [1300, 300, 24, 9]].map(([x, y, rx, ry]) => <ellipse key={x} cx={x} cy={y} rx={rx} ry={ry} fill="#0F0403" />)}
    {[290, 296, 302].map((y, i) => <path key={y} d={`M${i * 120} ${y} Q${200 + i * 120} ${y - 10} ${420 + i * 120} ${y} T${840 + i * 120} ${y}`} fill="none" stroke="#FB923C" strokeOpacity=".15" strokeWidth="1.5" />)}
  </svg>
);

const Backdrop = React.memo(function Backdrop({ world, aurora, alarm }) {
  const moon = world === "moon";
  return (
    <div className="no-print fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div key={world} className="absolute inset-0 bgfade" style={{ background: moon ? "linear-gradient(180deg,#03050A,#090D16)" : "linear-gradient(180deg,#18090C 0%,#451A14 40%,#7C2D12 65%,#7C2D12 100%)" }}>
        {moon && BG_STARS.map((s, i) => <span key={i} className="bgtw absolute rounded-full" style={{ left: s.x + "%", top: s.y + "%", width: s.s, height: s.s, background: "#fff", opacity: s.o, animationDuration: s.d + "s", animationDelay: s.dl + "s" }} />)}
        {moon && (
          <svg viewBox="0 0 160 160" className="absolute" style={{ width: 160, height: 160, right: "7%", top: "6%" }}>
            <defs>
              <radialGradient id="bgHalo" cx=".5" cy=".5" r=".5"><stop offset=".62" stopColor="#22D3EE" stopOpacity=".5" /><stop offset="1" stopColor="#22D3EE" stopOpacity="0" /></radialGradient>
              <clipPath id="bgGlobe"><circle cx="80" cy="80" r="55" /></clipPath>
            </defs>
            <circle cx="80" cy="80" r="80" fill="url(#bgHalo)" />
            <circle cx="80" cy="80" r="55" fill="#1D4ED8" />
            <g clipPath="url(#bgGlobe)" fill="none" stroke="#fff" strokeLinecap="round">
              <path d="M30 62 Q60 48 95 60 T135 56" strokeWidth="5" opacity=".6" /><path d="M28 86 Q62 72 98 88 T138 82" strokeWidth="6" opacity=".5" /><path d="M40 110 Q72 98 102 110 T132 104" strokeWidth="4" opacity=".55" />
              <path d="M70 44 Q86 52 80 66" strokeWidth="3" opacity=".5" />
              <circle cx="62" cy="98" r="55" fill="#050811" stroke="none" opacity=".94" />
            </g>
          </svg>
        )}
        {moon && <MoonTerrain />}
        {moon && BG_MOTES.map((m, i) => <span key={i} className="bgmote absolute rounded-full" style={{ left: m.x + "%", top: m.y + "%", width: m.s, height: m.s, background: "#E2E8F0", opacity: 0.7, animationDuration: m.d + "s", animationDelay: m.dl + "s" }} />)}
        {!moon && (
          <svg viewBox="0 0 140 140" className="absolute" style={{ width: 140, height: 140, left: "10%", bottom: "30%" }}>
            <defs><radialGradient id="bgSun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#BAE6FD" stopOpacity=".95" /><stop offset=".25" stopColor="#BAE6FD" stopOpacity=".55" /><stop offset="1" stopColor="#BAE6FD" stopOpacity="0" /></radialGradient></defs>
            <circle cx="70" cy="70" r="70" fill="url(#bgSun)" /><circle cx="70" cy="70" r="14" fill="#F0F9FF" />
          </svg>
        )}
        {!moon && <MarsTerrain />}
        {!moon && BG_DUST.map((d, i) => <span key={i} className="bgwind absolute rounded-full" style={{ left: 0, top: d.y + "%", width: d.s, height: d.s, background: "#FB923C", opacity: 0.2, animationDuration: d.d + "s", animationDelay: d.dl + "s" }} />)}
      </div>
      <svg viewBox="0 0 1440 360" preserveAspectRatio="none" className="absolute inset-x-0 top-0 w-full" style={{ height: "40%", opacity: aurora ? 1 : 0, transition: "opacity 1s ease" }}>
        <defs>
          <linearGradient id="bgAur1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBBF24" stopOpacity=".7" /><stop offset=".6" stopColor="#A78BFA" stopOpacity=".3" /><stop offset="1" stopColor="#A78BFA" stopOpacity="0" /></linearGradient>
          <linearGradient id="bgAur2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A78BFA" stopOpacity=".6" /><stop offset=".7" stopColor="#FBBF24" stopOpacity=".2" /><stop offset="1" stopColor="#FBBF24" stopOpacity="0" /></linearGradient>
        </defs>
        <g className="bgaur"><path d="M0 0 H1440 V140 Q1200 220 960 150 T480 170 T0 120Z" fill="url(#bgAur1)" /><path d="M0 0 H1440 V90 Q1180 170 900 100 T420 130 T0 80Z" fill="url(#bgAur2)" /></g>
      </svg>
      <div className={`absolute inset-0 ${alarm ? "bgalarm" : ""}`} style={{ boxShadow: "inset 0 0 80px rgba(239,68,68,.35)", opacity: alarm ? 1 : 0, transition: "opacity .6s ease" }} />
    </div>
  );
});

/* ---------- App ---------- */
export default function App() {
  const [screen, setScreen] = useState("setup");
  const [name, setName] = useState("");
  const [siteKey, setSiteKey] = useState("moon");
  const [sol, setSol] = useState(1);
  const [m, setM] = useState({ p: 75, l: 75, s: 75, sci: 0 });
  const [morning, setMorning] = useState(null);
  const [pending, setPending] = useState({});
  const [log, setLog] = useState(null);
  const [history, setHistory] = useState([]);
  const [abort, setAbort] = useState(null);
  const [flare, setFlare] = useState({ ...ARCHIVE });
  const [status, setStatus] = useState("loading");
  const [sound, setSound] = useState(false);
  Snd.on = sound;

  /* Live DONKI call, honest fallback */
  useEffect(() => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    fetch("https://api.nasa.gov/DONKI/FLR?startDate=2026-10-01&endDate=2026-11-14&api_key=DEMO_KEY", { signal: ctl.signal })
      .then((r) => { if (!r.ok) throw new Error("bad"); return r.json(); })
      .then((rows) => {
        const best = (Array.isArray(rows) ? rows : []).filter((x) => x.classType).sort((a, b) => rankFlare(b.classType) - rankFlare(a.classType))[0];
        if (!best) throw new Error("none");
        setFlare({ cls: best.classType, date: (best.peakTime || best.beginTime || "").slice(0, 10) });
        setStatus("live");
      })
      .catch(() => { setFlare({ ...ARCHIVE }); setStatus("archive"); })
      .finally(() => clearTimeout(t));
    return () => { clearTimeout(t); ctl.abort(); };
  }, []);

  const site = SITES[siteKey];
  const events = useMemo(() => buildEvents(siteKey, flare), [siteKey, flare]);
  const ev = events[sol]; /* undefined on the quiet Sols 2 and 4 */

  /* Sound cues: radio static + warning chime on alerts */
  useEffect(() => {
    if (screen === "event" && ev) { Snd.radio(); if (ev.flare) setTimeout(() => Snd.warn(), 400); }
    if (screen === "log" && (m.p < 25 || m.l < 25 || m.s < 25)) Snd.warn();
    if (screen === "end") { if (abort) Snd.warn(); else Snd.ok(); }
  }, [screen]);

  /* Quiet Sols: a 1.5 second status toast, then straight to Step C */
  useEffect(() => {
    if (screen !== "quiet") return;
    const t = setTimeout(() => commit(baseLines(), { takeaway: QUIET[siteKey][sol] }, null), 1500);
    return () => clearTimeout(t);
  }, [screen]);

  const start = () => { setSol(1); setM({ p: 75, l: 75, s: 75, sci: 0 }); setMorning(null); setPending({}); setHistory([]); setAbort(null); setLog(null); setScreen("power"); };

  const baseLines = () => {
    const lines = [];
    if (morning) lines.push({ label: morning.label, d: morning.d });
    if (Object.keys(pending).length) lines.push({ label: "Carried over from your last choice", d: pending });
    return lines;
  };
  const commit = (lines, logEv, c) => {
    const t = sumD(lines);
    const nm = { p: clamp(m.p + t.p), l: clamp(m.l + t.l), s: clamp(m.s + t.s), sci: Math.max(0, m.sci + t.sci) };
    setLog({ lines, t, ev: logEv, c }); setM(nm); setPending((c && c.next) || {});
    const zero = [["p", "Power Budget"], ["l", "Life Support"], ["s", "Crew Safety"]].find(([kk]) => nm[kk] <= 0);
    if (zero) {
      const worst = [...lines].sort((a, b) => (a.d[zero[0]] || 0) - (b.d[zero[0]] || 0))[0];
      setAbort({ meter: zero[1], why: worst.label, sol });
    } else setAbort(null);
    setScreen("log");
  };
  const pickChoice = (c) => {
    const lines = baseLines();
    lines.push({ label: `Your choice: ${c.t}`, d: c.now });
    setHistory((h) => [...h, { sol, title: ev.title, c }]);
    commit(lines, ev, c);
  };
  const next = () => { if (abort) setScreen("end"); else if (sol === 5) setScreen("end"); else { setSol(sol + 1); setMorning(null); setScreen("power"); } };

  const big = useMemo(() => {
    if (!history.length) return null;
    const score = (h) => Math.max(0, ...Object.values(h.c.now)) + Math.abs(Math.min(0, ...Object.values(h.c.now)));
    return [...history].sort((a, b) => score(b) - score(a))[0];
  }, [history]);
  const rating = m.sci >= 35 ? "Chief Flight Director" : m.sci >= 20 ? "Mission Specialist" : "Junior Commander";
  const pill = { ...GL, color: C.text };

  return (
    <div className="min-h-screen w-full p-3 md:p-5" onClickCapture={(e) => { if (e.target.closest && e.target.closest("button")) Snd.click(); }} style={{ background: C.bg, color: C.text, fontFamily: "'Trebuchet MS', 'Segoe UI', ui-rounded, system-ui, sans-serif" }}>
      {screen !== "setup" && <Backdrop world={siteKey} aurora={screen === "event" && !!ev && !!ev.flare} alarm={screen !== "end" && (m.p < 30 || m.l < 30 || m.s < 30)} />}
      <style>{`
        @keyframes bgtw{0%,100%{opacity:.25}50%{opacity:1}} .bgtw{animation:bgtw 3s ease-in-out infinite}
        @keyframes bgmote{0%{transform:translate(0,0)}50%{transform:translate(24px,-18px)}100%{transform:translate(-10px,-6px)}} .bgmote{animation:bgmote 12s ease-in-out infinite alternate}
        @keyframes bgwind{from{transform:translateX(-8vw)}to{transform:translateX(108vw)}} .bgwind{animation:bgwind 24s linear infinite}
        @keyframes bgaur{0%,100%{opacity:.55;transform:translateX(0)}50%{opacity:1;transform:translateX(-2%)}} .bgaur{animation:bgaur 3.2s ease-in-out infinite}
        @keyframes bgalarm{0%,100%{opacity:.55}50%{opacity:1}} .bgalarm{animation:bgalarm 1.4s ease-in-out infinite}
        @keyframes bgfade{from{opacity:0}to{opacity:1}} .bgfade{animation:bgfade .6s ease-out both}
        @keyframes wv{0%,100%{height:4px}50%{height:20px}} .wave{height:6px;animation:wv .9s ease-in-out infinite}
        @keyframes bp{50%{opacity:.3}} .bpulse{animation:bp 1.4s ease-in-out infinite}
        @keyframes sw{to{transform:rotate(360deg)}} .sweep{transform-origin:150px 150px;animation:sw 3s linear infinite}
        @keyframes wavex{to{transform:translateX(-50%)}} .wavex{animation:wavex 2.5s linear infinite}
        @keyframes bubup{from{transform:translateY(0);opacity:.7}to{transform:translateY(-140px);opacity:0}} .bub{position:absolute;bottom:0;width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.6);animation:bubup 2.4s linear infinite}
        @keyframes toast{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}} .toast{animation:toast .35s ease-out both}
        @media (prefers-reduced-motion: reduce){.bgtw,.bgmote,.bgwind,.bgaur,.bgalarm,.bgfade,.wave,.bpulse,.sweep,.wavex,.bub,.toast{animation:none}}
        @media print{.no-print{display:none!important} body,.cert-wrap{background:#fff!important} .cert{border:6px double #0B1120!important;color:#0B1120!important;background:#fff!important}}
      `}</style>
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header bar */}
        <header className={`no-print flex flex-wrap items-center justify-between gap-2 mb-3 ${screen === "setup" ? "hidden" : ""}`}>
          <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-2"><Rocket style={{ color: C.power }} />Artemis &amp; Mars Outpost Commander</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-full px-3 py-1" style={pill}>Commander {name || "Alex"} at {site.short}</span>
            <span className="rounded-full px-3 py-1" style={pill}>Sol {sol} of 5</span>
            <Badge status={status} />
            <button onClick={() => setSound(!sound)} aria-pressed={sound} aria-label={sound ? "Turn sound off" : "Turn sound on"} className="rounded-full px-3 py-1 flex items-center gap-1" style={{ ...pill, minHeight: 32 }}>{sound ? <Volume2 size={14} /> : <VolumeX size={14} />}SOUND {sound ? "ON" : "OFF"}</button>
          </div>
        </header>

        {/* HUD: 3 core systems + Science Data */}
        {screen !== "setup" && screen !== "end" && (
          <section className="no-print mb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Meter label="Power Budget" v={m.p} color={C.power} icon={Zap} hint="Solar arrays and batteries" />
              <Meter label="Life Support" v={m.l} color={C.life} icon={Leaf} hint="Oxygen and greenhouse food" />
              <Meter label="Crew Safety" v={m.s} color={C.safe} icon={ShieldCheck} hint="Radiation shielding and hull" />
              <div className="rounded-xl p-2" style={GL}>
                <div className="text-xs font-bold flex items-center gap-1" style={{ color: C.sci }}><FlaskConical size={14} />Science Data</div>
                <div className="text-3xl font-extrabold" style={{ color: C.sci }}>{m.sci}</div>
              </div>
            </div>
          </section>
        )}

        {/* SETUP: cinematic intro (visual layer only) */}
        {screen === "setup" && <Intro name={name} setName={setName} siteKey={siteKey} setSiteKey={setSiteKey} status={status} onLaunch={start} sound={sound} setSound={setSound} />}

        {/* STEP A: planet-specific morning task, every Sol */}
        {screen === "power" && <Morning key={sol + siteKey} site={siteKey} sol={sol} hasEvent={!!ev} onDone={(r) => { setMorning(r); setScreen(events[sol] ? "event" : "quiet"); }} />}

        {/* Quiet Sols 2 and 4: no radio call */}
        {screen === "quiet" && (
          <section className="toast rounded-2xl p-6 text-center" role="status" style={GL}>
            <Wave /><p className="mt-2 text-lg font-bold">Quiet afternoon at the outpost — crew completing routine system checks</p>
          </section>
        )}

        {/* STEP B: radio check-in (Sols 1, 3 and 5) */}
        {screen === "event" && ev && (
          <section className="rounded-2xl p-4" style={GL}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Wave /><span className="font-bold text-sm" style={{ color: C.power }}>Incoming radio from {ev.who}</span>
              <span className="text-xs rounded-full px-2 py-0.5" style={{ border: `1px solid ${C.edge}`, color: C.dim }}>NASA Data Source: {ev.flare ? (status === "live" ? "Live DONKI" : "Archived DONKI") : ev.nasa}</span>
            </div>
            <h2 className="text-xl font-extrabold flex items-center gap-2"><ev.icon style={{ color: C.safe }} />{ev.title}</h2>
            <p className="my-2 text-base"><Rich text={ev.text} /></p>
            {ev.flare && status !== "live" && <p className="text-xs mb-2" style={{ color: C.safe }}>Heads up: this flare is from NASA's archive, not from today.</p>}
            <div className="grid md:grid-cols-2 gap-3">
              {ev.choices.map((c) => (
                <button key={c.t} onClick={() => pickChoice(c)} className="text-left rounded-xl p-3 active:scale-95 transition" style={{ background: C.bg, border: `2px solid ${C.edge}` }}>
                  <div className="font-extrabold mb-1"><Rich text={c.t} /></div>
                  <div className="text-sm" style={{ color: C.life }}>Good: {c.pro}</div>
                  <div className="text-sm mb-1" style={{ color: C.safe }}>Cost: {c.con}</div>
                  <Deltas d={c.now} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STEP C: LOG */}
        {screen === "log" && log && (
          <section className="rounded-2xl p-4" style={GL}>
            <h2 className="text-xl font-extrabold mb-2">Step C: End of Sol {sol} report</h2>
            <ul className="mb-3">
              {log.lines.map((x, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-1 text-sm" style={{ borderBottom: `1px solid ${C.edge}` }}>
                  <span><Rich text={x.label} /></span><span><Deltas d={x.d} /></span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl p-3 mb-3 text-sm" style={{ background: C.bg }}>
              <div className="font-bold mb-1" style={{ color: C.power }}>Real NASA science</div><Rich text={log.ev.takeaway} />
            </div>
            <Btn onClick={next}>{abort ? "See mission report" : sol === 5 ? "Finish mission" : `Start Sol ${sol + 1}`} <ChevronRight size={18} /></Btn>
          </section>
        )}

        {/* END */}
        {screen === "end" && abort && (
          <section className="rounded-2xl p-5 text-center" style={GL}>
            <AlertTriangle size={44} className="mx-auto" style={{ color: C.safe }} />
            <h2 className="text-2xl font-extrabold my-2">Mission Abort — Crew Safely Evacuated</h2>
            <p className="max-w-xl mx-auto mb-2">Great news: everyone got home safely. On Sol {abort.sol}, <b>{abort.meter}</b> reached 0%.</p>
            <p className="max-w-xl mx-auto mb-2" style={{ color: C.dim }}>The biggest cause: "{abort.why}". Real engineers learn from trade-offs just like this one.</p>
            <p className="max-w-xl mx-auto mb-4 text-sm">Try a new plan: pick a different radio choice, or practice the morning task, and see what it costs somewhere else!</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Btn onClick={start}><RotateCcw size={18} />Try New Strategy</Btn>
              <Btn onClick={() => setScreen("setup")} color={C.sci}>Change site</Btn>
            </div>
            <Sources status={status} flare={flare} />
          </section>
        )}
        {screen === "end" && !abort && (
          <section className="cert-wrap">
            <div className="cert rounded-2xl p-5 text-center" style={{ background: C.panel, border: `6px double ${C.safe}` }}>
              <Award size={48} className="mx-auto" style={{ color: C.safe }} />
              <h2 className="text-2xl md:text-3xl font-extrabold">NASA Outpost Commander Certificate</h2>
              <p className="mt-2">This certifies that</p>
              <p className="text-3xl font-extrabold my-1" style={{ color: C.power }}>Commander {name}</p>
              <p>kept an outpost alive for 5 Sols at <b>{site.name}</b></p>
              <p className="text-sm" style={{ color: C.dim }}>{site.place}</p>
              <p className="text-lg font-bold mt-1">Rank earned: {rating}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-3 text-sm">
                {[["Power", m.p, C.power], ["Life Support", m.l, C.life], ["Crew Safety", m.s, C.safe], ["Science Score", m.sci, C.sci]].map(([l, v, c]) => (
                  <div key={l} className="rounded-lg p-2" style={{ background: C.bg, color: c }}><div className="text-2xl font-extrabold">{v}{l === "Science Score" ? "" : "%"}</div>{l}</div>
                ))}
              </div>
              {big && <p className="text-sm max-w-2xl mx-auto mb-2"><b>Biggest trade-off:</b> During Sol {big.sol} ({big.title}) you prioritized {big.c.focus} over {big.c.over}.</p>}
              <Sources status={status} flare={flare} />
            </div>
            <div className="no-print flex flex-wrap justify-center gap-3 mt-3">
              <Btn onClick={() => window.print()} color={C.safe}><Printer size={18} />Print Certificate</Btn>
              <Btn onClick={start}><RotateCcw size={18} />Play Again</Btn>
              <Btn onClick={() => setScreen("setup")} color={C.sci}>Change Site</Btn>
            </div>
          </section>
        )}
        {screen !== "setup" && <footer className="no-print mt-4 text-center text-xs" style={{ color: C.dim }}>NASA data: DONKI space weather ({status === "live" ? "live" : status === "loading" ? "connecting" : "archived"}), OSDR, Curiosity RAD and LRO CRaTER. Game numbers are simplified for learning.</footer>}
      </div>
    </div>
  );
}

/* ================= CINEMATIC INTRO (visual layer only; game logic untouched) ================= */
const FT = "'Space Grotesk','Trebuchet MS',system-ui,sans-serif", FB = "Inter,'Segoe UI',system-ui,sans-serif", FM = "'IBM Plex Mono',ui-monospace,Consolas,monospace";
const LINE = "Pick a call sign and a world, Explorer!";
const CHIPS = { moon: ["1/6th of Earth's gravity", "1.3-second radio delay", "Near-constant sunlight on crater rims"], mars: ["38% of Earth's gravity", "24h 39m Sol", "About 14-minute radio delay"] };
const ARC = "M-100 210Q720 -50 1540 210";
const CRATERS = [[260, 190, 110, 15], [640, 150, 80, 11], [980, 170, 120, 16], [1230, 230, 70, 10], [430, 260, 90, 12], [820, 260, 130, 14], [100, 280, 60, 9], [1380, 290, 80, 10]];
const TEX = {
  moon: "radial-gradient(circle at 18% 28%,rgba(0,0,0,.30) 0 7%,transparent 8%),radial-gradient(circle at 62% 22%,rgba(0,0,0,.22) 0 5%,transparent 6%),radial-gradient(circle at 72% 64%,rgba(0,0,0,.30) 0 11%,transparent 12%),radial-gradient(circle at 40% 70%,rgba(0,0,0,.22) 0 8%,transparent 9%),radial-gradient(circle at 88% 30%,rgba(255,255,255,.16) 0 6%,transparent 7%),radial-gradient(circle at 30% 50%,rgba(60,60,70,.25) 0 14%,transparent 15%),#B3BCC9",
  mars: "radial-gradient(circle at 24% 38%,rgba(70,25,8,.45) 0 14%,transparent 15%),radial-gradient(circle at 66% 60%,rgba(70,25,8,.35) 0 17%,transparent 18%),radial-gradient(circle at 48% 14%,rgba(255,226,170,.40) 0 8%,transparent 9%),radial-gradient(circle at 84% 82%,rgba(251,191,36,.25) 0 10%,transparent 11%),radial-gradient(circle at 12% 78%,rgba(120,40,10,.30) 0 9%,transparent 10%),#C65A22",
};
const p2 = (n) => String(n).padStart(2, "0");

function useTick() { const [s, setS] = useState(0); useEffect(() => { const i = setInterval(() => setS((x) => x + 1), 1000); return () => clearInterval(i); }, []); return s; }
function Clock() { const s = useTick(); return <>T+{p2(Math.floor(s / 3600))}:{p2(Math.floor(s / 60) % 60)}:{p2(s % 60)}</>; }
function TelemL() {
  return (
    <div aria-hidden="true" style={{ fontFamily: FM, color: "#D5DEEF" }}>
      {[["ALT", "3.4 KM"], ["VEL", "296 M/S"]].map(([k, v]) => (
        <div key={k} className="mb-1"><div className="text-sm font-medium" style={{ letterSpacing: ".08em" }}>{k} {v}</div><div style={{ fontSize: 9, letterSpacing: ".16em", color: C.dim }}>SIMULATED</div></div>
      ))}
    </div>
  );
}
function TelemR() {
  return (
    <div className="flex flex-col items-start md:items-end gap-1" style={{ fontFamily: FM }}>
      <div className="flex flex-wrap gap-2 md:justify-end">
        <span className="tpill" aria-label="Mission clock">MISSION CLOCK <Clock /></span>
        <span className="tpill" aria-hidden="true">PWR 96% <i className="batt"><b style={{ width: "calc(96% - 2px)" }} /></i></span>
      </div>
      <span style={{ fontSize: 9, letterSpacing: ".16em", color: C.dim }}>PWR SIMULATED</span>
    </div>
  );
}
const Glass = ({ children, className = "", style }) => (
  <div className={`glass relative ${className}`} style={style}>{["tl", "tr", "bl", "br"].map((c) => <i key={c} className={`brk ${c}`} />)}{children}</div>
);

/* Three-layer canvas starfield: parallax drift, twinkle, shooting star every ~8s, warp lines. DPR capped at 1.5. */
function Stars({ warp, calm, hidden }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, g = cv.getContext("2d");
    let W, H, raf, stars = [], sh = null, next = performance.now() + 8000;
    const draw = (t) => {
      g.clearRect(0, 0, W, H);
      const p = warp.current ? Math.min(1, (performance.now() - warp.current) / 1200) : 0;
      g.strokeStyle = g.fillStyle = "#E8EEFB";
      stars.forEach((s) => {
        const sp = [3, 7, 14][s.l], r = [0.6, 1, 1.5][s.l], x = calm ? s.x : (s.x + (t / 1000) * sp) % W;
        g.globalAlpha = Math.max(0.12, calm ? 0.7 : 0.45 + 0.4 * Math.sin(t / (900 + s.l * 400) + s.ph));
        if (p > 0) { const k = p * p * (0.5 + 0.4 * s.l); g.lineWidth = r; g.beginPath(); g.moveTo(x, s.y); g.lineTo(x + (x - W / 2) * k, s.y + (s.y - H / 2) * k); g.stroke(); }
        else g.fillRect(x, s.y, r * 1.6, r * 1.6);
      });
      if (!calm && p === 0) {
        if (!sh && t > next) { sh = { x: Math.random() * W * 0.6, y: Math.random() * H * 0.3, t0: t }; next = t + 8000; }
        if (sh) { const a = t - sh.t0; if (a > 900) sh = null; else { const x = sh.x + a * 0.9, y = sh.y + a * 0.45; g.globalAlpha = 1 - a / 900; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 90, y - 45); g.stroke(); } }
      }
      g.globalAlpha = 1;
    };
    const size = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0);
      stars = Array.from({ length: Math.min(260, Math.round((W * H) / 5500)) }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, l: i % 3, ph: Math.random() * 6.3 }));
      draw(performance.now());
    };
    size(); window.addEventListener("resize", size);
    const loop = (t) => { draw(t); raf = requestAnimationFrame(loop); };
    if (!calm && !hidden) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, [calm, hidden, warp]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

/* Original artwork: one horizon scene per world. The two scenes cross-fade (opacity, 600ms). */
function Scene({ k, on }) {
  const m = k === "moon", rim = m ? "#67E8F9" : "#FBBF24";
  return (
    <div className="scene" style={{ opacity: on ? 1 : 0 }} aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0" style={{ height: "60%", background: `radial-gradient(ellipse 60% 50% at 50% 100%,${m ? "rgba(34,211,238,.22)" : "rgba(251,146,60,.30)"},transparent 70%)` }} />
      <svg viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" className="hor">
        <defs>
          <linearGradient id={k + "g"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={m ? "#566070" : "#B4521C"} /><stop offset=".4" stopColor={m ? "#252C38" : "#5A1F0A"} /><stop offset="1" stopColor="#0B0F19" /></linearGradient>
          <filter id={k + "b"} x="-5%" y="-80%" width="110%" height="260%"><feGaussianBlur stdDeviation="10" /></filter>
        </defs>
        <path d={ARC + "L1540 360L-100 360Z"} fill={`url(#${k}g)`} />
        {CRATERS.map(([x, y, rx, ry], i) => <g key={i}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill="rgba(0,0,0,.30)" /><ellipse cx={x} cy={y - 3} rx={rx} ry={ry} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="2" /></g>)}
        <path className="rim" d={ARC} fill="none" stroke={rim} strokeWidth="18" opacity=".6" filter={`url(#${k}b)`} />
        <path d={ARC} fill="none" stroke={rim} strokeWidth="2.5" />
      </svg>
      {!m && <div className="absolute inset-x-0" style={{ bottom: "20vh", height: "14vh", background: "linear-gradient(transparent,rgba(251,146,60,.26),transparent)" }} />}
    </div>
  );
}

/* World orb: .fl floats, .ow scales on hover/focus, .tex scrolls slowly so the globe appears to rotate. */
function Orb({ k, on, pick, delay }) {
  const s = SITES[k];
  const glow = k === "moon" ? "0 0 46px rgba(214,232,255,.30)" : "0 0 46px rgba(251,146,60,.45)";
  return (
    <button onClick={() => pick(k)} aria-pressed={on} aria-label={`Choose ${s.name}`} className="orb flex flex-col items-center" style={{ background: "none", border: 0, color: "#fff" }}>
      <span className="fl" style={{ animationDelay: delay }}>
        <span className="ow" style={{ width: "var(--orb)", height: "var(--orb)" }}>
          <span className="tip" role="tooltip">{s.name}<br /><span style={{ color: C.dim }}>{s.tag}</span></span>
          <span className={`ring ${on ? "on" : ""}`} />
          <span className="ball" style={{ boxShadow: glow }}><span className="tex" style={{ background: TEX[k], backgroundSize: "50% 100%" }} /><span className="shade" /></span>
          {on && <span className="orbit"><i /></span>}
        </span>
      </span>
      <span className="olabel" style={{ color: on ? "#67E8F9" : "#fff" }}>{s.short.toUpperCase()}{on && <span className="sro"> (selected)</span>}</span>
    </button>
  );
}

/* Original astronaut guide (white suit, teal trim): floats, blinks, waves (viewer-right arm), points at Start (viewer-left arm). */
function Astro({ wave, point }) {
  return (
    <svg viewBox="0 0 160 200" className="astro" role="img" aria-label="Astro-Bot, a friendly astronaut guide">
      <defs>
        <linearGradient id="vz2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#14264A" /><stop offset="1" stopColor="#03060F" /></linearGradient>
      </defs>
      <rect x="98" y="76" width="38" height="58" rx="14" fill="#E6EDF4" stroke="#BCCBD8" strokeWidth="2" /><rect x="104" y="92" width="26" height="8" rx="4" fill="#5EEAD4" />
      <rect x="60" y="128" width="20" height="44" rx="9" fill="#F8FAFC" stroke="#D5DEE8" strokeWidth="2" /><rect x="86" y="128" width="20" height="44" rx="9" fill="#F8FAFC" stroke="#D5DEE8" strokeWidth="2" />
      <rect x="57" y="162" width="26" height="15" rx="7" fill="#5EEAD4" /><rect x="83" y="162" width="26" height="15" rx="7" fill="#5EEAD4" />
      <rect x="52" y="78" width="62" height="60" rx="22" fill="#F8FAFC" stroke="#D5DEE8" strokeWidth="2" /><rect x="55" y="120" width="56" height="7" rx="3.5" fill="#5EEAD4" />
      <rect x="69" y="92" width="28" height="20" rx="6" fill="#5EEAD4" stroke="#2DD4BF" strokeWidth="1.5" /><circle cx="77" cy="100" r="3.2" fill="#FB7B5A" /><circle cx="87" cy="100" r="3" fill="#E0FFFB" /><rect x="74" y="105" width="16" height="3" rx="1.5" fill="#E0FFFB" />
      <g className={`arm ${point ? "parm" : ""}`} style={{ transformOrigin: "50px 92px" }}>
        <rect x="42" y="86" width="16" height="38" rx="8" fill="#F8FAFC" stroke="#D5DEE8" strokeWidth="2" /><rect x="42" y="112" width="16" height="7" rx="3" fill="#5EEAD4" /><circle cx="50" cy="128" r="9" fill="#5EEAD4" />
      </g>
      <g className={wave ? "wavearm" : ""} style={{ transformOrigin: "116px 92px", transform: wave ? "rotate(-150deg)" : "rotate(0deg)", transition: "transform .4s" }}>
        <rect x="108" y="86" width="16" height="38" rx="8" fill="#F8FAFC" stroke="#D5DEE8" strokeWidth="2" /><rect x="108" y="112" width="16" height="7" rx="3" fill="#5EEAD4" /><circle cx="116" cy="128" r="9" fill="#5EEAD4" />
      </g>
      <circle cx="83" cy="52" r="37" fill="#F8FAFC" stroke="#D5DEE8" strokeWidth="2" />
      <ellipse cx="45" cy="54" rx="8" ry="13" fill="#5EEAD4" /><ellipse cx="121" cy="54" rx="8" ry="13" fill="#5EEAD4" />
      <ellipse cx="83" cy="54" rx="29" ry="24" fill="none" stroke="#5EEAD4" strokeWidth="4" />
      <ellipse cx="83" cy="54" rx="27" ry="22" fill="url(#vz2)" />
      <path d="M62 44Q68 35 80 34" stroke="rgba(255,255,255,.4)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse className="eye" cx="74" cy="55" rx="3.2" ry="4.2" fill="#67E8F9" opacity=".9" /><ellipse className="eye" cx="92" cy="55" rx="3.2" ry="4.2" fill="#67E8F9" opacity=".9" />
    </svg>
  );
}

const INTRO_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&family=IBM+Plex+Mono:wght@500&display=swap');
.intro{--orb:clamp(120px,min(15vw,26vh),220px);font-family:${FB}}
.intro :focus-visible{outline:3px solid #6EE7B7;outline-offset:3px}
.scene{position:absolute;inset:0;transition:opacity 600ms ease}
.hor{position:absolute;left:0;bottom:0;width:100%;height:31vh;min-height:150px}
.rim{animation:shim 6s ease-in-out infinite alternate}
.glass{background:linear-gradient(145deg,rgba(30,41,59,.82),rgba(15,23,42,.86));-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(6,182,212,.4);border-radius:16px;box-shadow:0 0 28px rgba(34,211,238,.10)}
.brk{position:absolute;width:12px;height:12px;border:2px solid #22D3EE}
.brk.tl{top:-1px;left:-1px;border-right:0;border-bottom:0;border-top-left-radius:16px}.brk.tr{top:-1px;right:-1px;border-left:0;border-bottom:0;border-top-right-radius:16px}
.brk.bl{bottom:-1px;left:-1px;border-right:0;border-top:0;border-bottom-left-radius:16px}.brk.br{bottom:-1px;right:-1px;border-left:0;border-top:0;border-bottom-right-radius:16px}
.card .brk{width:16px;height:16px;border-width:1.5px;border-color:#22D3EE;border-radius:0}
.card .brk.tl{top:14px;left:14px}.card .brk.tr{top:14px;right:14px;left:auto}.card .brk.bl{bottom:14px;left:14px;top:auto}.card .brk.br{bottom:14px;right:14px;top:auto;left:auto}
.tpill{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:9999px;border:1px solid rgba(190,205,230,.35);background:rgba(18,24,38,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#D5DEEF;font-size:12px;font-weight:500;letter-spacing:.06em;white-space:nowrap}
.batt{display:inline-block;position:relative;width:20px;height:10px;border:1.5px solid #67E8F9;border-radius:3px}
.batt b{position:absolute;left:1px;top:1px;bottom:1px;background:#67E8F9;border-radius:1px}
.ib{width:48px;height:48px;border-radius:9999px;border:1px solid rgba(103,232,249,.5);background:rgba(11,15,25,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#E8EEFB;display:grid;place-items:center;transition:transform .2s}
.ib:hover{transform:scale(1.08)}
.ghost{border:1px solid rgba(103,232,249,.55);color:#E8EEFB;background:transparent;border-radius:10px;padding:10px 14px;min-height:44px;font-size:14px}
.grad{background:linear-gradient(90deg,#67E8F9,#6EE7B7);-webkit-background-clip:text;background-clip:text;color:transparent}
.cs{background:transparent;border:0;border-bottom:2px solid rgba(200,210,230,.35);color:#fff;font:700 1.25rem ${FT};padding:0 4px;outline:none;width:100%;height:56px}
.cs::placeholder{color:#9AA8C7;font-weight:500}
.ul{position:absolute;left:0;right:0;bottom:0;height:2px;background:#22D3EE;transform:scaleX(0);transform-origin:left;transition:transform .35s}
.cs:focus~.ul{transform:scaleX(1)}
.lb{position:relative;display:block;width:100%;height:56px;padding:0;border:0;background:none;border-radius:9999px}
.lb:disabled{opacity:.5;cursor:not-allowed}
.lbglow{position:absolute;inset:-2px;border-radius:9999px;background:linear-gradient(90deg,#5EEAD4,#38BDF8);filter:blur(14px);opacity:.35;animation:gp 2.6s ease-in-out infinite}
.lb:disabled .lbglow{display:none}
.lbface{position:absolute;inset:0;border-radius:9999px;background:linear-gradient(90deg,#5EEAD4,#3DD6F5);box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -2px 0 rgba(0,0,0,.12);color:#06222B;display:flex;align-items:center;justify-content:center;gap:10px;font:700 1.05rem ${FT};letter-spacing:.06em;transition:transform .1s}
.lb:active:not(:disabled) .lbface{transform:translateY(2px) scale(.99)}
.rk{transition:transform .2s}.lb:hover:not(:disabled) .rk{transform:translate(3px,-3px)}
.fl{display:block;animation:flt 7s ease-in-out infinite alternate}
.ow{position:relative;display:block;transition:transform .25s}
.orb:hover .ow,.orb:focus-visible .ow{transform:scale(1.08)}
.ring{position:absolute;inset:-8px;border-radius:50%;border:2px solid var(--rim);box-shadow:0 0 28px var(--rim),inset 0 0 18px var(--rim);opacity:0;transition:opacity .25s}
.ring.on{animation:rp 3.2s ease-in-out infinite;opacity:.8}
.orb:hover .ring,.orb:focus-visible .ring{opacity:1;animation:none}
.ball{position:absolute;inset:0;border-radius:50%;overflow:hidden}
.tex{position:absolute;top:0;left:0;width:200%;height:100%;animation:drift 60s linear infinite}
.shade{position:absolute;inset:0;background:radial-gradient(circle at 30% 28%,rgba(255,255,255,.34),transparent 42%,rgba(0,0,0,.62) 100%)}
.orbit{position:absolute;inset:-16px;animation:spin 7s linear infinite}
.orbit i{position:absolute;top:-4px;left:50%;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:#fff;box-shadow:0 0 12px var(--rim)}
.olabel{margin-top:14px;font:700 clamp(1.1rem,2.2vw,1.9rem) ${FT};letter-spacing:.06em;line-height:1.1}
.sro{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.tip{position:absolute;bottom:calc(100% + 18px);left:50%;transform:translateX(-50%);width:max-content;max-width:190px;text-align:center;padding:6px 10px;border-radius:10px;background:rgba(11,15,25,.9);border:1px solid rgba(103,232,249,.32);font:500 12px ${FM};color:#E8EEFB;opacity:0;pointer-events:none;transition:opacity .2s;z-index:5}
.orb:hover .tip,.orb:focus-visible .tip{opacity:1}
.ig{display:grid;gap:22px;grid-template-columns:1fr}
.cl{display:flex;flex-direction:column;gap:16px}
.cm{display:flex;align-items:flex-end;gap:12px}
.cc{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding-top:8px}
.astro{width:clamp(96px,min(22vw,17vh),150px);height:auto;flex:none}
.arm{transition:transform .4s}.parm{transform:rotate(165deg)}
.bubble{padding:14px 16px;max-width:270px;color:#F1F5FB;font:500 1rem ${FT};border-radius:18px}
.bubble:before{content:"";position:absolute;left:-7px;bottom:22px;width:12px;height:12px;background:#131c2e;border-left:1px solid rgba(6,182,212,.4);border-bottom:1px solid rgba(6,182,212,.4);transform:rotate(45deg)}
@media(min-width:900px){
  .ig{grid-template-columns:minmax(300px,420px) 1fr minmax(220px,320px);align-items:stretch;gap:28px}
  .cm{margin-top:auto}
  .cb{align-self:end}
  .bubble{font-size:clamp(1rem,1.3vw,1.2rem)}
}
.bob{animation:bob 5s ease-in-out infinite alternate}
.wavearm{animation:wv2 .6s ease-in-out infinite alternate}
.eye{transform-box:fill-box;transform-origin:center;animation:bl 4.5s infinite}
.cur{animation:cur 1s steps(1) infinite}
.pop{animation:pop .5s cubic-bezier(.2,1.6,.4,1) both}.fi{animation:fi .5s both}
.sh3{--a:1px;animation:sk .1s linear infinite}.sh2{--a:3px;animation:sk .1s linear infinite}.sh1{--a:6px;animation:sk .08s linear infinite}.shgo{--a:2px;animation:sk .08s linear infinite}
.paused *{animation-play-state:paused!important}
.calm *:not(.keep){animation:none!important}
@keyframes drift{to{transform:translateX(-50%)}}@keyframes spin{to{transform:rotate(360deg)}}
@keyframes flt{from{transform:translateY(0)}to{transform:translateY(-9px)}}
@keyframes rp{50%{opacity:.5}}@keyframes shim{from{opacity:.4}to{opacity:.75}}
@keyframes bob{from{transform:translateY(0) rotate(-6deg)}to{transform:translateY(-10px) rotate(-1deg)}}
@keyframes wv2{from{transform:rotate(-135deg)}to{transform:rotate(-170deg)}}
@keyframes bl{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}
@keyframes gp{50%{opacity:.65}}@keyframes cur{50%{opacity:0}}@keyframes fi{from{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.18);opacity:1}100%{transform:scale(1)}}
@keyframes sk{0%,100%{transform:translate(0,0)}25%{transform:translate(calc(var(--a)*-1),var(--a))}50%{transform:translate(var(--a),calc(var(--a)*-1))}75%{transform:translate(calc(var(--a)*-1),calc(var(--a)*-1))}}
`;

function Intro({ name, setName, siteKey, setSiteKey, status, onLaunch, sound, setSound }) {
  const mq = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const [reduced, setReduced] = useState(!!mq?.matches);
  const [calmSet, setCalmSet] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [panel, setPanel] = useState(null);
  const [wave, setWave] = useState(false);
  const [picked, setPicked] = useState(false);
  const [launch, setLaunch] = useState(false);
  const [phase, setPhase] = useState(3);
  const [n, setN] = useState(0);
  const warp = useRef(0), wt = useRef(null);
  const calm = reduced || calmSet, named = name.trim().length > 0, ok = named && picked, moon = siteKey === "moon";
  const msg = ok ? `Ready for launch, Commander ${name.trim()}!` : LINE;

  useEffect(() => { const f = (e) => setReduced(e.matches); mq?.addEventListener?.("change", f); return () => mq?.removeEventListener?.("change", f); }, []);
  useEffect(() => { const f = () => setHidden(document.hidden); document.addEventListener("visibilitychange", f); return () => document.removeEventListener("visibilitychange", f); }, []);
  useEffect(() => { setN(0); }, [ok]);
  useEffect(() => {
    if (calm) { setN(msg.length); return; }
    if (n >= msg.length || hidden) return;
    const t = setTimeout(() => setN(n + 1), n === 0 ? 500 : 48);
    return () => clearTimeout(t);
  }, [n, msg, calm, hidden]);
  useEffect(() => () => clearTimeout(wt.current), []);

  /* Launch: 3-2-1 (pop + rising shake) then ~1.2s warp, then hand off to the unchanged start() */
  useEffect(() => {
    if (!launch) return;
    const T = [], at = (ms, fn) => T.push(setTimeout(fn, ms)), tone = (f) => Snd.count(f);
    setPhase(3); tone(440);
    if (calm) { at(700, () => setPhase(2)); at(1400, () => setPhase(1)); at(2100, () => setPhase("go")); at(2700, onLaunch); }
    else { at(800, () => { setPhase(2); tone(494); }); at(1600, () => { setPhase(1); tone(554); }); at(2400, () => { setPhase("go"); warp.current = performance.now(); tone(880); }); at(3600, onLaunch); }
    return () => T.forEach(clearTimeout);
  }, [launch]);

  const pick = (k) => { setSiteKey(k); setPicked(true); setWave(true); clearTimeout(wt.current); wt.current = setTimeout(() => setWave(false), 2200); };
  const shake = !calm && launch ? (phase === "go" ? "shgo" : "sh" + phase) : "";
  const icon = { position: "absolute", zIndex: 20 };

  return (
    <div className={`intro fixed inset-0 z-40 overflow-hidden ${hidden ? "paused" : ""} ${calm ? "calm" : ""} ${shake}`}
      style={{ "--rim": moon ? "#67E8F9" : "#FBBF24", background: "#0B0F19", color: C.text }}>
      <style>{INTRO_CSS}</style>
      <Stars warp={warp} calm={calm} hidden={hidden} />
      <Scene k="moon" on={moon} /><Scene k="mars" on={!moon} />

      {/* corner controls */}
      <button className="ib" style={{ ...icon, bottom: 16, left: 16 }} aria-label="Settings" aria-expanded={panel === "s"} onClick={() => setPanel(panel === "s" ? null : "s")}><Settings size={22} /></button>
      <button className="ib" style={{ ...icon, bottom: 16, left: 72 }} aria-label="Credits" aria-expanded={panel === "c"} onClick={() => setPanel(panel === "c" ? null : "c")}><Info size={22} /></button>
      <div className="flex items-center gap-2" style={{ ...icon, bottom: 16, right: 16 }}>
        <span style={{ fontFamily: FM, fontSize: 11, letterSpacing: ".14em" }}>SOUND {sound ? "ON" : "OFF"}</span>
        <button className="ib" aria-label={sound ? "Turn sound off" : "Turn sound on"} aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? <Volume2 size={22} /> : <VolumeX size={22} />}</button>
      </div>
      {panel === "s" && <Glass className="p-3 w-64" style={{ ...icon, bottom: 76, left: 16 }}>
        <div className="font-bold mb-2" style={{ fontFamily: FT }}>Settings</div>
        <button className="ghost w-full mb-2" aria-pressed={calmSet} onClick={() => setCalmSet(!calmSet)}>Calm mode: {calm ? "on" : "off"}</button>
        <p className="text-xs" style={{ color: C.dim }}>Calm mode swaps moving effects for simple fades. It also turns on by itself if your device asks for less motion.</p>
      </Glass>}
      {panel === "c" && <Glass className="p-3 w-72" style={{ ...icon, bottom: 76, left: 16 }}>
        <div className="font-bold mb-2" style={{ fontFamily: FT }}>Credits</div>
        <p className="text-xs" style={{ color: C.dim }}>All artwork, the astronaut guide and the animations are original. Space facts come from NASA open data: DONKI, OSDR, Curiosity RAD and LRO CRaTER.</p>
      </Glass>}

      <main className="relative z-10 h-full overflow-y-auto">
        <div className="min-h-full flex flex-col mx-auto px-5 md:px-12 pt-5 md:pt-6 pb-24" style={{ maxWidth: 1600 }}>
          {/* telemetry: top-left ALT/VEL, top-right clock and power. Everything is in flow, so nothing overlaps the title. */}
          <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
            <TelemL />
            <div className="flex flex-col items-start md:items-end gap-2"><TelemR /><Badge status={status} /></div>
          </header>
          <div className="mt-3 md:mt-4" style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: FT, fontWeight: 700, letterSpacing: ".02em", textTransform: "uppercase", lineHeight: 1.05, fontSize: "clamp(1.6rem,4.2vw,4rem)", filter: "drop-shadow(0 0 16px rgba(34,211,238,.5))" }}>
              <span className="block grad">Artemis &amp; Mars</span><span className="block grad">Outpost Commander</span>
            </h1>
            <p className="mt-3 text-base md:text-lg" style={{ fontFamily: FB }}>Prepare for launch: every choice has a trade-off.</p>
          </div>

          <div className="ig flex-1 mt-5">
            <div className="cl">
              <Glass className="card p-5" style={{ maxWidth: 400 }}>
                <label htmlFor="cs" className="block text-sm mb-1" style={{ fontFamily: FM, color: "#A9B4C8", letterSpacing: ".12em", paddingLeft: 4 }}>CALL SIGN</label>
                <div className="relative mb-4">
                  <input id="cs" className="cs" value={name} maxLength={20} onChange={(e) => setName(e.target.value.slice(0, 20))} placeholder="Type your name" autoComplete="off" />
                  <span className="ul" />
                </div>
                <button className="lb" disabled={!ok} onClick={() => ok && setLaunch(true)}>
                  <span className="lbglow" />
                  <span className="lbface"><Rocket className="rk" size={22} />START MISSION</span>
                </button>
                {!ok && <p className="text-xs mt-3" style={{ color: C.dim }}>{named ? "Now pick a world below to begin." : picked ? "Type a call sign to begin." : "Type a call sign and pick a world to begin."}</p>}
              </Glass>
              {/* Astro-Bot stands left of the planets */}
              <div className="cm">
                <div className="bob"><Astro wave={wave} point={ok && !wave} /></div>
                <Glass className="bubble" style={{ minHeight: 56 }}><span aria-label={msg}>{msg.slice(0, n)}{n < msg.length && <span className="cur">|</span>}</span></Glass>
              </div>
            </div>

            <div className="cc">
              <div className="flex justify-center items-end gap-8 md:gap-10">
                <Orb k="moon" on={picked && siteKey === "moon"} pick={pick} delay="0s" />
                <Orb k="mars" on={picked && siteKey === "mars"} pick={pick} delay="-3.5s" />
              </div>
            </div>

            <div className="cb">
              <Glass className="p-3" style={{ maxWidth: 340 }}>
                <div key={picked ? siteKey : "none"} className="fi">
                  {picked
                    ? <><div className="font-bold text-xs mb-1" style={{ fontFamily: FT, color: C.power, letterSpacing: ".08em" }}>{SITES[siteKey].name.toUpperCase()} · {SITES[siteKey].place.toUpperCase()}</div><p className="text-xs"><Rich text={SITES[siteKey].ctx} /></p></>
                    : <p className="text-sm">Tap the Moon or Mars to choose your mission site.</p>}
                </div>
              </Glass>
            </div>
          </div>
          <p className="text-xs text-center mt-6" style={{ color: C.dim }}>NASA data credit: DONKI, OSDR, Curiosity RAD, LRO CRaTER</p>
        </div>
      </main>

      {launch && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center" style={{ background: "rgba(11,15,25,.35)", cursor: "pointer" }} onClick={onLaunch} role="button" aria-label="Skip launch countdown">
          {phase === "go"
            ? <div className="keep fi" style={{ fontFamily: FT, fontWeight: 700, letterSpacing: ".2em", fontSize: "clamp(1.5rem,8vw,3rem)", textShadow: "0 0 30px #22D3EE" }}>LIFTOFF</div>
            : <div key={phase} className={`keep ${calm ? "fi" : "pop"}`} style={{ fontFamily: FT, fontWeight: 700, fontSize: "clamp(7rem,32vw,17rem)", lineHeight: 1, color: "#fff", textShadow: "0 0 40px #22D3EE" }}>{phase}</div>}
          <div className="absolute bottom-6 text-sm" style={{ color: C.dim, fontFamily: FM }}>Tap anywhere to skip</div>
        </div>
      )}
    </div>
  );
}

function Sources({ status, flare }) {
  return (
    <div className="text-left text-xs rounded-xl p-3 mt-3" style={{ background: "#0B112033", border: `1px solid ${C.edge}`, color: C.dim }}>
      <div className="font-bold mb-1" style={{ color: C.text }}>Verified NASA Data Attribution</div>
      <p className="mb-1">Solar flare in this game: <b>{flare.cls}</b> on {flare.date}. {status === "live" ? "Source: live NASA DONKI API (api.nasa.gov)." : `Source: archived record, ${ARCHIVE.name}. The live DONKI request did not return data, so this is not today's flare.`}</p>
      <ul className="list-disc pl-4">{DATASETS.map((d) => <li key={d}>{d}</li>)}</ul>
      <p className="mt-1">Game numbers are simplified for learning. Figures are approximate and drawn from NASA public data.</p>
    </div>
  );
}
