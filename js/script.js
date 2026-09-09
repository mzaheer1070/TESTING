/**
 * Muhammad Zaheer Portfolio - Interactive Scripts & Developer Engine
 * Lightweight, accessible, performant vanilla JavaScript
 */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==========================================================================
   AMBIENT ANIMATED BACKGROUND ENGINE
   ========================================================================== */

/* ==========================================================================
   AMBIENT INTERACTIVE BACKGROUND ENGINE (High-Graphics HD Retina & Ultra-Smooth 60/120fps)
   ========================================================================== */

const AmbientBackgroundEngine = (() => {
    // Locked single theme: Galaxy Matrix (Constellation)
    const MODES = [
        { id: "constellation", name: "Galaxy Matrix", icon: "✨" }
    ];

    let currentModeIndex = 0;
    let canvas = null;
    let ctx = null;
    let animationFrameId = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let backgroundStars = [];
    let cyberStreams = [];
    let waveRibbons = [];
    let isTabActive = true;
    let lastTimestamp = 0;

    // Mouse tracking with velocity & smooth lerped position
    let mouse = {
        x: -9999,
        y: -9999,
        targetX: -9999,
        targetY: -9999,
        vx: 0,
        vy: 0,
        radius: 190,
        isDown: false
    };

    // Parallax tracking for ambient blurred orbs & mesh
    let orbParallax = { currentX: 0, currentY: 0, targetX: 0, targetY: 0 };

    function init() {
        let bgContainer = document.getElementById("ambientBg");
        if (!bgContainer) {
            bgContainer = document.createElement("div");
            bgContainer.id = "ambientBg";
            bgContainer.className = "ambient-bg-container";
            bgContainer.setAttribute("aria-hidden", "true");
            bgContainer.innerHTML = `
                <div class="ambient-mesh-layer"></div>
                <div class="ambient-orb orb-primary"></div>
                <div class="ambient-orb orb-secondary"></div>
                <div class="ambient-orb orb-accent"></div>
                <canvas id="ambientCanvas" class="ambient-particle-canvas"></canvas>
            `;
            document.body.prepend(bgContainer);
        }

        canvas = document.getElementById("ambientCanvas");
        if (!canvas) return;
        ctx = canvas.getContext("2d", { alpha: true });

        // Load saved mode
        let savedMode = "constellation";
        try {
            savedMode = localStorage.getItem("portfolio-bg-mode") || "constellation";
        } catch (e) {}
        
        const foundIdx = MODES.findIndex(m => m.id === savedMode);
        currentModeIndex = foundIdx !== -1 ? foundIdx : 0;
        applyMode(MODES[currentModeIndex].id, false);

        // Global pointer events with passive tracking
        window.addEventListener("pointermove", (e) => {
            const prevX = mouse.targetX;
            const prevY = mouse.targetY;
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
            mouse.vx = e.clientX - prevX;
            mouse.vy = e.clientY - prevY;

            // Smooth parallax target (-35px to +35px range)
            orbParallax.targetX = ((e.clientX / window.innerWidth) - 0.5) * 60;
            orbParallax.targetY = ((e.clientY / window.innerHeight) - 0.5) * 60;
        }, { passive: true });

        window.addEventListener("pointerleave", () => {
            mouse.targetX = -9999;
            mouse.targetY = -9999;
            orbParallax.targetX = 0;
            orbParallax.targetY = 0;
        }, { passive: true });

        window.addEventListener("pointerdown", () => {
            mouse.isDown = true;
        }, { passive: true });

        window.addEventListener("pointerup", () => {
            mouse.isDown = false;
        }, { passive: true });

        // High-DPI Window resize handler
        window.addEventListener("resize", resize, { passive: true });
        resize();

        // Visibility tab change listener to save CPU/GPU cycles when blurred
        document.addEventListener("visibilitychange", () => {
            isTabActive = !document.hidden;
            if (isTabActive) {
                lastTimestamp = performance.now();
                requestAnimationFrame(render);
            }
        });

        // Setup background mode switcher buttons across DOM
        setupModeButtons();

        if (!prefersReducedMotion) {
            lastTimestamp = performance.now();
            requestAnimationFrame(render);
        }
    }

    function resize() {
        if (!canvas || !ctx) return;
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for optimal high-DPI quality + 60fps performance
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initModeEntities();
    }

    function initModeEntities() {
        particles = [];
        backgroundStars = [];
        cyberStreams = [];
        waveRibbons = [];
        const mode = MODES[currentModeIndex].id;

        // Ambient micro-stardust background (shared across high-fidelity modes)
        const starCount = Math.min(Math.floor((width * height) / 22000), 50);
        for (let i = 0; i < starCount; i++) {
            backgroundStars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.2 + 0.4,
                alpha: Math.random() * 0.35 + 0.1,
                twinkleSpeed: Math.random() * 0.002 + 0.001,
                phase: Math.random() * Math.PI * 2
            });
        }

        if (mode === "constellation") {
            // High-density primary constellation nodes
            const count = Math.min(Math.floor((width * height) / 18000), 65);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (Math.random() - 0.5) * 0.6,
                    radius: Math.random() * 2.4 + 1.2,
                    alpha: Math.random() * 0.5 + 0.35,
                    baseAlpha: Math.random() * 0.5 + 0.35,
                    pulse: Math.random() * Math.PI * 2,
                    pulseSpeed: Math.random() * 0.03 + 0.015,
                    isCore: Math.random() > 0.75
                });
            }
        } else if (mode === "nebula") {
            // Cosmic shimmering multi-tier stars with cross-flares
            const count = Math.min(Math.floor((width * height) / 12000), 95);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 3.0 + 0.8,
                    alpha: Math.random() * 0.75 + 0.25,
                    baseAlpha: Math.random() * 0.75 + 0.25,
                    twinkleSpeed: Math.random() * 0.04 + 0.015,
                    hueOffset: Math.random() * 60 - 30,
                    hasCrossFlare: Math.random() > 0.65
                });
            }
        } else if (mode === "cyber") {
            // Cyber optic fiber data beams
            const cols = Math.floor(width / 36);
            for (let i = 0; i < cols; i++) {
                cyberStreams.push({
                    x: i * 36 + 18,
                    y: Math.random() * height,
                    speed: Math.random() * 3.2 + 1.8,
                    length: Math.floor(Math.random() * 16 + 8),
                    alpha: Math.random() * 0.45 + 0.25,
                    headSize: Math.random() * 2.2 + 1.4,
                    colorType: Math.random() > 0.3 ? "cyan" : "sapphire"
                });
            }
        } else if (mode === "waves") {
            // High-resolution multi-harmonic continuous wave ribbons
            const ribbonCount = 5;
            for (let r = 0; r < ribbonCount; r++) {
                waveRibbons.push({
                    baseY: (height * 0.35) + (r * (height * 0.12)),
                    amplitude: 28 + r * 8,
                    frequency: 0.0022 - r * 0.0003,
                    speed: 0.0018 + r * 0.0004,
                    phase: r * 1.2,
                    alpha: 0.38 - r * 0.05,
                    color: r % 2 === 0 ? "teal" : "cyan"
                });
            }
        }
    }

    function applyMode(modeId = "constellation", showToastNotice = false) {
        const bgContainer = document.getElementById("ambientBg");
        if (bgContainer) {
            bgContainer.className = "ambient-bg-container mode-constellation";
        }

        try {
            localStorage.setItem("portfolio-bg-mode", "constellation");
        } catch (e) {}

        initModeEntities();
    }

    function cycleMode() {
        currentModeIndex = 0;
        applyMode("constellation", true);
    }

    function setModeById(id) {
        currentModeIndex = 0;
        applyMode("constellation", false);
    }

    function setupModeButtons() {
        document.querySelectorAll("[data-bg-toggle]").forEach(btn => {
            btn.addEventListener("click", () => {
                cycleMode();
            });
        });
    }

    function render(timestamp) {
        if (!isTabActive) return;

        // Delta-time scaling for perfectly smooth 60/120fps
        if (!lastTimestamp) lastTimestamp = timestamp;
        const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
        lastTimestamp = timestamp;
        const timeScale = delta * 60; // 1.0 at 60fps

        // Ultra-smooth mouse position lerp
        if (mouse.targetX !== -9999) {
            mouse.x += (mouse.targetX - mouse.x) * 0.18;
            mouse.y += (mouse.targetY - mouse.y) * 0.18;
        } else {
            mouse.x = -9999;
            mouse.y = -9999;
        }

        // Parallax smooth interpolation on ambient orbs and mesh
        orbParallax.currentX += (orbParallax.targetX - orbParallax.currentX) * 0.05;
        orbParallax.currentY += (orbParallax.targetY - orbParallax.currentY) * 0.05;

        const orbs = document.querySelectorAll(".ambient-orb");
        if (orbs.length >= 3) {
            orbs[0].style.transform = `translate3d(${-orbParallax.currentX * 1.5}px, ${-orbParallax.currentY * 1.5}px, 0)`;
            orbs[1].style.transform = `translate3d(${orbParallax.currentX * 1.9}px, ${orbParallax.currentY * 1.9}px, 0)`;
            orbs[2].style.transform = `translate3d(${-orbParallax.currentX * 1.1}px, ${orbParallax.currentY * 1.1}px, 0)`;
        }
        const mesh = document.querySelector(".ambient-mesh-layer");
        if (mesh) {
            mesh.style.transform = `translate3d(${orbParallax.currentX * 0.35}px, ${orbParallax.currentY * 0.35}px, 0)`;
        }

        ctx.clearRect(0, 0, width, height);

        const isDark = document.documentElement.dataset.theme !== "light";
        const mode = MODES[currentModeIndex].id;

        // Render ambient background micro-starfield (HD Depth layer)
        for (let i = 0; i < backgroundStars.length; i++) {
            const star = backgroundStars[i];
            const starAlpha = star.alpha + Math.sin(timestamp * star.twinkleSpeed + star.phase) * 0.08;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${Math.max(0.04, starAlpha)})` : `rgba(15, 23, 42, ${Math.max(0.04, starAlpha * 0.8)})`;
            ctx.fill();
        }

        // Draw Interactive Spotlight Glow at Mouse position with soft multi-stage falloff
        if (mouse.x > 0 && mouse.y > 0) {
            const spotGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 240);
            let spotRGB = "16, 185, 129";
            if (mode === "nebula") spotRGB = isDark ? "192, 132, 252" : "147, 51, 234";
            else if (mode === "cyber") spotRGB = isDark ? "6, 182, 212" : "2, 132, 199";
            else if (mode === "waves") spotRGB = isDark ? "45, 212, 191" : "13, 148, 136";

            spotGrad.addColorStop(0, `rgba(${spotRGB}, ${isDark ? "0.14" : "0.08"})`);
            spotGrad.addColorStop(0.5, `rgba(${spotRGB}, ${isDark ? "0.05" : "0.03"})`);
            spotGrad.addColorStop(1, `rgba(${spotRGB}, 0)`);
            ctx.fillStyle = spotGrad;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 240, 0, Math.PI * 2);
            ctx.fill();
        }

        // ==========================================
        // MODE 1: GALAXY MATRIX (High-Graphics Neural Constellation)
        // ==========================================
        if (mode === "constellation") {
            const primaryRGB = isDark ? "16, 185, 129" : "5, 150, 105";
            const accentRGB = isDark ? "56, 189, 248" : "2, 132, 199";

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                p.x += p.vx * timeScale;
                p.y += p.vy * timeScale;

                // Smooth edge wraparound
                if (p.x < -10) p.x = width + 10;
                if (p.x > width + 10) p.x = -10;
                if (p.y < -10) p.y = height + 10;
                if (p.y > height + 10) p.y = -10;

                // Dynamic pulsation
                p.pulse += p.pulseSpeed * timeScale;
                const pulseRadius = p.radius + Math.sin(p.pulse) * (p.isCore ? 0.8 : 0.3);

                // Smooth Mouse Gravity & Attraction
                if (mouse.x > 0 && mouse.y > 0) {
                    const dx = mouse.x - p.x;
                    const dy = mouse.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < mouse.radius) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        p.x += (dx / dist) * force * 2.2 * timeScale;
                        p.y += (dy / dist) * force * 2.2 * timeScale;
                        p.alpha = Math.min(p.baseAlpha + 0.45, 0.95);
                    } else {
                        p.alpha += (p.baseAlpha - p.alpha) * 0.05 * timeScale;
                    }
                }

                // Draw Core & Soft Luminescent Halo
                if (p.isCore) {
                    const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseRadius * 3.5);
                    halo.addColorStop(0, `rgba(${accentRGB}, ${p.alpha * 0.45})`);
                    halo.addColorStop(1, `rgba(${accentRGB}, 0)`);
                    ctx.fillStyle = halo;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, pulseRadius * 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
                ctx.fillStyle = p.isCore ? `rgba(${accentRGB}, ${p.alpha})` : `rgba(${primaryRGB}, ${p.alpha})`;
                ctx.shadowBlur = p.isCore ? 10 : 5;
                ctx.shadowColor = p.isCore ? `rgba(${accentRGB}, 0.7)` : `rgba(${primaryRGB}, 0.5)`;
                ctx.fill();
                ctx.shadowBlur = 0;

                // High-fidelity Dual-Color Gradient Connections
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 135) {
                        const lineAlpha = (1 - dist / 135) * 0.28;
                        const lineGrad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
                        lineGrad.addColorStop(0, `rgba(${primaryRGB}, ${lineAlpha * p.alpha})`);
                        lineGrad.addColorStop(1, `rgba(${accentRGB}, ${lineAlpha * p2.alpha})`);

                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = lineGrad;
                        ctx.lineWidth = dist < 70 ? 1.2 : 0.8;
                        ctx.stroke();
                    }
                }
            }
        } 
        // ==========================================
        // MODE 2: STARLIGHT NEBULA (Cosmic Aurora & Diamond Cross Glimmers)
        // ==========================================
        else if (mode === "nebula") {
            const baseHue = isDark ? 280 : 265;

            // Render flowing Cosmic Aurora ribbon in the background
            const auroraGrad = ctx.createLinearGradient(0, height * 0.1, width, height * 0.9);
            const aTime = timestamp * 0.0006;
            const a1 = Math.sin(aTime) * 0.5 + 0.5;
            const a2 = Math.cos(aTime * 0.8) * 0.5 + 0.5;
            auroraGrad.addColorStop(0, `hsla(${baseHue - 20}, 80%, ${isDark ? "60%" : "45%"}, ${isDark ? 0.04 * a1 : 0.02 * a1})`);
            auroraGrad.addColorStop(0.5, `hsla(${baseHue + 40}, 85%, ${isDark ? "65%" : "50%"}, ${isDark ? 0.06 * a2 : 0.03 * a2})`);
            auroraGrad.addColorStop(1, `hsla(${baseHue + 90}, 80%, ${isDark ? "60%" : "45%"}, ${isDark ? 0.04 * a1 : 0.02 * a1})`);
            ctx.fillStyle = auroraGrad;
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx * timeScale;
                p.y += p.vy * timeScale;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Smooth sinusoidal twinkling
                p.alpha += Math.sin(timestamp * p.twinkleSpeed) * 0.018 * timeScale;
                p.alpha = Math.max(0.15, Math.min(0.95, p.alpha));

                // Mouse Celestial Gravity Bend
                if (mouse.x > 0 && mouse.y > 0) {
                    const dx = mouse.x - p.x;
                    const dy = mouse.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 180) {
                        const force = (180 - dist) / 180;
                        p.x -= (dx / dist) * force * 1.5 * timeScale;
                        p.y -= (dy / dist) * force * 1.5 * timeScale;
                    }
                }

                const starColor = `hsla(${baseHue + p.hueOffset}, 88%, ${isDark ? "78%" : "50%"}, ${p.alpha})`;

                // Draw 4-point Diamond Cross-Flare for prominent celestial bodies
                if (p.hasCrossFlare && p.alpha > 0.45) {
                    const flareLen = p.radius * 3.8 * p.alpha;
                    ctx.beginPath();
                    ctx.moveTo(p.x - flareLen, p.y);
                    ctx.lineTo(p.x + flareLen, p.y);
                    ctx.moveTo(p.x, p.y - flareLen);
                    ctx.lineTo(p.x, p.y + flareLen);
                    ctx.strokeStyle = `hsla(${baseHue + p.hueOffset}, 95%, 90%, ${p.alpha * 0.55})`;
                    ctx.lineWidth = 0.9;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = starColor;
                ctx.shadowBlur = 8;
                ctx.shadowColor = starColor;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        // ==========================================
        // MODE 3: CYBER MATRIX (Fiber-Optic Data Beams & Circuit Glow)
        // ==========================================
        else if (mode === "cyber") {
            const cyanRGB = isDark ? "6, 182, 212" : "2, 132, 199";
            const sapphireRGB = isDark ? "59, 130, 246" : "37, 99, 235";

            for (let i = 0; i < cyberStreams.length; i++) {
                const s = cyberStreams[i];
                s.y += s.speed * timeScale;

                if (s.y > height + 80) {
                    s.y = -80;
                    s.speed = Math.random() * 3.2 + 1.8;
                }

                // Interactive Mouse Speed Acceleration
                if (mouse.x > 0 && Math.abs(mouse.x - s.x) < 70) {
                    s.y += 3.5 * timeScale;
                }

                const streamRGB = s.colorType === "cyan" ? cyanRGB : sapphireRGB;
                const streamLengthPx = s.length * 14;

                // Render smooth glowing trail gradient
                const trailGrad = ctx.createLinearGradient(s.x, s.y - streamLengthPx, s.x, s.y);
                trailGrad.addColorStop(0, `rgba(${streamRGB}, 0)`);
                trailGrad.addColorStop(0.7, `rgba(${streamRGB}, ${s.alpha * 0.5})`);
                trailGrad.addColorStop(1, `rgba(${streamRGB}, ${s.alpha * 0.95})`);

                ctx.beginPath();
                ctx.moveTo(s.x, s.y - streamLengthPx);
                ctx.lineTo(s.x, s.y);
                ctx.strokeStyle = trailGrad;
                ctx.lineWidth = s.headSize;
                ctx.stroke();

                // High-Luminosity Leading Data Packet Head
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.headSize * 1.3, 0, Math.PI * 2);
                ctx.fillStyle = isDark ? "#ffffff" : `rgba(${streamRGB}, 1)`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = `rgba(${streamRGB}, 0.9)`;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        // ==========================================
        // MODE 4: FLUID WAVES (High-Poly Multi-Harmonic Ocean Ribbons)
        // ==========================================
        else if (mode === "waves") {
            const isDarkTheme = isDark;

            waveRibbons.forEach((ribbon, rIdx) => {
                const time = timestamp * ribbon.speed;
                ctx.beginPath();
                ctx.moveTo(0, height);

                const segments = 45;
                const step = width / segments;

                for (let x = 0; x <= width + step; x += step) {
                    // Multi-harmonic sinusoidal wave calculation
                    const wave1 = Math.sin(x * ribbon.frequency + time + ribbon.phase) * ribbon.amplitude;
                    const wave2 = Math.cos(x * ribbon.frequency * 1.8 - time * 0.6) * (ribbon.amplitude * 0.35);
                    let y = ribbon.baseY + wave1 + wave2;

                    // Interactive Fluid Surface Displacement by Pointer
                    if (mouse.x > 0 && mouse.y > 0) {
                        const dx = x - mouse.x;
                        const dy = y - mouse.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 220) {
                            const force = (220 - dist) / 220;
                            y += Math.sin(force * Math.PI) * 32 * (rIdx % 2 === 0 ? 1 : -1);
                        }
                    }

                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();

                // Chromatic fluid depth gradient
                const waveGrad = ctx.createLinearGradient(0, ribbon.baseY - ribbon.amplitude, width, height);
                const colorRGB = ribbon.color === "teal" 
                    ? (isDarkTheme ? "45, 212, 191" : "13, 148, 136") 
                    : (isDarkTheme ? "14, 165, 233" : "2, 132, 199");

                waveGrad.addColorStop(0, `rgba(${colorRGB}, ${ribbon.alpha * (isDarkTheme ? 0.35 : 0.22)})`);
                waveGrad.addColorStop(1, `rgba(${colorRGB}, 0.02)`);

                ctx.fillStyle = waveGrad;
                ctx.fill();

                // Subtle crest highlights
                ctx.strokeStyle = `rgba(${colorRGB}, ${ribbon.alpha * 0.8})`;
                ctx.lineWidth = 1.4;
                ctx.stroke();
            });
        }

        animationFrameId = requestAnimationFrame(render);
    }

    return {
        init,
        cycleMode,
        setModeById,
        getModes: () => MODES,
        getCurrentMode: () => MODES[currentModeIndex]
    };
})();

function setupAmbientBackground() {
    AmbientBackgroundEngine.init();
}

/* ==========================================================================
   TOAST NOTIFICATION SYSTEM
   ========================================================================== */

function showToast(message, icon = "✓", duration = 2800) {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        container.setAttribute("aria-live", "polite");
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("is-visible"));

    setTimeout(() => {
        toast.classList.remove("is-visible");
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function copyToClipboard(text, successMsg = "Copied to clipboard!") {
    navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg, "📋");
    }).catch(() => {
        // Fallback
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        showToast(successMsg, "📋");
    });
}

/* ==========================================================================
   THEME TOGGLE SYSTEM
   ========================================================================== */

function setTheme(theme) {
    const validTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = validTheme;
    try {
        localStorage.setItem("portfolio-theme", validTheme);
    } catch (e) {
        // Ignore localStorage errors
    }

    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
        const nextMode = validTheme === "dark" ? "Light" : "Dark";
        btn.setAttribute("aria-label", `Switch to ${nextMode} Mode`);
        btn.setAttribute("title", `Switch to ${nextMode} Mode`);
    });
}

function setupThemeToggle() {
    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem("portfolio-theme");
    } catch (e) {
        savedTheme = null;
    }

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(savedTheme || systemTheme || "dark");

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem("portfolio-theme")) {
            setTheme(e.matches ? "dark" : "light");
        }
    });

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const currentTheme = document.documentElement.dataset.theme || "dark";
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            setTheme(nextTheme);
            if (window.CinematicAudio) CinematicAudio.playClick();
            showToast(`Switched to ${nextTheme === "dark" ? "Dark" : "Light"} mode`, nextTheme === "dark" ? "🌙" : "☀️");
        });
    });
}

/* ==========================================================================
   SCROLL PROGRESS BAR
   ========================================================================== */

function setupScrollProgress() {
    let progressBar = document.getElementById("scrollProgress");
    if (!progressBar) {
        progressBar = document.createElement("div");
        progressBar.id = "scrollProgress";
        progressBar.className = "scroll-progress-bar";
        document.body.appendChild(progressBar);
    }

    window.addEventListener("scroll", () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        progressBar.style.width = `${progress}%`;
    }, { passive: true });
}

/* ==========================================================================
   LIVE REAL-TIME CLOCK & STATUS
   ========================================================================== */

function setupLiveClock() {
    const clockElements = document.querySelectorAll("[data-live-clock]");
    if (!clockElements.length) return;

    function updateClock() {
        const now = new Date();
        // Format in PKT (UTC+5) or Local with timezone indicator
        const timeString = now.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        
        clockElements.forEach((elem) => {
            elem.textContent = `${timeString} UTC+5`;
        });
    }

    updateClock();
    setInterval(updateClock, 1000);
}

/* ==========================================================================
   NAVIGATION & ACTIVE STATES
   ========================================================================== */

function setupNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const panel = document.querySelector(".nav-panel");
    const currentPage = document.body.dataset.page || "home";

    document.querySelectorAll(".nav-link").forEach((link) => {
        const href = link.getAttribute("href") || "";
        const targetPage = href.replace(".html", "").replace("index", "home") || "home";

        if (targetPage === currentPage || (currentPage === "home" && href === "index.html")) {
            link.classList.add("is-active");
            link.setAttribute("aria-current", "page");
        }

        link.addEventListener("click", () => {
            if (!toggle || !panel) return;
            toggle.setAttribute("aria-expanded", "false");
            panel.classList.remove("is-open");
            document.body.classList.remove("nav-open");
        });
    });

    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isOpen));
        panel.classList.toggle("is-open", !isOpen);
        document.body.classList.toggle("nav-open", !isOpen);
    });

    document.addEventListener("click", (e) => {
        if (panel.classList.contains("is-open") && !panel.contains(e.target) && !toggle.contains(e.target)) {
            toggle.setAttribute("aria-expanded", "false");
            panel.classList.remove("is-open");
            document.body.classList.remove("nav-open");
        }
    });
}

/* ==========================================================================
   SCROLL REVEAL ANIMATIONS
   ========================================================================== */

function setupRevealAnimations() {
    const revealItems = document.querySelectorAll("[data-reveal]");

    if (!revealItems.length || prefersReducedMotion) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    document.body.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));
}

/* ==========================================================================
   TYPING ROLES ANIMATION
   ========================================================================== */

function setupTypedRoles() {
    const roleElem = document.querySelector("[data-roles]");
    if (!roleElem || prefersReducedMotion) return;

    const roles = roleElem.dataset.roles
        .split("|")
        .map((r) => r.trim())
        .filter(Boolean);

    if (roles.length < 2) return;

    let roleIndex = 0;
    let charIndex = roles[0].length;
    let isDeleting = true;

    function tick() {
        const currentRole = roles[roleIndex];

        if (isDeleting) {
            charIndex--;
            roleElem.textContent = currentRole.substring(0, charIndex);

            if (charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                setTimeout(tick, 300);
                return;
            }
            setTimeout(tick, 45);
        } else {
            charIndex++;
            roleElem.textContent = currentRole.substring(0, charIndex);

            if (charIndex === currentRole.length) {
                isDeleting = true;
                setTimeout(tick, 2200);
                return;
            }
            setTimeout(tick, 75);
        }
    }

    setTimeout(tick, 1800);
}

/* ==========================================================================
   ANIMATED NUMBER COUNTERS
   ========================================================================== */

function setupCounters() {
    const counters = document.querySelectorAll("[data-count-to]");
    if (!counters.length) return;

    const runCounter = (counter) => {
        const target = Number(counter.dataset.countTo);
        const duration = prefersReducedMotion ? 1 : 1100;
        const startTime = performance.now();

        const tick = (currentTime) => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.round(target * easeProgress);

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                counter.textContent = target;
            }
        };

        requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                runCounter(entry.target);
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.5 }
    );

    counters.forEach((counter) => observer.observe(counter));
}

/* ==========================================================================
   ACCESSIBLE TABS (ABOUT PAGE)
   ========================================================================== */

function setupTabs() {
    document.querySelectorAll("[data-tabs]").forEach((tabGroup) => {
        const buttons = Array.from(tabGroup.querySelectorAll("[data-tab]"));

        buttons.forEach((button, index) => {
            button.addEventListener("click", () => {
                buttons.forEach((btn) => {
                    const panel = document.getElementById(btn.dataset.tab);
                    const isActive = btn === button;

                    btn.classList.toggle("is-active", isActive);
                    btn.setAttribute("aria-selected", String(isActive));

                    if (panel) {
                        panel.hidden = !isActive;
                    }
                });
            });

            button.addEventListener("keydown", (e) => {
                let nextIndex = null;
                if (e.key === "ArrowRight") {
                    nextIndex = (index + 1) % buttons.length;
                } else if (e.key === "ArrowLeft") {
                    nextIndex = (index - 1 + buttons.length) % buttons.length;
                }

                if (nextIndex !== null) {
                    buttons[nextIndex].focus();
                    buttons[nextIndex].click();
                }
            });
        });
    });
}

/* ==========================================================================
   PROJECT FILTERS & SEARCH
   ========================================================================== */

function setupProjectFilters() {
    const filters = document.querySelectorAll("[data-filter]");
    const cards = document.querySelectorAll(".project-card[data-category]");

    if (!filters.length || !cards.length) return;

    filters.forEach((filter) => {
        filter.addEventListener("click", () => {
            const selected = filter.dataset.filter;

            filters.forEach((btn) => {
                const isActive = btn === filter;
                btn.classList.toggle("is-active", isActive);
                btn.setAttribute("aria-pressed", String(isActive));
            });

            cards.forEach((card) => {
                const categories = (card.dataset.category || "").split(" ");
                const match = selected === "all" || categories.includes(selected);
                
                if (match) {
                    card.hidden = false;
                    card.classList.add("is-visible");
                } else {
                    card.hidden = true;
                }
            });
        });
    });
}

/* ==========================================================================
   EXPANDABLE CARD DETAILS
   ========================================================================== */

function setupCardDetails() {
    document.querySelectorAll(".project-card .card-toggle").forEach((button) => {
        const card = button.closest(".project-card");
        const details = card ? card.querySelector(".card-details") : null;
        if (!details) return;

        button.addEventListener("click", () => {
            const expanded = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", String(!expanded));
            button.textContent = expanded ? "View Details" : "Hide Details";
            details.hidden = expanded;
        });
    });
}

/* ==========================================================================
   CINEMATIC AUDIO ENGINE (Zero-Asset Web Audio API Synthesizer)
   ========================================================================== */

const CinematicAudio = (() => {
    let ctx = null;
    let enabled = false;

    function getAudioContext() {
        if (!ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                ctx = new AudioCtx();
            }
        }
        if (ctx && ctx.state === "suspended") {
            ctx.resume();
        }
        return ctx;
    }

    return {
        isEnabled() {
            return enabled;
        },
        setEnabled(state) {
            enabled = !!state;
            if (enabled) {
                getAudioContext();
                this.playChime();
            }
            try {
                localStorage.setItem("portfolio-sound", enabled ? "true" : "false");
            } catch (e) {}
        },
        initFromStorage() {
            try {
                enabled = localStorage.getItem("portfolio-sound") === "true";
            } catch (e) {
                enabled = false;
            }
            return enabled;
        },
        playHover() {
            if (!enabled) return;
            const ac = getAudioContext();
            if (!ac) return;
            try {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(2400, ac.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.03);
                gain.gain.setValueAtTime(0.015, ac.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.03);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start();
                osc.stop(ac.currentTime + 0.035);
            } catch (e) {}
        },
        playClick() {
            if (!enabled) return;
            const ac = getAudioContext();
            if (!ac) return;
            try {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(600, ac.currentTime);
                osc.frequency.exponentialRampToValueAtTime(140, ac.currentTime + 0.05);
                gain.gain.setValueAtTime(0.04, ac.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start();
                osc.stop(ac.currentTime + 0.06);
            } catch (e) {}
        },
        playModalOpen() {
            if (!enabled) return;
            const ac = getAudioContext();
            if (!ac) return;
            try {
                // Cinematic Sub-Bass drop
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(160, ac.currentTime);
                osc.frequency.exponentialRampToValueAtTime(42, ac.currentTime + 0.35);
                gain.gain.setValueAtTime(0.08, ac.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.4);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start();
                osc.stop(ac.currentTime + 0.42);
            } catch (e) {}
        },
        playChime() {
            if (!enabled) return;
            const ac = getAudioContext();
            if (!ac) return;
            try {
                [523.25, 659.25, 783.99].forEach((freq, i) => {
                    const osc = ac.createOscillator();
                    const gain = ac.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.06);
                    gain.gain.setValueAtTime(0.03, ac.currentTime + i * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.06 + 0.25);
                    osc.connect(gain);
                    gain.connect(ac.destination);
                    osc.start(ac.currentTime + i * 0.06);
                    osc.stop(ac.currentTime + i * 0.06 + 0.28);
                });
            } catch (e) {}
        },
        playWarp() {
            if (!enabled) return;
            const ac = getAudioContext();
            if (!ac) return;
            try {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(200, ac.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.12);
                gain.gain.setValueAtTime(0.02, ac.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.14);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start();
                osc.stop(ac.currentTime + 0.15);
            } catch (e) {}
        }
    };
})();

/* ==========================================================================
   CINEMATIC DIRECTOR'S MODE & GRAIN ENGINE
   ========================================================================== */

function setupCinematicMode() {
    // 1. Ensure letterbox bars and film grain overlay exist in DOM
    if (!document.querySelector(".cinematic-grain")) {
        const grain = document.createElement("div");
        grain.className = "cinematic-grain";
        grain.setAttribute("aria-hidden", "true");
        document.body.prepend(grain);
    }

    if (!document.querySelector(".cinematic-letterbox-top")) {
        const lbTop = document.createElement("div");
        lbTop.className = "cinematic-letterbox-top";
        lbTop.setAttribute("aria-hidden", "true");
        const lbBottom = document.createElement("div");
        lbBottom.className = "cinematic-letterbox-bottom";
        lbBottom.setAttribute("aria-hidden", "true");
        document.body.appendChild(lbTop);
        document.body.appendChild(lbBottom);
    }

    const toggleButtons = document.querySelectorAll("[data-cinematic-toggle]");

    function setCinematic(active, showNotice = true) {
        document.body.classList.toggle("cinematic-mode", active);
        toggleButtons.forEach(btn => {
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });
        try {
            localStorage.setItem("portfolio-cinema", active ? "true" : "false");
        } catch (e) {}

        if (showNotice) {
            if (active) {
                CinematicAudio.playModalOpen();
                showToast("Cinematic Director's View Enabled (21:9 Framing)", "🎬");
            } else {
                showToast("Standard View Restored", "🎞️");
            }
        }
    }

    let savedCinema = false;
    try {
        savedCinema = localStorage.getItem("portfolio-cinema") === "true";
    } catch (e) {}

    setCinematic(savedCinema, false);

    toggleButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const isCurrently = document.body.classList.contains("cinematic-mode");
            setCinematic(!isCurrently, true);
        });
    });

    // Keyboard shortcut Shift + C
    window.addEventListener("keydown", (e) => {
        if (e.shiftKey && (e.key === "C" || e.key === "c") && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
            e.preventDefault();
            const isCurrently = document.body.classList.contains("cinematic-mode");
            setCinematic(!isCurrently, true);
        }
    });
}

/* ==========================================================================
   CINEMATIC SOUND FX CONTROLLER
   ========================================================================== */

function setupSoundToggle() {
    const isEnabled = CinematicAudio.initFromStorage();
    const buttons = document.querySelectorAll("[data-sound-toggle]");

    function updateButtons(active) {
        buttons.forEach(btn => {
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
            const icon = btn.querySelector(".sound-icon");
            if (icon) {
                icon.textContent = active ? "🔊" : "🔇";
            }
        });
    }

    updateButtons(isEnabled);

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const next = !CinematicAudio.isEnabled();
            CinematicAudio.setEnabled(next);
            updateButtons(next);
            showToast(next ? "Cinematic Audio FX: ON" : "Cinematic Audio FX: Muted", next ? "🔊" : "🔇");
        });
    });
}

/* ==========================================================================
   CINEMATIC CLICK SPARKS (Ember Particle Bursts)
   ========================================================================== */

function setupClickSparks() {
    if (prefersReducedMotion) return;

    let canvas = document.getElementById("clickSparksCanvas");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "clickSparksCanvas";
        canvas.className = "click-sparks-canvas";
        canvas.setAttribute("aria-hidden", "true");
        document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let sparks = [];

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }, { passive: true });

    window.addEventListener("pointerdown", (e) => {
        const count = 10;
        const isDark = document.documentElement.dataset.theme !== "light";
        const color = isDark ? "52, 211, 153" : "5, 150, 105";

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3.2 + 1.2;
            sparks.push({
                x: e.clientX,
                y: e.clientY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5,
                radius: Math.random() * 2 + 1,
                alpha: 1,
                decay: Math.random() * 0.04 + 0.03,
                color: color
            });
        }
        CinematicAudio.playClick();
    }, { passive: true });

    function renderSparks() {
        if (sparks.length > 0) {
            ctx.clearRect(0, 0, width, height);
            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.x += s.vx;
                s.y += s.vy;
                s.vy += 0.08; // gravity
                s.vx *= 0.96;
                s.alpha -= s.decay;

                if (s.alpha <= 0) {
                    sparks.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${s.color}, ${s.alpha})`;
                ctx.shadowBlur = 6;
                ctx.shadowColor = `rgba(${s.color}, 0.8)`;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        requestAnimationFrame(renderSparks);
    }
    renderSparks();
}

