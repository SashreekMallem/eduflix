"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeJSBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Enable transparency
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Set clear color to transparent

    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    // Neural Network Background
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCnt = 500;

    const posArray = new Float32Array(particlesCnt * 3);
    const velArray = new Float32Array(particlesCnt * 3); // Add velocity array

    for (let i = 0; i < particlesCnt * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 5;
      posArray[i + 1] = (Math.random() - 0.5) * 5;
      posArray[i + 2] = (Math.random() - 0.5) * 5;

      velArray[i] = (Math.random() - 0.5) * 0.01; // Random X velocity
      velArray[i + 1] = (Math.random() - 0.5) * 0.01; // Random Y velocity
      velArray[i + 2] = (Math.random() - 0.5) * 0.01; // Random Z velocity
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velArray, 3)); // Set velocity attribute

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x9370DB, // Purple color
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 2;

    const animate = () => {
      requestAnimationFrame(animate);

      const positions = particlesGeometry.attributes.position.array as THREE.Float32Array;
      const velocities = particlesGeometry.attributes.velocity.array as THREE.Float32Array;

      for (let i = 0; i < particlesCnt * 3; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Bounce off the edges
        if (positions[i] < -5 || positions[i] > 5) velocities[i] *= -1;
        if (positions[i + 1] < -5 || positions[i + 1] > 5) velocities[i + 1] *= -1;
        if (positions[i + 2] < -5 || positions[i + 2] > 5) velocities[i + 2] *= -1;
      }

      particlesGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />;
};

export default ThreeJSBackground;
