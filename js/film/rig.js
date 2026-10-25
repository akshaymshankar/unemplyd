/* unemplyd. film — reusable choreography primitives.
   Everything in the film is a pure function of one number: scroll progress. Scrubbing backwards
   replays the shot in reverse for free, and any later scene (clouds, globe, ocean, portal) only
   has to describe its keys.

   Track      scalar keyframes  [[t, value, ease?], ...]  → value at t
   Timeline   ordered scenes with scroll weights        → { scene, local t } for a global progress
   ShotRig    camera on a Catmull-Rom spline through keys that live in world space or in a
              subject's frame (e.g. "15 m behind the aircraft"), plus look-at, fov, roll, shake */
(function () {
  "use strict";
  var THREE = window.THREE;

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var EASE = {
    linear: function (k) { return k; },
    smooth: function (k) { return k * k * (3 - 2 * k); },
    smoother: function (k) { return k * k * k * (k * (k * 6 - 15) + 10); },
    in: function (k) { return k * k; },
    out: function (k) { return 1 - (1 - k) * (1 - k); },
    in3: function (k) { return k * k * k; },
    out3: function (k) { return 1 - Math.pow(1 - k, 3); },
    inOut3: function (k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    hold: function () { return 0; }
  };
  var ease = function (name) { return typeof name === "function" ? name : (EASE[name] || EASE.smooth); };
  var range = function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); };

  /* ---------- Track ---------- */
  function Track(keys) { this.keys = keys; }
  Track.prototype.at = function (t) {
    var K = this.keys, n = K.length;
    if (t <= K[0][0]) return K[0][1];
    if (t >= K[n - 1][0]) return K[n - 1][1];
    for (var i = 0; i < n - 1; i++) {
      if (t < K[i + 1][0]) {
        var k = ease(K[i + 1][2])((t - K[i][0]) / (K[i + 1][0] - K[i][0]));
        return K[i][1] + (K[i + 1][1] - K[i][1]) * k;
      }
    }
    return K[n - 1][1];
  };

  /* ---------- Timeline ---------- */
  // scenes: [{ id, weight }] in order; weight = how much scroll the scene gets
  function Timeline(scenes) {
    var sum = 0; scenes.forEach(function (s) { sum += s.weight; });
    var acc = 0;
    this.scenes = scenes.map(function (s) { var o = { id: s.id, from: acc / sum, to: (acc + s.weight) / sum, def: s }; acc += s.weight; return o; });
  }
  Timeline.prototype.locate = function (p) {
    p = clamp(p, 0, 1);
    for (var i = 0; i < this.scenes.length; i++) {
      var s = this.scenes[i];
      if (p <= s.to || i === this.scenes.length - 1) return { index: i, id: s.id, scene: s.def, t: range(p, s.from, s.to) };
    }
  };
  Timeline.prototype.span = function (id) { for (var i = 0; i < this.scenes.length; i++) if (this.scenes[i].id === id) return this.scenes[i]; return null; };

  /* ---------- subject frames ---------- */
  // A subject exposes frame(t) → { pos, heading } where heading is a yaw (radians, 0 = facing -Z).
  // Camera keys in subject space ignore the subject's pitch and roll, so a chase camera stays level
  // like a real tracking vehicle or helicopter instead of being glued to the fuselage.
  var _v = new THREE.Vector3();
  function resolve(key, frames, out) {
    var p = key.p;
    if (!key.in) return out.set(p[0], p[1], p[2]);
    var f = frames[key.in];
    var c = Math.cos(f.heading), s = Math.sin(f.heading);
    // subject-local: +x right wing, +y up, +z behind the tail
    return out.set(f.pos.x + p[0] * c + p[2] * s, f.pos.y + p[1], f.pos.z - p[0] * s + p[2] * c);
  }

  /* ---------- ShotRig ---------- */
  // shot = { keys: [{ t, pos:{p,in?}, look:{p,in?}, fov, roll, ease }] , shake: Track, minY }
  function ShotRig(camera) {
    this.camera = camera;
    this.pos = new THREE.Vector3(); this.look = new THREE.Vector3();
    this.fov = camera.fov; this.roll = 0;
    this._posCurve = new THREE.CatmullRomCurve3([], false, "centripetal");
    this._lookCurve = new THREE.CatmullRomCurve3([], false, "centripetal");
    this._seed = Math.random() * 100;
  }
  ShotRig.prototype.evaluate = function (shot, t, frames) {
    var K = shot.keys, n = K.length, i;
    // keys are re-resolved every frame so subject-relative points ride along with the subject
    var pc = this._posCurve.points, lc = this._lookCurve.points;
    while (pc.length < n) { pc.push(new THREE.Vector3()); lc.push(new THREE.Vector3()); }
    pc.length = lc.length = n;
    for (i = 0; i < n; i++) { resolve(K[i].pos, frames, pc[i]); resolve(K[i].look, frames, lc[i]); }
    // which segment, and how far through it (per-key easing)
    var seg = n - 2, k = 1;
    if (t <= K[0].t) { seg = 0; k = 0; }
    else for (i = 0; i < n - 1; i++) if (t < K[i + 1].t) { seg = i; k = ease(K[i + 1].ease)((t - K[i].t) / (K[i + 1].t - K[i].t)); break; }
    var u = (seg + k) / (n - 1);
    if (n === 1) { this.pos.copy(pc[0]); this.look.copy(lc[0]); }
    else { this._posCurve.getPoint(u, this.pos); this._lookCurve.getPoint(u, this.look); }
    var a = K[seg], b = K[Math.min(n - 1, seg + 1)];
    this.fov = (a.fov || 40) + ((b.fov || 40) - (a.fov || 40)) * k;
    this.roll = (a.roll || 0) + ((b.roll || 0) - (a.roll || 0)) * k;
    if (shot.minY != null && this.pos.y < shot.minY) this.pos.y = shot.minY;
    return this;
  };
  // smooth noise for handheld / vibration (sum of sines: deterministic, cheap)
  ShotRig.prototype.noise = function (x, o) {
    o = o || 0;
    return Math.sin(x * 1.7 + o) * 0.5 + Math.sin(x * 3.3 + o * 2.1) * 0.3 + Math.sin(x * 7.1 + o * 0.7) * 0.2;
  };
  // write the evaluated pose to the camera, with shake (meters) and a slow handheld drift
  ShotRig.prototype.apply = function (time, shake, drift) {
    var cam = this.camera, s = this._seed, hf = time * 38, lf = time * 0.6;
    cam.position.copy(this.pos);
    cam.position.x += (this.noise(hf, s) * shake) + this.noise(lf, s + 3) * drift;
    cam.position.y += (this.noise(hf * 1.3, s + 1) * shake) + this.noise(lf * 1.2, s + 5) * drift * 0.6;
    _v.copy(this.look); _v.x += this.noise(lf * 0.8, s + 9) * drift * 2;
    cam.up.set(0, 1, 0);
    cam.lookAt(_v);
    var r = this.roll + this.noise(hf * 0.7, s + 2) * shake * 0.02;
    if (r) cam.rotateZ(r);
    if (Math.abs(cam.fov - this.fov) > 1e-3) { cam.fov = this.fov; cam.updateProjectionMatrix(); }
  };

  window.FilmRig = { Track: Track, Timeline: Timeline, ShotRig: ShotRig, EASE: EASE, ease: ease, clamp: clamp, range: range };
})();
