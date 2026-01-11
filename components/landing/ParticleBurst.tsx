'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { motion, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';

interface ParticleData {
    position: THREE.Vector3;
    burstDirection: THREE.Vector3; // Direction to burst towards
    rotation: THREE.Euler;
    rotationSpeed: THREE.Vector3;
    scale: number;
}

// Generate particles on a sphere surface
function generateSphereParticles(count: number): ParticleData[] {
    const particles: ParticleData[] = [];
    const radius = 0.70; // Reduced radius for smaller sphere
    const xOffset = 0; // Centered at origin

    for (let i = 0; i < count; i++) {
        // Uniform distribution on sphere surface
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);

        const localX = radius * Math.sin(phi) * Math.cos(theta);
        const localY = radius * Math.sin(phi) * Math.sin(theta);
        const localZ = radius * Math.cos(phi);

        // Burst direction is simply the normalized position vector for a sphere
        const burstDir = new THREE.Vector3(localX, localY, localZ).normalize();

        particles.push({
            position: new THREE.Vector3(localX, localY, localZ),
            burstDirection: burstDir,
            rotation: new THREE.Euler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            ),
            rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            ),
            scale: 0.9 + Math.random() * 0.4
        });
    }

    return particles;
}

function ParticleField({ scrollProgress }: { scrollProgress: number }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const timeRef = useRef(0);
    const dummyRef = useRef(new THREE.Object3D());

    const { viewport, size } = useThree();
    const [sphereTransform, setSphereTransform] = useState<{ position: [number, number, number], scale: number }>({
        position: [0, 0, 0],
        scale: 1
    });

    useEffect(() => {
        const updatePosition = () => {
            const placeholder = document.getElementById('sphere-placeholder');
            if (!placeholder) return;

            const rect = placeholder.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Convert to normalized device coordinates (-1 to 1)
            const nX = (centerX / window.innerWidth) * 2 - 1;
            const nY = -(centerY / window.innerHeight) * 2 + 1;

            // Convert to world coordinates
            const x = (nX * viewport.width) / 2;
            const y = (nY * viewport.height) / 2;

            // Calculate scale to match text height
            // Base sphere diameter is roughly 1.4 (radius 0.7 * 2)
            // We want (1.4 * scale) to cover the text height roughly
            const targetHeightWorld = (rect.height / window.innerHeight) * viewport.height;
            // Add a small multiplier (e.g. 0.5) to make it fit nicely within the line height
            const scale = (targetHeightWorld / 1.4) * 0.5;

            setSphereTransform({ position: [x, y, 0], scale });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [viewport, size]);

    // Generate particles in sphere formation
    const particles = useMemo(() => {
        return generateSphereParticles(2000); // Slight increase for density
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;

        timeRef.current += 0.01;
        const time = timeRef.current;

        // Smooth easing for blast - ease out cubic
        const easedProgress = 1 - Math.pow(1 - scrollProgress, 3);

        // Burst distance - longer distance for more dramatic effect
        const burstDistance = easedProgress * 20;

        const dummy = dummyRef.current;
        const rotationAmount = scrollProgress * scrollProgress;

        // Global sphere rotation when initially idle
        const idleRotationSpeed = 0.5;
        const idleRotation = time * idleRotationSpeed * (1 - easedProgress);

        // Update each particle
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];

            // Original position
            const px = particle.position.x;
            const py = particle.position.y;
            const pz = particle.position.z;

            // Re-calculate local coordinates relative to the sphere center
            const localX = px;
            // localY = py
            // localZ = pz

            // Apply idle rotation around the sphere's own center
            const cosIdle = Math.cos(idleRotation);
            const sinIdle = Math.sin(idleRotation);

            // Rotate local X and Z
            const rotatedLocalX = localX * cosIdle - pz * sinIdle;
            const rotatedLocalZ = localX * sinIdle + pz * cosIdle;

            // Add offset back
            const rotatedX = rotatedLocalX;
            const rotatedZ = rotatedLocalZ;

            // Calculate burst position
            // Normalize using the correct radius 0.70 to get direction
            const burstDirX = rotatedLocalX / 0.70;
            const burstDirY = py / 0.70;
            const burstDirZ = rotatedLocalZ / 0.70;

            // Add slight randomness to burst to avoid "flat" look
            const noise = Math.sin(i * 0.1) * 0.1 * easedProgress;

            const burstX = rotatedX + (burstDirX + noise) * burstDistance;
            const burstY = py + (burstDirY + noise) * burstDistance;
            const burstZ = rotatedZ + (burstDirZ + noise) * burstDistance;

            // Set position
            dummy.position.set(burstX, burstY, burstZ);

            // Rotate particles individuals
            dummy.rotation.set(
                particle.rotation.x + particle.rotationSpeed.x * rotationAmount,
                particle.rotation.y + particle.rotationSpeed.y * rotationAmount,
                particle.rotation.z + particle.rotationSpeed.z * rotationAmount
            );

            // Scale particles - fade out slightly at max distance
            const scale = particle.scale * 0.045 * (1 + scrollProgress * 0.2);
            dummy.scale.setScalar(scale);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <>
            {/* Ambient light */}
            <ambientLight intensity={0.8} color="#fff5e6" />

            {/* Instanced mesh for particles */}
            <instancedMesh
                ref={meshRef}
                args={[undefined, undefined, particles.length]}
                frustumCulled={false}
                position={sphereTransform.position}
                scale={sphereTransform.scale}
            >
                {/* Rectangular quad for confetti effect */}
                <planeGeometry args={[1, 1.4]} />
                <meshBasicMaterial
                    color="#E6E6FA"
                    side={THREE.DoubleSide}
                    toneMapped={false}
                    transparent={true}
                    opacity={0.98}
                />
            </instancedMesh>
        </>
    );
}

export function ParticleBurst() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [documentHeight, setDocumentHeight] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const rafRef = useRef<number | null>(null);
    const lastUpdateRef = useRef(0);

    useEffect(() => {
        const updateHeight = () => {
            setDocumentHeight(document.documentElement.scrollHeight);
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);

        // Update height after content loads
        const timer = setTimeout(updateHeight, 100);

        return () => {
            window.removeEventListener('resize', updateHeight);
            clearTimeout(timer);
        };
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Map scroll progress across entire page
    const burstProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

    // Throttle scroll progress updates with requestAnimationFrame
    useEffect(() => {
        const unsubscribe = burstProgress.on('change', (latest) => {
            // Cancel any pending update
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }

            // Throttle updates to max 60fps
            const now = performance.now();
            if (now - lastUpdateRef.current < 16) {
                rafRef.current = requestAnimationFrame(() => {
                    setScrollProgress(latest);
                    lastUpdateRef.current = now;
                });
            } else {
                setScrollProgress(latest);
                lastUpdateRef.current = now;
            }
        });

        return () => {
            unsubscribe();
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [burstProgress]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ height: documentHeight > 0 ? `${documentHeight}px` : '100vh' }}
        >
            <motion.div
                className="w-full h-screen fixed top-0 left-0"
                style={{
                    opacity: useTransform(scrollYProgress, [0, 0.85, 1], [1, 0.5, 0]),
                    willChange: 'opacity, transform'
                }}
            >
                <Canvas
                    camera={{ position: [0, 0, 4], fov: 75 }}
                    style={{ background: 'transparent', willChange: 'transform' }}
                    dpr={[1, 1.5]}
                    gl={{
                        antialias: true,
                        alpha: true,
                        powerPreference: 'high-performance',
                        stencil: false,
                        depth: true
                    }}
                    shadows={false}
                    frameloop="always"
                >
                    <ParticleField scrollProgress={scrollProgress} />
                </Canvas>
            </motion.div>
        </div>
    );
}
