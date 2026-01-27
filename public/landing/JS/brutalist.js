/**
 * ============================================
 * BRUTALIST.JS - ISTE SCTCE
 * Modern Neo-Brutalist Interactions
 * ============================================
 */

(function () {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        preloaderDuration: 500,
        scrollThreshold: 50,
        animationDuration: 0.8,
        staggerDelay: 0.1
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        isLoaded: false,
        menuOpen: false,
        scrollPosition: 0
    };

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    let elements = {};

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function init() {
        cacheElements();
        initPreloader();
        initNavigation();
        initScrollEffects();
        initAnimations();
        initEventListeners();

        initMagneticButtons();
        initHeroAnimation();
        init3DTilt();
        initCustomCursor();
        initGlitchEffect();

        console.log('🚀 ISTE SCTCE Brutalist Site initialized');
    }

    // ==========================================
    // MAGNETIC BUTTONS
    // ==========================================
    function initMagneticButtons() {
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .nav-link, .btn-event, .btn-view-all, .btn-hiring');

        buttons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                gsap.to(btn, {
                    x: x * 0.3,
                    y: y * 0.3,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
        });
    }

    // ==========================================
    // HERO TEXT ANIMATION
    // ==========================================
    function initHeroAnimation() {
        const titleLines = document.querySelectorAll('.title-line');
        titleLines.forEach(line => {
            const text = line.textContent;
            line.innerHTML = '';
            line.style.opacity = '1';

            // Wrap each char
            [...text].forEach(char => {
                const span = document.createElement('span');
                span.textContent = char;
                span.style.display = 'inline-block';
                span.style.opacity = '0';
                span.style.transform = 'translateY(100%)';
                line.appendChild(span);
            });
        });

        // Animate chars
        const chars = document.querySelectorAll('.title-line span');
        gsap.to(chars, {
            y: 0,
            opacity: 1,
            stagger: 0.03,
            duration: 1,
            ease: 'power4.out',
            delay: 0.5
        });
    }

    // ==========================================
    // 3D TILT EFFECT
    // ==========================================
    function init3DTilt() {
        const tiltElements = document.querySelectorAll('.forum-card, .event-item');

        tiltElements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -5; // Max 5 deg
                const rotateY = ((x - centerX) / centerX) * 5;

                gsap.to(el, {
                    rotationX: rotateX,
                    rotationY: rotateY,
                    transformPerspective: 1000,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });

            el.addEventListener('mouseleave', () => {
                gsap.to(el, {
                    rotationX: 0,
                    rotationY: 0,
                    duration: 0.7,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
        });
    }

    // ==========================================
    // CUSTOM CURSOR
    // ==========================================
    function initCustomCursor() {
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorCircle = document.querySelector('.cursor-circle');

        if (!cursorDot || !cursorCircle) return;

        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            gsap.to(cursorDot, {
                x: mouseX,
                y: mouseY,
                duration: 0.1
            });
        });

        // Lagging follower
        gsap.ticker.add(() => {
            const dt = 1.0 - Math.pow(1.0 - 0.2, gsap.ticker.deltaRatio());
            cursorX += (mouseX - cursorX) * dt;
            cursorY += (mouseY - cursorY) * dt;

            gsap.set(cursorCircle, { x: cursorX, y: cursorY });
        });

        // Hover effects
        const hoverables = document.querySelectorAll('a, button, .forum-card, .event-item');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => cursorCircle.classList.add('hovered'));
            el.addEventListener('mouseleave', () => cursorCircle.classList.remove('hovered'));
        });
    }

    // ==========================================
    // GLITCH EFFECT
    // ==========================================
    function initGlitchEffect() {
        const titles = document.querySelectorAll('.section-title, .hero-title, .glitch-target');

        titles.forEach(title => {
            title.classList.add('glitch-text');
            title.setAttribute('data-text', title.textContent);

            // Randomly trigger stronger glitch
            setInterval(() => {
                if (Math.random() > 0.95) {
                    title.style.animation = 'none';
                    title.offsetHeight; /* trigger reflow */
                    title.style.animation = null;
                }
            }, 3000);
        });
    }

    // ==========================================
    // CACHE DOM ELEMENTS
    // ==========================================
    function cacheElements() {
        elements = {
            preloader: document.getElementById('preloader'),
            navBar: document.querySelector('.nav-bar'),
            menuBtn: document.getElementById('menuBtn'),
            mobileMenu: document.getElementById('mobileMenu'),
            mobileLinks: document.querySelectorAll('.mobile-link'),
            heroSection: document.querySelector('.hero'),
            sections: document.querySelectorAll('section'),
            forumCards: document.querySelectorAll('.forum-card'),
            eventItems: document.querySelectorAll('.event-item'),
            marqueeTrack: document.querySelectorAll('.marquee-track')
        };
    }

    // ==========================================
    // PRELOADER
    // ==========================================
    function initPreloader() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (elements.preloader) {
                    elements.preloader.classList.add('hidden');
                }
                state.isLoaded = true;
                triggerEntranceAnimations();
            }, CONFIG.preloaderDuration);
        });
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    function initNavigation() {
        if (elements.menuBtn) {
            elements.menuBtn.addEventListener('click', toggleMobileMenu);
        }

        elements.mobileLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;

                e.preventDefault();
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    closeMobileMenu();
                    const navHeight = elements.navBar ? elements.navBar.offsetHeight : 0;
                    const targetPosition = targetElement.offsetTop - navHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    function toggleMobileMenu() {
        state.menuOpen = !state.menuOpen;

        if (elements.menuBtn) {
            elements.menuBtn.classList.toggle('active', state.menuOpen);
        }

        if (elements.mobileMenu) {
            elements.mobileMenu.classList.toggle('active', state.menuOpen);
        }

        document.body.style.overflow = state.menuOpen ? 'hidden' : '';
    }

    function closeMobileMenu() {
        state.menuOpen = false;

        if (elements.menuBtn) {
            elements.menuBtn.classList.remove('active');
        }

        if (elements.mobileMenu) {
            elements.mobileMenu.classList.remove('active');
        }

        document.body.style.overflow = '';
    }

    // ==========================================
    // SCROLL EFFECTS
    // ==========================================
    function initScrollEffects() {
        gsap.registerPlugin(ScrollTrigger);

        window.addEventListener('scroll', () => {
            state.scrollPosition = window.scrollY;

            if (elements.navBar) {
                elements.navBar.classList.toggle('scrolled', state.scrollPosition > CONFIG.scrollThreshold);
            }
        }, { passive: true });
    }

    // ==========================================
    // GSAP ANIMATIONS
    // ==========================================
    function initAnimations() {
        // Section background text parallax
        elements.sections.forEach(section => {
            const bgText = section.querySelector('.section-bg-text, .join-bg-text');
            if (bgText) {
                gsap.to(bgText, {
                    yPercent: -30,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1
                    }
                });
            }
        });

        // Forum cards animation
        elements.forumCards.forEach((card, index) => {
            gsap.from(card, {
                opacity: 0,
                y: 50,
                duration: CONFIG.animationDuration,
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                delay: (index % 2) * CONFIG.staggerDelay
            });
        });

        // Event items animation
        elements.eventItems.forEach((item, index) => {
            gsap.from(item, {
                opacity: 0,
                x: -30,
                duration: CONFIG.animationDuration,
                scrollTrigger: {
                    trigger: item,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                delay: index * CONFIG.staggerDelay
            });
        });

        // About section animation
        const aboutSection = document.querySelector('.about-section');
        if (aboutSection) {
            const aboutLeft = aboutSection.querySelector('.about-left');
            const aboutRight = aboutSection.querySelector('.about-right');

            if (aboutLeft) {
                gsap.from(aboutLeft, {
                    opacity: 0,
                    x: -50,
                    duration: 1,
                    scrollTrigger: {
                        trigger: aboutSection,
                        start: 'top 70%',
                        toggleActions: 'play none none reverse'
                    }
                });
            }

            if (aboutRight) {
                gsap.from(aboutRight, {
                    opacity: 0,
                    x: 50,
                    duration: 1,
                    scrollTrigger: {
                        trigger: aboutSection,
                        start: 'top 70%',
                        toggleActions: 'play none none reverse'
                    },
                    delay: 0.2
                });
            }
        }

        // Stats counter animation
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            const finalValue = stat.textContent;
            const numericValue = parseInt(finalValue.replace(/\D/g, ''));
            const suffix = finalValue.replace(/[0-9]/g, '');

            if (!isNaN(numericValue)) {
                gsap.from(stat, {
                    textContent: 0,
                    duration: 2,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: stat,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    },
                    snap: { textContent: 1 },
                    onUpdate: function () {
                        stat.textContent = Math.floor(this.targets()[0].textContent) + suffix;
                    }
                });
            }
        });

        // Join section animation
        const joinSection = document.querySelector('.join-section');
        if (joinSection) {
            gsap.from(joinSection.querySelector('.join-content'), {
                opacity: 0,
                y: 50,
                scale: 0.95,
                duration: 1,
                scrollTrigger: {
                    trigger: joinSection,
                    start: 'top 70%',
                    toggleActions: 'play none none reverse'
                }
            });
        }

        // Contact section animation
        const contactSection = document.querySelector('.contact-section');
        if (contactSection) {
            const contactLeft = contactSection.querySelector('.contact-left');
            const contactRight = contactSection.querySelector('.contact-right');

            if (contactLeft) {
                gsap.from(contactLeft, {
                    opacity: 0,
                    x: -50,
                    duration: 1,
                    scrollTrigger: {
                        trigger: contactSection,
                        start: 'top 70%',
                        toggleActions: 'play none none reverse'
                    }
                });
            }

            if (contactRight) {
                gsap.from(contactRight, {
                    opacity: 0,
                    x: 50,
                    duration: 1,
                    scrollTrigger: {
                        trigger: contactSection,
                        start: 'top 70%',
                        toggleActions: 'play none none reverse'
                    },
                    delay: 0.2
                });
            }
        }
    }

    // ==========================================
    // ENTRANCE ANIMATIONS
    // ==========================================
    function triggerEntranceAnimations() {
        const heroBgText = document.querySelector('.hero-bg-text');
        if (heroBgText) {
            gsap.from(heroBgText, {
                opacity: 0,
                scale: 0.8,
                duration: 1.5,
                ease: 'power3.out'
            });
        }
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    function initEventListeners() {
        // Forum card hover effects
        elements.forumCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    scale: 1.01,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.menuOpen) {
                closeMobileMenu();
            }
        });
    }

    // ==========================================
    // EXPOSE PUBLIC API
    // ==========================================
    window.ISTE = {
        init,
        toggleMobileMenu,
        getState: () => ({ ...state })
    };

    // ==========================================
    // AUTO-INITIALIZE
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
