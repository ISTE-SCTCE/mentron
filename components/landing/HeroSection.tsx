'use client';

import { motion, useScroll, useTransform } from 'framer-motion';


export function HeroSection() {
    const { scrollYProgress } = useScroll();



    return (
        <section className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Animated glow */}
            <div className="hero-glow" />

            {/* Text Container with Fade Out */}
            <motion.div
                className="relative z-10 max-w-7xl mx-auto px-6 text-center select-none"
                style={{ opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0]) }}
            >
                <h1 className="text-[10rem] leading-none font-black tracking-wider text-white mix-blend-difference">
                    MENTR<span id="sphere-placeholder" className="opacity-0 mx-4">O</span>N
                </h1>
                <p className="text-xl text-gray-400 mt-8 max-w-2xl mx-auto font-light tracking-wide">
                    SHAPING THE FUTURE OF EDUCATION
                </p>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2"
            >
                <div className="scroll-indicator">
                    <div className="scroll-indicator-dot" />
                </div>
            </motion.div>
        </section>
    );
}
