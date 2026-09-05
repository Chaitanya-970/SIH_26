import React, { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';

/**
 * WireframeBall - Rotating Wireframe Polyhedron
 * Features an outer icosahedron wireframe shell, an inner dodecahedron core,
 * and glowing vertex points rendered in muted acid-lime (#b6d83a).
 */
function WireframeBall({
  color = '#8ea836',
  secondaryColor = '#5c6f1a',
  size = 200,
  speed = 0.8,
  opacity = 0.35
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

    // 1. Outer Polyhedron: Icosahedron Wireframe (Dull & Transparent)
    const outerGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: opacity * 0.85
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    // 2. Inner Nested Polyhedron: Dodecahedron Wireframe (Subtle)
    const innerGeo = new THREE.DodecahedronGeometry(0.72, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      wireframe: true,
      transparent: true,
      opacity: opacity * 0.55
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    // 3. Subtle Non-Clashing Vertex Points
    const pointsMat = new THREE.PointsMaterial({
      color: color,
      size: 0.035,
      transparent: true,
      opacity: opacity * 0.9
    });
    const points = new THREE.Points(outerGeo, pointsMat);
    group.add(points);

    // Subtle ambient lighting for depth
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
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
  }, [color, secondaryColor, size, speed]);

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

