"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GRID_SIZE = 42; // points per axis — density of the engineering grid
const SPACING = 0.62;

function ParticleGrid({ dark }: { dark: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const { positions, color } = useMemo(() => {
    const count = GRID_SIZE * GRID_SIZE;
    const positions = new Float32Array(count * 3);
    let i = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        positions[i * 3] = (x - GRID_SIZE / 2) * SPACING;
        positions[i * 3 + 1] = (y - GRID_SIZE / 2) * SPACING;
        positions[i * 3 + 2] = 0;
        i++;
      }
    }
    // Dots read as a subtle texture against whichever surface is
    // active — light gray on the dark surface, warm gray on paper.
    const color = new THREE.Color(dark ? "#4a4a4a" : "#d8d6d0");
    return { positions, color };
  }, [dark]);

  useFrame(({ clock, mouse }) => {
    pointer.current.x += (mouse.x - pointer.current.x) * 0.04;
    pointer.current.y += (mouse.y - pointer.current.y) * 0.04;

    if (pointsRef.current) {
      pointsRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.02) * 0.02;
      pointsRef.current.position.x = pointer.current.x * 0.6;
      pointsRef.current.position.y = pointer.current.y * 0.4;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color={color}
        sizeAttenuation
        transparent
        opacity={0.85}
      />
    </points>
  );
}

/**
 * The hero's signature element: a living engineering-schematic grid,
 * an extension of the logo's hairline corner marks into a full
 * cursor-reactive field. The cursor's own "glow" is handled by the
 * separate DOM-level CursorSpotlight layered on top — Points geometry
 * in three.js isn't lit by scene lights, so that effect lives in CSS
 * instead of WebGL, where it actually renders.
 *
 * Falls back to a static grid for prefers-reduced-motion and
 * no-WebGL environments.
 */
export default function BlueprintField({ dark = true }: { dark?: boolean }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setWebglOk(!!gl);
    } catch {
      setWebglOk(false);
    }
  }, []);

  if (reducedMotion || !webglOk) {
    return (
      <div
        className={`absolute inset-0 opacity-30 ${
          dark ? "blueprint-grid" : "blueprint-grid-dark"
        }`}
      />
    );
  }

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ParticleGrid dark={dark} />
      </Canvas>
    </div>
  );
}
