/* unemplyd. — World engine (Three.js r149)
   A code-glyph globe, flight arcs, a hub on India, a 12-waypoint route and a procedural jet.
   All motion is driven by `World.target` (set by scroll) and damped every frame. */
(function () {
  "use strict";
  var THREE = window.THREE;
  var D2R = Math.PI / 180;
  var RED = new THREE.Color("#F20A14");

  function ll2v(lat, lon, r) {
    var phi = (90 - lat) * D2R, th = (lon + 180) * D2R;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  }
  function v2ll(v) {
    var n = v.clone().normalize();
    var lat = Math.asin(n.y) / D2R;
    var lon = Math.atan2(n.z, -n.x) / D2R - 180;
    if (lon < -180) lon += 360;
    return [lat, lon];
  }

  /* ---------------- land mask (1024x512, 1 bit per pixel, MSB first) */
  var MASK = (function () {
    var bin = atob(window.LANDMASK), a = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a;
  })();
  function isLand(lat, lon) {
    var x = Math.floor((lon + 180) / 360 * 1024) & 1023;
    var y = Math.min(511, Math.max(0, Math.floor((90 - lat) / 180 * 512)));
    var idx = y * 1024 + x;
    return (MASK[idx >> 3] >> (7 - (idx & 7))) & 1;
  }

  /* ---------------- glyph atlas */
  var GLYPHS = "01{};</>";
  function glyphAtlas() {
    var c = document.createElement("canvas"); c.width = 512; c.height = 64;
    var g = c.getContext("2d");
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "700 50px 'JetBrains Mono', ui-monospace, monospace";
    for (var i = 0; i < 8; i++) g.fillText(GLYPHS[i], i * 64 + 32, 34);
    var t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.LinearMipMapLinearFilter; t.generateMipmaps = true;
    return t;
  }

  /* ---------------- shaders */
  var POINT_VS = [
    "attribute float aGlyph; attribute float aRnd;",
    "uniform float uTime, uSize, uPR, uActiveCos, uActiveAmt, uHubCos;",
    "uniform vec3 uActiveDir, uHubDir;",
    "varying float vAlpha, vGlyph, vSize, vActive, vHub;",
    "void main(){",
    "  vec3 n = normalize(position);",
    "  vec4 mv = modelViewMatrix * vec4(position,1.0);",
    "  vec3 nv = normalize(normalMatrix * n);",
    "  float facing = smoothstep(-0.05, 0.45, nv.z);",
    "  vActive = smoothstep(uActiveCos - 0.06, uActiveCos + 0.02, dot(n, uActiveDir)) * uActiveAmt;",
    "  vHub = smoothstep(uHubCos - 0.02, uHubCos + 0.01, dot(n, uHubDir));",
    "  float tw = 0.65 + 0.35 * sin(uTime * (0.6 + aRnd * 1.6) + aRnd * 40.0);",
    "  vAlpha = facing * tw;",
    "  vGlyph = aGlyph;",
    "  float s = uSize * (1.0 + vActive * 0.9 + vHub * 0.6) * uPR * (6.0 / -mv.z);",
    "  vSize = s; gl_PointSize = s;",
    "  gl_Position = projectionMatrix * mv;",
    "}"
  ].join("\n");
  var POINT_FS = [
    "uniform sampler2D uAtlas; uniform vec3 uColor, uActiveCol; uniform float uOpacity;",
    "varying float vAlpha, vGlyph, vSize, vActive, vHub;",
    "void main(){",
    "  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);",
    "  float a;",
    "  if (vSize < 7.0) { float d = length(gl_PointCoord - 0.5); a = 1.0 - smoothstep(0.32, 0.5, d); }",
    "  else { a = texture2D(uAtlas, vec2((vGlyph + uv.x) / 8.0, uv.y)).a; }",
    "  vec3 col = mix(uColor, uActiveCol, vActive);",
    "  col = mix(col, vec3(0.95, 0.04, 0.08), vHub * 0.85);",
    "  float al = a * vAlpha * uOpacity * (0.55 + vActive * 0.45 + vHub * 0.4);",
    "  if (al < 0.02) discard;",
    "  gl_FragColor = vec4(col, al);",
    "}"
  ].join("\n");

  var ARC_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }";
  var ARC_FS = [
    "uniform float uTime, uDraw, uOpacity, uPhase, uSpeed, uBase, uPacket; uniform vec3 uColor;",
    "varying vec2 vUv;",
    "void main(){",
    "  float t = vUv.x;",
    "  if (t > uDraw) discard;",
    "  float head = smoothstep(uDraw - 0.04, uDraw, t) * step(uDraw, 0.999);",
    "  float p = fract(uTime * uSpeed + uPhase);",
    "  float d = t - p;",
    "  float pk = exp(-d * d * 1400.0) * uPacket;",
    "  float a = (uBase + pk * 1.6 + head * 1.2) * uOpacity;",
    "  vec3 c = mix(uColor, vec3(1.0), clamp(pk * 0.7 + head * 0.5, 0.0, 1.0));",
    "  gl_FragColor = vec4(c, a);",
    "}"
  ].join("\n");

  var RING_FS = [
    "uniform float uTime, uOpacity; varying vec2 vUv;",
    "void main(){",
    "  float r = length(vUv - 0.5) * 2.0;",
    "  float rings = 0.0;",
    "  for (int i = 0; i < 3; i++) { float k = fract(uTime * 0.45 + float(i) / 3.0); rings += smoothstep(0.035, 0.0, abs(r - k)) * (1.0 - k); }",
    "  float core = smoothstep(0.16, 0.0, r);",
    "  float a = (rings * 0.9 + core) * uOpacity * step(r, 1.0);",
    "  gl_FragColor = vec4(mix(vec3(0.95,0.04,0.08), vec3(1.0,0.75,0.75), core * 0.6), a);",
    "}"
  ].join("\n");
  var BEAM_FS = [
    "uniform float uTime, uOpacity; varying vec2 vUv;",
    "void main(){",
    "  float a = pow(1.0 - vUv.y, 2.2) * (0.75 + 0.25 * sin(uTime * 3.0)) * uOpacity;",
    "  gl_FragColor = vec4(0.95, 0.06, 0.1, a);",
    "}"
  ].join("\n");
  var ATMO_VS = "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }";
  var ATMO_FS = "uniform float uOpacity; varying vec3 vN; void main(){ float i = pow(max(0.0, 0.66 - dot(vN, vec3(0.0,0.0,1.0))), 4.0) * 1.6; gl_FragColor = vec4(vec3(0.52,0.6,0.85) * i, i * uOpacity * 0.85); }";
  var BASE_FS = "varying vec3 vN; void main(){ float f = pow(1.0 - max(dot(vN, vec3(0.0,0.0,1.0)), 0.0), 2.4); gl_FragColor = vec4(vec3(0.028,0.034,0.048) + vec3(0.10,0.13,0.2) * f, 1.0); }";

  /* ---------------- data */
  var HUB = { name: "India", lat: 20.6, lon: 78.9 };
  var CITIES = [
    [37.77, -122.42], [40.71, -74.0], [43.65, -79.38], [51.5, -0.12], [52.52, 13.4], [48.85, 2.35], [59.33, 18.06],
    [35.68, 139.69], [37.56, 126.97], [1.35, 103.82], [22.32, 114.17], [-33.87, 151.21], [25.2, 55.27], [-23.55, -46.63],
    [-1.29, 36.82], [6.52, 3.37], [-26.2, 28.04], [64.13, -21.9], [19.43, -99.13], [31.23, 121.47]
  ];
  var EXTRA = [[0, 3], [3, 1], [7, 0], [9, 11], [13, 5], [18, 1], [16, 15], [4, 6], [8, 19], [12, 3]];

  var REGIONS = [
    { key: "india", lat: 21, lon: 79, cos: 0.94, col: "#FF5A4F" },
    { key: "na", lat: 41, lon: -98, cos: 0.86, col: "#7FE0FF" },
    { key: "eu", lat: 50, lon: 12, cos: 0.93, col: "#9CFFB0" },
    { key: "ea", lat: 33, lon: 115, cos: 0.92, col: "#FF8AE6" },
    { key: "sa", lat: -14, lon: -60, cos: 0.88, col: "#C6A2FF" },
    { key: "af", lat: 3, lon: 20, cos: 0.86, col: "#FFB35C" },
    { key: "arctic", lat: 66, lon: 25, cos: 0.9, col: "#A9C8FF" },
    { key: "ocean", lat: -8, lon: -150, cos: 0.75, col: "#FF6B63" }
  ];

  // 12 waypoints around the world, starting and ending near the hub
  var ROUTE = [
    [12.97, 77.59], [28.6, 77.2], [41.0, 28.97], [50.1, 8.68], [51.5, -0.12], [40.71, -74.0],
    [37.77, -122.42], [21.3, -157.8], [35.68, 139.69], [22.32, 114.17], [1.35, 103.82], [19.07, 72.88]
  ];

  /* ---------------- builder */
  function World(canvas, opts) {
    this.canvas = canvas;
    this.mobile = !!opts.mobile;
    this.reduce = !!opts.reduce;
    this.target = {
      gx: 0.95, gy: -0.02, scale: 1, camZ: 5.2, yaw: 0, tilt: 0.3, faceLat: HUB.lat, faceLon: HUB.lon,
      spin: 0, dots: 1, arcs: 1, arcDraw: 1, route: 0, routeDraw: 0, active: 0, activeIdx: 0,
      hub: 1, atmo: 1, plane: "park", planeT: 1, preflight: 6, burst: 0, takeoff: 0, runway: 0
    };
    this.cur = JSON.parse(JSON.stringify(this.target));
    this.tourT = 0;
    this.time = 0;
    this._build();
  }

  World.prototype._build = function () {
    var r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    r.setClearColor(0x06070a, 1);
    this.pr = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 1.75);
    r.setPixelRatio(this.pr);
    r.outputEncoding = THREE.sRGBEncoding;

    var scene = this.scene = new THREE.Scene();
    var cam = this.camera = new THREE.PerspectiveCamera(34, 1, 0.05, 200);
    cam.position.set(0, 0, 5.2);

    // stars
    var sN = this.mobile ? 900 : 2200, sp = new Float32Array(sN * 3), sr = new Float32Array(sN);
    for (var i = 0; i < sN; i++) {
      var u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, rr = 30 + Math.random() * 40, q = Math.sqrt(1 - u * u);
      sp[i * 3] = q * Math.cos(a) * rr; sp[i * 3 + 1] = u * rr; sp[i * 3 + 2] = q * Math.sin(a) * rr; sr[i] = Math.random();
    }
    var sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); sg.setAttribute("aRnd", new THREE.BufferAttribute(sr, 1));
    this.starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: this.pr } },
      vertexShader: "attribute float aRnd; uniform float uTime, uPR; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vA = 0.25 + 0.5*abs(sin(uTime*0.4 + aRnd*30.0)); gl_PointSize = (0.8 + aRnd*1.6)*uPR; gl_Position = projectionMatrix*mv; }",
      fragmentShader: "varying float vA; void main(){ float d = length(gl_PointCoord-0.5); gl_FragColor = vec4(0.85,0.9,1.0, vA*(1.0-smoothstep(0.2,0.5,d))); }",
      transparent: true, depthWrite: false
    });
    scene.add(new THREE.Points(sg, this.starMat));

    // rig
    var rig = this.rig = new THREE.Group(); scene.add(rig);
    var globe = this.globe = new THREE.Group(); rig.add(globe);

    // base sphere (occluder + subtle fresnel)
    var base = new THREE.Mesh(new THREE.SphereGeometry(0.985, 64, 48), new THREE.ShaderMaterial({ vertexShader: ATMO_VS, fragmentShader: BASE_FS }));
    globe.add(base);

    // atmosphere
    this.atmoMat = new THREE.ShaderMaterial({ uniforms: { uOpacity: { value: 1 } }, vertexShader: ATMO_VS, fragmentShader: ATMO_FS, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    var atmo = new THREE.Mesh(new THREE.SphereGeometry(1.1, 64, 48), this.atmoMat);
    rig.add(atmo);

    // points: land glyphs + ocean grid
    var N = this.mobile ? 42000 : 90000, golden = Math.PI * (3 - Math.sqrt(5));
    var lp = [], lg = [], lr = [], op = [], orr = [];
    for (i = 0; i < N; i++) {
      var y = 1 - 2 * (i + 0.5) / N, rad = Math.sqrt(1 - y * y), ph = i * golden;
      var x = Math.cos(ph) * rad, z = Math.sin(ph) * rad;
      var ll = v2ll(new THREE.Vector3(x, y, z));
      if (isLand(ll[0], ll[1])) { lp.push(x, y, z); lg.push(Math.floor(Math.random() * 8)); lr.push(Math.random()); }
      else if (i % (this.mobile ? 5 : 7) === 0) { op.push(x * 1.0, y * 1.0, z * 1.0); orr.push(Math.random()); }
    }
    this.atlas = glyphAtlas();
    var common = function (size, color, opacity) {
      return {
        uTime: { value: 0 }, uSize: { value: size }, uPR: { value: 1 }, uAtlas: { value: null }, uColor: { value: new THREE.Color(color) },
        uActiveCol: { value: new THREE.Color("#ffffff") }, uActiveDir: { value: new THREE.Vector3(0, 0, 1) }, uActiveCos: { value: 2 }, uActiveAmt: { value: 0 },
        uHubDir: { value: ll2v(HUB.lat, HUB.lon, 1) }, uHubCos: { value: 0.9985 }, uOpacity: { value: opacity }
      };
    };
    var landGeo = new THREE.BufferGeometry();
    landGeo.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
    landGeo.setAttribute("aGlyph", new THREE.Float32BufferAttribute(lg, 1));
    landGeo.setAttribute("aRnd", new THREE.Float32BufferAttribute(lr, 1));
    this.landMat = new THREE.ShaderMaterial({ uniforms: common(this.mobile ? 2.1 : 2.3, "#B9CCFF", 1), vertexShader: POINT_VS, fragmentShader: POINT_FS, transparent: true, depthWrite: false });
    this.landMat.uniforms.uAtlas.value = this.atlas;
    globe.add(new THREE.Points(landGeo, this.landMat));
    this.landCount = lp.length / 3;

    var oceanGeo = new THREE.BufferGeometry();
    oceanGeo.setAttribute("position", new THREE.Float32BufferAttribute(op, 3));
    oceanGeo.setAttribute("aGlyph", new THREE.Float32BufferAttribute(new Array(op.length / 3).fill(0), 1));
    oceanGeo.setAttribute("aRnd", new THREE.Float32BufferAttribute(orr, 1));
    this.oceanMat = new THREE.ShaderMaterial({ uniforms: common(1.1, "#3F5F9E", 0.55), vertexShader: POINT_VS, fragmentShader: POINT_FS, transparent: true, depthWrite: false });
    this.oceanMat.uniforms.uAtlas.value = this.atlas;
    globe.add(new THREE.Points(oceanGeo, this.oceanMat));

    // hub
    var hubN = this.hubN = ll2v(HUB.lat, HUB.lon, 1);
    this.ringMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } }, vertexShader: ARC_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    var ring = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), this.ringMat);
    ring.position.copy(hubN.clone().multiplyScalar(1.004)); ring.lookAt(hubN.clone().multiplyScalar(2));
    globe.add(ring);
    this.beamMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } }, vertexShader: ARC_VS, fragmentShader: BEAM_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    var beamG = new THREE.CylinderGeometry(0.0035, 0.0035, 0.55, 8, 1, true); beamG.translate(0, 0.275, 0);
    var beam = new THREE.Mesh(beamG, this.beamMat);
    beam.position.copy(hubN); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hubN);
    globe.add(beam);

    // runway: a strip laid along the take-off great circle through the hub (storyboard 01B / 03)
    var tang = new THREE.Vector3(0, 1, 0).cross(hubN).normalize();
    var east0 = tang.clone(), head0 = east0.clone().applyAxisAngle(hubN, 0.35), gcA = this._gcAxis = hubN.clone().cross(head0).normalize();
    var rwPos = [], rwIdx = [], lights = [], lcol = [], dash = [], RW = 0.016, NA = 60, a0 = -0.06, a1 = 0.26;
    for (i = 0; i <= NA; i++) {
      var ang = a0 + (a1 - a0) * i / NA, c = hubN.clone().applyAxisAngle(gcA, ang), sd = c.clone().cross(gcA.clone().cross(c)).normalize().cross(c).normalize();
      sd = gcA.clone(); // across-track direction = rotation axis (perpendicular to travel)
      var L = c.clone().multiplyScalar(1.0035).add(sd.clone().multiplyScalar(RW)), R = c.clone().multiplyScalar(1.0035).add(sd.clone().multiplyScalar(-RW));
      rwPos.push(L.x, L.y, L.z, R.x, R.y, R.z);
      if (i < NA) { var k2 = i * 2; rwIdx.push(k2, k2 + 1, k2 + 2, k2 + 1, k2 + 3, k2 + 2); }
      if (i % 2 === 0) {
        [1.15, -1.15].forEach(function (f) { var q = c.clone().multiplyScalar(1.005).add(sd.clone().multiplyScalar(RW * f)); lights.push(q.x, q.y, q.z); var end = i < 4 || i > NA - 4; lcol.push(1, end ? 0.15 : 0.93, end ? 0.15 : 0.8); });
      }
      if (i % 3 === 0) { var d = c.clone().multiplyScalar(1.0045); dash.push(d.x, d.y, d.z); }
    }
    var rwG = new THREE.BufferGeometry(); rwG.setAttribute("position", new THREE.Float32BufferAttribute(rwPos, 3)); rwG.setIndex(rwIdx);
    this.rwMat = new THREE.MeshBasicMaterial({ color: 0x0c0e13, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    globe.add(new THREE.Mesh(rwG, this.rwMat));
    var lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lights, 3)); lg.setAttribute("color", new THREE.Float32BufferAttribute(lcol, 3));
    this.runwayMat = new THREE.PointsMaterial({ vertexColors: true, size: 0.012, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    globe.add(new THREE.Points(lg, this.runwayMat));
    var dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.Float32BufferAttribute(dash, 3));
    this.dashMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.006, transparent: true, opacity: 0, depthWrite: false });
    globe.add(new THREE.Points(dg, this.dashMat));
    this.runwayTangent = tang;

    // arcs
    this.arcs = [];
    var self = this;
    function addArc(a, b, color, base, speed, radius) {
      var A = ll2v(a[0], a[1], 1.0), B = ll2v(b[0], b[1], 1.0);
      var ang = A.angleTo(B), lift = 1 + Math.min(0.55, 0.12 + ang * 0.22);
      var c1 = A.clone().lerp(B, 0.25).normalize().multiplyScalar(lift);
      var c2 = A.clone().lerp(B, 0.75).normalize().multiplyScalar(lift);
      var curve = new THREE.CubicBezierCurve3(A.clone().multiplyScalar(1.002), c1, c2, B.clone().multiplyScalar(1.002));
      var mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uDraw: { value: 1 }, uOpacity: { value: 1 }, uPhase: { value: Math.random() }, uSpeed: { value: speed }, uBase: { value: base }, uPacket: { value: 1 }, uColor: { value: new THREE.Color(color) } },
        vertexShader: ARC_VS, fragmentShader: ARC_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      var m = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, radius, 5, false), mat);
      globe.add(m); self.arcs.push(mat); return mat;
    }
    CITIES.forEach(function (c, k) { addArc([HUB.lat, HUB.lon], c, "#F20A14", 0.28, 0.12 + (k % 5) * 0.03, 0.0032); });
    EXTRA.forEach(function (p) { addArc(CITIES[p[0]], CITIES[p[1]], "#FF6C66", 0.12, 0.08, 0.0022); });

    // route (12 waypoints) + two branches
    var rpts = ROUTE.map(function (p) { return ll2v(p[0], p[1], 1.018); });
    var full = [];
    for (i = 0; i < rpts.length - 1; i++) {
      var a0 = rpts[i], b0 = rpts[i + 1], an = a0.angleTo(b0), steps = Math.max(6, Math.round(an * 30));
      for (var s = 0; s < steps; s++) {
        var t = s / steps, v = a0.clone().normalize().lerp(b0.clone().normalize(), t).normalize();
        var h = 1.018 + Math.sin(t * Math.PI) * Math.min(0.16, an * 0.09);
        full.push(v.multiplyScalar(h));
      }
    }
    full.push(rpts[rpts.length - 1].clone());
    this.routeCurve = new THREE.CatmullRomCurve3(full, false, "centripetal");
    this.routeMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uDraw: { value: 0 }, uOpacity: { value: 0 }, uPhase: { value: 0 }, uSpeed: { value: 0.0 }, uBase: { value: 0.95 }, uPacket: { value: 0 }, uColor: { value: new THREE.Color("#F20A14") } },
      vertexShader: ARC_VS, fragmentShader: ARC_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    globe.add(new THREE.Mesh(new THREE.TubeGeometry(this.routeCurve, 420, 0.0055, 6, false), this.routeMat));
    // waypoint markers
    this.wpMats = []; this.wpT = [];
    var totalLen = this.routeCurve.getLength();
    rpts.forEach(function (p, k) {
      var mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
      var m = new THREE.Mesh(new THREE.SphereGeometry(k === 5 || k === 10 ? 0.016 : 0.011, 12, 10), mat);
      m.position.copy(p); globe.add(m); self.wpMats.push(mat);
    });
    // waypoint parametric positions along curve
    var samples = 600, best = rpts.map(function () { return { d: 1e9, t: 0 }; });
    for (i = 0; i <= samples; i++) {
      var tt = i / samples, pt = this.routeCurve.getPointAt(tt);
      rpts.forEach(function (p, k) { var d = pt.distanceTo(p); if (d < best[k].d) best[k] = { d: d, t: tt }; });
    }
    this.wpT = best.map(function (b) { return b.t; });
    this.wpT[0] = 0; this.wpT[11] = 1;
    // branches: experience 3->6, opportunity 8->11 (1-based steps → indices 2->5, 7->10)
    this.branchMats = [];
    [[2, 5], [7, 10]].forEach(function (pr) {
      var A = rpts[pr[0]], B = rpts[pr[1]];
      var mid = A.clone().add(B).normalize().multiplyScalar(1.0 + Math.min(0.5, A.angleTo(B) * 0.35));
      var curve = new THREE.QuadraticBezierCurve3(A, mid, B);
      var mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uDraw: { value: 0 }, uOpacity: { value: 0 }, uPhase: { value: 0 }, uSpeed: { value: 0.25 }, uBase: { value: 0.55 }, uPacket: { value: 1 }, uColor: { value: new THREE.Color("#FFFFFF") } },
        vertexShader: ARC_VS, fragmentShader: ARC_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      globe.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.0028, 5, false), mat));
      self.branchMats.push({ mat: mat, t0: self.wpT[pr[0]], t1: self.wpT[pr[1]] });
    });

    // region pillars (data columns that rise in the active region)
    this.regionCols = [];
    REGIONS.forEach(function (R, k) {
      var grp = new THREE.Group(); var center = ll2v(R.lat, R.lon, 1);
      var mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(R.col), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      var count = 0, tries = 0;
      while (count < 26 && tries < 2000) {
        tries++;
        var la = R.lat + (Math.random() - 0.5) * 26, lo = R.lon + (Math.random() - 0.5) * 34;
        if (R.key !== "ocean" && !isLand(la, lo)) continue;
        var p = ll2v(la, lo, 1);
        if (p.dot(center) < R.cos) continue;
        var hgt = 0.02 + Math.random() * (R.key === "na" || R.key === "ea" || R.key === "arctic" ? 0.16 : 0.07);
        var g = new THREE.BoxGeometry(0.008, hgt, 0.008); g.translate(0, hgt / 2, 0);
        var m = new THREE.Mesh(g, mat);
        m.position.copy(p); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
        m.scale.y = 0.001; m.userData.h = 1;
        grp.add(m); count++;
      }
      globe.add(grp); self.regionCols.push({ grp: grp, mat: mat });
    });

    // lights for the plane
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(3, 4, 5); scene.add(key);
    var rim = new THREE.DirectionalLight(0x9fb4ff, 0.7); rim.position.set(-4, -1, -3); scene.add(rim);

    this._buildPlane();
    this.resize();
  };

  World.prototype._buildPlane = function () {
    // Twin-engine airliner after the storyboard turnaround (3D-01): soft white shell,
    // fine white wireframe, red fin, cabin windows, glowing nav / strobe / landing lights.
    var P = this.plane = new THREE.Group();
    var white = new THREE.MeshStandardMaterial({ color: 0xf2f3f6, roughness: 0.32, metalness: 0.18, emissive: 0x0b0c0f });
    var red = new THREE.MeshStandardMaterial({ color: 0xf20a14, roughness: 0.38, metalness: 0.15, emissive: 0x2a0000 });
    var glass = new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.1, metalness: 0.8, emissive: 0x000000 });
    var engineM = new THREE.MeshStandardMaterial({ color: 0xd9dce2, roughness: 0.25, metalness: 0.45, emissive: 0x000000 });
    var dark = new THREE.MeshBasicMaterial({ color: 0x07080b });
    this.planeParts = { cockpit: glass, engines: engineM, wings: white, tail: red };
    var V2 = THREE.Vector2;
    function lathe(pts, seg, mat) { var g = new THREE.LatheGeometry(pts.map(function (p) { return new V2(p[0], p[1]); }), seg); g.rotateX(Math.PI / 2); return new THREE.Mesh(g, mat); }
    // fuselage: tail cone → cabin barrel → rounded nose (axis = +z nose)
    var body = lathe([[0, -0.215], [0.006, -0.212], [0.013, -0.195], [0.021, -0.16], [0.027, -0.11], [0.0285, -0.07], [0.0285, 0.12], [0.0275, 0.15], [0.024, 0.175], [0.017, 0.195], [0.009, 0.208], [0, 0.213]], 32, white);
    body.scale.set(1, 1.06, 1); body.position.y = 0.0; P.add(body);
    // cockpit glass band
    var ck = new THREE.Mesh(new THREE.SphereGeometry(0.0262, 24, 12, -0.95, 1.9, 0.95, 0.42), glass);
    ck.rotation.x = Math.PI / 2; ck.position.set(0, 0.002, 0.168); ck.scale.set(1, 1, 1.15); P.add(ck);
    // cabin windows (both sides)
    var wg = new THREE.BoxGeometry(0.0012, 0.0034, 0.0032), wN = 26, win = new THREE.InstancedMesh(wg, dark, wN * 2), M = new THREE.Matrix4();
    for (var i = 0; i < wN; i++) { var z = -0.1 + i * 0.0085; M.makeTranslation(0.0287, 0.009, z); win.setMatrixAt(i * 2, M); M.makeTranslation(-0.0287, 0.009, z); win.setMatrixAt(i * 2 + 1, M); }
    P.add(win);
    // tapered, swept wing with a winglet
    function wing(o) {
      var s = new THREE.Shape();
      s.moveTo(0, 0); s.lineTo(o.span, -o.sweep); s.lineTo(o.span, -o.sweep - o.tip); s.lineTo(0, -o.root); s.lineTo(0, 0);
      var g = new THREE.ExtrudeGeometry(s, { depth: o.t, bevelEnabled: true, bevelThickness: o.t * 0.4, bevelSize: o.t * 0.3, bevelSegments: 1 });
      g.rotateX(Math.PI / 2); g.translate(0, o.y, o.z);
      var out = [];
      [1, -1].forEach(function (sx) {
        var gg = g.clone(); if (sx < 0) { gg.scale(-1, 1, 1); }
        var m = new THREE.Mesh(gg, o.mat); m.rotation.z = sx * (o.dihedral || 0); out.push(m);
        if (o.winglet) {
          var ws = new THREE.Shape(); ws.moveTo(0, 0); ws.lineTo(-0.012, 0.024); ws.lineTo(-0.02, 0.024); ws.lineTo(-o.tip, 0); ws.lineTo(0, 0);
          var wgeo = new THREE.ExtrudeGeometry(ws, { depth: 0.0018, bevelEnabled: false }); wgeo.rotateY(-Math.PI / 2);
          var wm = new THREE.Mesh(wgeo, o.wingletMat || o.mat); wm.position.set(sx * o.span, o.y + Math.sin(o.dihedral || 0) * o.span * sx * sx, o.z - o.sweep); m.add(wm);
          wm.position.set(sx * o.span, o.y, o.z - o.sweep); wm.rotation.z = -sx * 0.18;
        }
      });
      return out;
    }
    wing({ span: 0.225, root: 0.095, tip: 0.024, sweep: 0.085, y: -0.012, z: 0.06, t: 0.0045, mat: white, dihedral: 0.07, winglet: true, wingletMat: red }).forEach(function (m) { P.add(m); });
    wing({ span: 0.078, root: 0.045, tip: 0.017, sweep: 0.036, y: 0.006, z: -0.158, t: 0.003, mat: white, dihedral: 0.05 }).forEach(function (m) { P.add(m); });
    // vertical fin (red), swept
    var fs = new THREE.Shape(); fs.moveTo(0, 0); fs.lineTo(-0.062, 0.088); fs.lineTo(-0.088, 0.088); fs.lineTo(-0.085, 0); fs.lineTo(0, 0);
    var fg = new THREE.ExtrudeGeometry(fs, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 1 });
    fg.rotateY(-Math.PI / 2); fg.translate(0.002, 0.018, -0.118); P.add(new THREE.Mesh(fg, red));
    // engines: nacelle + dark intake + pylon
    var self = this; this.engGlow = [];
    [-0.078, 0.078].forEach(function (x) {
      var n = lathe([[0.0125, -0.035], [0.0148, -0.02], [0.0158, 0.01], [0.0152, 0.028], [0.0138, 0.034]], 24, engineM);
      n.position.set(x, -0.03, 0.058); P.add(n);
      var intake = new THREE.Mesh(new THREE.CircleGeometry(0.0128, 24), dark); intake.position.set(x, -0.03, 0.0925); P.add(intake);
      var py = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.016, 0.04), white); py.position.set(x, -0.018, 0.05); P.add(py);
    });
    // wireframe overlay: the storyboard's white edge lines
    var edgesMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
    P.children.slice().forEach(function (m) {
      if (!m.geometry || m.isInstancedMesh) return;
      var e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), edgesMat);
      e.position.copy(m.position); e.rotation.copy(m.rotation); e.scale.copy(m.scale); P.add(e);
    });
    // glowing lights as additive sprites
    var cv = document.createElement("canvas"); cv.width = cv.height = 64; var g2 = cv.getContext("2d");
    var gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    var glowTex = new THREE.CanvasTexture(cv);
    function glow(col, size) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); return s; }
    this.navL = glow(0xff2a2a, 0.05); this.navR = glow(0x35ff7a, 0.05);
    this.navL.position.set(-0.226, -0.004, -0.03); this.navR.position.set(0.226, -0.004, -0.03);
    this.strobe = glow(0xffffff, 0.07); this.strobe.position.set(0, 0.108, -0.205);
    this.landing = glow(0xfff4dc, 0.09); this.landing.position.set(0, -0.02, 0.2);
    P.add(this.navL, this.navR, this.landing);
    P.add(this.strobe);
    this.planeScale = 0.4;
    P.scale.setScalar(this.planeScale);
    this.globe.add(P);
    this._baseQ = new THREE.Quaternion(); this.roll = 0; this.planeOn = false;
    // contrail: a camera-facing glowing beam (bright core, soft halo) that follows the jet
    var TN = this.trailN = 90, tg = new THREE.BufferGeometry(), idx = [];
    this.trailPos = new Float32Array(TN * 12); this.trailCol = new Float32Array(TN * 12); this.trailPts = [];
    for (var i = 0; i < TN - 1; i++) { var k = i * 4, n = k + 4; for (var c = 0; c < 3; c++) idx.push(k + c, k + c + 1, n + c, k + c + 1, n + c + 1, n + c); }
    tg.setIndex(idx);
    tg.setAttribute("position", new THREE.BufferAttribute(this.trailPos, 3));
    tg.setAttribute("color", new THREE.BufferAttribute(this.trailCol, 3));
    this.trail = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.trail.frustumCulled = false;
    this.globe.add(this.trail);
  };

  World.prototype.resize = function () {
    var w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.landMat.uniforms.uPR.value = this.pr * (h / 900);
    this.oceanMat.uniforms.uPR.value = this.pr * (h / 900);
    this.mobile = w < 768;
  };

  /* plane pose helpers (globe-local) */
  World.prototype._poseOnGreatCircle = function (angle, alt, out) {
    // great circle through hub, heading east-north-east
    if (!this._gcAxis) {
      var east = new THREE.Vector3(0, 1, 0).cross(this.hubN).normalize();
      var head = east.clone().applyAxisAngle(this.hubN, 0.35);
      this._gcAxis = this.hubN.clone().cross(head).normalize();
    }
    var p = this.hubN.clone().applyAxisAngle(this._gcAxis, angle).multiplyScalar(alt);
    var p2 = this.hubN.clone().applyAxisAngle(this._gcAxis, angle + 0.01).multiplyScalar(alt);
    out.pos.copy(p); out.fwd.copy(p2.sub(p).normalize()); out.up.copy(p.clone().normalize());
  };
  function lookQuat(fwd, up) {
    var z = fwd.clone().normalize(), x = up.clone().cross(z).normalize(), y = z.clone().cross(x);
    var m = new THREE.Matrix4().makeBasis(x, y, z);
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }

  World.prototype.planePose = function (mode, t) {
    var o = { pos: new THREE.Vector3(), fwd: new THREE.Vector3(), up: new THREE.Vector3(), scale: 0.4, bank: 0 };
    var A = 0.75;
    if (mode === "approach") {           // t 0→1 lands on hub
      var e = 1 - Math.pow(1 - t, 2.2);
      var alt = 1.012 + 0.9 * Math.pow(1 - e, 2);
      this._poseOnGreatCircle(-A * (1 - e), alt, o);
      o.scale = 0.4 + 0.25 * (1 - e); o.bank = 0.35 * (1 - e) * Math.sin(e * 6);
    } else if (mode === "park") {
      this._poseOnGreatCircle(0, 1.012, o); o.scale = 0.4;
    } else if (mode === "runway") {     // t 0→1: parked → roll → rotate → climb out (hero scroll)
      var roll = Math.min(1, t / 0.55), climb = Math.max(0, (t - 0.45) / 0.55);
      var ang = 0.2 * roll * roll + 0.35 * climb;
      this._poseOnGreatCircle(ang, 1.009 + 0.55 * climb * climb, o);
      o.fwd.add(o.up.clone().multiplyScalar(0.55 * Math.min(1, climb * 3))).normalize();
      o.scale = 0.62;
    } else if (mode === "takeoff") {     // t 0→1 climbs away
      var alt2 = 1.012 + 1.6 * t * t;
      this._poseOnGreatCircle(A * t, alt2, o); o.scale = 0.4 + t * 0.9;
      o.fwd.add(o.up.clone().multiplyScalar(0.6 * t)).normalize();
    } else if (mode === "tour") {
      var n = REGIONS.length, f = Math.max(0, Math.min(n - 1, t)), i0 = Math.floor(f), i1 = Math.min(n - 1, i0 + 1), k = f - i0;
      var d0 = ll2v(REGIONS[i0].lat, REGIONS[i0].lon, 1), d1 = ll2v(REGIONS[i1].lat, REGIONS[i1].lon, 1);
      var dir = d0.clone().lerp(d1, k).normalize();
      var dirB = d0.clone().lerp(d1, Math.min(1, k + 0.02)).normalize();
      if (i0 === i1 || dirB.distanceTo(dir) < 1e-4) { dirB = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.02); }
      var alt3 = 1.22 + Math.sin(k * Math.PI) * 0.12;
      o.pos.copy(dir.clone().multiplyScalar(alt3)); o.fwd.copy(dirB.sub(dir).normalize()); o.up.copy(dir); o.scale = 0.5;
    } else if (mode === "route") {
      var tt = Math.max(0.0005, Math.min(0.999, t));
      var p = this.routeCurve.getPointAt(tt), tg = this.routeCurve.getTangentAt(tt);
      o.pos.copy(p.clone().normalize().multiplyScalar(p.length() + 0.02)); o.fwd.copy(tg); o.up.copy(p.clone().normalize()); o.scale = 0.36;
    }
    return o;
  };

  World.prototype.faceQuat = function (lat, lon, tilt, extraYaw) {
    var v = ll2v(lat, lon, 1);
    var yaw = -Math.atan2(v.x, v.z) + (extraYaw || 0);
    return { yaw: yaw, tilt: lat * D2R * 0.85 + tilt };
  };

  World.prototype.regionDir = function (i) { var R = REGIONS[i]; return ll2v(R.lat, R.lon, 1); };

  World.prototype.update = function (dt) {
    this.time += dt;
    var T = this.target, C = this.cur, k = 1 - Math.pow(0.0025, dt), kf = 1 - Math.pow(0.02, dt);
    ["gx", "gy", "scale", "camZ", "dots", "arcs", "arcDraw", "route", "routeDraw", "active", "hub", "atmo", "preflight", "burst", "takeoff", "planeT", "runway"].forEach(function (key) {
      C[key] += (T[key] - C[key]) * (key === "routeDraw" || key === "planeT" ? kf : k);
    });
    C.activeIdx = T.activeIdx;
    // face angles with shortest-path yaw
    var face = this.faceQuat(T.faceLat, T.faceLon, T.tilt, T.spin);
    var dy = face.yaw - C.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    C.yaw += dy * k; C.tilt += (face.tilt - C.tilt) * k;

    var mob = window.innerWidth < 768;
    this.rig.position.set(mob ? C.gx * 0.15 : C.gx, C.gy, 0);
    this.rig.scale.setScalar(C.scale * (mob ? 0.78 : 1));
    this.globe.rotation.set(C.tilt, C.yaw, 0, "XYZ");
    this.camera.position.z = C.camZ;

    var tm = this.time;
    this.landMat.uniforms.uTime.value = tm; this.oceanMat.uniforms.uTime.value = tm; this.starMat.uniforms.uTime.value = tm;
    this.landMat.uniforms.uOpacity.value = C.dots; this.oceanMat.uniforms.uOpacity.value = 0.55 * C.dots;
    this.atmoMat.uniforms.uOpacity.value = C.atmo;
    this.ringMat.uniforms.uTime.value = tm; this.ringMat.uniforms.uOpacity.value = C.hub;
    this.beamMat.uniforms.uTime.value = tm; this.beamMat.uniforms.uOpacity.value = C.hub * 0.9 * (1 - C.runway);
    var self = this;
    this.arcs.forEach(function (m, i) {
      m.uniforms.uTime.value = tm; m.uniforms.uDraw.value = Math.min(1, C.arcDraw * 1.15 - (i % 7) * 0.02);
      m.uniforms.uOpacity.value = C.arcs * (1 + C.burst * 1.8);
    });
    // active region tint
    var R = REGIONS[C.activeIdx];
    [this.landMat, this.oceanMat].forEach(function (m) {
      m.uniforms.uActiveDir.value.copy(self.regionDir(C.activeIdx)); m.uniforms.uActiveCos.value = R.cos;
      m.uniforms.uActiveCol.value.set(R.col); m.uniforms.uActiveAmt.value = C.active;
    });
    this.regionCols.forEach(function (rc, i) {
      var on = (i === C.activeIdx ? C.active : 0);
      rc.mat.opacity += (on * 0.85 - rc.mat.opacity) * k;
      rc.grp.children.forEach(function (m, j) { var tgt = on > 0.5 ? 1 : 0.001; m.scale.y += (tgt - m.scale.y) * (k * (0.6 + (j % 5) * 0.12)); });
    });
    // route
    this.routeMat.uniforms.uDraw.value = C.routeDraw; this.routeMat.uniforms.uOpacity.value = C.route;
    this.wpMats.forEach(function (m, i) { var on = C.routeDraw >= self.wpT[i] - 0.002 ? 1 : 0.18; m.opacity = C.route * on; m.visible = m.opacity > 0.01; m.color.set(on > 0.5 && (i === 5 || i === 10) ? 0xf20a14 : 0xffffff); });
    this.branchMats.forEach(function (b) {
      b.mat.uniforms.uTime.value = tm;
      var q = (C.routeDraw - b.t0) / (b.t1 - b.t0); b.mat.uniforms.uDraw.value = Math.max(0, Math.min(1, q));
      b.mat.uniforms.uOpacity.value = C.route * (q > 0 ? 1 : 0);
    });
    // runway + preflight glow
    var rv = C.runway, sc = this.rig.scale.x;
    this.rwMat.opacity = rv * 0.92; this.dashMat.opacity = rv * 0.8; this.dashMat.size = 0.006 * sc;
    this.runwayMat.size = 0.016 * sc; this.runwayMat.opacity = rv * (0.75 + 0.25 * Math.sin(tm * 5));
    var pf = C.preflight, parts = this.planeParts;
    parts.cockpit.emissive.setRGB(0.5 * clamp01(pf - 0), 0.55 * clamp01(pf - 0), 0.7 * clamp01(pf - 0));
    parts.engines.emissive.setRGB(0.35 * clamp01(pf - 1), 0.35 * clamp01(pf - 1), 0.4 * clamp01(pf - 1));
    parts.wings.emissive.setRGB(0.045 + 0.1 * clamp01(pf - 2), 0.047 + 0.1 * clamp01(pf - 2), 0.06 + 0.11 * clamp01(pf - 2));
    var nav = clamp01(pf - 3);
    this.navL.material.opacity = 0.25 + nav * 0.75; this.navR.material.opacity = 0.25 + nav * 0.75;
    parts.tail.emissive.setRGB(0.6 * clamp01(pf - 4), 0, 0);
    this.strobe.material.opacity = (Math.sin(tm * 9) > 0.85 ? 1 : 0.05) * (0.35 + nav * 0.65);
    this.landing.material.opacity = (T.plane === "approach" || T.plane === "takeoff") ? 0.9 : 0.25;

    // plane
    var pose = this.planePose(T.plane, T.plane === "tour" ? T.planeT : C.planeT);
    var q = lookQuat(pose.fwd, pose.up);
    if (pose.bank) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pose.bank));
    if (this.plane.position.distanceTo(pose.pos) > 0.9) { this.plane.position.copy(pose.pos); this.trailPts.length = 0; }
    this.plane.position.lerp(pose.pos, kf);
    this._baseQ.slerp(q, kf);
    this.plane.quaternion.copy(this._baseQ);
    if (this.roll) this.plane.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.roll));
    var s = this.plane.scale.x + (pose.scale - this.plane.scale.x) * kf;
    this.plane.scale.setScalar(s);
    this.plane.visible = this.planeOn && C.dots > 0.05;
    this.updateTrail(s);

    this.renderer.render(this.scene, this.camera);
  };
  World.prototype.updateTrail = function (s) {
    var pts = this.trailPts, TN = this.trailN, P = this.trailPos, Cc = this.trailCol;
    var tail = new THREE.Vector3(0, 0, -0.17 * s).applyQuaternion(this.plane.quaternion).add(this.plane.position);
    if (pts.length && pts[0].distanceTo(tail) > 0.3) pts.length = 0; // teleport: restart the trail
    pts.unshift(tail); if (pts.length > TN) pts.pop();
    var tk = this.target.plane === "takeoff" ? 1 : 0;
    var boost = this.trailBoost = (this.trailBoost || 0) + (tk - (this.trailBoost || 0)) * 0.06;
    var md = this.target.plane, on = this.plane.visible && md !== "park" && !(md === "runway" && this.cur.planeT < 0.42) ? 1 : 0;
    var cam = this.globe.worldToLocal(this.camera.position.clone());
    var tan = new THREE.Vector3(), view = new THREE.Vector3(), side = new THREE.Vector3();
    for (var i = 0; i < TN; i++) {
      var p = pts[Math.min(i, pts.length - 1)], q = pts[Math.min(i + 1, pts.length - 1)];
      tan.subVectors(p, q); if (tan.lengthSq() < 1e-10) tan.set(0, 0, 1).applyQuaternion(this.plane.quaternion);
      view.subVectors(cam, p); side.crossVectors(tan, view).normalize();
      var t = i / (TN - 1), taper = Math.pow(1 - t, 0.7);
      var core = (0.0016 + 0.0045 * s) * (1 + boost * 1.5) * taper, halo = core * 4.5;
      var a = on * (0.35 + 0.65 * boost) * Math.pow(1 - t, 1.2 + 1.5 * (1 - boost)), hot = Math.max(0, 1 - t * 7);
      var offs = [-halo, -core, core, halo], amp = [0, 1, 1, 0];
      for (var v = 0; v < 4; v++) {
        var j = (i * 4 + v) * 3, o = offs[v], m = a * amp[v];
        P[j] = p.x + side.x * o; P[j + 1] = p.y + side.y * o; P[j + 2] = p.z + side.z * o;
        Cc[j] = m * 1.0; Cc[j + 1] = m * (0.06 + 0.8 * hot); Cc[j + 2] = m * (0.09 + 0.75 * hot);
      }
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.color.needsUpdate = true;
  };
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  World.REGIONS = REGIONS;
  World.HUB = HUB;
  World.ROUTE = ROUTE;
  window.World = World;
})();
