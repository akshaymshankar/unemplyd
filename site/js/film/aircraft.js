/* unemplyd. film — the UNEMPLYD aircraft.
   A procedural narrow-body airliner (A321-class proportions, meters) in the house livery: white
   fuselage, graphite belly and tail, the wordmark on both sides, red sharklets and intake lips.
   It is a stand-in until a Blender model exists: drop a GLB at FILM_ASSETS.aircraft and it
   replaces the procedural body while the lights, gear and fans keep working (see assets.js).

   Local frame: origin at the main-gear ground contact, nose toward -Z, +X is the right wing. */
(function () {
  "use strict";
  var THREE = window.THREE;
  var D2R = Math.PI / 180;

  var NOSE = -25, TAIL = 19, LEN = TAIL - NOSE, R = 2.0, CY = 4.0;   // fuselage
  var RED = "#F20A14", GRAPHITE = "#15171c", WHITE = "#f4f5f7";

  function srgb(tex) { tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8; return tex; }
  function canvas(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  /* ---------- fuselage profile ---------- */
  function radius(s) {            // s: 0 nose → 1 tail
    if (s < 0.13) { var a = 1 - s / 0.13; return R * Math.pow(1 - a * a * a, 0.42); }
    if (s > 0.7) { var b = (s - 0.7) / 0.3; return R * (1 - 0.92 * Math.pow(b, 1.5)); }
    return R;
  }
  function center(s) {
    if (s < 0.13) { var a = 1 - s / 0.13; return -0.32 * a * a; }
    if (s > 0.7) { var b = (s - 0.7) / 0.3; return 1.45 * Math.pow(b, 1.45); }
    return 0;
  }
  function fuselageGeometry() {
    var N = 72, M = 48, pos = [], uv = [], idx = [];
    for (var i = 0; i <= N; i++) {
      var s = i / N, r = Math.max(0.12, radius(s)), c = center(s), z = NOSE + s * LEN;
      if (i === 0) r = 0.0001;
      for (var j = 0; j <= M; j++) {
        var th = j / M * Math.PI * 2;
        pos.push(Math.sin(th) * r, CY + c + Math.cos(th) * r * 1.06, z);
        uv.push(1 - s, 1 - j / M);
      }
    }
    for (i = 0; i < N; i++) for (var k = 0; k < M; k++) {
      var a = i * (M + 1) + k, b = a + M + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  /* ---------- livery ---------- */
  // canvas x = along the body (nose on the right), y = around (right side at 25%, left at 75%)
  var LW = 2048, LH = 1024, PXZ = LW / LEN, PXR = LH / (Math.PI * 2 * R * 1.03);
  function zx(z) { return (1 - (z - NOSE) / LEN) * LW; }
  function liveryTextures(logoImg) {
    var c = canvas(LW, LH), g = c.getContext("2d"), e = canvas(LW / 2, LH / 2), ge = e.getContext("2d");
    g.fillStyle = WHITE; g.fillRect(0, 0, LW, LH);
    // graphite belly + red cheatlines
    var b0 = 0.355 * LH, b1 = 0.645 * LH;
    g.fillStyle = GRAPHITE; g.fillRect(0, b0, LW, b1 - b0);
    g.fillStyle = RED; g.fillRect(0, b0 - 10, LW, 7); g.fillRect(0, b1 + 3, LW, 7);
    // tail cone graphite, sweeping into the fin
    g.fillStyle = GRAPHITE; g.beginPath(); g.moveTo(zx(9), b0 - 10); g.quadraticCurveTo(zx(14), 0.08 * LH, zx(TAIL), 0); g.lineTo(0, 0); g.lineTo(0, LH);
    g.lineTo(zx(TAIL), LH); g.quadraticCurveTo(zx(14), 0.92 * LH, zx(9), b1 + 10); g.closePath(); g.fill();
    ge.fillStyle = "#000"; ge.fillRect(0, 0, e.width, e.height);
    // subtle panel lines
    g.strokeStyle = "rgba(20,24,30,.08)"; g.lineWidth = 1;
    for (var z = -20; z < 14; z += 2.6) { g.beginPath(); g.moveTo(zx(z), 0); g.lineTo(zx(z), LH); g.stroke(); }
    // the left side reads with "down" reversed, so it is drawn flipped vertically; text is also
    // mirrored in place so it reads nose-to-tail from either side
    [[0.25 * LH, false], [0.75 * LH, true]].forEach(function (S) {
      var yc = S[0], flip = S[1];
      g.save(); ge.save(); ge.scale(0.5, 0.5);
      if (flip) { g.translate(0, 2 * yc); g.scale(1, -1); ge.translate(0, 2 * yc); ge.scale(1, -1); }
      var win = yc - 0.52 * PXR;           // window row, a little above the centreline
      var doors = [-19.6, -9.2, 4.6, 13.2];
      for (var z = -18.4; z < 12.6; z += 0.53) {
        if (doors.some(function (d) { return Math.abs(z - d) < 0.9; })) continue;
        var x = zx(z) - 6;
        g.fillStyle = "#1b2230"; roundRect(g, x, win - 17, 13, 34, 6); g.fill();
        ge.fillStyle = "rgba(255,196,128,0.92)"; roundRect(ge, x + 1, win - 15, 11, 30, 5); ge.fill();
      }
      g.strokeStyle = "rgba(20,24,30,.35)"; g.lineWidth = 2;
      doors.forEach(function (d) { roundRect(g, zx(d) - 21, win - 70, 42, 150, 10); g.stroke(); });
      // cockpit glazing
      g.fillStyle = "#0b0e14";
      g.beginPath(); g.moveTo(zx(-22.6), win - 54); g.lineTo(zx(-23.9), win - 30); g.lineTo(zx(-23.6), win + 2); g.lineTo(zx(-22.3), win - 6); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(zx(-21.9), win - 58); g.lineTo(zx(-22.45), win - 56); g.lineTo(zx(-22.15), win - 8); g.lineTo(zx(-21.6), win - 12); g.closePath(); g.fill();
      function mirrored(cx, cy, fn) { g.save(); g.translate(cx, cy); g.scale(flip ? -1 : 1, 1); fn(); g.restore(); }
      // wordmark, 1.15 m tall, above the windows on the forward fuselage
      if (logoImg) {
        var h = 1.15 * PXR, w = 1.15 * (9496 / 2047) * PXZ;
        mirrored(zx(-3.5), yc - 1.3 * PXR, function () { g.drawImage(logoImg, -w / 2, -h / 2, w, h); });
      }
      // registration
      g.fillStyle = "rgba(21,23,28,.75)"; g.font = "600 22px 'JetBrains Mono', monospace"; g.textAlign = "center";
      mirrored(zx(15.2), yc - 0.4 * PXR, function () { g.scale(1, PXR / PXZ); g.fillText("VT-UNE", 0, 0); });
      g.restore(); ge.restore();
    });
    var map = srgb(new THREE.CanvasTexture(c)), emi = srgb(new THREE.CanvasTexture(e));
    return { map: map, emissive: emi };
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // two panels so the mark reads correctly from both sides: left side u∈[0,.5), right side u∈[.5,1]
  function finTexture(markImg) {
    var c = canvas(1024, 512), g = c.getContext("2d");
    g.fillStyle = GRAPHITE; g.fillRect(0, 0, 1024, 512);
    g.fillStyle = RED; g.fillRect(0, 0, 1024, 14);
    if (markImg) { g.drawImage(markImg, 512 * 0.62 - 135, 150, 270, 270); g.drawImage(markImg, 512 + 512 * 0.38 - 135, 150, 270, 270); }
    return srgb(new THREE.CanvasTexture(c));
  }
  function svgImage(svg, cb) {
    var img = new Image();
    img.onload = function () { cb(img); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------- lifting surfaces ---------- */
  // planform in (x, z); thickness tapers toward the tip, dihedral lifts it
  function surface(root, tip, y0, dihedral, thick, sign) {
    // root/tip: [x, zLE, chord]
    var sh = new THREE.Shape();
    sh.moveTo(root[0], root[1]); sh.lineTo(tip[0], tip[1]); sh.lineTo(tip[0], tip[1] + tip[2]); sh.lineTo(root[0], root[1] + root[2]); sh.closePath();
    var g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.45, bevelSize: Math.min(0.12, thick * 0.4), bevelSegments: 3, steps: 1, curveSegments: 1 });
    g.rotateX(Math.PI / 2);                    // shape y → world z, depth → world -y
    g.translate(0, thick / 2, 0);
    var p = g.attributes.position, span = tip[0] - root[0];
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), f = Math.max(0, Math.min(1, (x - root[0]) / span));
      p.setY(i, y0 + p.getY(i) * (1 - 0.62 * f) + (x - root[0]) * Math.tan(dihedral));
    }
    if (sign < 0) mirrorX(g);
    g.computeVertexNormals();
    return g;
  }
  function mirrorX(g) {
    g.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
    var ix = g.index;
    if (ix) { for (var i = 0; i < ix.count; i += 3) { var a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } }
    else {
      var p = g.attributes.position, keys = Object.keys(g.attributes);
      for (var j = 0; j < p.count; j += 3) keys.forEach(function (k) {
        var at = g.attributes[k], n = at.itemSize;
        for (var c = 0; c < n; c++) { var t = at.array[(j + 1) * n + c]; at.array[(j + 1) * n + c] = at.array[(j + 2) * n + c]; at.array[(j + 2) * n + c] = t; }
      });
    }
    return g;
  }

  /* ---------- glow sprite texture (shared) ---------- */
  var _glow = null;
  function glowTexture() {
    if (_glow) return _glow;
    var c = canvas(128, 128), g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.12, "rgba(255,255,255,.85)"); gr.addColorStop(0.35, "rgba(255,255,255,.22)");
    gr.addColorStop(0.7, "rgba(255,255,255,.05)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    _glow = new THREE.CanvasTexture(c); return _glow;
  }
  function glow(color, size) {
    var m = new THREE.SpriteMaterial({ map: glowTexture(), color: color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: true });
    var s = new THREE.Sprite(m); s.scale.setScalar(size); s.userData.size = size; return s;
  }

  function fanTexture() {
    var c = canvas(256, 256), g = c.getContext("2d");
    g.fillStyle = "#0c0d10"; g.fillRect(0, 0, 256, 256);
    g.translate(128, 128);
    for (var i = 0; i < 22; i++) {
      g.rotate(Math.PI * 2 / 22);
      var gr = g.createLinearGradient(0, 0, 0, 124); gr.addColorStop(0, "#3a3f48"); gr.addColorStop(1, "#7a808a");
      g.fillStyle = gr; g.beginPath(); g.moveTo(-3, 18); g.quadraticCurveTo(16, 70, 6, 124); g.lineTo(-10, 124); g.quadraticCurveTo(-2, 70, -8, 18); g.closePath(); g.fill();
    }
    g.fillStyle = "#1a1c21"; g.beginPath(); g.arc(0, 0, 24, 0, Math.PI * 2); g.fill();
    return srgb(new THREE.CanvasTexture(c));
  }
  function spinnerTexture() {
    var c = canvas(128, 128), g = c.getContext("2d");
    g.fillStyle = "#2b2e35"; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "#e9ebef"; g.lineWidth = 10; g.beginPath();
    for (var k = 0; k < 64; k++) { var a = k / 64 * Math.PI * 1.6, r = k; g.lineTo(64 + Math.cos(a) * r * 0.9, 64 + Math.sin(a) * r * 0.9); }
    g.stroke();
    return srgb(new THREE.CanvasTexture(c));
  }

  /* ---------- Aircraft ---------- */
  function Aircraft(opts) {
    opts = opts || {};
    var root = this.root = new THREE.Group();       // position + heading
    var pitch = this.pitchG = new THREE.Group();     // pitch about the main gear
    var roll = this.rollG = new THREE.Group();
    root.add(pitch); pitch.add(roll);
    var body = this.body = new THREE.Group(); roll.add(body);
    this.lights = new THREE.Group(); roll.add(this.lights);

    var white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0.12, envMapIntensity: 1.1 });
    var wingM = new THREE.MeshStandardMaterial({ color: 0xc3c8d0, roughness: 0.42, metalness: 0.35, envMapIntensity: 1.0 });
    var dark = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.5, metalness: 0.3 });
    var red = new THREE.MeshStandardMaterial({ color: 0xF20A14, roughness: 0.35, metalness: 0.1, emissive: 0x2a0002 });
    var metal = new THREE.MeshStandardMaterial({ color: 0x8a9099, roughness: 0.28, metalness: 0.9 });
    var rubber = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.9 });
    this.mats = { white: white, wing: wingM };

    // fuselage + livery
    var liv = liveryTextures(null);
    white.map = liv.map; white.emissiveMap = liv.emissive; white.emissive = new THREE.Color(0xffffff); white.emissiveIntensity = 0.0;
    var fus = new THREE.Mesh(fuselageGeometry(), white); body.add(fus);
    this.cabin = white;
    var self = this;
    if (window.LOGO_SVG) svgImage(window.LOGO_SVG.replace('fill="currentColor"', 'fill="' + GRAPHITE + '"').replace("<svg ", '<svg width="1900" height="410" '), function (img) {
      var l2 = liveryTextures(img); white.map = l2.map; white.emissiveMap = l2.emissive; white.needsUpdate = true;
    });

    // wings, sharklets, belly fairing
    var wr = [1.9, -4.6, 7.2], wt = [17.0, 2.5, 1.55];
    [1, -1].forEach(function (s) {
      body.add(new THREE.Mesh(surface(wr, wt, 2.55, 5.2 * D2R, 0.62, s), wingM));
      var tipY = 2.55 + (wt[0] - wr[0]) * Math.tan(5.2 * D2R);
      var sk = new THREE.Shape(); sk.moveTo(0, 0); sk.lineTo(1.5, 0); sk.lineTo(1.25, 2.4); sk.lineTo(0.75, 2.4); sk.closePath();
      var skg = new THREE.ExtrudeGeometry(sk, { depth: 0.12, bevelEnabled: false });
      skg.rotateY(-Math.PI / 2); skg.translate(s * (wt[0] + 0.02) + (s > 0 ? 0.06 : 0.06), tipY + 0.1, wt[1] + 0.05);
      var m = new THREE.Mesh(skg, red); m.rotation.z = 0; body.add(m);
    });
    var fair = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), dark); fair.scale.set(2.25, 0.9, 7.5); fair.position.set(0, 2.45, -1.2); body.add(fair);
    // horizontal stabiliser + fin
    [1, -1].forEach(function (s) { body.add(new THREE.Mesh(surface([0.5, 14.6, 3.9], [6.4, 17.7, 1.5], 5.15, 6 * D2R, 0.3, s), dark)); });
    var fin = new THREE.Shape(); fin.moveTo(12.2, 5.0); fin.lineTo(19.4, 5.0); fin.lineTo(19.9, 12.0); fin.lineTo(17.6, 12.0); fin.closePath();
    var fg = new THREE.ExtrudeGeometry(fin, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 2, curveSegments: 1 });
    fg.rotateY(-Math.PI / 2); fg.translate(0.17, 0, 0);
    var fp = fg.attributes.position, fuv = fg.attributes.uv;
    for (var i = 0; i < fp.count; i++) {
      var uz = (fp.getZ(i) - 12.2) / 7.7;
      fuv.setXY(i, fp.getX(i) > 0 ? 0.5 + 0.5 * (1 - uz) : 0.5 * uz, (fp.getY(i) - 5.0) / 7.0);
    }
    var finMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.2, map: finTexture(null), emissive: new THREE.Color(0xffffff), emissiveIntensity: 0 });
    finMat.emissiveMap = finMat.map;
    body.add(new THREE.Mesh(fg, finMat)); this.finMat = finMat;
    if (window.LOGO_SVG) {
      var u = window.LOGO_SVG.match(/<path transform="translate\(0\.0 0\)" d="([^"]+)"/);
      if (u) svgImage('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="-60 -1260 1760 1320"><g transform="scale(1,-1)" fill="#fff"><path d="' + u[1] + '"/></g><circle cx="1440" cy="-200" r="200" fill="' + RED + '"/></svg>', function (img) {
        finMat.map = finTexture(img); finMat.emissiveMap = finMat.map; finMat.needsUpdate = true;
      });
    }

    // engines
    this.fans = [];
    var fanTex = fanTexture(), spinTex = spinnerTexture();
    var nac = [];
    [[0, 0.98], [0.25, 1.1], [1.6, 1.16], [3.6, 1.12], [4.9, 1.04], [5.25, 1.0]].forEach(function (p) { nac.push(new THREE.Vector2(p[1], p[0])); });
    var nacG = new THREE.LatheGeometry(nac, 40); nacG.rotateX(-Math.PI / 2);
    [1, -1].forEach(function (s) {
      var eg = new THREE.Group(); eg.position.set(s * 5.9, 1.62, -2.4); body.add(eg);
      var shell = new THREE.Mesh(nacG, white); eg.add(shell);
      var lip = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 10, 40), red); lip.position.z = -5.25; eg.add(lip);
      var inner = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 1.4, 40, 1, true), dark); inner.material = new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.8, side: THREE.BackSide }); inner.rotation.x = Math.PI / 2; inner.position.z = -4.55; eg.add(inner);
      var fan = new THREE.Mesh(new THREE.CircleGeometry(0.96, 40), new THREE.MeshStandardMaterial({ map: fanTex, roughness: 0.5, metalness: 0.6 }));
      fan.position.z = -4.2; fan.rotation.y = Math.PI; eg.add(fan);
      var sp = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.75, 24), new THREE.MeshStandardMaterial({ map: spinTex, roughness: 0.35, metalness: 0.4 }));
      sp.rotation.x = -Math.PI / 2; sp.position.z = -4.5; eg.add(sp);
      var ex = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 24), metal); ex.rotation.x = Math.PI / 2; ex.position.z = 0.7; eg.add(ex);
      var py = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.1, 4.2), wingM); py.position.set(0, 1.05, -1.1); eg.add(py);
      self.fans.push(fan, sp);
    });

    // landing gear
    var gearM = metal;
    function wheel(x, y, z, r, w) { var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 20), rubber); m.rotation.z = Math.PI / 2; m.position.set(x, y, z); return m; }
    function leg(x, top, h, z) { var g = new THREE.Group(); g.position.set(x, top, z); var st = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, h, 10), gearM); st.position.y = -h / 2; g.add(st); return g; }
    var nose = leg(0, 2.45, 2.03, -20); nose.add(wheel(-0.26, -2.03, 0, 0.42, 0.28)); nose.add(wheel(0.26, -2.03, 0, 0.42, 0.28));
    var mainL = leg(-3.8, 2.55, 1.9, 0.0), mainR = leg(3.8, 2.55, 1.9, 0.0);
    [mainL, mainR].forEach(function (g) { g.add(wheel(-0.34, -1.95, 0, 0.6, 0.38)); g.add(wheel(0.34, -1.95, 0, 0.6, 0.38)); });
    body.add(nose, mainL, mainR);
    this.gear = { nose: nose, l: mainL, r: mainR };

    // lights
    var L = this.lights;
    this.landing = [glow(0xfff3dd, 5.5), glow(0xfff3dd, 5.5), glow(0xfff7ea, 3.6)];
    this.landing[0].position.set(-3.2, 2.35, -4.4); this.landing[1].position.set(3.2, 2.35, -4.4); this.landing[2].position.set(0, 0.95, -20.4);
    this.landing.forEach(function (g) { L.add(g); });
    this.navR = glow(0xff1a1a, 2.2); this.navR.position.set(-17.15, 3.95, 3.0);
    this.navG = glow(0x22ff66, 2.2); this.navG.position.set(17.15, 3.95, 3.0);
    this.navW = glow(0xffffff, 1.8); this.navW.position.set(0, 5.7, 19.4);
    this.strobes = [glow(0xffffff, 7), glow(0xffffff, 7)]; this.strobes[0].position.set(-17.2, 3.95, 3.6); this.strobes[1].position.set(17.2, 3.95, 3.6);
    this.beacons = [glow(0xff2a1a, 3.4), glow(0xff2a1a, 3.4)]; this.beacons[0].position.set(0, 6.2, -5.5); this.beacons[1].position.set(0, 1.85, -2.5);
    [this.navR, this.navG, this.navW].concat(this.strobes, this.beacons).forEach(function (g) { L.add(g); });
    // the real light the landing lights throw on the runway
    var spot = this.spot = new THREE.SpotLight(0xfff1dc, 0, 420, 0.32, 0.55, 1.1);
    spot.position.set(0, 2.4, -18); spot.target.position.set(0, 0, -110); roll.add(spot, spot.target);
    var spot2 = this.spot2 = new THREE.SpotLight(0xfff1dc, 0, 120, 0.9, 0.8, 1.4);
    spot2.position.set(0, 2.4, -16); spot2.target.position.set(0, 0, -40); roll.add(spot2, spot2.target);

    this.state = { gear: 1, fan: 0, landing: 0, strobe: 0, beacon: 1, logo: 1, cabin: 1 };
    this._fanAngle = 0;
  }

  // per-frame: s = desired state (from the scene), dt seconds, time seconds
  Aircraft.prototype.update = function (s, dt, time) {
    // fans spin with rpm (idle when engines are running, rpm 1 = take-off thrust)
    this._fanAngle += dt * (s.fan * 46 + (s.fan > 0.01 ? 4 : 0));
    var fa = this._fanAngle;
    this.fans.forEach(function (f, i) { if (i % 2 === 0) f.rotation.z = -fa; else f.rotation.y = fa; });
    // gear: 1 down, 0 stowed (mains fold inward, nose forward)
    var g = s.gear, G = this.gear, k = (1 - g) * Math.PI * 0.5;
    G.l.rotation.z = k; G.r.rotation.z = -k; G.nose.rotation.x = k;
    G.l.visible = G.r.visible = G.nose.visible = g > 0.03;
    // landing lights
    var lv = s.landing;
    this.landing.forEach(function (gl, i) { gl.material.opacity = lv; gl.scale.setScalar(gl.userData.size * (0.6 + 0.4 * lv)); gl.visible = lv > 0.01 && (i < 2 || g > 0.3); });
    this.spot.intensity = 3.2 * lv; this.spot2.intensity = 0.9 * lv;
    // strobes double-flash, beacons pulse
    var ph = time % 1.3, fl = s.strobe > 0 && (ph < 0.05 || (ph > 0.12 && ph < 0.17)) ? 1 : 0;
    this.strobes.forEach(function (st) { st.material.opacity = fl * s.strobe; st.visible = fl > 0; });
    var bp = Math.max(0, Math.sin(time * Math.PI * 2 * 0.95)); bp = Math.pow(bp, 6) * s.beacon;
    this.beacons.forEach(function (b) { b.material.opacity = bp; b.scale.setScalar(b.userData.size * (0.5 + bp)); });
    this.navR.material.opacity = this.navG.material.opacity = this.navW.material.opacity = 1;
    this.cabin.emissiveIntensity = 0.85 * s.cabin;
    this.finMat.emissiveIntensity = 0.38 * s.logo;
  };

  // pose in world: pos (Vector3 of main-gear contact), heading yaw, pitch (nose up +), bank (right wing down +)
  Aircraft.prototype.pose = function (pos, heading, pitch, bank) {
    this.root.position.copy(pos); this.root.rotation.set(0, heading, 0);
    this.pitchG.rotation.x = pitch; this.rollG.rotation.z = -bank;
  };

  // swap in an authored model (glTF scene). Expected: meters, nose toward -Z, origin at the main
  // gear contact. Optional node names it will drive: gear_nose, gear_left, gear_right, fan_left, fan_right.
  Aircraft.prototype.useModel = function (scene) {
    var keep = this.body; keep.visible = false;
    this.rollG.add(scene);
    var n = function (name) { return scene.getObjectByName(name); };
    if (n("gear_nose") && n("gear_left") && n("gear_right")) this.gear = { nose: n("gear_nose"), l: n("gear_left"), r: n("gear_right") };
    var fans = [n("fan_left"), n("fan_right")].filter(Boolean);
    if (fans.length) { this.fans = []; var self = this; fans.forEach(function (f) { self.fans.push(f, f); }); }
    var cabin = null;
    scene.traverse(function (o) { if (o.isMesh) { o.castShadow = false; if (!cabin && o.material && o.material.emissiveMap) cabin = o.material; } });
    if (cabin) this.cabin = cabin; else this.cabin = { emissiveIntensity: 0 };
  };

  Aircraft.glowTexture = glowTexture;
  Aircraft.glow = glow;
  Aircraft.DIM = { NOSE: NOSE, TAIL: TAIL, SPAN: 34.4, CY: CY };
  window.FilmAircraft = Aircraft;
})();
