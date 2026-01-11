'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface StorySectionProps {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    stats: Array<{
        value: string;
        label: string;
    }>;
    glowColor: string;
    image?: string;
    index: number;
}

export function StorySection({
    id,
    title,
    subtitle,
    description,
    stats,
    glowColor,
    image,
    index
}: StorySectionProps) {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Parallax effects
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);

    // Horizontal slide animation (alternating left/right)
    const isEven = index % 2 === 0;
    const xContent = useTransform(
        scrollYProgress,
        [0, 0.3, 0.7, 1],
        isEven ? [-100, 0, 0, -100] : [100, 0, 0, 100]
    );
    const xImage = useTransform(
        scrollYProgress,
        [0, 0.3, 0.7, 1],
        isEven ? [100, 0, 0, 100] : [-100, 0, 0, -100]
    );

    // Rotation effect
    const rotate = useTransform(scrollYProgress, [0, 0.5, 1], isEven ? [-5, 0, 5] : [5, 0, -5]);

    // Image scale transform
    const imageScale = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [1.2, 1, 1.2]);

    // Element opacity/transforms
    const glowOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 0.6, 0.6, 0]);
    const subtitleOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
    const titleOpacity = useTransform(scrollYProgress, [0.15, 0.35], [0, 1]);
    const titleY = useTransform(scrollYProgress, [0.15, 0.35], [50, 0]);
    const descOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

    return (
        <section
            id={id}
            ref={ref}
            className="story-section relative min-h-screen flex items-center py-32"
            style={{
                '--glow-color': glowColor
            } as React.CSSProperties}
        >
            {/* Section glow - animated */}
            <motion.div
                className="section-glow"
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${glowColor}15 0%, transparent 70%)`,
                    opacity: glowOpacity
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Content - slides from left/right */}
                    <motion.div
                        style={{
                            opacity,
                            x: xContent,
                            scale
                        }}
                        className={isEven ? 'md:order-1' : 'md:order-2'}
                    >
                        <motion.h3
                            className="section-subtitle text-sm uppercase tracking-widest text-text-secondary mb-4"
                            style={{ opacity: subtitleOpacity }}
                        >
                            {subtitle}
                        </motion.h3>
                        <motion.h2
                            className="section-title mb-6"
                            style={{
                                opacity: titleOpacity,
                                y: titleY
                            }}
                        >
                            {title}
                        </motion.h2>
                        <motion.p
                            className="text-lg md:text-xl text-text-secondary leading-relaxed mb-8"
                            style={{ opacity: descOpacity }}
                        >
                            {description}
                        </motion.p>

                        {/* Stats - staggered animation */}
                        <div className="grid grid-cols-3 gap-6">
                            {stats.map((stat, statIndex) => (
                                <StatItem
                                    key={statIndex}
                                    stat={stat}
                                    index={statIndex}
                                    scrollYProgress={scrollYProgress}
                                    glowColor={glowColor}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Image/Visual - slides from opposite direction with rotation */}
                    <motion.div
                        style={{
                            opacity,
                            x: xImage,
                            rotate,
                            scale
                        }}
                        className={`relative ${isEven ? 'md:order-2' : 'md:order-1'}`}
                    >
                        {image ? (
                            <div className="aspect-square rounded-2xl overflow-hidden">
                                <motion.img
                                    src={image}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                    style={{
                                        scale: imageScale
                                    }}
                                />
                            </div>
                        ) : (
                            <motion.div
                                className="aspect-square rounded-2xl flex items-center justify-center text-9xl font-bold"
                                style={{
                                    background: `linear-gradient(135deg, ${glowColor}20, ${glowColor}05)`,
                                    border: `2px solid ${glowColor}40`,
                                    boxShadow: `0 0 60px ${glowColor}30`
                                }}
                            >
                                {title[0]}
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function StatItem({ stat, index, scrollYProgress, glowColor }: {
    stat: { value: string; label: string };
    index: number;
    scrollYProgress: any;
    glowColor: string;
}) {
    const opacity = useTransform(
        scrollYProgress,
        [0.3 + index * 0.05, 0.4 + index * 0.05],
        [0, 1]
    );
    const y = useTransform(
        scrollYProgress,
        [0.3 + index * 0.05, 0.4 + index * 0.05],
        [30, 0]
    );

    return (
        <motion.div
            className="text-center"
            style={{ opacity, y }}
        >
            <div
                className="stat-value"
                style={{ color: glowColor }}
            >
                {stat.value}
            </div>
            <div className="stat-label text-xs uppercase tracking-wider text-text-secondary mt-2">
                {stat.label}
            </div>
        </motion.div>
    );
}
