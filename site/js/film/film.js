/* unemplyd. film — "Beyond the Horizon", the scroll-controlled opening.
   The visitor scrolls the movie. Scroll → progress → (scene, local t) → aircraft pose, camera shot,
   lighting and titles, all pure functions of t, so scrubbing backwards plays it in reverse.

   Built so far:  Scene 01 Departure (runway)  ·  Scene 02 Take-off
   Then a short bridge climbs into the cloud deck and hands over to the existing globe hero.
   Scenes 03–06 (atmosphere, globe, ocean, portal) slot into STORYBOARD with their own shots. */
(function () {
  "use strict";
  var THREE = window.THREE, Rig = window.FilmRig;
  if (!THREE || !Rig) return;
  var Track = Rig.Track, range = Rig.range, clamp = Rig.clamp, E = Rig.EASE;

  /* ---------- storyboard (fractions of the whole journey) ---------- */
  // `span` is the share of the complete film from the creative brief; the scroll length of each
  // scene is span × JOURNEY_VH, so later scenes keep their proportions when they arrive.
  var JOURNEY_VH = 1700;
  var STORYBOARD = [
    { id: "runway",  n: "01", name: "Departure",  span: 0.12, built: true },
    { id: "takeoff", n: "02", name: "Take-off",   span: 0.14, built: true },
    // { id: "atmosphere", n: "03", name: "Into the atmosphere", span: 0.14 },
    // { id: "globe",      n: "04", name: "Around the globe",    span: 0.32 },
    // { id: "ocean",      n: "05", name: "The ocean descent",   span: 0.18 },
    // { id: "portal",     n: "06", name: "UNEMPLYD",            span: 0.10 },
    { id: "bridge",  n: "03", name: "Into the atmosphere", span: 0.055, built: true }   // temporary: hands over to the globe hero
  ];

  /* ---------- aircraft kinematics ---------- */
  // Scene 02: a take-off roll with constant acceleration, rotation at Vr, lift-off, climb, gear up
  var ROLL_END = 0.56, ROLL_DIST = 1500, V_LOF = 2 * ROLL_DIST / ROLL_END;
  var T2 = {
    pitch: new Track([[0, 0], [0.47, 0], [0.585, 9 * Math.PI / 180, "smooth"], [0.72, 12.5 * Math.PI / 180, "smooth"], [1, 11 * Math.PI / 180]]),
    gear: new Track([[0, 1], [0.68, 1], [0.8, 0, "smooth"]]),
    fan: new Track([[0, 0.38], [0.12, 1, "smooth"]]),
    bank: new Track([[0, 0], [0.8, 0], [1, 7 * Math.PI / 180, "smooth"]]),
    heading: new Track([[0, 0], [0.8, 0], [1, -0.05, "in"]]),
    shake: new Track([[0, 0.004], [0.14, 0.03], [0.42, 0.075], [0.56, 0.095], [0.6, 0.03], [0.74, 0.012], [1, 0.008]])
  };
  function alt2(t) { return t <= ROLL_END ? 0 : 340 * Math.pow((t - ROLL_END) / (1 - ROLL_END), 1.7); }
  function dist2(t) { return t <= ROLL_END ? ROLL_DIST * (t / ROLL_END) * (t / ROLL_END) : ROLL_DIST + V_LOF * (t - ROLL_END) * (1 + 0.25 * (t - ROLL_END)); }
  var T1 = {
    fan: new Track([[0, 0], [0.44, 0], [0.8, 0.22, "smooth"], [1, 0.38, "smooth"]]),
    landing: new Track([[0, 0], [0.5, 0], [0.56, 1, "out"]]),
    strobe: new Track([[0, 0], [0.82, 0], [0.83, 1]]),
    shake: new Track([[0, 0], [0.5, 0], [1, 0.005]])
  };
  var CLOUD = new THREE.Color(0.84, 0.88, 0.95), SPACE = new THREE.Color(0.0018, 0.0021, 0.0032);   // SPACE ≈ #06070A after sRGB
  function aircraftState(loc, out) {
    var t = loc.t, id = loc.id;
    out.pos.set(0, 0, 0); out.heading = 0; out.pitch = 0; out.bank = 0;
    out.gear = 1; out.fan = 0; out.landing = 0; out.strobe = 0; out.beacon = 1; out.logo = 1; out.cabin = 1;
    if (id === "runway") { out.fan = T1.fan.at(t); out.landing = T1.landing.at(t); out.strobe = T1.strobe.at(t); }
    else if (id === "takeoff") {
      var d = dist2(t), h = T2.heading.at(t);
      out.pos.set(Math.max(0, d - 2200) * Math.sin(-h) * 0.5, alt2(t), -d);
      out.heading = h; out.pitch = T2.pitch.at(t); out.bank = T2.bank.at(t);
      out.gear = T2.gear.at(t); out.fan = T2.fan.at(t); out.landing = 1; out.strobe = 1;
    } else {    // bridge: keep climbing out, turning gently right, into the cloud deck
      var d1 = dist2(1), v = V_LOF * 1.5, dd = d1 + v * 0.62 * t, hh = -0.05 - 0.12 * E.smooth(t);
      out.pos.set((dd - 2200) * 0.04 * t, 340 + 260 * t, -dd);
      out.heading = hh; out.pitch = (11 - 3 * t) * Math.PI / 180; out.bank = (7 + 6 * E.smooth(t)) * Math.PI / 180;
      out.gear = 0; out.fan = 1; out.landing = 1 - range(t, 0.4, 0.6); out.strobe = 1;
    }
    return out;
  }
  function groundSpeedKt(loc) {
    if (loc.id === "runway") return 0;
    if (loc.id === "takeoff") return loc.t <= ROLL_END ? 158 * loc.t / ROLL_END : 158 + 34 * E.out((loc.t - ROLL_END) / (1 - ROLL_END));
    return 192 + 40 * loc.t;
  }

  /* ---------- camera shots ---------- */
  var W = function (x, y, z) { return { p: [x, y, z] }; };
  var S = function (x, y, z) { return { p: [x, y, z], in: "plane" }; };
  var SHOTS = {
    // low and wide on the runway, ahead of the aircraft; a slow dolly in that ends on its side
    runway: { minY: 0.6, keys: [
      { t: 0.0,  pos: W(6, 1.4, -165),  look: W(0, 2.2, 20),  fov: 36 },
      { t: 0.34, pos: W(14, 2.0, -104), look: W(0, 4.0, 4),   fov: 36, ease: "linear" },
      { t: 0.66, pos: W(25, 2.7, -52),  look: W(0, 4.5, -6),  fov: 35, ease: "linear" },
      { t: 1.0,  pos: W(33, 2.1, -9),   look: W(0, 4.6, -4),  fov: 33, ease: "out" }
    ] },
    // it rolls past the camera, the camera whips round into a low rear chase, lift-off, gear up, climb
    takeoff: { minY: 0.7, keys: [
      { t: 0.0,  pos: W(33, 2.1, -9),   look: S(0, 4.6, -4),   fov: 33 },
      { t: 0.15, pos: W(30, 1.5, -72),  look: S(0, 4.2, -14),  fov: 31, ease: "linear" },
      { t: 0.31, pos: S(15, 2.3, 40),   look: S(0, 4.5, -36),  fov: 43, ease: "linear" },
      { t: 0.5,  pos: S(5.5, 1.5, 36),  look: S(0, 5.2, -60),  fov: 48, ease: "linear" },
      { t: 0.66, pos: S(-3, 2.4, 44),   look: S(0, 9, -60),    fov: 46, ease: "linear" },
      { t: 0.84, pos: S(-19, 7, 60),    look: S(0, 12, -40),   fov: 42, ease: "linear" },
      { t: 1.0,  pos: S(-11, 22, 96),   look: S(0, 20, -120),  fov: 40, ease: "linear" }
    ] },
    bridge: { keys: [
      { t: 0.0,  pos: S(-11, 22, 96),   look: S(0, 20, -120),  fov: 40 },
      { t: 1.0,  pos: S(-3, 9, 52),     look: S(0, 14, -260),  fov: 50, ease: "inOut3" }
    ] }
  };

  /* ---------- titles & callouts ---------- */
  var CALLOUTS = [[0.06, "THRUST SET"], [0.3, "80 KNOTS"], [0.45, "V1"], [0.515, "ROTATE"], [0.64, "POSITIVE RATE"], [0.7, "GEAR UP"]];

  /* ---------- post-processing (all core three.js) ---------- */
  var QUAD_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }";
  function quadMat(fs, uniforms) { return new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: fs, uniforms: uniforms, depthTest: false, depthWrite: false }); }
  var ACCUM_FS = "uniform sampler2D tCur, tPrev; uniform float uK; varying vec2 vUv; void main(){ vec3 c = texture2D(tCur, vUv).rgb; vec3 p = texture2D(tPrev, vUv).rgb; gl_FragColor = vec4(mix(c, p, uK), 1.); }";
  var BRIGHT_FS = "uniform sampler2D tSrc; uniform float uThr; varying vec2 vUv; void main(){ vec3 c = texture2D(tSrc, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(uThr, uThr * 2.2, l), 1.); }";
  var BLUR_FS = "uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv; void main(){ vec3 c = texture2D(tSrc, vUv).rgb * 0.227;" +
    " c += (texture2D(tSrc, vUv + uDir * 1.385).rgb + texture2D(tSrc, vUv - uDir * 1.385).rgb) * 0.316;" +
    " c += (texture2D(tSrc, vUv + uDir * 3.231).rgb + texture2D(tSrc, vUv - uDir * 3.231).rgb) * 0.07; gl_FragColor = vec4(c, 1.); }";
  var FINAL_FS = [
    "uniform sampler2D tSrc, tB1, tB2; uniform float uExposure, uBloom, uTime, uWhite, uVig, uGrain, uAberr; uniform vec3 uWhiteCol; varying vec2 vUv;",
    "vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0., 1.); }",
    "vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - 0.055, step(0.0031308, c)); }",
    "float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",
    "void main(){",
    "  vec2 d = vUv - 0.5; float r2 = dot(d, d);",
    "  vec3 c; c.r = texture2D(tSrc, vUv + d * uAberr * r2).r; c.g = texture2D(tSrc, vUv).g; c.b = texture2D(tSrc, vUv - d * uAberr * r2).b;",
    "  vec3 b = texture2D(tB1, vUv).rgb * 0.75 + texture2D(tB2, vUv).rgb * 1.1;",
    "  c += b * uBloom;",
    "  c *= uExposure; c = aces(c);",
    "  c *= mix(1., smoothstep(0.95, 0.2, r2 * 1.9), uVig);",
    "  c = mix(c, uWhiteCol, uWhite);",
    "  c = toSRGB(c);",
    "  c += (h(vUv * 1000. + fract(uTime * 7.3)) - 0.5) * uGrain;",
    "  gl_FragColor = vec4(c, 1.);",
    "}"
  ].join("\n");

  /* ---------- Film ---------- */
  function Film(opts) {
    opts = opts || {};
    var self = this;
    this.opts = opts;
    this.section = document.getElementById("film");
    this.stage = this.section.querySelector(".film-stage");
    this.canvas = document.getElementById("filmCanvas");
    this.mobile = innerWidth < 768 || matchMedia("(pointer:coarse)").matches;
    this.onCover = opts.onCover || function () {};
    this.onExit = opts.onExit || function () {};

    var R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: false, powerPreference: "high-performance", stencil: false });
    R.setClearColor(0x000000, 1);
    R.outputEncoding = THREE.LinearEncoding;
    R.toneMapping = THREE.NoToneMapping;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 1.75);

    var scene = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.3, 14000);
    this.rig = new Rig.ShotRig(this.camera);
    this.airport = new window.FilmAirport(scene, { mobile: this.mobile });
    scene.environment = this.airport.environment(R);

    this.plane = new window.FilmAircraft();
    scene.add(this.plane.root);
    this.shadow = this._contactShadow(); scene.add(this.shadow);
    this.ac = { pos: new THREE.Vector3() };
    this.frames = { plane: { pos: new THREE.Vector3(), heading: 0 } };
    this._loadAssets();

    // timeline: built scenes only, weighted by their share of the journey
    this.board = STORYBOARD.filter(function (s) { return s.built; });
    this.timeline = new Rig.Timeline(this.board.map(function (s) { return { id: s.id, weight: s.span, meta: s }; }));
    var vh = this.board.reduce(function (a, s) { return a + s.span; }, 0) * JOURNEY_VH * (this.mobile ? 0.8 : 1);
    this.section.style.height = "calc(" + Math.round(vh) + "vh + 100svh)";

    this._post();
    this.ui = {
      slateN: document.getElementById("filmSceneN"), slateName: document.getElementById("filmSceneName"),
      title: document.getElementById("filmTitle"), kicker: document.getElementById("filmKicker"), callout: document.getElementById("filmCallout"),
      gs: document.getElementById("hudGs"), alt: document.getElementById("hudAlt"), hud: this.section.querySelector(".film-hud"),
      hint: this.section.querySelector(".film-hint"), bars: this.section.querySelector(".film-bars"), slate: this.section.querySelector(".film-slate"),
      progress: this.section.querySelector(".film-progress i"), skip: document.getElementById("filmSkip")
    };
    var skip = document.getElementById("filmSkip");
    if (skip) skip.addEventListener("click", function () { var t = document.getElementById(opts.exitTo || "top"); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY, behavior: "auto" }); });

    this.target = 0; this.p = 0; this.time = 0; this.visible = true; this.covering = true; this.exited = false;
    this._lastCam = new THREE.Vector3(); this._lastQ = new THREE.Quaternion(); this._first = true;
    this._calloutIdx = -1;
    this.resize();
    window.addEventListener("resize", function () { self.resize(); });

    var ST = window.ScrollTrigger;
    ST.create({ trigger: this.section, start: "top top", end: "bottom bottom",
      onUpdate: function (st) { self.target = st.progress; },
      onRefresh: function (st) { self.target = st.progress; } });
    ST.create({ trigger: this.section, start: "top bottom", end: "bottom top", onToggle: function (st) { self.visible = st.isActive; } });
    this.target = this.p = clamp((scrollY - this.section.offsetTop) / Math.max(1, this.section.offsetHeight - innerHeight), 0, 1);
  }

  Film.prototype._loadAssets = function () {
    var A = window.FILM_ASSETS || {}, self = this;
    if (!A.aircraft) return;
    var go = function () {
      new THREE.GLTFLoader().load(A.aircraft, function (g) { self.plane.useModel(g.scene); }, null, function (e) { console.warn("film: aircraft model failed to load, keeping the procedural one", e); });
    };
    if (THREE.GLTFLoader) go();
    else { var s = document.createElement("script"); s.src = "vendor/GLTFLoader.js"; s.onload = go; document.head.appendChild(s); }
  };

  // a blurred top-down silhouette of the aircraft, laid on the runway: soft sky-light occlusion
  Film.prototype._contactShadow = function () {
    var c = document.createElement("canvas"); c.width = 256; c.height = 256; var g = c.getContext("2d");
    g.filter = "blur(9px)"; g.fillStyle = "rgba(0,0,0,.85)";
    var X = function (x) { return 128 + x * 5.6; }, Z = function (z) { return 128 + (z + 3) * 5.6; };
    g.beginPath(); g.ellipse(X(0), Z(-3), 2.3 * 5.6, 22 * 5.6, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(X(-1.9), Z(-4.6)); g.lineTo(X(-17), Z(2.5)); g.lineTo(X(-17), Z(4)); g.lineTo(X(-1.9), Z(2.6));
    g.lineTo(X(1.9), Z(2.6)); g.lineTo(X(17), Z(4)); g.lineTo(X(17), Z(2.5)); g.lineTo(X(1.9), Z(-4.6)); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(X(-0.5), Z(14.6)); g.lineTo(X(-6.4), Z(17.7)); g.lineTo(X(6.4), Z(17.7)); g.lineTo(X(0.5), Z(14.6)); g.fill();
    var t = new THREE.CanvasTexture(c);
    var m = new THREE.Mesh(new THREE.PlaneGeometry(256 / 5.6, 256 / 5.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.9, polygonOffset: true, polygonOffsetFactor: -4 }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 3;
    return m;
  };

  Film.prototype._post = function () {
    var R = this.renderer, gl2 = R.capabilities.isWebGL2;
    var half = R.extensions.has("EXT_color_buffer_half_float") || R.extensions.has("EXT_color_buffer_float") || (gl2 && R.extensions.has("EXT_color_buffer_float"));
    var type = half ? THREE.HalfFloatType : THREE.UnsignedByteType;
    var o = { type: type, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.rt = { scene: new THREE.WebGLRenderTarget(4, 4, { type: type, samples: gl2 ? (this.mobile ? 2 : 4) : 0 }),
      a: new THREE.WebGLRenderTarget(4, 4, o), b: new THREE.WebGLRenderTarget(4, 4, o),
      q1: new THREE.WebGLRenderTarget(4, 4, o), q2: new THREE.WebGLRenderTarget(4, 4, o),
      e1: new THREE.WebGLRenderTarget(4, 4, o), e2: new THREE.WebGLRenderTarget(4, 4, o) };
    this.hdr = half;
    this.quadScene = new THREE.Scene(); this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.quad.frustumCulled = false; this.quadScene.add(this.quad);
    this.m = {
      accum: quadMat(ACCUM_FS, { tCur: { value: null }, tPrev: { value: null }, uK: { value: 0 } }),
      bright: quadMat(BRIGHT_FS, { tSrc: { value: null }, uThr: { value: half ? 1.1 : 0.82 } }),
      blur: quadMat(BLUR_FS, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }),
      final: quadMat(FINAL_FS, { tSrc: { value: null }, tB1: { value: null }, tB2: { value: null }, uExposure: { value: 1.25 }, uBloom: { value: 0.9 },
        uTime: { value: 0 }, uWhite: { value: 0 }, uWhiteCol: { value: new THREE.Color(0.86, 0.9, 0.97) }, uVig: { value: 0.85 }, uGrain: { value: 0.035 }, uAberr: { value: 0.012 } })
    };
  };
  Film.prototype._pass = function (mat, target) { this.quad.material = mat; this.renderer.setRenderTarget(target); this.renderer.render(this.quadScene, this.quadCam); };

  Film.prototype.resize = function () {
    var w = innerWidth, h = innerHeight, R = this.renderer, d = this.dpr;
    R.setPixelRatio(d); R.setSize(w, h, false);
    this.canvas.style.width = w + "px"; this.canvas.style.height = h + "px";
    var W = Math.round(w * d), H = Math.round(h * d);
    this.rt.scene.setSize(W, H); this.rt.a.setSize(W, H); this.rt.b.setSize(W, H);
    var qw = Math.max(2, W >> 2), qh = Math.max(2, H >> 2), ew = Math.max(2, W >> 3), eh = Math.max(2, H >> 3);
    this.rt.q1.setSize(qw, qh); this.rt.q2.setSize(qw, qh); this.rt.e1.setSize(ew, eh); this.rt.e2.setSize(ew, eh);
    this.size = { w: W, h: H, qw: qw, qh: qh, ew: ew, eh: eh };
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this._first = true;
  };

  // keep roughly the same horizontal framing on portrait screens
  Film.prototype._fov = function (f) {
    var a = this.camera.aspect, ref = 1.6;
    if (a >= ref * 0.9) return f;
    var hf = 2 * Math.atan(Math.tan(f * Math.PI / 360) * ref);
    return Math.min(80, 2 * Math.atan(Math.tan(hf / 2) / a) * 180 / Math.PI * 0.9);
  };

  Film.prototype.locate = function (p) { return this.timeline.locate(p); };

  Film.prototype.update = function (dt) {
    this.time += dt;
    // ease toward the scroll position: the camera operator lags the dolly grip by a beat
    this.p += (this.target - this.p) * (1 - Math.exp(-dt * 5.5));
    if (Math.abs(this.target - this.p) < 1e-5) this.p = this.target;
    var p = this.p, loc = this.locate(p), meta = loc.scene.meta;

    // the stage fades out over the last stretch of the bridge, revealing the globe behind it
    var fade = loc.id === "bridge" ? range(loc.t, 0.8, 0.98) : 0;
    var covering = fade < 0.001 && this.target < 0.9999;
    this.stage.style.opacity = (1 - fade).toFixed(3);
    this.stage.style.visibility = fade >= 0.999 ? "hidden" : "visible";
    if (covering !== this.covering) { this.covering = covering; this.onCover(covering); }
    if (fade > 0.5 && !this.exited) { this.exited = true; this.onExit(); }
    if (!this.visible || fade >= 0.999) return;

    // aircraft
    var ac = aircraftState(loc, this.ac);
    this.plane.pose(ac.pos, ac.heading, ac.pitch, ac.bank);
    this.plane.update(ac, dt, this.time);
    this.frames.plane.pos.copy(ac.pos); this.frames.plane.heading = ac.heading;
    var alt = ac.pos.y;
    this.shadow.position.set(ac.pos.x, 0.06, ac.pos.z - 3 * Math.cos(ac.heading));
    this.shadow.rotation.z = ac.heading;
    this.shadow.material.opacity = 0.9 * clamp(1 - alt / 22, 0, 1);
    this.shadow.scale.setScalar(1 + alt / 40);
    this.shadow.visible = alt < 22;

    // camera
    var shot = SHOTS[loc.id];
    this.rig.evaluate(shot, loc.t, this.frames);
    this.rig.fov = this._fov(this.rig.fov);
    var shake = loc.id === "takeoff" ? T2.shake.at(loc.t) : loc.id === "runway" ? T1.shake.at(loc.t) : 0.004;
    this.rig.apply(this.time, shake * (this.mobile ? 0.7 : 1), loc.id === "runway" ? 0.12 : 0.05);

    // environment
    var pix = this.size.h / (2 * Math.tan(this.camera.fov * Math.PI / 360));
    var climb = loc.id === "bridge" ? 1 : loc.id === "takeoff" ? range(loc.t, 0.6, 1) : 0;
    this.airport.update(this.time, dt, this.camera, pix, {
      mist: 1 - climb * 0.6, clouds: 1, cloudGlow: climb, lift: range(this.camera.position.y, 60, 500) * 0.6,
      lightGain: 1
    });

    // motion trails scale with how fast the image is moving
    var cam = this.camera, mv = this._first ? 0 : cam.position.distanceTo(this._lastCam) / Math.max(dt, 1e-3);
    var rot = this._first ? 0 : 2 * Math.acos(Math.min(1, Math.abs(cam.quaternion.dot(this._lastQ)))) / Math.max(dt, 1e-3);
    this._lastCam.copy(cam.position); this._lastQ.copy(cam.quaternion);
    var k = clamp(mv * 0.0012 + rot * 0.18, 0, 0.45);
    // inside the cloud: everything goes to cloud-white, then darkens to the site's deep space as we punch through
    var white = loc.id === "bridge" ? E.smooth(range(loc.t, 0.28, 0.55)) * 0.94 : 0;
    var wc = this.m.final.uniforms.uWhiteCol.value;
    wc.copy(CLOUD).lerp(SPACE, loc.id === "bridge" ? E.smooth(range(loc.t, 0.55, 0.8)) : 0);
    if (loc.id === "bridge") white = Math.max(white, range(loc.t, 0.55, 0.62));
    this.render(dt, k, white);
    this._ui(loc, meta, ac, p);
    this._first = false;
  };

  Film.prototype.render = function (dt, k, white) {
    var R = this.renderer, rt = this.rt, m = this.m, s = this.size;
    R.setRenderTarget(rt.scene); R.clear(); R.render(this.scene, this.camera);
    // accumulate (frame-rate independent persistence)
    var kk = this._first ? 0 : Math.pow(k, clamp(dt * 60, 0.5, 3));
    m.accum.uniforms.tCur.value = rt.scene.texture; m.accum.uniforms.tPrev.value = rt.b.texture; m.accum.uniforms.uK.value = kk;
    this._pass(m.accum, rt.a);
    var cur = rt.a; rt.a = rt.b; rt.b = cur;               // b now holds this frame
    // bloom: bright pass → quarter-res blur → eighth-res blur
    m.bright.uniforms.tSrc.value = rt.b.texture; this._pass(m.bright, rt.q1);
    m.blur.uniforms.tSrc.value = rt.q1.texture; m.blur.uniforms.uDir.value.set(1 / s.qw, 0); this._pass(m.blur, rt.q2);
    m.blur.uniforms.tSrc.value = rt.q2.texture; m.blur.uniforms.uDir.value.set(0, 1 / s.qh); this._pass(m.blur, rt.q1);
    m.blur.uniforms.tSrc.value = rt.q1.texture; m.blur.uniforms.uDir.value.set(1 / s.ew * 1.6, 0); this._pass(m.blur, rt.e1);
    m.blur.uniforms.tSrc.value = rt.e1.texture; m.blur.uniforms.uDir.value.set(0, 1 / s.eh * 1.6); this._pass(m.blur, rt.e2);
    var f = m.final.uniforms;
    f.tSrc.value = rt.b.texture; f.tB1.value = rt.q1.texture; f.tB2.value = rt.e2.texture;
    f.uTime.value = this.time; f.uWhite.value = white;
    this._pass(m.final, null);
  };

  Film.prototype._ui = function (loc, meta, ac, p) {
    var u = this.ui, t = loc.t, id = loc.id;
    if (this._scene !== id) {
      this._scene = id;
      u.slateN.textContent = "SCENE " + meta.n; u.slateName.textContent = meta.name.toUpperCase();
      u.slate.classList.remove("in"); void u.slate.offsetWidth; u.slate.classList.add("in");
    }
    // title: Scene 01 opening card
    var ti = id === "runway" ? range(t, 0.03, 0.14) * (1 - range(t, 0.42, 0.56)) : 0;
    u.title.style.opacity = ti.toFixed(3);
    u.title.style.transform = "translate3d(0," + ((1 - ti) * 14).toFixed(1) + "px,0)";
    u.title.style.letterSpacing = (0.18 + (1 - ti) * 0.08).toFixed(3) + "em";
    var ki = id === "runway" ? range(t, 0.7, 0.8) : id === "takeoff" ? 1 - range(t, 0.04, 0.12) : id === "bridge" ? range(t, 0.0, 0.1) * (1 - range(t, 0.26, 0.36)) : 0;
    u.kicker.textContent = id === "bridge" ? "Beyond the horizon." : "Cleared for take-off.";
    u.kicker.style.opacity = ki.toFixed(3);
    // callouts during the roll
    var ci = -1;
    if (id === "takeoff") for (var i = 0; i < CALLOUTS.length; i++) if (t >= CALLOUTS[i][0]) ci = i;
    var show = ci >= 0 && t - CALLOUTS[ci][0] < 0.075;
    if (ci !== this._calloutIdx) { this._calloutIdx = ci; if (ci >= 0) { u.callout.textContent = CALLOUTS[ci][1]; u.callout.classList.remove("hit"); void u.callout.offsetWidth; u.callout.classList.add("hit"); } }
    u.callout.style.opacity = show ? 1 : 0;
    // HUD
    var gs = Math.round(groundSpeedKt(loc)), ft = Math.round(ac.pos.y * 3.281);
    u.gs.textContent = "GS " + ("00" + gs).slice(-3) + " KT";
    u.alt.textContent = "ALT " + ("000" + ft).slice(-4) + " FT";
    u.hud.style.opacity = u.slate.style.opacity = (id === "bridge" ? 1 - range(t, 0.2, 0.45) : 1).toFixed(3);
    u.hint.style.opacity = (1 - range(p, 0.0, 0.025)).toFixed(3);
    if (u.skip) u.skip.style.opacity = (id === "bridge" ? 1 - range(t, 0.4, 0.6) : 1).toFixed(3);
    // letterbox closes in at the start and opens up into the site at the end
    var bars = id === "bridge" ? 1 - E.smooth(range(t, 0.4, 0.9)) : 1;
    this.stage.style.setProperty("--bar", bars.toFixed(3));
    if (u.progress) u.progress.style.transform = "scaleX(" + p.toFixed(4) + ")";
  };

  Film.STORYBOARD = STORYBOARD;
  Film.SHOTS = SHOTS;
  Film.aircraftState = aircraftState;
  window.Film = Film;
})();
