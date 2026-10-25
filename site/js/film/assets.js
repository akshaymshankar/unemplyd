/* unemplyd. film — asset slots.
   Everything ships procedural so the film works today. When the real assets exist, point these
   at the files and reload: nothing else needs to change.

   aircraft   GLB (glTF binary). Meters, nose toward -Z, +Y up, origin at the main-gear ground
              contact (between the main wheels, on the ground). ~44 m long for A321 proportions.
              Optional node names the film will animate:
                gear_nose, gear_left, gear_right  (pivot at the top of the leg; folded by rotation)
                fan_left, fan_right               (spin about local Z)
              Cabin glow: give the fuselage material an emissive map with the windows lit.
              Keep it under ~6 MB with Draco off (this build has no Draco decoder) and 2K textures. */
window.FILM_ASSETS = {
  aircraft: null          // e.g. "assets/film/unemplyd-aircraft.glb"
};