/* ==========================================================================
   INTERACTIVE 3D MOUSE TILT & SPOTLIGHT
   ========================================================================== */

function setup3DTilt() {
    if (prefersReducedMotion || window.innerWidth < 768) return;

    const tiltElements = document.querySelectorAll(".project-card, .home-project-card, .stat-card, .hero-avatar-frame");

    tiltElements.forEach((el) => {
        el.addEventListener("mousemove", (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg
            const rotateY = ((x - centerX) / centerX) * 6;

            el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
            el.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
            el.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
        });

        el.addEventListener("mouseleave", () => {
            el.style.transform = "";
        });
    });
}

/* ==========================================================================
   INTERACTIVE PROJECT SANDBOX / PREVIEW MODAL
   ========================================================================== */

const PROJECTS_DATA = [
    {
        id: "weather-dashboard",
        title: "Weather Dashboard Pro",
        url: "projects/weather-dashboard/index.html",
        badge: "Open-Meteo & AQI",
        desc: "Real-time atmospheric analytics with live AQI, UV index, and 8-day forecasts."
    },
    {
        id: "api-dashboard",
        title: "API Status Dashboard",
        url: "projects/api-dashboard/index.html",
        badge: "HTTP Prober",
        desc: "Live REST endpoint monitoring with latency benchmarks and health checks."
    },
    {
        id: "todo-app",
        title: "Todo Application",
        url: "projects/todo-app/index.html",
        badge: "LocalStorage App",
        desc: "Task management with client-side persistence and category filters."
    },
    {
        id: "weather-app",
        title: "Minimal Weather App",
        url: "projects/weather-app/index.html",
        badge: "Live API Utility",
        desc: "Lightweight city weather lookup with instant climate metrics."
    }
];

