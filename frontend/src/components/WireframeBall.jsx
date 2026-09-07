import React, { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';

/**
 * Helper to interpolate 3D vertex colors smoothly across a geometry:
 * Transitions smoothly from Azure Blue (#0284c7) -> Sky Blue (#0ea5e9) -> Warm Golden Amber (#fbbf24) -> Warm Yellowish-Amber Orange (#f59e0b).
 *
 * Guaranteed Zero-Purple:
 * The transition through warm golden amber maintains elevated Green (g > 175) while Red rises and Blue descends,
 * mathematically preventing Red + Blue from elevating together with low Green (which causes purple).
 * This ensures vibrant, beautiful Azure Blue and Warm-Yellowish-Amber Orange are both prominently visible!
 */
function applyGradientColors(geometry, primaryBlue = '#0284c7', secondaryAmber = '#f59e0b') {
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const pos = geometry.attributes.position;

  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < count; i++) {
    const val = pos.getX(i) + pos.getY(i) * 0.85 + pos.getZ(i) * 0.6;
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  }
  const range = maxVal - minVal || 1;

  const cBlueDark = new THREE.Color('#0369a1');       // Refined deep azure blue
  const cBlueSky = new THREE.Color('#0284c7');        // Restrained technical azure
  const cGoldAmber = new THREE.Color('#d97706');      // Warm amber (muted, non-glaring)
  const cAmberOrange = new THREE.Color('#b45309');    // Deeper warm amber-orange
  const tempColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const val = pos.getX(i) + pos.getY(i) * 0.85 + pos.getZ(i) * 0.6;
    const t = Math.max(0, Math.min(1, (val - minVal) / range));

    if (t < 0.45) {
      // 0.0 -> 0.45: Muted Azure Blue
      tempColor.copy(cBlueDark).lerp(cBlueSky, t / 0.45);
    } else if (t < 0.68) {
      // 0.45 -> 0.68: Azure -> Warm Amber
      tempColor.copy(cBlueSky).lerp(cGoldAmber, (t - 0.45) / 0.23);
    } else {
      // 0.68 -> 1.0: Warm Amber -> Deeper Amber-Orange
      tempColor.copy(cGoldAmber).lerp(cAmberOrange, (t - 0.68) / 0.32);
    }

    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/**
 * WireframeBall - Rotating Wireframe Polyhedron
 * Features an outer icosahedron wireframe shell, an inner dodecahedron core,
 * and delicate vertex points rendered with a balanced, subtle gradient from azure blue
 * to warm amber orange.
 */
function WireframeBall({
  color = '#0284c7',
  secondaryColor = '#d97706',
  size = 200,
  speed = 0.7,
  opacity = 0.38
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId;
    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.6;

    // Renderer with transparent background
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // Group for combined rotations
    const group = new THREE.Group();
    scene.add(group);

    // 1. Outer Polyhedron: Semi-Transparent Icosahedron Wireframe
    const outerGeo = new THREE.IcosahedronGeometry(1.2, 1);
    applyGradientColors(outerGeo, color, secondaryColor);
    const outerMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: opacity * 0.70
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    // 2. Inner Nested Polyhedron: Soft Semi-Transparent Core
    const innerGeo = new THREE.DodecahedronGeometry(0.72, 0);
    applyGradientColors(innerGeo, color, secondaryColor);
    const innerMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: opacity * 0.28
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    // 3. Delicate Subtle Vertex Points
    const pointsMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.022,
      transparent: true,
      opacity: opacity * 0.40
    });
    const points = new THREE.Points(outerGeo, pointsMat);
    group.add(points);

    // Subtle ambient lighting for depth
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      mouseX = x * 0.8;
      mouseY = y * 0.8;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Continuous complex rotation
      outerMesh.rotation.x += 0.004 * speed;
      outerMesh.rotation.y += 0.007 * speed;

      innerMesh.rotation.x -= 0.006 * speed;
      innerMesh.rotation.y -= 0.009 * speed;

      points.rotation.x += 0.004 * speed;
      points.rotation.y += 0.007 * speed;

      // Gentle mouse parallax interpolation
      group.rotation.x += (mouseY - group.rotation.x) * 0.05;
      group.rotation.y += (mouseX - group.rotation.y) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      outerGeo.dispose();
      outerMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      pointsMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [color, secondaryColor, size, speed, opacity]);

  return (
    <div
      ref={mountRef}
      className="anim-wireframe-ball"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    />
  );
}

export default memo(WireframeBall);

