/* unemplyd. — page orchestration: builds DOM content, drives the World from scroll. */
(function () {
  "use strict";
  var gsap = window.gsap, ST = window.ScrollTrigger, SITE = window.SITE;
  gsap.registerPlugin(ST);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  if (reduce) root.classList.add("reduce");

  /* ---------- logo slots + CTA ---------- */
  $$(".logo-slot").forEach(function (el) { el.innerHTML = window.LOGO_SVG; el.classList.add("has-svg"); });
  $$("[data-cta]").forEach(function (a) { a.setAttribute("href", SITE.CTA_URL); });

  /* ---------- mobile menu ---------- */
  var menu = $("#navMenu"), sheet = $("#navSheet");
  menu.addEventListener("click", function () { var o = menu.getAttribute("aria-expanded") === "true"; menu.setAttribute("aria-expanded", String(!o)); sheet.hidden = o; });
  $$("a", sheet).forEach(function (a) { a.addEventListener("click", function () { menu.setAttribute("aria-expanded", "false"); sheet.hidden = true; }); });

  /* ---------- build content ---------- */
  // tour nav
  var tourNav = $("#tourNav");
  SITE.regions.forEach(function (r, i) {
    var li = document.createElement("li");
    li.innerHTML = '<button type="button" data-i="' + i + '"><span class="n">' + ("0" + (i + 1)).slice(-2) + "</span>" + r.title + "</button>";
    tourNav.appendChild(li);
  });
  // commits
  var commitsEl = $("#commits");
  SITE.commits.forEach(function (c, i) {
    var li = document.createElement("li"); li.className = "commit" + (c.gate ? " gate-" + c.gate : "");
    li.innerHTML = '<span class="cm-node" aria-hidden="true"></span>' +
      '<div class="cm-body"><p class="cm-title"><span class="cm-n">' + ("0" + (i + 1)).slice(-2) + "</span>" + c.title + "</p><p class=\"cm-msg\">" + c.body + "</p>" +
      '<p class="cm-meta"><span class="cm-t">' + c.t + ":</span>" + (c.tag ? '<span class="cm-tag">' + (c.gate ? "<b>" + c.gate + "</b>" : "") + c.tag + "</span>" : "") + "</p></div>";
    commitsEl.appendChild(li);
  });
  var commitEls = $$(".commit", commitsEl);
  // departures board
  var boardRows = $("#boardRows");
  SITE.courses.forEach(function (row) {
    var d = document.createElement("div"); d.className = "board-row"; d.setAttribute("role", "row");
    d.innerHTML = row.map(function (cell, k) { return '<span role="cell" class="flap" data-v="' + cell + '">' + cell + "</span>"; }).join("");
    boardRows.appendChild(d);
  });
  // labs
  var labGrid = $("#labGrid"), ltOut = $("#ltOut"), ltTitle = $("#ltTitle"), labTimer = null;
  SITE.labs.forEach(function (l, i) {
    var b = document.createElement("button"); b.type = "button"; b.className = "lab"; b.setAttribute("role", "listitem");
    b.innerHTML = '<span class="lab-n">' + ("0" + (i + 1)).slice(-2) + "</span><span class=\"lab-name\">" + l.name + '</span><span class="lab-what">' + l.what + "</span>";
    b.addEventListener("click", function () { runLab(i); });
    labGrid.appendChild(b);
  });
  function runLab(i) {
    var l = SITE.labs[i];
    $$(".lab", labGrid).forEach(function (b, k) { b.classList.toggle("on", k === i); });
    ltTitle.textContent = l.name.toLowerCase();
    clearTimeout(labTimer); ltOut.textContent = "";
    var lines = l.run.slice(), k = 0;
    (function next() {
      if (k >= lines.length) { ltOut.innerHTML += '<span class="cur"></span>'; return; }
      var line = lines[k++], isCmd = /^[$>]|^PC0>|^Build|^Compiling/.test(line);
      ltOut.innerHTML += (isCmd ? '<span class="c">' : '<span class="o">') + line.replace(/</g, "&lt;") + "</span>\n";
      labTimer = setTimeout(next, reduce ? 0 : 320);
    })();
  }
  runLab(5);
  // passes
  var passes = $("#passes");
  SITE.projects.forEach(function (p) {
    var a = document.createElement("article"); a.className = "pass" + (p.pending ? " pending" : "");
    a.innerHTML = '<div class="pass-l"><p class="pass-id">' + p.id + '</p><h3>' + p.name + '</h3><p class="pass-hook">' + p.hook + "</p>" +
      (p.pending ? "" :
        '<dl class="pass-dl"><div><dt>PROBLEM</dt><dd>' + p.problem + '</dd></div><div><dt>SOLUTION</dt><dd>' + p.solution + '</dd></div><div><dt>STACK</dt><dd>' + p.stack.map(function (s) { return "<span>" + s + "</span>"; }).join("") + '</dd></div><div><dt>CONCEPTS</dt><dd>' + p.concepts.join(" · ") + "</dd></div></dl>") +
      '</div><div class="pass-r" aria-hidden="true"><span class="pass-gate">GATE ' + (p.pending ? "—" : "O") + '</span><span class="pass-bar"></span></div>' +
      (p.shipped ? '<span class="stamp" aria-label="Shipped">SHIPPED</span>' : "");
    passes.appendChild(a);
  });
  // ASCII monograms on crew badges
  $$(".ascii").forEach(function (el) {
    var name = el.dataset.name, cols = 30, rows = 12;
    var c = document.createElement("canvas"); c.width = cols; c.height = rows; var g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, cols, rows); g.fillStyle = "#fff"; g.font = "bold 11px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(name.slice(0, 2), cols / 2, rows / 2 + 1);
    var d = g.getImageData(0, 0, cols, rows).data, ramp = " .:-=+*#%@", out = "";
    for (var y = 0; y < rows; y++) { for (var x = 0; x < cols; x++) { var v = d[(y * cols + x) * 4] / 255; out += ramp[Math.min(9, Math.floor(v * 9.99))]; } out += "\n"; }
    el.textContent = out;
  });

  /* ---------- world ---------- */
  var canvas = $("#world"), world = null;
  function webglOK() { try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch (e) { return false; } }
  if (window.THREE && webglOK()) {
    try { world = new window.World(canvas, { mobile: innerWidth < 768, reduce: reduce }); } catch (e) { world = null; console.warn(e); }
  }
  if (!world) root.classList.add("no-webgl");
  var T = world ? world.target : {};

  var hubTag = $("#hubTag");
  var last = performance.now(), running = true, inHero = true;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (world && running) {
      world.update(dt);
    }
    requestAnimationFrame(frame);
  }
  if (world) {
    window.addEventListener("resize", function () { world.resize(); });
    document.addEventListener("visibilitychange", function () { running = !document.hidden; last = performance.now(); });
    requestAnimationFrame(frame);
  }

  function set(o) { if (!world) return; for (var k in o) T[k] = o[k]; }
  var mob = function () { return innerWidth < 768; };

  /* ---------- scene states ---------- */
  var HUB = window.World ? window.World.HUB : { lat: 20.6, lon: 78.9 };
  var STATES = {
    hero: function () { return { gx: mob() ? -1.5 : 0, gy: mob() ? -1.7 : -3.1, scale: mob() ? 2.35 : 3.05, camZ: 5.2, faceLat: HUB.lat, faceLon: HUB.lon - 12, tilt: -1.35, dots: 1, arcs: 0.55, arcDraw: 1, route: 0, active: 0, hub: 0.6, atmo: 1, burst: 0, runway: 1 }; },
    mission: function () { return { gx: 0, gy: mob() ? -0.9 : -1.15, scale: 1.55, camZ: 5.2, faceLat: HUB.lat + 18, faceLon: HUB.lon, tilt: 0.55, dots: 0.85, arcs: 0.9, arcDraw: 1, route: 0, active: 0, hub: 0.7, atmo: 1.2, burst: 0, runway: 0, plane: "takeoff", planeT: 1 }; },
    preflight: function () { return { gx: mob() ? -3 : -1.65, gy: mob() ? -1.4 : -3.65, scale: mob() ? 2.35 : 3.6, camZ: 5.2, faceLat: HUB.lat, faceLon: HUB.lon - 12, tilt: -1.35, dots: 1, arcs: 0.3, arcDraw: 1, route: 0, active: 0, hub: 0.4, atmo: 0.9, burst: 0, runway: 1, plane: "runway", planeT: 0 }; },
    tour: function () {
      // fit the globe into the band between the traceroute window and the card, so nothing covers it
      var H = innerHeight, tw = $(".trace-win"), tc = $("#tourCard");
      var top = tw ? tw.offsetTop + tw.offsetHeight + 14 : 0.25 * H, bot = tc ? tc.offsetTop - 14 : 0.75 * H;
      var band = Math.max(0.3 * H, bot - top), unit = H / 3.16, rs = mob() ? 0.78 : 1;
      var sc = Math.min(mob() ? 1 : 0.8, (band / 2.5) / unit / rs), cy = (top + bot) / 2;
      return { gx: 0, gy: (H / 2 - cy) / unit, scale: sc, camZ: 5.2, tilt: 0.0, dots: 1, arcs: 0.35, arcDraw: 1, route: 0, active: 1, hub: 0.6, atmo: 1, burst: 0, runway: 0, plane: "tour" }; },
    route: function () { return { runway: 0, gx: mob() ? 0 : 0.85, gy: mob() ? 0.55 : -0.02, scale: mob() ? 0.9 : 1.05, camZ: 5.2, tilt: 0.1, dots: 1, arcs: 0.12, arcDraw: 1, route: 1, active: 0, hub: 0.6, atmo: 1, burst: 0, plane: "route" }; },
    learn: function () { return { runway: 0, gx: 0, gy: 0.15, scale: 0.95, camZ: 8.5, faceLat: 15, faceLon: 20, tilt: 0.2, dots: 0.32, arcs: 0.4, arcDraw: 1, route: 0, active: 0, hub: 0.3, atmo: 0.5, burst: 0, plane: "park" }; },
    board: function () { return { runway: 0, gx: 0, gy: mob() ? 0.25 : -0.28, scale: mob() ? 0.95 : 1.15, camZ: 5.2, faceLat: HUB.lat, faceLon: HUB.lon, tilt: 0.25, dots: 1, arcs: 1, arcDraw: 1, route: 0, active: 0, hub: 1, atmo: 1.3, burst: 1, plane: "takeoff" }; }
  };
  var spin = 0;
  window.__uw = { set: function (o) { set(o); }, states: STATES, world: function () { return world; } };
  function enter(name) { set(STATES[name]()); document.body.dataset.scene = name; }

  /* ---------- typing helper ---------- */
  // tiny syntax highlighter: comments, calls, keywords, strings, punctuation
  function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function hl(src) {
    var re = /(\/\/[^\n]*|#[^\n]*)|("[^"\n]*"?|'[^'\n]*'?)|\b(while|return|const|let|var|if|else|for|function|new|import|from|export|async|await|class|def|true|false|null|None|self)\b|([A-Za-z_$][\w$]*)(?=\s*\()|(\d+(?:\.\d+)?)|([{}()\[\];:,.!=<>+\-*&|?]+)/g;
    var out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      var c = m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : m[4] ? "f" : m[5] ? "n" : "p";
      out += '<span class="sx-' + c + '">' + esc(m[0]) + "</span>";
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }
  $$("[data-type]").forEach(function (el) { el.dataset.full = el.textContent; });
  function typeTo(el, p) { var f = el.dataset.full, n = Math.round(f.length * Math.max(0, Math.min(1, p))); el.innerHTML = hl(f.slice(0, n)) + (n < f.length ? '<span class="tcur"></span>' : ""); }

  /* ---------- scroll ---------- */
  var heroLanded = false, landTween = null;
  function setupScroll() {
    // hero: the jet rolls down the runway, rotates and climbs out as you scroll; camera pulls back to the globe
    function lerp(a, b, k) { return a + (b - a) * k; }
    ST.create({ trigger: "#top", start: "top top", end: "bottom top",
      onEnterBack: function () { enter("hero"); },
      onUpdate: function (st) {
        if (reduce || !world) return;
        var p = st.progress;
        if (p > 0.01 && landTween) { landTween.kill(); landTween = null; if (!heroLanded) { heroLanded = true; trimMark(); } }
        if (heroLanded) set({ plane: "runway", planeT: Math.min(1, p * 1.25) });
        var H = STATES.hero(), M = STATES.mission(), k = Math.max(0, Math.min(1, (p - 0.3) / 0.7)); k = k * k * (3 - 2 * k);
        set({ scale: lerp(H.scale, M.scale, k), gy: lerp(H.gy, M.gy, k), faceLat: lerp(H.faceLat, M.faceLat, k), faceLon: lerp(H.faceLon, M.faceLon, k), tilt: lerp(H.tilt, M.tilt, k), runway: 1 - k });
        hubTag.style.opacity = Math.max(0, 1 - p * 2.6); hubTag.style.transform = "translate(-50%," + (-p * 60).toFixed(1) + "px)";
      } });

    var mcode = $$("#mission [data-type]");
    if (reduce) { mcode.forEach(function (el) { typeTo(el, 1); }); }
    ST.create({
      trigger: "#mission", start: "top top", end: "bottom bottom", pin: false,
      onEnter: function () { enter("mission"); }, onEnterBack: function () { enter("mission"); },
      onUpdate: function (s) { if (reduce) return; var p = s.progress; typeTo(mcode[0], p / 0.42); typeTo(mcode[1], (p - 0.45) / 0.42);
        $("#missionCard").classList.toggle("on", p > 0.02); $("#visionCard").classList.toggle("on", p > 0.45); }
    });

    var checks = $$("#checks li");
    function setChecks(n) {
      checks.forEach(function (li, i) { var on = i < n; li.classList.toggle("pass", on); li.querySelector(".st").textContent = on ? "[✓]" : (i === n ? "[…]" : "[ ]"); });
      $("#pfCount").textContent = n; $("#pfClear").textContent = n >= 6 ? "cleared for takeoff" : "holding";
      $("#pfSum").classList.toggle("clear", n >= 6);
      set({ preflight: n });
    }
    setChecks(reduce ? 6 : 0);
    ST.create({
      trigger: "#preflight", start: "top 60%", end: "bottom bottom",
      onEnter: function () { enter("preflight"); }, onEnterBack: function () { enter("preflight"); },
      onLeave: function () { set({ preflight: 6 }); },
      onUpdate: function (s) { if (!reduce) setChecks(Math.min(6, Math.floor(s.progress * 7.2))); }
    });

    var cur = -1, tcBtns = $$("#tourNav button");
    function setArt(i) {
      var img = $("#tcArt"); if (!img) return;
      var R = window.World && window.World.REGIONS[i], src = R && MEDIA[R.key];
      if (!src) { img.parentNode.style.display = "none"; return; }
      if (img.getAttribute("src") === src) return;
      img.src = src; if (!reduce) gsap.fromTo(img, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" });
    }
    setArt(0);
    function showRegion(i) {
      if (i === cur) return; cur = i;
      var r = SITE.regions[i], R = window.World.REGIONS[i];
      $("#tcTitle").textContent = r.title; $("#tcLine").textContent = r.line;
      $("#tcTopics").innerHTML = r.topics.map(function (t) { return "<li>" + t + "</li>"; }).join("");
      $("#tcCode").innerHTML = hl(r.code); setArt(i); $("#tcPlain").textContent = r.plain;
      $("#tourCard").style.setProperty("--tint", R.col);
      tcBtns.forEach(function (b, k) { b.classList.toggle("on", k === i); });
      if (!reduce) gsap.fromTo("#tourCard > *", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: "expo.out", overwrite: true });
      set({ activeIdx: i, faceLat: R.lat, faceLon: R.lon });
    }
    showRegion(0);
    var tourST = ST.create({
      trigger: "#world-tour", start: "top top", end: "bottom bottom",
      onEnter: function () { enter("tour"); showRegion(cur < 0 ? 0 : cur); set({ faceLat: window.World.REGIONS[cur].lat, faceLon: window.World.REGIONS[cur].lon }); },
      onEnterBack: function () { enter("tour"); set({ faceLat: window.World.REGIONS[cur].lat, faceLon: window.World.REGIONS[cur].lon }); },
      onUpdate: function (s) { var f = s.progress * 7.999; set({ planeT: f }); showRegion(Math.min(7, Math.floor(f + 0.35))); }
    });
    tcBtns.forEach(function (b, k) { b.addEventListener("click", function () { var y = tourST.start + (tourST.end - tourST.start) * (k + 0.05) / 8; window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" }); }); });

    ST.create({
      trigger: "#route", start: "top 60%", end: "bottom 80%",
      onEnter: function () { enter("route"); }, onEnterBack: function () { enter("route"); },
      onUpdate: function (s) {
        var p = s.progress; set({ routeDraw: p, planeT: p });
        if (world) { var pt = world.routeCurve.getPointAt(Math.max(0.001, Math.min(0.999, p))).clone().normalize(); var lat = Math.asin(pt.y) * 180 / Math.PI, lon = Math.atan2(pt.z, -pt.x) * 180 / Math.PI - 180; set({ faceLat: lat * 0.6, faceLon: lon - 20 }); }
        var n = SITE.commits.length;
        commitEls.forEach(function (el, i) { el.classList.toggle("on", p >= (world ? world.wpT[i] : i / (n - 1)) - 0.003); });
      }
    });
    if (reduce || !world) commitEls.forEach(function (el) { el.classList.add("on"); });

    ["#learn", "#projects", "#crew"].forEach(function (id) {
      ST.create({ trigger: id, start: "top 60%", end: "bottom 40%", onEnter: function () { enter("learn"); }, onEnterBack: function () { enter("learn"); } });
    });
    ST.create({
      trigger: "#outro", start: "top 70%", end: "bottom bottom",
      onEnter: function () { enter("board"); }, onEnterBack: function () { enter("board"); },
      onUpdate: function (s) { set({ planeT: Math.max(0, (s.progress - 0.15) / 0.85) }); }
    });

    // departures board flaps
    ST.create({ trigger: "#courses", start: "top 75%", once: true, onEnter: function () { flapAll(); } });
    // theory diagrams draw
    if (!reduce) gsap.from(".dg path, .dg rect, .dg circle", { strokeDashoffset: 400, strokeDasharray: 400, duration: 1.4, ease: "power2.out", stagger: 0.02, scrollTrigger: { trigger: "#theory", start: "top 75%" } });
    // stamp
    ST.create({ trigger: "#passes", start: "top 70%", once: true, onEnter: function () { $$(".stamp").forEach(function (s) { s.classList.add("hit"); }); } });
    // reveals
    if (!reduce) $$(".sec-head, .block-head, .badge, .pass, .route-head").forEach(function (el) {
      gsap.from(el, { y: 30, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });
    ST.refresh();
  }

  function flapAll() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-·";
    $$(".flap").forEach(function (el, i) {
      var v = el.dataset.v; if (reduce) { el.textContent = v; return; }
      var n = 0, max = 10 + (i % 6) * 2;
      var iv = setInterval(function () {
        n++; var out = "";
        for (var k = 0; k < v.length; k++) out += (n > max - (v.length - k) * 0.6 || v[k] === " ") ? v[k] : chars[(Math.random() * chars.length) | 0];
        el.textContent = out; if (n >= max) { clearInterval(iv); el.textContent = v; }
      }, 55);
    });
  }

  /* ---------- intro / landing ---------- */
  // hub label (storyboard 01A/01B): types "unemployed", o + e flagged as a diff,
  // drop down into Gate O / Gate E at touchdown, label closes up to "unemplyd."
  var HM = (function () {
    var m = $("#htWord"); if (!m) return null;
    m.textContent = "";
    var sp = "unemployed".split("").map(function (ch) { var s = document.createElement("span"); s.className = "hm-ch"; s.textContent = ch; m.appendChild(s); return s; });
    var dot = document.createElement("span"); dot.className = "hm-ch hm-dot"; dot.textContent = "."; m.appendChild(dot);
    var caret = document.createElement("span"); caret.className = "hm-caret"; m.appendChild(caret);
    return { sp: sp, o: sp[6], e: sp[8], dot: dot, caret: caret, bs: $$(".ht-g .gv b"), rests: $$(".ht-g .gv i"), ks: $$(".ht-g .gk") };
  })();
  function finalMark() {
    if (!HM) return;
    HM.o.style.display = HM.e.style.display = "none"; HM.caret.style.display = "none";
    gsap.set([HM.dot].concat(HM.bs, HM.rests, HM.ks), { opacity: 1, scale: 1 });
  }
  function typeMark() {
    if (!HM) return;
    gsap.set(HM.bs.concat(HM.rests, HM.ks), { opacity: 0 }); gsap.set(HM.dot, { opacity: 0, scale: 0, display: "none" });
    gsap.set(HM.sp, { display: "none" }); $(".ht-gates").style.visibility = "hidden";
    HM.sp.forEach(function (s, i) { gsap.set(s, { display: "inline-block", delay: 0.6 + i * 0.07 }); });
  }
  function trimMark() {
    if (!HM) return;
    var o = HM.o, e = HM.e;
    gsap.set(HM.sp, { display: "inline-block" });
    var gates = $(".ht-gates"); gates.style.visibility = "";
    var tl = gsap.timeline();
    tl.add(function () { o.classList.add("del"); e.classList.add("del"); })
      .to([o, e], { y: -6, duration: 0.08, yoyo: true, repeat: 3, ease: "power1.inOut" }, 0.1)
      .add(function () {
        [[o, HM.bs[0]], [e, HM.bs[1]]].forEach(function (pr, i) {
          var a = pr[0].getBoundingClientRect(), b = pr[1].getBoundingClientRect(), sc = b.height / a.height;
          gsap.timeline({ delay: i * 0.1 })
            .to(pr[0], { x: b.left - a.left + (b.width - a.width * sc) / 2, y: b.top - a.top, scale: sc, transformOrigin: "0 0", rotation: i ? 10 : -8, duration: 0.7, ease: "power2.in" })
            .set(pr[0], { opacity: 0 })
            .fromTo(pr[1], { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(3)" });
        });
      }, 0.5)
      .add(function () { [o, e].forEach(function (el) { el.style.width = el.getBoundingClientRect().width + "px"; el.style.overflow = "hidden"; }); }, 1.45)
      .to([o, e], { width: 0, x: 0, y: 0, rotation: 0, scale: 1, duration: 0.6, ease: "expo.inOut" }, 1.46)
      .set(HM.caret, { display: "none" }, 1.9)
      .set(HM.dot, { display: "inline-block" }, 1.9)
      .to(HM.dot, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(3)" }, 1.9)
      .to(HM.ks, { opacity: 1, duration: 0.4 }, 1.6)
      .fromTo(HM.rests, { opacity: 0, x: -8, filter: "blur(5px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.7, stagger: 0.12, ease: "expo.out" }, 1.7)
      .add(function () { o.style.display = e.style.display = "none"; });
  }

  // storyboard frames as art: region cards + learn blocks
  var MEDIA = window.MEDIA || {};
  $$("[data-media]").forEach(function (img) { var k = img.getAttribute("data-media"); if (MEDIA[k]) img.src = MEDIA[k]; else img.parentNode.remove(); });

  // passes tilt toward the pointer; badges swing on their lanyards as you scroll
  if (!reduce && matchMedia("(hover:hover)").matches) {
    $$(".pass").forEach(function (p) {
      p.addEventListener("pointermove", function (ev) {
        var r = p.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        p.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg"); p.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
        p.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); p.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      p.addEventListener("pointerleave", function () { p.style.setProperty("--rx", "0deg"); p.style.setProperty("--ry", "0deg"); });
    });
  }
  if (!reduce) $$(".badge").forEach(function (b, i) {
    gsap.fromTo(b, { rotation: i ? 1.6 : -1.6 }, { rotation: i ? -0.8 : 0.8, ease: "none", scrollTrigger: { trigger: "#crew", start: "top bottom", end: "bottom top", scrub: 1 } });
  });

  var globeShown = false;
  function showGlobe() {
    if (globeShown) return; globeShown = true;
    $("#loader").classList.add("clear");
    root.classList.add("globe-on");
  }
  function startSite() {
    enter("hero");
    root.classList.remove("pre");
    root.classList.add("ready");
    if (world) world.planeOn = true;
    if (!reduce) { gsap.from(".hero .reveal", { y: 24, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out", delay: 0.15 }); typeMark(); } else finalMark();
    // plane landing
    if (world && !reduce) {
      set({ plane: "approach", planeT: 0 }); world.cur.planeT = 0;
      landTween = gsap.to(T, { planeT: 1, duration: 3.4, ease: "none", delay: 0.2, onComplete: function () { landTween = null; set({ plane: "runway", planeT: 0 }); world.cur.planeT = 0; heroLanded = true; trimMark(); } });
    } else { set({ plane: "runway", planeT: 0 }); heroLanded = true; if (!reduce) setTimeout(trimMark, 1700); }
    setupScroll();
  }

  // initial world state: centred for the loader
  if (world) {
    set({ gx: 0, gy: 0, scale: mob() ? 0.75 : 0.95, faceLat: HUB.lat, faceLon: HUB.lon - 18, tilt: 0.12, arcDraw: 0, dots: 1, plane: "approach", planeT: 0 });
    for (var k in T) world.cur[k] = T[k];
    world.cur.dots = 0; world.cur.arcDraw = 0; world.cur.scale = 0.6;
    set({ dots: 0 });
  }

  var fast = false; try { fast = sessionStorage.getItem("unemplyd-loader") === "1"; } catch (e) {}
  if (reduce) {
    $("#loader").style.display = "none"; root.classList.remove("pre"); showGlobe(); if (world) set({ dots: 1, arcDraw: 1 }); startSite();
  } else {
    var L = new window.Loader({
      fast: fast,
      onGlobe: function () { showGlobe(); if (world) { set({ dots: 1 }); gsap.to(T, { arcDraw: 1, duration: 2.2, ease: "power2.out", delay: 0.4 }); } },
      onDone: function () { gsap.ticker.lagSmoothing(500, 33); startSite(); }
    });
    gsap.ticker.lagSmoothing(0);
    var go = function () { L.start(); };
    if (document.fonts && document.fonts.ready) { var started = false; document.fonts.ready.then(function () { if (!started) { started = true; go(); } }); setTimeout(function () { if (!started) { started = true; go(); } }, 1500); }
    else go();
  }

  // easter egg: type "sudo" for a barrel roll
  var buf = "";
  window.addEventListener("keydown", function (e) {
    if (e.key.length !== 1) return; buf = (buf + e.key.toLowerCase()).slice(-4);
    if (buf === "sudo" && world && !reduce) { gsap.fromTo(world, { roll: 0 }, { roll: Math.PI * 2, duration: 1.2, ease: "power2.inOut" }); }
  });
})();