function setupProjectSandboxModal() {
    let modal = document.getElementById("sandboxModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "sandboxModal";
        modal.className = "sandbox-modal";
        modal.innerHTML = `
            <div class="sandbox-overlay" data-close-modal></div>
            <div class="sandbox-dialog" role="dialog" aria-modal="true" aria-labelledby="sandboxTitle">
                <div class="sandbox-header">
                    <div class="sandbox-title-wrap">
                        <span class="sandbox-badge">Interactive Live Sandbox</span>
                        <h3 id="sandboxTitle" class="sandbox-title">Project Preview</h3>
                    </div>
                    <div class="sandbox-controls">
                        <div class="device-switcher" role="group" aria-label="Device viewport size">
                            <button class="device-btn is-active" data-size="100%" title="Desktop View (100%)">🖥️ Full</button>
                            <button class="device-btn" data-size="768px" title="Tablet View (768px)">📱 Tablet</button>
                            <button class="device-btn" data-size="390px" title="Mobile View (390px)">📲 Mobile</button>
                        </div>
                        <button class="sandbox-action-btn" id="reloadSandbox" title="Reload Frame">🔄</button>
                        <a class="sandbox-action-btn" id="openExternalSandbox" href="#" target="_blank" rel="noopener noreferrer" title="Open in New Tab">↗</a>
                        <button class="sandbox-action-btn close-btn" data-close-modal aria-label="Close Preview">✕</button>
                    </div>
                </div>
                <div class="sandbox-frame-wrapper" id="sandboxFrameWrap">
                    <div class="sandbox-loading" id="sandboxLoading">
                        <div class="spinner"></div>
                        <span>Booting live application...</span>
                    </div>
                    <iframe id="sandboxIframe" class="sandbox-iframe" title="Interactive Project Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const iframe = document.getElementById("sandboxIframe");
    const loading = document.getElementById("sandboxLoading");
    const title = document.getElementById("sandboxTitle");
    const externalLink = document.getElementById("openExternalSandbox");
    const reloadBtn = document.getElementById("reloadSandbox");
    const frameWrap = document.getElementById("sandboxFrameWrap");
    const deviceButtons = modal.querySelectorAll(".device-btn");

    function openModal(url, projectTitle) {
        title.textContent = projectTitle || "Live Sandbox Preview";
        externalLink.href = url;
        loading.style.display = "flex";
        iframe.src = url;
        
        CinematicAudio.playModalOpen();

        iframe.onload = () => {
            loading.style.display = "none";
            CinematicAudio.playChime();
        };

        modal.classList.add("is-open");
        document.body.classList.add("modal-open");
    }

    function closeModal() {
        CinematicAudio.playClick();
        modal.classList.remove("is-open");
        document.body.classList.remove("modal-open");
        iframe.src = "about:blank";
    }

    modal.querySelectorAll("[data-close-modal]").forEach((el) => {
        el.addEventListener("click", closeModal);
    });

    reloadBtn.addEventListener("click", () => {
        loading.style.display = "flex";
        iframe.src = iframe.src;
    });

    deviceButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            deviceButtons.forEach((b) => b.classList.remove("is-active"));
            btn.classList.add("is-active");
            const size = btn.dataset.size;
            iframe.style.width = size;
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("is-open")) {
            closeModal();
        }
    });

    // Attach to preview trigger buttons
    document.querySelectorAll("[data-preview-project]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const projectId = btn.dataset.previewProject;
            const project = PROJECTS_DATA.find((p) => p.id === projectId);
            if (project) {
                openModal(project.url, project.title);
            }
        });
    });

    window.openProjectSandbox = openModal;
}

/* ==========================================================================
   SPOTLIGHT COMMAND PALETTE (CMD+K / CTRL+K)
   ========================================================================== */

function setupCommandPalette() {
    let palette = document.getElementById("commandPalette");
    if (!palette) {
        palette = document.createElement("div");
        palette.id = "commandPalette";
        palette.className = "command-palette";
        palette.innerHTML = `
            <div class="palette-overlay" data-close-palette></div>
            <div class="palette-dialog" role="dialog" aria-modal="true" aria-label="Command Palette">
                <div class="palette-input-wrap">
                    <span class="palette-search-icon">🔍</span>
                    <input type="text" id="paletteInput" class="palette-input" placeholder="Type a command, page, or search projects..." autocomplete="off" spellcheck="false">
                    <span class="palette-key-hint">ESC to close</span>
                </div>
                <div class="palette-results" id="paletteResults"></div>
                <div class="palette-footer">
                    <span>Navigation: <kbd>↑</kbd> <kbd>↓</kbd></span>
                    <span>Select: <kbd>Enter</kbd></span>
                    <span>Close: <kbd>Esc</kbd></span>
                </div>
            </div>
        `;
        document.body.appendChild(palette);
    }

    const input = document.getElementById("paletteInput");
    const results = document.getElementById("paletteResults");

    const COMMAND_ITEMS = [
        // Pages
        { title: "Home Page", category: "Navigation", icon: "🏠", action: () => window.location.href = "index.html" },
        { title: "About & Skills", category: "Navigation", icon: "👤", action: () => window.location.href = "about.html" },
        { title: "Projects Hub", category: "Navigation", icon: "📁", action: () => window.location.href = "projects.html" },
        { title: "Contact Developer", category: "Navigation", icon: "✉️", action: () => window.location.href = "contact.html" },
        
        // Projects Live Sandbox
        { title: "Weather Dashboard Pro (Live Sandbox)", category: "Live Applications", icon: "🌤️", action: () => window.openProjectSandbox ? window.openProjectSandbox("projects/weather-dashboard/index.html", "Weather Dashboard Pro") : window.open("projects/weather-dashboard/index.html", "_blank") },
        { title: "API Status Dashboard (Live Sandbox)", category: "Live Applications", icon: "📊", action: () => window.openProjectSandbox ? window.openProjectSandbox("projects/api-dashboard/index.html", "API Status Dashboard") : window.location.href = "projects/api-dashboard/index.html" },
        { title: "Todo Application (Live Sandbox)", category: "Live Applications", icon: "✅", action: () => window.openProjectSandbox ? window.openProjectSandbox("projects/todo-app/index.html", "Todo Application") : window.location.href = "projects/todo-app/index.html" },
        { title: "Minimal Weather App (Live Sandbox)", category: "Live Applications", icon: "🌡️", action: () => window.openProjectSandbox ? window.openProjectSandbox("projects/weather-app/index.html", "Minimal Weather App") : window.location.href = "projects/weather-app/index.html" },
        
        // Interactive Atmosphere & Effects
        { title: "Toggle Cinematic Director's Cut (21:9)", category: "Atmosphere", icon: "🎬", action: () => {
            const btn = document.querySelector("[data-cinematic-toggle]");
            if (btn) btn.click();
            else toggleCinematicMode();
        }},
        { title: "Toggle UI Audio Sound Effects", category: "Atmosphere", icon: "🔊", action: () => {
            const btn = document.querySelector("[data-sound-toggle]");
            if (btn) btn.click();
            else CinematicAudio.toggle();
        }},

        // Quick Tools & Actions
        { title: "Ask Zaheer AI (Gemini Chat Assistant)", category: "Actions", icon: "✨", action: () => {
            if (window.openGeminiChat) window.openGeminiChat();
        }},
        { title: "Toggle Light / Dark Theme Mode", category: "Actions", icon: "🌗", action: () => {
            const currentTheme = document.documentElement.dataset.theme || "dark";
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            setTheme(nextTheme);
            showToast(`Switched to ${nextTheme === "dark" ? "Dark" : "Light"} mode`, nextTheme === "dark" ? "🌙" : "☀️");
        }},
        { title: "Open Developer CLI Terminal", category: "Actions", icon: "💻", action: () => window.toggleDevTerminal && window.toggleDevTerminal(true) },
        { title: "Copy Developer Email", category: "Actions", icon: "📋", action: () => copyToClipboard("mzaheerlion@gmail.com", "Email copied: mzaheerlion@gmail.com") },
        { title: "Live Open-Meteo Weather Test", category: "Actions", icon: "⚡", action: () => {
            window.toggleDevTerminal && window.toggleDevTerminal(true);
            setTimeout(() => {
                if (window.runTerminalCommand) window.runTerminalCommand("weather Tokyo");
            }, 300);
        }}
    ];

    let selectedIndex = 0;
    let filteredItems = [...COMMAND_ITEMS];

    function renderResults() {
        if (!filteredItems.length) {
            results.innerHTML = `<div class="palette-empty">No results matching your query. Try 'weather', 'projects', 'theme', or 'about'.</div>`;
            return;
        }

        const groups = {};
        filteredItems.forEach((item, idx) => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push({ ...item, globalIndex: idx });
        });

        let html = "";
        for (const [category, items] of Object.entries(groups)) {
            html += `<div class="palette-category-title">${category}</div>`;
            items.forEach((item) => {
                const isSelected = item.globalIndex === selectedIndex;
                html += `
                    <div class="palette-item ${isSelected ? "is-selected" : ""}" data-index="${item.globalIndex}">
                        <span class="palette-item-icon">${item.icon}</span>
                        <span class="palette-item-title">${item.title}</span>
                        <span class="palette-item-arrow">↵</span>
                    </div>
                `;
            });
        }

        results.innerHTML = html;

        results.querySelectorAll(".palette-item").forEach((itemEl) => {
            itemEl.addEventListener("click", () => {
                const idx = Number(itemEl.dataset.index);
                executeItem(idx);
            });
        });
    }

    function executeItem(idx) {
        const item = filteredItems[idx];
        if (item) {
            closePalette();
            item.action();
        }
    }

    function filterItems(query) {
        const q = query.trim().toLowerCase();
        if (!q) {
            filteredItems = [...COMMAND_ITEMS];
        } else {
            filteredItems = COMMAND_ITEMS.filter((item) => 
                item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
            );
        }
        selectedIndex = 0;
        renderResults();
    }

    function openPalette() {
        palette.classList.add("is-open");
        document.body.classList.add("modal-open");
        input.value = "";
        filterItems("");
        setTimeout(() => input.focus(), 50);
    }

    function closePalette() {
        palette.classList.remove("is-open");
        document.body.classList.remove("modal-open");
    }

    palette.querySelectorAll("[data-close-palette]").forEach((el) => el.addEventListener("click", closePalette));

    input.addEventListener("input", (e) => filterItems(e.target.value));

    input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % filteredItems.length;
            renderResults();
            scrollSelectedIntoView();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
            renderResults();
            scrollSelectedIntoView();
        } else if (e.key === "Enter") {
            e.preventDefault();
            executeItem(selectedIndex);
        } else if (e.key === "Escape") {
            closePalette();
        }
    });

    function scrollSelectedIntoView() {
        const active = results.querySelector(".palette-item.is-selected");
        if (active) active.scrollIntoView({ block: "nearest" });
    }

    // Hotkey listener (Cmd+K or Ctrl+K or /)
    document.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            if (palette.classList.contains("is-open")) closePalette();
            else openPalette();
        } else if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
            e.preventDefault();
            openPalette();
        }
    });

    document.querySelectorAll("[data-open-palette]").forEach((btn) => {
        btn.addEventListener("click", openPalette);
    });

    window.openCommandPalette = openPalette;
}

/* ==========================================================================
   DEVELOPER CLI TERMINAL DRAWER
   ========================================================================== */

function setupDeveloperTerminal() {
    let terminal = document.getElementById("devTerminal");
    if (!terminal) {
        terminal = document.createElement("div");
        terminal.id = "devTerminal";
        terminal.className = "dev-terminal-drawer";
        terminal.innerHTML = `
            <div class="terminal-bar">
                <div class="terminal-dots">
                    <span class="dot red" data-close-terminal></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                </div>
                <div class="terminal-title">zaheer@portfolio: ~ (bash)</div>
                <div class="terminal-actions">
                    <button class="terminal-mini-btn" data-close-terminal title="Minimize Terminal">_</button>
                </div>
            </div>
            <div class="terminal-body" id="terminalBody">
                <div class="terminal-output" id="terminalOutput">
                    <div class="term-line banner">
███████╗ █████╗ ██╗  ██╗███████╗███████╗██████╗ 
╚══███╔╝██╔══██╗██║  ██║██╔════╝██╔════╝██╔══██╗
  ███╔╝ ███████║███████║█████╗  █████╗  ██████╔╝
 ███╔╝  ██╔══██║██╔══██║██╔══╝  ██╔══╝  ██╔══██╗
███████╗██║  ██║██║  ██║███████╗███████╗██║  ██║
                    </div>
                    <div class="term-line">Welcome to the Portfolio Interactive Terminal.</div>
                    <div class="term-line">Type <span class="cmd-highlight">help</span> to view available commands or try <span class="cmd-highlight">weather</span>.</div>
                </div>
                <form class="terminal-form" id="terminalForm">
                    <span class="term-prompt">zaheer@portfolio:~$</span>
                    <input type="text" id="terminalInput" class="term-input" autocomplete="off" spellcheck="false">
                </form>
            </div>
        `;
        document.body.appendChild(terminal);

        // Floating trigger button
        const trigger = document.createElement("button");
        trigger.className = "terminal-trigger-btn";
        trigger.id = "terminalTrigger";
        trigger.innerHTML = `<span class="term-trigger-icon">>_</span><span class="term-trigger-text">Terminal</span>`;
        trigger.setAttribute("aria-label", "Toggle Interactive Developer Terminal");
        document.body.appendChild(trigger);
    }

    const output = document.getElementById("terminalOutput");
    const form = document.getElementById("terminalForm");
    const input = document.getElementById("terminalInput");
    const body = document.getElementById("terminalBody");
    const trigger = document.getElementById("terminalTrigger");

    const history = [];
    let historyIdx = -1;

    function appendLine(content, className = "") {
        const line = document.createElement("div");
        line.className = `term-line ${className}`;
        line.innerHTML = content;
        output.appendChild(line);
        body.scrollTop = body.scrollHeight;
    }

    async function handleCommand(rawCmd) {
        const cmdStr = rawCmd.trim();
        if (!cmdStr) return;

        appendLine(`<span class="term-prompt">zaheer@portfolio:~$</span> ${escapeHTML(cmdStr)}`);

        history.push(cmdStr);
        historyIdx = history.length;

        const parts = cmdStr.split(" ");
        const mainCmd = parts[0].toLowerCase();
        const arg = parts.slice(1).join(" ");

        switch (mainCmd) {
            case "help":
            case "?":
                appendLine(`
<strong>Available Commands:</strong>
  <span class="cmd-highlight">projects</span>    - List interactive web applications with links
  <span class="cmd-highlight">skills</span>      - Display technical proficiency breakdown
  <span class="cmd-highlight">about</span>       - Show developer bio and core philosophy
  <span class="cmd-highlight">ai [question]</span>   - Chat with Zaheer AI (Gemini Assistant)
  <span class="cmd-highlight">weather [city]</span>- Live query via Open-Meteo API (e.g. weather Tokyo)
  <span class="cmd-highlight">theme [light|dark]</span> - Switch between Light and Dark mode
  <span class="cmd-highlight">cinema</span>      - Toggle 21:9 Director's cut cinematic letterbox
  <span class="cmd-highlight">sound</span>       - Toggle UI synthesized audio feedback
  <span class="cmd-highlight">contact</span>     - View contact methods & copy developer email
  <span class="cmd-highlight">quote</span>       - Get a developer programming quote
  <span class="cmd-highlight">matrix</span>      - Toggle digital matrix rain effect
  <span class="cmd-highlight">clear</span>       - Clear terminal screen
  <span class="cmd-highlight">exit</span>        - Close terminal drawer
                `);
                break;

            case "ai":
            case "chat":
            case "gemini":
            case "ask":
                if (window.openGeminiChat) {
                    window.openGeminiChat(arg || "");
                    appendLine(`Launched Zaheer AI Chatbot... ${arg ? `Asking: "<em>${arg}</em>"` : ""}`);
                }
                break;

            case "theme":
                if (arg === "light") {
                    setTheme("light");
                    appendLine("Theme set to: <strong>Light Mode (☀️)</strong>");
                } else if (arg === "dark") {
                    setTheme("dark");
                    appendLine("Theme set to: <strong>Dark Mode (🌙)</strong>");
                } else {
                    const cur = document.documentElement.dataset.theme || "dark";
                    const next = cur === "dark" ? "light" : "dark";
                    setTheme(next);
                    appendLine(`Theme toggled to: <strong>${next.toUpperCase()} MODE (${next === "dark" ? "🌙" : "☀️"})</strong>`);
                }
                break;

            case "bg":
            case "background":
                AmbientBackgroundEngine.setModeById("constellation");
                appendLine("Background atmosphere: <strong>Constellation starfield active</strong>");
                break;

            case "cinema":
            case "cinematic":
            case "directors":
                toggleCinematicMode();
                const isCin = document.body.classList.contains("is-cinematic");
                appendLine(`Cinematic Director's Cut (21:9): <strong>${isCin ? "ENABLED 🎬" : "DISABLED"}</strong>`);
                break;

            case "sound":
            case "audio":
                const snd = CinematicAudio.toggle();
                appendLine(`Audio Sound FX: <strong>${snd ? "ENABLED 🔊" : "MUTED 🔇"}</strong>`);
                break;

            case "projects":
            case "ls":
                appendLine(`
<strong>Interactive Projects Hosted (4):</strong>
  1. <a href="projects/weather-dashboard/index.html" class="term-link" target="_blank">Weather Dashboard Pro (Open-Meteo & Live AQI Analytics)</a>
  2. <a href="projects/api-dashboard/index.html" class="term-link" target="_blank">API Status Dashboard (Real-time HTTP Prober)</a>
  3. <a href="projects/todo-app/index.html" class="term-link" target="_blank">Todo Application (LocalStorage State Manager)</a>
  4. <a href="projects/weather-app/index.html" class="term-link" target="_blank">Minimal Weather App (City Search)</a>
<em>Tip: Use 'preview [1-4]' to launch in the in-page sandbox!</em>
                `);
                break;

            case "preview":
                const pNum = parseInt(arg);
                if (pNum >= 1 && pNum <= PROJECTS_DATA.length) {
                    const p = PROJECTS_DATA[pNum - 1];
                    appendLine(`Launching ${p.title} in sandbox...`);
                    if (window.openProjectSandbox) window.openProjectSandbox(p.url, p.title);
                } else {
                    appendLine(`Please specify project number between 1 and ${PROJECTS_DATA.length} (e.g. 'preview 1').`);
                }
                break;

            case "skills":
                appendLine(`
<strong>Technical Proficiencies:</strong>
  JavaScript (ES6+, DOM, Async)   [██████████████████░░] 90%
  HTML5 Semantic & Responsive CSS [███████████████████░] 92%
  REST APIs & Network Probing     [█████████████████░░░] 85%
  Firestore & Cloud Persistence   [████████████████░░░░] 80%
                `);
                break;

            case "about":
            case "whoami":
                appendLine(`
<strong>Muhammad Zaheer</strong> - Web & Software Developer
Specializing in clean web applications, performant user interfaces, and reliable REST API tooling.
Location: Pakistan (GMT+5) | Availability: Open to project collaborations & contract roles.
                `);
                break;

            case "contact":
                appendLine(`
<strong>Contact Details:</strong>
  Email: <span class="cmd-highlight">mzaheerlion@gmail.com</span>
  Form: <a href="contact.html" class="term-link">Open contact.html form</a>
                `);
                copyToClipboard("mzaheerlion@gmail.com", "Email copied to clipboard!");
                break;

            case "weather":
                const city = arg || "Tokyo";
                appendLine(`Connecting to Open-Meteo API for <strong>${escapeHTML(city)}</strong>...`);
                try {
                    // Geocoding query
                    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
                    const geoData = await geoRes.json();
                    
                    if (!geoData.results || !geoData.results.length) {
                        appendLine(`<span class="term-error">Could not find coordinates for '${escapeHTML(city)}'.</span>`);
                        break;
                    }

                    const location = geoData.results[0];
                    const lat = location.latitude;
                    const lon = location.longitude;

                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m`);
                    const weatherData = await weatherRes.json();
                    const current = weatherData.current_weather;

                    appendLine(`
<strong>🌤️ Weather Report for ${location.name}, ${location.country || ""}:</strong>
  Temperature : <strong>${current.temperature}°C</strong> (${((current.temperature * 9/5) + 32).toFixed(1)}°F)
  Wind Speed  : ${current.windspeed} km/h (Wind Direction: ${current.winddirection}°)
  Status Code : WMO ${current.weathercode} | Time: ${current.time}
                    `, "term-success");
                } catch (err) {
                    appendLine(`<span class="term-error">Weather fetch failed: ${err.message}</span>`);
                }
                break;

            case "theme":
                if (arg === "dark" || arg === "light") {
                    setTheme(arg);
                    appendLine(`Theme set to ${arg}.`);
                } else {
                    const next = (document.documentElement.dataset.theme || "dark") === "dark" ? "light" : "dark";
                    setTheme(next);
                    appendLine(`Theme toggled to ${next}.`);
                }
                break;

            case "matrix":
                toggleMatrixRain();
                appendLine("Matrix digital rain mode toggled! 🟩");
                break;

            case "quote":
                const quotes = [
                    "\"Simplicity is prerequisite for reliability.\" — Edsger W. Dijkstra",
                    "\"First, solve the problem. Then, write the code.\" — John Johnson",
                    "\"Make it work, make it right, make it fast.\" — Kent Beck",
                    "\"Clean code always looks like it was written by someone who cares.\" — Robert C. Martin"
                ];
                appendLine(quotes[Math.floor(Math.random() * quotes.length)]);
                break;

            case "sudo":
                appendLine('<span class="cmd-highlight">Permission granted: You are already superuser on this portfolio! 🚀</span>');
                break;

            case "clear":
            case "cls":
                output.innerHTML = "";
                break;

            case "exit":
                toggleTerminal(false);
                break;

            default:
                appendLine(`<span class="term-error">Command not found: '${escapeHTML(cmdStr)}'. Type <span class="cmd-highlight">help</span> for commands.</span>`);
                break;
        }

        body.scrollTop = body.scrollHeight;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    function toggleTerminal(force) {
        const isOpen = typeof force === "boolean" ? force : !terminal.classList.contains("is-open");
        terminal.classList.toggle("is-open", isOpen);
        trigger.classList.toggle("is-active", isOpen);
        if (isOpen) {
            setTimeout(() => input.focus(), 100);
        }
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = input.value;
        input.value = "";
        handleCommand(val);
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (historyIdx > 0) {
                historyIdx--;
                input.value = history[historyIdx] || "";
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIdx < history.length - 1) {
                historyIdx++;
                input.value = history[historyIdx] || "";
            } else {
                historyIdx = history.length;
                input.value = "";
            }
        }
    });

    trigger.addEventListener("click", () => toggleTerminal());
    terminal.querySelectorAll("[data-close-terminal]").forEach((el) => {
        el.addEventListener("click", () => toggleTerminal(false));
    });

    window.toggleDevTerminal = toggleTerminal;
    window.runTerminalCommand = (cmd) => {
        handleCommand(cmd);
    };
}

/* ==========================================================================
   MATRIX CANVAS EFFECT
   ========================================================================== */

function toggleMatrixRain() {
    let canvas = document.getElementById("matrixCanvas");
    if (canvas) {
        canvas.remove();
        return;
    }

    canvas = document.createElement("canvas");
    canvas.id = "matrixCanvas";
    canvas.className = "matrix-canvas";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01ZAHEER101010101010101010101010101010101010101010";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#10b981";
        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    const interval = setInterval(draw, 33);

    window.addEventListener("resize", () => {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });
}

/* ==========================================================================
   CONTACT FORM VALIDATION & TOPIC CHIPS
   ========================================================================== */

function setupContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const fields = Array.from(form.querySelectorAll("input, textarea"));
    const messageInput = form.querySelector("[data-count-input]");
    const countDisplay = form.querySelector("[data-char-count]");
    const statusDisplay = form.querySelector(".form-status");
    const submitBtn = form.querySelector("button[type='submit']");

    // Interactive topic tags / chips
    const topicChips = document.querySelectorAll("[data-topic-chip]");
    topicChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            topicChips.forEach((c) => c.classList.remove("is-active"));
            chip.classList.add("is-active");
            const topic = chip.dataset.topicChip;
            if (messageInput) {
                messageInput.value = `Hi Zaheer, I'm interested in discussing a project regarding ${topic}.\n\n`;
                messageInput.focus();
                updateCount();
            }
        });
    });

    const setError = (field, errorMsg) => {
        const errorElem = form.querySelector(`[data-error-for="${field.name}"]`);
        field.classList.toggle("is-invalid", Boolean(errorMsg));
        if (errorElem) {
            errorElem.textContent = errorMsg;
        }
    };

    const validateField = (field) => {
        const val = field.value.trim();
        let errorMsg = "";

        if (!val) {
            const labelElem = form.querySelector(`label[for="${field.id}"]`);
            const labelName = labelElem ? labelElem.textContent : field.name;
            errorMsg = `${labelName} is required.`;
        } else if (field.type === "email" && !field.validity.valid) {
            errorMsg = "Please enter a valid email address.";
        } else if (field.name === "message" && val.length < 10) {
            errorMsg = "Message should be at least 10 characters.";
        }

        setError(field, errorMsg);
        return !errorMsg;
    };

    const updateCount = () => {
        if (!messageInput || !countDisplay) return;
        const current = messageInput.value.length;
        const max = messageInput.maxLength || 500;
        countDisplay.textContent = `${current} / ${max}`;
    };

    fields.forEach((field) => {
        field.addEventListener("input", () => {
            validateField(field);
            updateCount();
        });
        field.addEventListener("blur", () => validateField(field));
    });

    updateCount();

    form.addEventListener("submit", (e) => {
        const allValid = fields.map(validateField).every(Boolean);

        if (!allValid) {
            e.preventDefault();
            const firstInvalid = form.querySelector(".is-invalid");
            if (firstInvalid) firstInvalid.focus();
            if (statusDisplay) {
                statusDisplay.className = "form-status status-error";
                statusDisplay.textContent = "Please fill in all required fields accurately.";
            }
            return;
        }

        if (statusDisplay) {
            statusDisplay.className = "form-status status-loading";
            statusDisplay.textContent = "Sending your message securely...";
        }
        if (submitBtn) submitBtn.disabled = true;
    });
}

