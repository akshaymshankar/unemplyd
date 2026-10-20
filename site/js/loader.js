/* unemplyd. — Loader: a real Dijkstra run on a random graph, then the logo intro
   ("unemployed" → o, e flagged → dropped into Gate O / Gate E → unemplyd.). */
(function () {
  "use strict";
  var gsap = window.gsap;

  function Loader(opts) {
    this.onGlobe = opts.onGlobe || function () {};
    this.onDone = opts.onDone || function () {};
    this.fast = !!opts.fast;
    this.el = document.getElementById("loader");
    this.cv = document.getElementById("graph");
    this.ctx = this.cv.getContext("2d");
    this.log = document.getElementById("loaderLog");
    this.done = false;
    this.tweens = [];
    var self = this;
    this._skip = function (e) { if (!e || e.type !== "keydown" || e.key === "Escape" || e.key === "Enter" || e.key === " ") self.finish(); };
    document.getElementById("skipIntro").addEventListener("click", this._skip);
    window.addEventListener("keydown", this._skip);
    window.addEventListener("wheel", this._skip, { passive: true });
    window.addEventListener("touchmove", this._skip, { passive: true });
    this._scroll = function () { if (window.scrollY > 40) self.finish(); };
    window.addEventListener("scroll", this._scroll, { passive: true });
  }

  Loader.prototype.size = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth; this.H = window.innerHeight;
    this.cv.width = this.W * dpr; this.cv.height = this.H * dpr;
    this.cv.style.width = this.W + "px"; this.cv.style.height = this.H + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  Loader.prototype.addLog = function (html) {
    var li = document.createElement("li"); li.innerHTML = html; this.log.appendChild(li);
  };

  Loader.prototype.buildGraph = function () {
    var W = this.W, H = this.H, cx = W / 2, cy = H / 2;
    var rx = Math.min(W * 0.36, 620), ry = Math.min(H * 0.28, 300);
    var N = W < 600 ? 30 : 42, nodes = [], tries = 0;
    while (nodes.length < N && tries < 5000) {
      tries++;
      var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
      var x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
      if (nodes.every(function (n) { return Math.hypot(n.x - x, n.y - y) > Math.min(W, 900) * 0.055; })) nodes.push({ x: x, y: y, d: Infinity, vis: false, prev: -1, a: 0 });
    }
    // edges: 3 nearest neighbours, symmetric
    var E = {}, edges = [];
    nodes.forEach(function (n, i) {
      var near = nodes.map(function (m, j) { return [j, Math.hypot(n.x - m.x, n.y - m.y)]; }).filter(function (p) { return p[0] !== i; }).sort(function (p, q) { return p[1] - q[1]; }).slice(0, 3);
      near.forEach(function (p) { var k = Math.min(i, p[0]) + "-" + Math.max(i, p[0]); if (!E[k]) { E[k] = 1; edges.push([i, p[0], p[1]]); } });
    });
    // connect components
    function comps() {
      var c = new Array(nodes.length).fill(-1), id = 0;
      for (var s = 0; s < nodes.length; s++) if (c[s] < 0) { var st = [s]; c[s] = id; while (st.length) { var u = st.pop(); edges.forEach(function (e) { var v = e[0] === u ? e[1] : (e[1] === u ? e[0] : -1); if (v >= 0 && c[v] < 0) { c[v] = id; st.push(v); } }); } id++; }
      return { c: c, n: id };
    }
    var cc = comps(), guard = 0;
    while (cc.n > 1 && guard++ < 50) {
      var best = null;
      for (var i = 0; i < nodes.length; i++) for (var j = 0; j < nodes.length; j++) if (cc.c[i] === 0 && cc.c[j] !== 0) { var d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y); if (!best || d < best[2]) best = [i, j, d]; }
      edges.push(best); cc = comps();
    }
    var start = 0, goal = 0;
    nodes.forEach(function (n, i) { if (n.x < nodes[start].x) start = i; if (n.x > nodes[goal].x) goal = i; });
    this.nodes = nodes; this.edges = edges; this.start = start; this.goal = goal;
    // run Dijkstra fully, record visit order
    nodes[start].d = 0;
    var order = [], visited = 0;
    while (visited < nodes.length) {
      var u = -1;
      nodes.forEach(function (n, i) { if (!n.vis && (u < 0 || n.d < nodes[u].d)) u = i; });
      if (u < 0 || nodes[u].d === Infinity) break;
      nodes[u].vis = true; visited++; order.push(u);
      edges.forEach(function (e) {
        var v = e[0] === u ? e[1] : (e[1] === u ? e[0] : -1);
        if (v >= 0 && !nodes[v].vis && nodes[u].d + e[2] < nodes[v].d) { nodes[v].d = nodes[u].d + e[2]; nodes[v].prev = u; }
      });
    }
    this.order = order;
    var path = [], c2 = goal; while (c2 >= 0) { path.unshift(c2); c2 = nodes[c2].prev; }
    this.path = path;
    this.state = { shown: 0, pathP: 0, fade: 0, morph: 0, glow: 0 };
  };

  Loader.prototype.draw = function () {
    var g = this.ctx, S = this.state, nodes = this.nodes, self = this;
    g.clearRect(0, 0, this.W, this.H);
    var shown = Math.floor(S.shown), visitedSet = {};
    for (var i = 0; i < shown && i < this.order.length; i++) visitedSet[this.order[i]] = 1;
    var onPath = {}; this.path.forEach(function (p, k) { if (k < self.path.length - 1) onPath[Math.min(p, self.path[k + 1]) + "-" + Math.max(p, self.path[k + 1])] = 1; });
    var cx = this.W / 2, cy = this.H / 2, R = Math.min(this.W, this.H) * (this.W < 768 ? 0.28 : 0.31);
    function pos(idx) {
      var n = nodes[idx];
      if (S.morph <= 0) return [n.x, n.y];
      var k = self.path.indexOf(idx);
      if (k < 0) return [n.x, n.y];
      var ang = -Math.PI + (k / (self.path.length - 1)) * Math.PI * 2;
      var tx = cx + Math.cos(ang) * R, ty = cy + Math.sin(ang) * R;
      var e = S.morph * S.morph * (3 - 2 * S.morph);
      return [n.x + (tx - n.x) * e, n.y + (ty - n.y) * e];
    }
    var dim = 1 - S.fade;
    // edges
    g.lineWidth = 1;
    this.edges.forEach(function (e) {
      var k = Math.min(e[0], e[1]) + "-" + Math.max(e[0], e[1]);
      var both = visitedSet[e[0]] && visitedSet[e[1]];
      if (onPath[k] && S.pathP > 0) return;
      g.strokeStyle = "rgba(220,227,240," + ((both ? 0.22 : 0.07) * dim) + ")";
      var a = pos(e[0]), b = pos(e[1]);
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    });
    // path
    if (S.pathP > 0) {
      g.strokeStyle = "#F20A14"; g.lineWidth = 2.2; g.shadowColor = "rgba(242,10,20,0.8)"; g.shadowBlur = 14;
      g.beginPath();
      var segs = (this.path.length - 1) * S.pathP;
      for (var j = 0; j <= Math.ceil(segs) && j < this.path.length; j++) {
        var p = pos(this.path[j]);
        if (j === 0) g.moveTo(p[0], p[1]);
        else if (j > segs) { var q = pos(this.path[j - 1]), f = segs - (j - 1); g.lineTo(q[0] + (p[0] - q[0]) * f, q[1] + (p[1] - q[1]) * f); }
        else g.lineTo(p[0], p[1]);
      }
      if (S.morph > 0.98) g.closePath();
      g.stroke(); g.shadowBlur = 0;
    }
    // nodes
    g.font = "500 10px 'JetBrains Mono', ui-monospace, monospace";
    nodes.forEach(function (n, idx) {
      var p = pos(idx), vis = visitedSet[idx], isPath = self.path.indexOf(idx) >= 0 && S.pathP > 0;
      var a = isPath ? 1 : (vis ? 0.9 : 0.35) * dim;
      if (a <= 0.01) return;
      g.fillStyle = isPath ? "#ffffff" : "rgba(220,227,240," + a + ")";
      g.beginPath(); g.arc(p[0], p[1], isPath ? 3.2 : 2.2, 0, Math.PI * 2); g.fill();
      if (vis && S.morph < 0.2 && n.d < Infinity) {
        g.fillStyle = "rgba(140,148,160," + (0.8 * dim) + ")";
        g.fillText(Math.round(n.d / 10), p[0] + 6, p[1] - 6);
      }
    });
    if (S.glow > 0) {
      var gr = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.25);
      gr.addColorStop(0, "rgba(242,10,20,0)"); gr.addColorStop(0.75, "rgba(242,10,20," + 0.18 * S.glow + ")"); gr.addColorStop(1, "rgba(242,10,20,0)");
      g.fillStyle = gr; g.fillRect(0, 0, this.W, this.H);
    }
  };

  Loader.prototype.start = function () {
    var self = this;
    this.size(); this.buildGraph();
    var tick = function () { if (!self.done) { self.draw(); self.raf = requestAnimationFrame(tick); } };
    tick();
    var S = this.state, sp = this.fast ? 2.4 : 1;
    var tl = this.tl = gsap.timeline({ onComplete: function () { self.finish(); } });
    tl.timeScale(sp);
    tl.add(function () { self.addLog('<span class="r">&gt;</span> implementing dijkstra(start: "student", goal: "engineer")'); }, 0.1)
      .to(S, { shown: this.order.length, duration: 1.5, ease: "none", onUpdate: function () {
        var v = Math.floor(S.shown);
        if (!self._vl) { self._vl = document.createElement("li"); self.log.appendChild(self._vl); }
        self._vl.innerHTML = '<span class="d">visited ' + v + "/" + self.nodes.length + " nodes</span>";
      } }, 0.3)
      .add(function () { self._vl.innerHTML = '<span class="d">visited ' + self.order.length + "/" + self.nodes.length + " · shortest path: " + (self.path.length - 1) + " hops · O(E log V)</span>"; }, 1.85)
      .to(S, { pathP: 1, duration: 0.55, ease: "power2.inOut" }, 1.85)
      .to(S, { fade: 1, duration: 0.45 }, 2.35)
      .add(function () { self.addLog('<span class="r">&gt;</span> route found. preparing for landing.'); }, 2.4)
      .to(S, { morph: 1, duration: 0.8, ease: "power3.inOut" }, 2.55)
      .to(S, { glow: 1, duration: 0.3 }, 3.2)
      .add(function () { self.onGlobe(); }, 3.25)
      .to(this.cv, { opacity: 0, duration: 0.6 }, 3.35)
      .to({}, { duration: 0.35 }, 3.4);
  };

  Loader.prototype.intro = function (tl) {
    var self = this, word = document.getElementById("introWord"), gates = document.getElementById("introGates");
    var letters = "unemployed".split("");
    word.innerHTML = "";
    var spans = letters.map(function (ch) { var s = document.createElement("span"); s.className = "ch"; s.textContent = ch; s.style.display = "none"; word.appendChild(s); return s; });
    var dot = document.createElement("span"); dot.className = "ch dotc"; dot.textContent = "."; dot.style.display = "none"; word.appendChild(dot);
    var caret = document.createElement("span"); caret.className = "caret"; word.appendChild(caret);
    var o = spans[6], e = spans[8];
    var t0 = tl.time();
    tl.set(word.parentNode, { autoAlpha: 1 }, t0);
    spans.forEach(function (s, i) { tl.set(s, { display: "inline-block" }, t0 + 0.05 + i * 0.055); });
    tl.add(function () { o.classList.add("del"); e.classList.add("del"); self.addLog('<span class="r">warn:</span> 2 missing in "unemployed" → resolving o, e'); }, t0 + 0.75)
      .to([o, e], { y: -8, duration: 0.1, yoyo: true, repeat: 3, ease: "power1.inOut" }, t0 + 0.8)
      .add(function () {
        // measure widths so we can collapse the gaps smoothly
        [o, e].forEach(function (el) { el.style.width = el.getBoundingClientRect().width + "px"; el.style.overflow = "visible"; });
      }, t0 + 1.2)
      .to([o, e], { y: function (i) { return i ? 150 : 120; }, scale: 0.4, rotation: function (i) { return i ? 14 : -10; }, opacity: 0, duration: 0.75, ease: "power2.in", stagger: 0.07 }, t0 + 1.22)
      .to([o, e], { width: 0, marginLeft: 0, marginRight: 0, duration: 0.6, ease: "expo.inOut" }, t0 + 1.45)
      .set(dot, { display: "inline-block" }, t0 + 1.75)
      .fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.45, ease: "back.out(3)" }, t0 + 1.75)
      .set(caret, { display: "none" }, t0 + 1.75)
      .to(gates, { autoAlpha: 1, duration: 0.3 }, t0 + 1.75)
      .add(function () {
        var rests = gates.querySelectorAll(".gate-rest");
        self.scramble(rests[0], "pportunities", 0.7); self.scramble(rests[1], "xperience", 0.6);
      }, t0 + 1.8)
      .to({}, { duration: 0.9 }, t0 + 2.2);
  };

  Loader.prototype.scramble = function (el, text, dur) {
    var chars = "01/_-=+*{}<>;", start = performance.now(), self = this;
    function step(now) {
      var p = Math.min(1, (now - start) / (dur * 1000)), n = Math.floor(text.length * p), out = text.slice(0, n);
      for (var i = n; i < text.length; i++) out += chars[(Math.random() * chars.length) | 0];
      el.textContent = out;
      if (p < 1 && !self.done) requestAnimationFrame(step); else el.textContent = text;
    }
    requestAnimationFrame(step);
  };

  Loader.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    if (this.tl) this.tl.kill();
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this._skip);
    window.removeEventListener("wheel", this._skip);
    window.removeEventListener("touchmove", this._skip);
    window.removeEventListener("scroll", this._scroll);
    this.onGlobe();
    var self = this;
    gsap.to(this.el, { autoAlpha: 0, duration: 0.6, ease: "power2.out", onComplete: function () { self.el.style.display = "none"; } });
    try { sessionStorage.setItem("unemplyd-loader", "1"); } catch (e) {}
    this.onDone();
  };

  window.Loader = Loader;
})();
