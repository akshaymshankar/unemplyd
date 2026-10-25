/* unemplyd. film — the airport at blue hour (Scene 01–02 set).
   Sky dome, fog, wet runway with markings, the full lighting system (edge, centreline, threshold,
   approach + sequenced flashers, PAPI, taxiways), terminal, tower, horizon city glow, ground mist
   and the cloud deck the aircraft climbs into. All procedural; swap-in points are in assets.js.

   World frame: meters, runway centreline on x = 0, take-off toward -Z. */
(function () {
  "use strict";
  var THREE = window.THREE;

  var RWY = { x: 0, z0: 40, z1: -3160, w: 45, shoulder: 7.5 };          // threshold z0, far end z1
  var SUN = new THREE.Vector3(0.32, -0.035, -1).normalize();             // just below the horizon, ahead-right
  var FOG = new THREE.Color(0.026, 0.032, 0.056);

  function canvas(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function srgb(t) { t.encoding = THREE.sRGBEncoding; return t; }

  /* ---------- value-noise fbm on a canvas (tileable) ---------- */
  function hash(x, y, s) { var h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
  function noise(x, y, p, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi % p, yi % p, s), b = hash((xi + 1) % p, yi % p, s), c = hash(xi % p, (yi + 1) % p, s), d = hash((xi + 1) % p, (yi + 1) % p, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(size, period, oct, seed) {
    var out = new Float32Array(size * size);
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      var f = 0, amp = 0.5, fr = 1, n = 0;
      for (var o = 0; o < oct; o++) { f += amp * noise(x / size * period * fr, y / size * period * fr, period * fr, seed + o); n += amp; amp *= 0.5; fr *= 2; }
      out[y * size + x] = f / n;
    }
    return out;
  }

  /* ---------- sky ---------- */
  function sky() {
    var m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSun: { value: SUN }, uFog: { value: FOG }, uTime: { value: 0 }, uLift: { value: 0 } },
      vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }",
      fragmentShader: [
        "uniform vec3 uSun; uniform vec3 uFog; uniform float uTime; uniform float uLift; varying vec3 vDir;",
        "float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }",
        "void main(){",
        "  vec3 d = normalize(vDir); float h = d.y;",
        "  vec3 zen = vec3(0.002,0.004,0.013), mid = vec3(0.012,0.022,0.06), hor = vec3(0.06,0.06,0.095);",
        "  vec3 c = mix(hor, mid, smoothstep(0.0, 0.16, h)); c = mix(c, zen, smoothstep(0.12, 0.75, h));",
        "  vec3 sf = normalize(vec3(uSun.x, 0., uSun.z)); float a = max(dot(normalize(vec3(d.x,0.,d.z)), sf), 0.);",
        "  float band = exp(-max(h + 0.01, 0.) * 9.);",
        "  c += vec3(1.0,0.36,0.12) * pow(a, 6.) * band * 0.55 + vec3(0.7,0.26,0.22) * pow(a, 1.8) * band * 0.08;",
        "  c += vec3(0.1,0.13,0.26) * pow(1. - a, 2.) * band * 0.03;",
        // stars, only high up, fading as the sky brightens toward the sun
        "  vec2 g = vec2(atan(d.z, d.x) * 180., asin(clamp(h,-1.,1.)) * 180.); vec2 gi = floor(g);",
        "  float s = h21(gi); float tw = 0.6 + 0.4 * sin(uTime * 2. + s * 40.);",
        "  float star = step(0.9972, s) * smoothstep(0.22, 0.0, length(fract(g) - 0.5)) * smoothstep(0.12, 0.5, h) * (1. - pow(a, 3.) * 0.8);",
        "  c += vec3(0.75,0.8,1.0) * star * tw * 0.6;",
        // fold into fog colour at and below the horizon so ground and sky meet without a seam
        "  c = mix(c, uFog + vec3(0.2,0.08,0.03) * pow(a, 4.) * 0.3, smoothstep(0.03 + uLift * 0.05, -0.02 - uLift * 0.06, h));",
        "  gl_FragColor = vec4(c, 1.);",
        "}"
      ].join("\n")
    });
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), m);
    mesh.frustumCulled = false; mesh.renderOrder = -10;
    return mesh;
  }

  /* ---------- runway surface ---------- */
  function runwayTexture() {
    var W = 512, H = 2048, c = canvas(W, H), g = c.getContext("2d"), px = W / 60;   // 60 m × 240 m tile
    var n = fbm(256, 16, 4, 3), img = g.createImageData(W, H), d = img.data;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var m = Math.abs(x - W / 2) / px, sh = m > RWY.w / 2;
      var v = n[(y % 256) * 256 + (x % 256)], grain = hash(x, y, 1);
      var base = sh ? 30 : 38, l = base + (v - 0.5) * 22 + (grain - 0.5) * 14;
      // rubber deposits around the touchdown/rollout track
      if (!sh && Math.abs(m - 3.2) < 2.6) l -= 8 * (1 - Math.abs(m - 3.2) / 2.6) * (0.6 + v);
      var i = (y * W + x) * 4; d[i] = l; d[i + 1] = l + 1; d[i + 2] = l + 4; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    var paint = "rgba(214,218,224,.62)";
    g.fillStyle = paint;
    [-1, 1].forEach(function (s) { g.fillRect(W / 2 + s * RWY.w / 2 * px - (s > 0 ? 0.9 * px : 0), 0, 0.9 * px, H); });
    for (var k = 0; k < 4; k++) g.fillRect(W / 2 - 0.45 * px, (k * 60 + 12) * (H / 240), 0.9 * px, 36 * (H / 240));
    // shoulder stripes
    g.fillStyle = "rgba(220,190,90,.22)";
    for (var j = 0; j < 8; j++) [-1, 1].forEach(function (s) { g.save(); g.translate(W / 2 + s * (RWY.w / 2 + 3.8) * px, j * 30 * (H / 240)); g.rotate(s * 0.7); g.fillRect(-0.4 * px, 0, 0.8 * px, 5 * px); g.restore(); });
    var t = srgb(new THREE.CanvasTexture(c)); t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16;
    t.repeat.set(1, (RWY.z0 - RWY.z1) / 240);
    return t;
  }
  function thresholdTexture() {
    var W = 512, H = 1024, c = canvas(W, H), g = c.getContext("2d"), px = W / 60, py = H / 120;   // 60 m × 120 m
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(214,218,224,.66)";
    // threshold "piano keys": 8 stripes per side, 30 m long, starting 6 m in
    var z = function (m) { return H - m * py; };
    for (var i = 0; i < 8; i++) [-1, 1].forEach(function (s) { var x = W / 2 + s * (3 + i * 2.4) * px; g.fillRect(x - 0.9 * px, z(36), 1.8 * px, 30 * py); });
    g.fillRect(W / 2 - RWY.w / 2 * px, z(4), RWY.w * px, 1.6 * py);   // threshold bar
    // designator "27" (each glyph 9 m tall)
    // canvas top = further down the runway, so the numbers read upright from the threshold
    g.save(); g.translate(W / 2, z(52));
    g.font = "700 " + (9 * px * 1.15) + "px 'Inter Display', 'Geist', Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("27", 0, 0); g.restore();
    // touchdown zone bars
    [80, 110].forEach(function (m) { [-1, 1].forEach(function (s) { for (var k = 0; k < 3; k++) g.fillRect(W / 2 + s * (6 + k * 1.8) * px - 0.7 * px, z(m + 22), 1.4 * px, 22 * py); }); });
    var t = srgb(new THREE.CanvasTexture(c)); t.anisotropy = 16; return t;
  }

  /* ---------- light points (one draw call for every fixture) ---------- */
  function LightField() { this.p = []; this.c = []; this.s = []; this.k = []; this.ph = []; }
  LightField.prototype.add = function (x, y, z, col, size, kind, phase) {
    var c = new THREE.Color(col);
    this.p.push(x, y, z); this.c.push(c.r, c.g, c.b); this.s.push(size); this.k.push(kind || 0); this.ph.push(phase || 0);
  };
  LightField.prototype.build = function () {
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute("size", new THREE.Float32BufferAttribute(this.s, 1));
    g.setAttribute("kind", new THREE.Float32BufferAttribute(this.k, 1));
    g.setAttribute("phase", new THREE.Float32BufferAttribute(this.ph, 1));
    var m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPix: { value: 800 }, uFogD: { value: 0.00042 }, uGain: { value: 1 }, uMaxPx: { value: 64 } },
      vertexShader: [
        "attribute vec3 color; attribute float size; attribute float kind; attribute float phase;",
        "uniform float uTime, uPix, uFogD, uGain, uMaxPx; varying vec3 vC; varying float vA;",
        "void main(){",
        "  vec4 mv = modelViewMatrix * vec4(position, 1.); float d = max(-mv.z, 0.1);",
        "  float px = size * uPix / d; float a = 1.;",
        "  if (kind > 0.5 && kind < 1.5) { float f = fract(uTime * 2.1 - phase); a = smoothstep(0.09, 0.0, f) * 3.; }",   // sequenced flashers
        "  if (kind > 1.5 && kind < 2.5) { a = 0.55 + 0.45 * sin(uTime * 1.3 + phase * 6.283); }",                     // far city shimmer
        "  if (kind > 2.5) { a = pow(max(0., sin(uTime * 3.1 + phase * 6.283)), 8.) * 2.; }",                          // obstruction blink
        "  float fog = kind > 1.5 && kind < 2.5 ? 1. : exp(-pow(d * uFogD, 2.));",
        "  float near = kind < 0.5 ? smoothstep(3., 22., d) : 1.;",
        "  vA = a * fog * near * uGain * min(1., px / 2.2);",
        "  vC = color; gl_PointSize = clamp(px * 2.4, 2.2, uMaxPx);",
        "  gl_Position = projectionMatrix * mv;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "varying vec3 vC; varying float vA;",
        "void main(){",
        "  float r = length(gl_PointCoord - 0.5) * 2.; if (r > 1.) discard;",
        "  float core = smoothstep(0.22, 0.0, r), halo = exp(-r * r * 7.) * 0.5 + exp(-r * 3.5) * 0.12;",
        "  gl_FragColor = vec4(vC * (core * 2.6 + halo) * vA, 1.);",
        "}"
      ].join("\n")
    });
    var pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5;
    return pts;
  }

  /* ---------- Airport ---------- */
  function Airport(scene, opts) {
    opts = opts || {};
    var mobile = !!opts.mobile;
    this.scene = scene;
    scene.fog = new THREE.FogExp2(FOG.getHex(), 0.00072);
    scene.background = null;
    this.sky = sky(); scene.add(this.sky);

    var glowTex = window.FilmAircraft.glowTexture();

    // ground
    var gn = fbm(256, 8, 5, 11), gc = canvas(256, 256), gg = gc.getContext("2d"), gi = gg.createImageData(256, 256);
    for (var i = 0; i < 256 * 256; i++) { var v = gn[i]; gi.data[i * 4] = 12 + v * 16; gi.data[i * 4 + 1] = 16 + v * 20; gi.data[i * 4 + 2] = 14 + v * 14; gi.data[i * 4 + 3] = 255; }
    gg.putImageData(gi, 0, 0);
    var gt = srgb(new THREE.CanvasTexture(gc)); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(220, 220);
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(24000, 24000), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.95, metalness: 0, color: 0x2a2f2d, envMapIntensity: 0.1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.z = -2000; scene.add(ground);

    // runway + markings
    var len = RWY.z0 - RWY.z1;
    var rmat = new THREE.MeshStandardMaterial({ map: runwayTexture(), roughness: 0.62, metalness: 0.0, envMapIntensity: 0.1, color: 0x6e7178 });
    var rwy = new THREE.Mesh(new THREE.PlaneGeometry(RWY.w + 2 * RWY.shoulder, len), rmat);
    rwy.rotation.x = -Math.PI / 2; rwy.position.set(0, 0.02, (RWY.z0 + RWY.z1) / 2); scene.add(rwy);
    var thr = new THREE.Mesh(new THREE.PlaneGeometry(60, 120), new THREE.MeshStandardMaterial({ map: thresholdTexture(), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }));
    thr.rotation.x = -Math.PI / 2; thr.position.set(0, 0.03, RWY.z0 - 60); scene.add(thr);
    // blast pad + taxiway + connectors (plain asphalt)
    var asph = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.6 });
    function slab(w, l, x, z, rot) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), asph); m.rotation.x = -Math.PI / 2; m.rotation.z = rot || 0; m.position.set(x, 0.015, z); scene.add(m); }
    slab(23, len + 200, -190, (RWY.z0 + RWY.z1) / 2 - 100);
    [-60, -900, -1900, -2900].forEach(function (z) { slab(23, 168, -105, z, Math.PI / 2); });
    slab(60, 120, 0, RWY.z0 + 60);

    // lights
    var F = new LightField(), W = 0xfff4e2, AMB = 0xffb547, RED = 0xff2b1c, GRN = 0x2bff7a, BLU = 0x3d7bff;
    for (var z = RWY.z0; z >= RWY.z1; z -= 60) {                               // edge lights
      var amber = z < RWY.z1 + 600;
      [-1, 1].forEach(function (s) { F.add(s * (RWY.w / 2 + 1.5), 0.45, z, amber ? AMB : W, 0.42); });
    }
    for (z = RWY.z0 - 7; z >= RWY.z1; z -= 15) {                               // centreline
      var toEnd = z - RWY.z1, col = toEnd < 300 ? RED : toEnd < 900 ? (Math.round(z / 15) % 2 ? RED : W) : W;
      F.add(0.9, 0.08, z, col, 0.26);
    }
    for (var xx = -RWY.w / 2; xx <= RWY.w / 2; xx += 3) { F.add(xx, 0.3, RWY.z0 + 1, GRN, 0.38); F.add(xx, 0.3, RWY.z1 - 1, RED, 0.38); }
    for (z = RWY.z0 - 60; z > RWY.z0 - 900; z -= 30) [-1, 1].forEach(function (s) { for (var k = 0; k < 3; k++) F.add(s * (6 + k * 1.6), 0.08, z, W, 0.2); });   // touchdown zone
    for (var a = 60; a <= 900; a += 30) {                                         // approach lights + sequenced flashers
      var zz = RWY.z0 + a, hy = 0.6 + a * 0.012;
      for (var b = -2; b <= 2; b++) F.add(b * 1.1, hy, zz, W, 0.4);
      if (a === 300) for (var cb = -15; cb <= 15; cb += 1.5) F.add(cb, hy, zz, W, 0.4);
      F.add(0, hy + 0.5, zz, 0xeaf2ff, 1.1, 1, a / 900);
    }
    [0, 1, 2, 3].forEach(function (i) { F.add(-(RWY.w / 2 + 15 + i * 9), 0.9, RWY.z0 - 300, i < 2 ? RED : W, 0.8); });   // PAPI (on slope: 2 red, 2 white)
    for (z = RWY.z0 + 100; z >= RWY.z1 - 100; z -= 45) [-1, 1].forEach(function (s) { F.add(-190 + s * 12.5, 0.4, z, BLU, 0.36); });  // taxiway edges
    for (z = RWY.z0 + 100; z >= RWY.z1 - 100; z -= 18) F.add(-190, 0.06, z, GRN, 0.2);
    [-60, -900, -1900, -2900].forEach(function (zc) { for (var x = -180; x <= -30; x += 12) F.add(x, 0.06, zc, GRN, 0.2); });
    // apron floodlights, terminal, tower
    var apron = [];
    for (var m = 0; m < 9; m++) { var ax = -330 - (m % 3) * 70, az = -380 - Math.floor(m / 3) * 260 - (m % 2) * 40; apron.push([ax, az]); F.add(ax, 28, az, 0xffc27a, 3.4); }
    var TW = { x: -300, z: -760 };
    F.add(TW.x, 66, TW.z, RED, 1.3, 3, 0.1); F.add(-470, 26, -520, RED, 1.0, 3, 0.4); F.add(-470, 26, -1180, RED, 1.0, 3, 0.7);
    // far horizon: a city glowing in sodium and white, a few aviation reds on masts
    for (var q = 0; q < (mobile ? 500 : 1300); q++) {
      var ang = -0.25 + Math.random() * 1.6 - Math.PI / 2, rr = 3200 + Math.random() * 2400;
      var xx2 = Math.cos(ang) * rr + 900, zz2 = Math.sin(ang) * rr - 1600;
      F.add(xx2, 1 + Math.random() * 18, zz2, Math.random() < 0.7 ? 0xffb35c : 0xe8ecff, 1.6 + Math.random() * 3.2, 2, Math.random());
    }
    for (q = 0; q < 14; q++) { var aa = Math.random() * Math.PI * 2, r2 = 2600 + Math.random() * 2600; F.add(Math.cos(aa) * r2, 60 + Math.random() * 120, Math.sin(aa) * r2 - 1600, RED, 3.6, 3, Math.random()); }
    this.lights = F.build(); scene.add(this.lights);

    // wet-tarmac light pools under edge and centreline lights
    var pg = new THREE.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
    var pm = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, fog: true });
    var pools = [], pc = new THREE.Color();
    for (z = RWY.z0; z >= -1800; z -= 60) [-1, 1].forEach(function (s) { pools.push([s * (RWY.w / 2 + 0.3), z, 5, 26, W]); });
    for (z = RWY.z0 - 7; z >= -1500; z -= 15) pools.push([0.9, z, 2.2, 12, W]);
    apron.forEach(function (p) { pools.push([p[0], p[1], 70, 70, 0xffa860]); });
    var pool = new THREE.InstancedMesh(pg, pm, pools.length), mtx = new THREE.Matrix4();
    pools.forEach(function (p, i) { mtx.makeScale(p[2], 1, p[3]); mtx.setPosition(p[0], 0.05, p[1]); pool.setMatrixAt(i, mtx); pool.setColorAt(i, pc.set(p[4])); });
    pool.renderOrder = 4; scene.add(pool); this.pools = pool;

    // terminal, hangars, tower
    var wc = canvas(256, 64), wg = wc.getContext("2d"); wg.fillStyle = "#07080b"; wg.fillRect(0, 0, 256, 64);
    for (var wy = 6; wy < 60; wy += 14) for (var wx = 0; wx < 256; wx += 6) { if (hash(wx, wy, 5) < 0.62) { wg.fillStyle = hash(wx, wy, 9) < 0.8 ? "rgba(255,214,160,.9)" : "rgba(200,225,255,.85)"; wg.fillRect(wx, wy, 4, 7); } }
    var wt = srgb(new THREE.CanvasTexture(wc)); wt.wrapS = THREE.RepeatWrapping; wt.repeat.set(6, 1);
    var term = new THREE.Mesh(new THREE.BoxGeometry(70, 22, 820), [
      new THREE.MeshStandardMaterial({ color: 0x0a0b0e, emissive: 0xffffff, emissiveMap: wt, emissiveIntensity: 0.9, map: wt, roughness: 0.4, metalness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0x0a0b0e }), new THREE.MeshStandardMaterial({ color: 0x15171b }), new THREE.MeshStandardMaterial({ color: 0x0a0b0e }),
      new THREE.MeshStandardMaterial({ color: 0x0a0b0e }), new THREE.MeshStandardMaterial({ color: 0x0a0b0e })
    ]);
    term.position.set(-520, 11, -820); scene.add(term);
    var hang = new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.7 });
    [[360, -420], [380, -620], [350, -1500]].forEach(function (h) { var m = new THREE.Mesh(new THREE.BoxGeometry(90, 28, 110), hang); m.position.set(h[0], 14, h[1]); scene.add(m); });
    var tm = new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.6 });
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.4, 56, 16), tm); shaft.position.set(TW.x, 28, TW.z); scene.add(shaft);
    var cab = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 6.5, 6, 16), new THREE.MeshStandardMaterial({ color: 0x0b1210, emissive: 0x6dffc9, emissiveIntensity: 0.55, roughness: 0.15, metalness: 0.6 }));
    cab.position.set(TW.x, 59, TW.z); scene.add(cab);
    var roof = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.5, 1.4, 16), tm); roof.position.set(TW.x, 62.6, TW.z); scene.add(roof);
    // the rotating airport beacon, green / white
    this.beacon = window.FilmAircraft.glow(0xffffff, 14); this.beacon.position.set(TW.x, 67, TW.z); scene.add(this.beacon);

    // horizon silhouette (trees, low hills) — far, dark, just enough to give the ground an edge
    var hs = new THREE.CylinderGeometry(6200, 6200, 1, 220, 1, true), hp = hs.attributes.position;
    for (i = 0; i < hp.count; i++) { if (hp.getY(i) > 0) { var ang2 = Math.atan2(hp.getZ(i), hp.getX(i)); hp.setY(i, 30 + 90 * noise(ang2 * 9 + 50, 3, 1000, 2) + 160 * Math.pow(noise(ang2 * 2.2 + 50, 7, 1000, 4), 3)); } else hp.setY(i, -5); }
    var hills = new THREE.Mesh(hs, new THREE.MeshBasicMaterial({ color: 0x010206, side: THREE.BackSide, fog: false, transparent: true }));
    hills.position.z = -1600; hills.renderOrder = -5; scene.add(hills); this.hills = hills;

    // ground mist: soft billboards hugging the airfield
    var mc = canvas(256, 128), mg = mc.getContext("2d"), mi = mg.createImageData(256, 128), mn = fbm(256, 6, 5, 21);
    for (var my = 0; my < 128; my++) for (var mx = 0; mx < 256; mx++) {
      var edge = Math.sin(mx / 255 * Math.PI) * Math.pow(Math.sin(my / 127 * Math.PI), 1.6), vv = mn[(my * 2) * 256 + mx];
      var al = Math.max(0, vv - 0.32) * 1.9 * edge, o = (my * 256 + mx) * 4;
      mi.data[o] = 200; mi.data[o + 1] = 210; mi.data[o + 2] = 235; mi.data[o + 3] = Math.min(255, al * 255);
    }
    mg.putImageData(mi, 0, 0);
    var mistTex = new THREE.CanvasTexture(mc);
    this.mist = [];
    var mistN = mobile ? 26 : 60;
    for (i = 0; i < mistN; i++) {
      var sm = new THREE.SpriteMaterial({ map: mistTex, color: 0x34405a, transparent: true, opacity: 0.0, depthWrite: false, fog: true });
      var sp = new THREE.Sprite(sm), w = 90 + Math.random() * 140;
      sp.scale.set(w, w * 0.16, 1);
      sp.position.set((Math.random() - 0.5) * 520, 3 + Math.random() * 6, 200 - Math.random() * 2200);
      sp.userData = { base: 0.08 + Math.random() * 0.1, drift: (Math.random() - 0.5) * 2 };
      scene.add(sp); this.mist.push(sp);
    }

    // cloud deck above the field: billboards the climb-out flies into
    var cc = canvas(256, 256), cg = cc.getContext("2d"), ci = cg.createImageData(256, 256), cn = fbm(256, 5, 6, 31);
    for (var cy = 0; cy < 256; cy++) for (var cx = 0; cx < 256; cx++) {
      var dx = (cx - 128) / 128, dy = (cy - 128) / 128, rr2 = Math.sqrt(dx * dx + dy * dy);
      var dens = Math.max(0, cn[cy * 256 + cx] * 1.35 - 0.25 - rr2 * 0.85), o2 = (cy * 256 + cx) * 4;
      var shade = 0.72 + 0.28 * (1 - (cy / 255));
      ci.data[o2] = 255 * shade; ci.data[o2 + 1] = 255 * shade; ci.data[o2 + 2] = 255 * shade; ci.data[o2 + 3] = Math.min(255, dens * 420);
    }
    cg.putImageData(ci, 0, 0);
    var cloudTex = new THREE.CanvasTexture(cc);
    this.clouds = [];
    var cN = mobile ? 70 : 150;
    for (i = 0; i < cN; i++) {
      var cm = new THREE.SpriteMaterial({ map: cloudTex, color: 0x4a5577, transparent: true, opacity: 0.85, depthWrite: false, fog: false, rotation: Math.random() * 6.28 });
      var cs = new THREE.Sprite(cm), size = 240 + Math.random() * 420;
      cs.scale.set(size, size * 0.62, 1);
      cs.position.set((Math.random() - 0.5) * 2600, 430 + Math.random() * 170, -2600 - Math.random() * 4200);
      cs.userData.col = new THREE.Color().setHSL(0.62 - Math.random() * 0.04, 0.25, 0.22 + Math.random() * 0.1);
      cm.color.copy(cs.userData.col);
      scene.add(cs); this.clouds.push(cs);
    }

    // lights for lit materials: cool sky fill, warm low sun bounce from the horizon
    this.hemi = new THREE.HemisphereLight(0x5a6c9c, 0x0c0d10, 0.55); scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xff9a6a, 0.1); this.sun.position.set(SUN.x * 100, 18, SUN.z * 100); scene.add(this.sun);
    this.apronLight = new THREE.PointLight(0xffb070, 1.2, 900, 1.4); this.apronLight.position.set(-380, 40, -700); scene.add(this.apronLight);
  }

  Airport.prototype.environment = function (renderer) {
    // a reflection probe of the sky so the aircraft and wet runway pick up the horizon glow
    var pm = new THREE.PMREMGenerator(renderer), sc = new THREE.Scene(), s = sky();
    s.material.uniforms.uLift.value = 0.0; sc.add(s);
    var rt = pm.fromScene(sc, 0.02, 1, 10000);
    pm.dispose(); s.geometry.dispose(); s.material.dispose();
    return rt.texture;
  };

  Airport.prototype.update = function (time, dt, camera, pix, o) {
    o = o || {};
    this.sky.position.copy(camera.position);
    this.sky.material.uniforms.uTime.value = time;
    this.sky.material.uniforms.uLift.value = o.lift || 0;
    var u = this.lights.material.uniforms; u.uTime.value = time; u.uPix.value = pix; u.uGain.value = o.lightGain == null ? 1 : o.lightGain;
    // airport beacon alternates green and white
    var bph = (time * 0.5) % 1, on = Math.pow(Math.max(0, Math.sin(bph * Math.PI * 2)), 10);
    this.beacon.material.color.set(Math.floor(time * 0.5 + 0.25) % 2 ? 0x8dffb7 : 0xffffff);
    this.beacon.material.opacity = on;
    var mist = o.mist == null ? 1 : o.mist;
    var cp = camera.position;
    this.mist.forEach(function (m) { m.position.x += m.userData.drift * dt; m.material.opacity = m.userData.base * mist * Math.min(1, Math.max(0, (m.position.distanceTo(cp) - 25) / 110)); });
    this.hills.material.opacity = 1 - Math.min(1, Math.max(0, (cp.y - 70) / 200));
    this.hills.visible = this.hills.material.opacity > 0.01;
    var cl = o.clouds == null ? 1 : o.clouds, glowK = o.cloudGlow || 0;
    this.clouds.forEach(function (c) {
      var d = c.position.distanceTo(camera.position);
      c.material.opacity = cl * 0.85 * Math.min(1, d / 160);       // fade as the camera passes through
      c.material.color.copy(c.userData.col).lerp(_warm, glowK * 0.35);
    });
  };
  var _warm = new THREE.Color(0xd08a7a);

  Airport.RWY = RWY;
  Airport.FOG = FOG;
  window.FilmAirport = Airport;
})();