/* ==========================================================================
   GEMINI AI CHATBOT SYSTEM
   ========================================================================== */

function setupGeminiChatbot() {
    // If chat container already exists, return
    if (document.getElementById("geminiChatModal")) return;

    // 1. Create Floating Launcher Button
    const launcher = document.createElement("button");
    launcher.id = "geminiChatLauncher";
    launcher.className = "gemini-chat-launcher";
    launcher.setAttribute("type", "button");
    launcher.setAttribute("aria-label", "Ask Zaheer AI (Portfolio Assistant)");
    launcher.setAttribute("title", "Chat with Zaheer AI (Powered by Gemini)");
    launcher.innerHTML = `
        <span class="gemini-launcher-icon">✨</span>
        <span class="gemini-launcher-label">Ask Zaheer AI</span>
        <span class="gemini-chat-badge">Gemini</span>
    `;
    document.body.appendChild(launcher);

    // 2. Create Chat Drawer Dialog
    const modal = document.createElement("div");
    modal.id = "geminiChatModal";
    modal.className = "gemini-chat-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Zaheer AI Chat Assistant");
    modal.setAttribute("hidden", "true");
    modal.innerHTML = `
        <header class="gemini-chat-header">
            <div class="gemini-chat-header-info">
                <div class="gemini-chat-avatar" aria-hidden="true">✨</div>
                <div class="gemini-chat-title-group">
                    <h3>Zaheer AI <span class="gemini-status-dot" title="Online"></span></h3>
                    <p>Muhammad Zaheer's AI Representative</p>
                </div>
            </div>
            <div class="gemini-chat-header-actions">
                <button type="button" class="gemini-chat-header-btn" id="geminiChatSettingsToggle" title="Gemini API Key Settings" aria-label="Settings">⚙️</button>
                <button type="button" class="gemini-chat-header-btn" id="geminiChatClear" title="Clear Conversation" aria-label="Clear chat">🗑️</button>
                <button type="button" class="gemini-chat-header-btn" id="geminiChatClose" title="Close Chat" aria-label="Close chat">✕</button>
            </div>
        </header>

        <div class="gemini-chat-settings-panel" id="geminiSettingsPanel" hidden>
            <p><strong>GitHub Pages Mode</strong>: To connect live to Gemini without a backend server, optionally paste your free Gemini API key below. It will stay saved strictly in your browser's localStorage.</p>
            <div class="gemini-key-input-row">
                <input type="password" id="geminiCustomKeyInput" class="gemini-key-input" placeholder="AIzaSy... (Gemini API Key)" autocomplete="off" />
                <button type="button" class="gemini-key-save-btn" id="geminiSaveKeyBtn">Save</button>
                <button type="button" class="gemini-key-clear-btn" id="geminiClearKeyBtn">Clear</button>
            </div>
        </div>

        <div class="gemini-chat-messages" id="geminiChatMessages" tabindex="0">
            <!-- Messages injected dynamically -->
        </div>

        <div class="gemini-suggested-prompts" id="geminiSuggestedPrompts">
            <button type="button" class="gemini-prompt-chip" data-prompt="What are Muhammad Zaheer's main technical skills?">🛠️ Core Skills</button>
            <button type="button" class="gemini-prompt-chip" data-prompt="Show me his featured portfolio projects.">🚀 Featured Projects</button>
            <button type="button" class="gemini-prompt-chip" data-prompt="How can I get in touch or hire him?">📬 Contact & Hire</button>
        </div>

        <footer class="gemini-chat-footer">
            <form class="gemini-chat-input-form" id="geminiChatForm">
                <input 
                    type="text" 
                    id="geminiChatInput" 
                    class="gemini-chat-input" 
                    placeholder="Ask about projects, skills, or background..." 
                    autocomplete="off"
                    aria-label="Your message to Zaheer AI"
                />
                <button type="submit" class="gemini-chat-send-btn" id="geminiChatSendBtn" aria-label="Send Message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </footer>
    `;
    document.body.appendChild(modal);

    const messagesContainer = document.getElementById("geminiChatMessages");
    const chatForm = document.getElementById("geminiChatForm");
    const chatInput = document.getElementById("geminiChatInput");
    const sendBtn = document.getElementById("geminiChatSendBtn");
    const closeBtn = document.getElementById("geminiChatClose");
    const clearBtn = document.getElementById("geminiChatClear");
    const settingsToggleBtn = document.getElementById("geminiChatSettingsToggle");
    const settingsPanel = document.getElementById("geminiSettingsPanel");
    const customKeyInput = document.getElementById("geminiCustomKeyInput");
    const saveKeyBtn = document.getElementById("geminiSaveKeyBtn");
    const clearKeyBtn = document.getElementById("geminiClearKeyBtn");
    const suggestedPrompts = document.getElementById("geminiSuggestedPrompts");

    // Conversation state maintained for multi-turn history
    let conversationHistory = [];
    const STORAGE_KEY = "zaheer-ai-chat-history";
    const API_KEY_STORAGE = "zaheer_gemini_client_api_key";

    // Prepopulate custom key input if stored
    const savedCustomKey = localStorage.getItem(API_KEY_STORAGE) || "";
    if (customKeyInput && savedCustomKey) {
        customKeyInput.value = savedCustomKey;
    }

    // High-fidelity Portfolio Knowledge Base (Offline / Static GitHub Pages Engine)
    function generatePortfolioSmartResponse(userQuery) {
        // Normalize query: lower case, remove punctuation except spaces
        const raw = (userQuery || "").toLowerCase().trim();
        const q = raw.replace(/[^\w\s]/g, " ");
        const tokens = q.split(/\s+/).filter(Boolean);

        const hasAny = (...words) => words.some(w => q.includes(w) || tokens.includes(w));
        const hasAll = (...words) => words.every(w => q.includes(w) || tokens.includes(w));

        // 1. Casual / Greetings / Identity of Assistant
        if (tokens.length <= 3 && (hasAny("hi", "hello", "hey", "sup", "yo", "hola", "salam", "morning", "evening", "afternoon", "bro", "dude", "buddy", "man") || raw === "hi" || raw === "hello")) {
            return `Hello there! I am **Zaheer AI**, Muhammad Zaheer's interactive portfolio assistant.\n\n` +
                   `I can answer questions about:\n` +
                   `* 🚀 **Projects**: *API Status Dashboard, Todo App, Weather Pro*\n` +
                   `* ⚡ **Skills & Stack**: *JavaScript, TypeScript, React, Tailwind, Node.js*\n` +
                   `* 📍 **Location & Availability**: *Remote / worldwide*\n` +
                   `* 📬 **Contact & Hire**: *Direct email & inquiry options*\n\n` +
                   `What would you like to explore?`;
        }

        if (hasAny("what are you doing", "what do you do", "what is your purpose", "who are you", "what are u doing")) {
            return `I am **Zaheer AI**, an AI assistant built into Muhammad Zaheer's portfolio.\n\n` +
                   `My role is to represent Muhammad, answer questions about his software engineering experience, demonstrate his interactive web applications, and help prospective clients or employers connect directly with him.`;
        }

        // 2. Origin / Location / Where is he from / Nationality / Remote
        if (hasAny("where he is from", "where is he from", "where from", "location", "country", "city", "where do you live", "where does he live", "based", "relocate", "remote")) {
            return `**Muhammad Zaheer** is based in **Pakistan** and works with clients and engineering teams **worldwide (Remote & Hybrid)**.\n\n` +
                   `* 📍 **Availability**: Open to global remote full-time positions, contract engagements, and freelance projects.\n` +
                   `* 🌐 **Timezone Flexibility**: Experienced with asynchronous workflows and distributed teams.\n` +
                   `* ✉️ **Direct Contact**: [mzaheerlion@gmail.com](mailto:mzaheerlion@gmail.com)`;
        }

        // 3. Specific Project: API Status Dashboard
        if (hasAny("api dashboard", "api status", "telemetry", "endpoint", "prober", "http prober") || (hasAny("api") && hasAny("dashboard", "project", "status", "detail", "tell", "explain", "about"))) {
            return `### 📊 API Status & Metrics Dashboard\n\n` +
                   `A real-time telemetry and endpoint health monitor built by Muhammad Zaheer.\n\n` +
                   `* **Key Capabilities**: Live REST API probing (GitHub, JSONPlaceholder), real-time millisecond round-trip latency calculation, HTTP status indicators (200 OK, 404, 500), and auto-refresh polling every 30 seconds.\n` +
                   `* **Stack**: Vanilla JS (ES6+), Fetch API, CSS Grid, High-contrast responsive HUD.\n` +
                   `* **Try it live**: Launch it from the [Projects Page](projects.html) or run it inside the sandbox view!`;
        }

        // 4. Specific Project: Todo Application
        if (hasAny("todo", "to do", "task", "tasks", "task manager", "todo app", "todos")) {
            return `### ✅ Interactive Todo Application\n\n` +
                   `A productivity and task management app engineered for seamless client-side performance.\n\n` +
                   `* **Key Capabilities**: Instant task creation with priority tagging, status filters (All, Active, Completed), real-time item counters, and keyboard accessibility.\n` +
                   `* **Persistence**: Full local storage persistence—your tasks remain saved across browser refreshes and sessions.\n` +
                   `* **Stack**: HTML5, Modern CSS, DOM State Management, LocalStorage API.\n` +
                   `* **Try it live**: Explore it directly on the [Projects Page](projects.html)!`;
        }

        // 5. Specific Project: Weather Apps (Pro Dashboard & Minimal App)
        if (hasAny("weather", "meteorol", "climate", "forecast", "aqi", "temperature")) {
            return `### 🌤️ Weather Dashboard Pro & Minimal Weather App\n\n` +
                   `Muhammad has built two distinct weather applications powered by live meteorological data:\n\n` +
                   `1. **Weather Dashboard Pro**: Features live Air Quality Index (PM2.5, NO₂, Ozone), UV index recommendations, 8-day forecasts, °C/°F toggle, and spatial audio rain/wind soundscapes.\n` +
                   `2. **Minimal Weather App**: A streamlined, lightweight city lookup for rapid conditions and temperature checks.\n\n` +
                   `💡 *Bonus*: You can also test live weather right now in the bottom-left **Terminal (>_)** by typing: \`weather Tokyo\` or \`weather London\`!`;
        }

        // 6. Upcoming Projects / Roadmap / Future work
        if (hasAny("upcoming", "roadmap", "future", "next", "coming soon", "in progress", "wip")) {
            return `### 🚀 Upcoming Projects & Roadmap\n\n` +
                   `Muhammad is currently actively engineering:\n\n` +
                   `* ⚡ **Next-Gen AI Portfolio Workflows**: Deep generative UI tools integrated with the Gemini API.\n` +
                   `* 📈 **Advanced Real-time Analytics Visualizer**: Canvas-based live streaming data visualizer with WebSocket support.\n` +
                   `* 🧩 **Design System Component Library**: Accessible, headless accessible UI components crafted with zero external bloat.\n\n` +
                   `Stay updated on new releases by visiting the [Projects Page](projects.html)!`;
        }

        // 7. General Projects List
        if (hasAny("project", "projects", "work", "portfolio", "apps", "built", "created", "showcase", "demos")) {
            return `### 🚀 Featured Applications by Muhammad Zaheer\n\n` +
                   `1. **Weather Dashboard Pro**: Real-time atmospheric analytics with live AQI, UV index, and spatial audio.\n` +
                   `2. **API Status Dashboard**: Real-time HTTP health monitor with millisecond latency and status tracking.\n` +
                   `3. **Todo Application**: State-managed productivity tool with local storage persistence and filter views.\n` +
                   `4. **Minimal Weather App**: Fast, lightweight weather lookup utility.\n\n` +
                   `👉 Visit the [Projects Page](projects.html) to launch each app live or test them in the interactive sandbox!`;
        }

        // 8. Technical Skills / Tech Stack
        if (hasAny("skill", "skills", "stack", "tech", "technolog", "languages", "framework", "frameworks", "tools", "frontend", "backend")) {
            return `### 🛠️ Technical Skills & Proficiencies\n\n` +
                   `* **Frontend**: JavaScript (ES6+), TypeScript, React, HTML5 semantic structure, CSS3 Flexbox & Grid\n` +
                   `* **Styling & UI**: Tailwind CSS, CSS Custom Properties (Tokens), Responsive Design, Accessibility (WCAG)\n` +
                   `* **Backend & APIs**: Node.js, Express.js, REST API integrations, Fetch API, Gemini API, Open-Meteo\n` +
                   `* **Engineering Practices**: Git, GitHub Actions/CI/CD, Performance Optimization, Clean Architecture\n\n` +
                   `For an in-depth breakdown with proficiency metrics, check the [About Page](about.html).`;
        }

        // 9. Contact / Hire / Freelance / Pricing / Email
        if (hasAny("hire", "contact", "email", "reach", "message", "touch", "call", "collaborat", "job", "offer", "freelance", "contract", "salary", "rate")) {
            return `### 📬 Connect with Muhammad Zaheer\n\n` +
                   `Muhammad is actively considering **full-time remote positions**, **contract roles**, and **freelance projects**:\n\n` +
                   `* 📧 **Direct Email**: [mzaheerlion@gmail.com](mailto:mzaheerlion@gmail.com)\n` +
                   `* 💬 **Online Form**: Send an immediate message via the [Contact Page](contact.html)\n` +
                   `* ⚡ **Response Time**: Usually within 24 hours.`;
        }

        // 10. Bio / About / Philosophy / Education / Experience
        if (hasAny("about", "bio", "experience", "background", "philosophy", "story", "education", "degree", "qualification", "who is muhammad")) {
            return `### 👨‍💻 About Muhammad Zaheer\n\n` +
                   `Muhammad Zaheer is a dedicated software developer passionate about building fast, intuitive web applications that prioritize user experience and performance.\n\n` +
                   `* **Philosophy**: Craft software with pure, resilient code that loads under 0.5s without unnecessary dependencies.\n` +
                   `* **Focus**: High-performance UI engineering, interactive dashboards, and pragmatic full-stack solutions.\n` +
                   `* Read the full story on the [About Page](about.html).`;
        }

        // 11. Polite / Casual Remarks (e.g. "thanks", "cool", "nice", "ok", "great")
        if (hasAny("thanks", "thank you", "cool", "awesome", "nice", "great", "ok", "good", "perfect", "got it")) {
            return `You're very welcome! Feel free to ask anything else about Muhammad's work, or test out his projects in the [Projects section](projects.html). Let me know how I can help!`;
        }

        // 12. Contextual Default (Intelligent summary with actionable suggestions)
        return `I can help you explore Muhammad Zaheer's work! Here are some quick topics you can ask me about:\n\n` +
               `* 🛠️ **"What are your core skills?"** (React, TypeScript, Node.js, Tailwind)\n` +
               `* 📊 **"Tell me about the API Status Dashboard"** or **"Weather Dashboard"**\n` +
               `* 📍 **"Where is he from?"** (Location & remote availability)\n` +
               `* 📬 **"How can I hire or email Muhammad?"** ([mzaheerlion@gmail.com](mailto:mzaheerlion@gmail.com))\n\n` +
               `What would you like to know more about?`;
    }

    // Direct client-side Gemini API caller (for static hosting like GitHub Pages when user configures key)
    async function callGeminiDirectly(apiKey, history) {
        const formattedContents = history.map(m => ({
            role: m.role === "assistant" || m.role === "model" ? "model" : "user",
            parts: [{ text: m.content || "" }]
        }));

        const systemText = `You are "Zaheer AI", an intelligent, polite, and articulate AI portfolio assistant representing Muhammad Zaheer (Frontend & Full-Stack Web Developer).
Greet visitors warmly and answer questions about Muhammad Zaheer's skills (React, TypeScript, Node.js, Tailwind, APIs), projects (API Status Dashboard, Interactive Todo, Weather Dashboards), and contact info (mzaheerlion@gmail.com). Keep responses concise (2-4 sentences or clean bullet points).`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemText }]
                },
                contents: formattedContents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return candidate || "Hello! How can I assist you with Muhammad Zaheer's portfolio today?";
    }

    // Format simple markdown into clean HTML
    function formatMarkdown(text) {
        if (!text) return "";
        let escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Markdown links [label](url)
        escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:underline;">$1</a>');

        // Bold **text**
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        // Italic *text*
        escaped = escaped.replace(/\*(.*?)\*/g, "<em>$1</em>");
        // Inline code `code`
        escaped = escaped.replace(/`([^`]+)`/g, '<code style="background:var(--surface);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.85em;">$1</code>');

        // Bullet and numbered lists and headers
        const lines = escaped.split("\n");
        let html = "";
        let inUl = false;
        let inOl = false;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("### ")) {
                if (inUl) { html += "</ul>"; inUl = false; }
                if (inOl) { html += "</ol>"; inOl = false; }
                html += `<h4 style="margin:8px 0 4px;font-size:0.96rem;font-weight:700;color:var(--text);">${trimmed.substring(4)}</h4>`;
            } else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
                if (inOl) { html += "</ol>"; inOl = false; }
                if (!inUl) { html += "<ul>"; inUl = true; }
                html += `<li>${trimmed.substring(2)}</li>`;
            } else if (/^\d+\.\s/.test(trimmed)) {
                if (inUl) { html += "</ul>"; inUl = false; }
                if (!inOl) { html += "<ol style='margin:6px 0 6px 18px;padding:0;'>"; inOl = true; }
                const content = trimmed.replace(/^\d+\.\s/, "");
                html += `<li style='margin-bottom:4px;'>${content}</li>`;
            } else {
                if (inUl) { html += "</ul>"; inUl = false; }
                if (inOl) { html += "</ol>"; inOl = false; }
                if (trimmed.length > 0) {
                    html += `<p>${trimmed}</p>`;
                }
            }
        }
        if (inUl) html += "</ul>";
        if (inOl) html += "</ol>";
        return html;
    }

    function appendMessageUI(role, content) {
        const row = document.createElement("div");
        row.className = `gemini-message-row is-${role === "user" ? "user" : "bot"}`;

        const bubble = document.createElement("div");
        bubble.className = "gemini-message-bubble";
        bubble.innerHTML = formatMarkdown(content);

        row.appendChild(bubble);
        messagesContainer.appendChild(row);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTypingIndicator() {
        const typingEl = document.createElement("div");
        typingEl.id = "geminiTyping";
        typingEl.className = "gemini-message-row is-bot";
        typingEl.innerHTML = `
            <div class="gemini-typing-indicator" aria-label="Zaheer AI is thinking...">
                <span></span><span></span><span></span>
            </div>
        `;
        messagesContainer.appendChild(typingEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const typing = document.getElementById("geminiTyping");
        if (typing) typing.remove();
    }

    function loadHistory() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                conversationHistory = JSON.parse(saved);
            }
        } catch (e) {
            conversationHistory = [];
        }

        messagesContainer.innerHTML = "";

        if (conversationHistory.length === 0) {
            // Initial greeting
            const initialGreeting = "Hello! I am **Zaheer AI**, Muhammad Zaheer's interactive portfolio assistant.\n\nAsk me anything about his technical stack, live projects, architecture, or how to get in touch!";
            conversationHistory.push({ role: "assistant", content: initialGreeting });
        }

        conversationHistory.forEach(msg => {
            appendMessageUI(msg.role, msg.content);
        });
    }

    function saveHistory() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationHistory));
        } catch (e) {}
    }

    async function sendMessage(userText) {
        const trimmed = userText.trim();
        if (!trimmed) return;

        // Append user message
        conversationHistory.push({ role: "user", content: trimmed });
        appendMessageUI("user", trimmed);
        saveHistory();

        if (chatInput) chatInput.value = "";
        if (sendBtn) sendBtn.disabled = true;
        showTypingIndicator();

        if (window.CinematicAudio) CinematicAudio.playClick();

        let botReply = "";
        const customKey = (localStorage.getItem(API_KEY_STORAGE) || "").trim();

        // 1. If custom key is provided, call Gemini directly via client
        if (customKey) {
            try {
                botReply = await callGeminiDirectly(customKey, conversationHistory);
            } catch (geminiErr) {
                console.warn("Direct Gemini call failed:", geminiErr);
                // Fallback to smart knowledge engine
                botReply = generatePortfolioSmartResponse(trimmed);
            }
        } else {
            // 2. Try backend /api/chat (works in AI Studio and dynamic servers)
            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: conversationHistory
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    botReply = data.reply || "";
                } else {
                    // Static host (like GitHub Pages where /api/chat returns 404)
                    botReply = generatePortfolioSmartResponse(trimmed);
                }
            } catch (err) {
                // Static host (e.g. GitHub Pages) fallback to smart portfolio engine
                console.info("Using built-in portfolio AI knowledge engine for GitHub Pages.");
                botReply = generatePortfolioSmartResponse(trimmed);
            }
        }

        if (!botReply) {
            botReply = generatePortfolioSmartResponse(trimmed);
        }

        removeTypingIndicator();
        conversationHistory.push({ role: "assistant", content: botReply });
        appendMessageUI("assistant", botReply);
        saveHistory();

        if (window.CinematicAudio) CinematicAudio.playChime();

        if (sendBtn) sendBtn.disabled = false;
        if (chatInput) chatInput.focus();
    }

    function toggleChat(forceState) {
        const isCurrentlyOpen = modal.classList.contains("is-open");
        const shouldOpen = typeof forceState === "boolean" ? forceState : !isCurrentlyOpen;

        if (shouldOpen) {
            modal.removeAttribute("hidden");
            // Allow CSS transition
            requestAnimationFrame(() => {
                modal.classList.add("is-open");
                if (chatInput) chatInput.focus();
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            });
            launcher.style.display = "none";
            if (window.CinematicAudio) CinematicAudio.playClick();
        } else {
            modal.classList.remove("is-open");
            setTimeout(() => {
                modal.setAttribute("hidden", "true");
                launcher.style.display = "flex";
            }, 300);
            if (window.CinematicAudio) CinematicAudio.playClick();
        }
    }

    // Event listeners
    launcher.addEventListener("click", () => toggleChat(true));
    closeBtn.addEventListener("click", () => toggleChat(false));

    // Settings toggle
    if (settingsToggleBtn && settingsPanel) {
        settingsToggleBtn.addEventListener("click", () => {
            const isHidden = settingsPanel.hasAttribute("hidden");
            if (isHidden) {
                settingsPanel.removeAttribute("hidden");
                if (customKeyInput) customKeyInput.focus();
            } else {
                settingsPanel.setAttribute("hidden", "true");
            }
        });
    }

    if (saveKeyBtn && customKeyInput) {
        saveKeyBtn.addEventListener("click", () => {
            const val = customKeyInput.value.trim();
            if (val) {
                localStorage.setItem(API_KEY_STORAGE, val);
                showToast("Gemini API Key saved for GitHub Pages!", "✨");
                if (settingsPanel) settingsPanel.setAttribute("hidden", "true");
            } else {
                localStorage.removeItem(API_KEY_STORAGE);
                showToast("Key cleared — using built-in portfolio AI engine", "ℹ️");
            }
        });
    }

    if (clearKeyBtn && customKeyInput) {
        clearKeyBtn.addEventListener("click", () => {
            customKeyInput.value = "";
            localStorage.removeItem(API_KEY_STORAGE);
            showToast("API Key removed", "🗑️");
            if (settingsPanel) settingsPanel.setAttribute("hidden", "true");
        });
    }

    clearBtn.addEventListener("click", () => {
        conversationHistory = [];
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        loadHistory();
        showToast("Chat conversation cleared", "🗑️");
    });

    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        sendMessage(chatInput.value);
    });

    // Suggested prompt chips
    suggestedPrompts.querySelectorAll("[data-prompt]").forEach(btn => {
        btn.addEventListener("click", () => {
            const promptText = btn.getAttribute("data-prompt");
            if (promptText) {
                sendMessage(promptText);
            }
        });
    });

    // Close on Escape key
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("is-open")) {
            toggleChat(false);
        }
    });

    // Expose global helper for Command Palette and Terminal
    window.openGeminiChat = (prefilledQuery) => {
        toggleChat(true);
        if (prefilledQuery && typeof prefilledQuery === "string") {
            setTimeout(() => sendMessage(prefilledQuery), 200);
        }
    };

    // Initialize conversation
    loadHistory();
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    setupAmbientBackground();
    setupCinematicMode();
    setupSoundToggle();
    setupClickSparks();
    setupThemeToggle();
    setupScrollProgress();
    setupLiveClock();
    setupNavigation();
    setupRevealAnimations();
    setupTypedRoles();
    setupCounters();
    setupTabs();
    setupProjectFilters();
    setupCardDetails();
    setup3DTilt();
    setupProjectSandboxModal();
    setupCommandPalette();
    setupDeveloperTerminal();
    setupContactForm();
    setupGeminiChatbot();
});

