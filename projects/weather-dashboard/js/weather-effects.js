(() => {
    'use strict';

    const canvas = document.getElementById('weatherCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Viewport dimensions & scaling
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Weather state
    let currentScene = 'idle';
    let windSpeed = 0;
    let precipitation = 0;
    let cloudCover = 0;
    let weatherCode = 0;
    let isDaytime = true;

    // 3D Mouse Parallax Coordinates
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    // Performance & Delta Time
    let lastTime = performance.now();
    let animationFrameId = null;
    let frameDropCounter = 0;
    let adaptiveScale = 1.0;

    // Lightning & Storm
    let stormTimer = null;
    let ambientFlash = 0; // 0 to 1 for sky illumination
    let activeLightningBolt = null;

    // Particle Object Pool
    const MAX_PARTICLES = 280;
    const MAX_SPLASHES = 60;
    const particles = [];
    const splashes = [];

    // Pre-allocate particle objects to eliminate GC pauses
    for (let i = 0; i < MAX_PARTICLES; i++) {
        particles.push({
            active: false,
            x: 0,
            y: 0,
            z: 1, // 0.15 (far background) to 1.0 (near foreground)
            vx: 0,
            vy: 0,
            size: 2,
            length: 12,
            alpha: 1,
            rotation: 0,
            rotSpeed: 0,
            phase: Math.random() * Math.PI * 2,
            wobbleSpeed: 1,
            color: '#fff'
        });
    }

    for (let i = 0; i < MAX_SPLASHES; i++) {
        splashes.push({
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 2,
            maxRadius: 10,
            alpha: 1,
            life: 0,
            maxLife: 0.25
        });
    }

    // Base particle counts per scene
    const SCENE_PARTICLE_TARGETS = {
        idle: 35,
        sun: 45,
        clouds: 30,
        fog: 50,
        drizzle: 75,
        shower: 140,
        rain: 180,
        thunder: 220,
        snow: 130
    };

    function normaliseScene(nextScene, code) {
        const c = Number(code);
        if (c >= 80 && c <= 82) return 'shower';
        if (c >= 95) return 'thunder';
        if (c >= 71 && c <= 77) return 'snow';
        if (c >= 61 && c <= 65) return 'rain';
        if (c >= 51 && c <= 55) return 'drizzle';
        if (c === 45 || c === 48) return 'fog';
        if (c === 2 || c === 3) return 'clouds';
        if (c === 0 || c === 1) return 'sun';
        return nextScene || 'idle';
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        reseedParticles();
    }

    function reseedParticles() {
        const targetCount = Math.min(
            MAX_PARTICLES,
            Math.round((SCENE_PARTICLE_TARGETS[currentScene] || 40) * adaptiveScale)
        );

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (i < targetCount) {
                p.active = true;
                initParticle(p, true);
            } else {
                p.active = false;
            }
        }
    }

    function initParticle(p, randomizeY = false) {
        // 3D Depth coordinate: 0.15 (far, slow, small) to 1.0 (near, fast, crisp)
        p.z = 0.15 + Math.random() * 0.85;
        p.x = Math.random() * (width + 200) - 100;
        p.y = randomizeY ? Math.random() * (height + 100) - 50 : -20 - Math.random() * 40;
        p.phase = Math.random() * Math.PI * 2;
        p.rotation = Math.random() * Math.PI * 2;
        p.rotSpeed = (Math.random() - 0.5) * 2.5;

        const isRain = ['drizzle', 'shower', 'rain', 'thunder'].includes(currentScene);

        if (isRain) {
            const baseLen = currentScene === 'drizzle' ? 10 : currentScene === 'thunder' ? 26 : 18;
            p.length = (baseLen + Math.random() * 12) * p.z;
            p.size = (0.7 + p.z * 1.3);
            p.alpha = 0.25 + p.z * 0.55;

            const baseSpeed = currentScene === 'drizzle' ? 380 : currentScene === 'shower' ? 680 : currentScene === 'thunder' ? 920 : 540;
            p.vy = baseSpeed * (0.55 + p.z * 0.65);
            p.vx = (windSpeed * 3.8 + (Math.random() - 0.5) * 15) * p.z;
        } else if (currentScene === 'snow') {
            p.size = (1.5 + Math.random() * 3.5) * p.z;
            p.alpha = 0.35 + p.z * 0.6;
            p.vy = (35 + Math.random() * 65) * p.z;
            p.vx = (windSpeed * 1.5 + (Math.random() - 0.5) * 20) * p.z;
            p.wobbleSpeed = 1.2 + Math.random() * 2.5;
        } else if (currentScene === 'sun') {
            // Sun motes / golden atmospheric embers
            p.size = (1.2 + Math.random() * 3.8) * p.z;
            p.alpha = 0.2 + p.z * 0.45;
            p.vy = -(12 + Math.random() * 24) * p.z;
            p.vx = (Math.sin(p.phase) * 18 + (windSpeed * 0.8)) * p.z;
            p.wobbleSpeed = 0.8 + Math.random() * 1.4;
        } else if (currentScene === 'fog') {
            // Rolling mist puffs
            p.size = (45 + Math.random() * 85) * p.z;
            p.alpha = 0.04 + p.z * 0.08;
            p.vy = (Math.sin(p.phase) * 6) * p.z;
            p.vx = (18 + windSpeed * 2) * p.z;
            p.wobbleSpeed = 0.5 + Math.random() * 0.8;
        } else {
            // Idle / Clouds atmospheric particles
            p.size = (1.5 + Math.random() * 2.5) * p.z;
            p.alpha = 0.15 + p.z * 0.35;
            p.vy = (Math.sin(p.phase) * 8 + 4) * p.z;
            p.vx = (Math.cos(p.phase) * 14 + windSpeed * 1.2) * p.z;
            p.wobbleSpeed = 0.6 + Math.random();
        }
    }

    function spawnSplash(x, y, z) {
        for (let i = 0; i < MAX_SPLASHES; i++) {
            const s = splashes[i];
            if (!s.active) {
                s.active = true;
                s.x = x;
                s.y = Math.min(y, height - 4);
                s.vx = (Math.random() - 0.5) * 55 * z;
                s.vy = -(25 + Math.random() * 60) * z;
                s.radius = 1;
                s.maxRadius = (3 + Math.random() * 7) * z;
                s.alpha = 0.45 * z;
                s.life = 0;
                s.maxLife = 0.2 + Math.random() * 0.12;
                return;
            }
        }
    }

    function updateParticles(dt) {
        const isRain = ['drizzle', 'shower', 'rain', 'thunder'].includes(currentScene);

        // Update 3D parallax position with smooth damping
        currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05;
        currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05;

        // Ambient flash fade
        if (ambientFlash > 0) {
            ambientFlash = Math.max(0, ambientFlash - dt * 2.8);
        }

        // Update active splashes
        for (let i = 0; i < MAX_SPLASHES; i++) {
            const s = splashes[i];
            if (!s.active) continue;

            s.life += dt;
            if (s.life >= s.maxLife) {
                s.active = false;
                continue;
            }

            const progress = s.life / s.maxLife;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vy += 220 * dt; // Gravity
            s.radius += (s.maxRadius - s.radius) * (dt * 12);
            s.alpha = (1 - progress) * 0.5;
        }

        // Update atmospheric particles
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (!p.active) continue;

            p.phase += dt * p.wobbleSpeed;
            p.rotation += dt * p.rotSpeed;

            if (isRain) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                // Ground splash physics
                if (p.y >= height - 10) {
                    if (Math.random() < (currentScene === 'thunder' ? 0.45 : 0.25)) {
                        spawnSplash(p.x, height - 6, p.z);
                    }
                    initParticle(p, false);
                }
            } else if (currentScene === 'snow') {
                p.x += (p.vx + Math.sin(p.phase) * 28) * dt;
                p.y += p.vy * dt;

                if (p.y > height + 20) {
                    initParticle(p, false);
                }
            } else if (currentScene === 'sun') {
                p.x += (p.vx + Math.sin(p.phase) * 14) * dt;
                p.y += p.vy * dt;

                if (p.y < -30 || p.x > width + 40 || p.x < -40) {
                    initParticle(p, false);
                    p.y = height + 10 + Math.random() * 30;
                }
            } else if (currentScene === 'fog') {
                p.x += p.vx * dt;
                p.y += Math.sin(p.phase) * 12 * dt;

                if (p.x > width + p.size * 2) {
                    initParticle(p, false);
                    p.x = -p.size * 2;
                }
            } else {
                p.x += (p.vx + Math.cos(p.phase) * 12) * dt;
                p.y += (p.vy + Math.sin(p.phase) * 8) * dt;

                if (p.y > height + 30) initParticle(p, false);
                if (p.y < -30) p.y = height + 20;
                if (p.x > width + 30) p.x = -30;
                if (p.x < -30) p.x = width + 30;
            }
        }
    }

    function render3DScene() {
        ctx.clearRect(0, 0, width, height);

        // 1. Ambient Lightning Flash (illuminates 3D atmosphere during thunderstorms)
        if (ambientFlash > 0.01) {
            ctx.save();
            ctx.fillStyle = `rgba(220, 240, 255, ${ambientFlash * 0.45})`;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }

        // 2. Volumetric 3D Sunbeams (God Rays) during clear/sun day
        if (currentScene === 'sun' && isDaytime) {
            renderVolumetricSunbeams();
        }

        // 3. Render 3D Depth-Sorted Particles
        const isRain = ['drizzle', 'shower', 'rain', 'thunder'].includes(currentScene);

        if (isRain) {
            render3DRain();
        } else if (currentScene === 'snow') {
            render3DSnow();
        } else if (currentScene === 'sun') {
            render3DSunMotes();
        } else if (currentScene === 'fog') {
            render3DFog();
        } else {
            render3DAtmosphericDust();
        }

        // 4. Render Splashes on floor
        renderSplashes();
    }

    function renderVolumetricSunbeams() {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const sunCenterX = width * 0.82 + currentParallaxX * 14;
        const sunCenterY = height * 0.14 + currentParallaxY * 10;
        const rayCount = 5;

        for (let i = 0; i < rayCount; i++) {
            const angle = (205 + i * 14 + Math.sin(lastTime * 0.0008 + i) * 3) * (Math.PI / 180);
            const rayLen = Math.max(width, height) * 1.3;
            const spread = 0.14;

            const grad = ctx.createRadialGradient(
                sunCenterX, sunCenterY, 40,
                sunCenterX + Math.cos(angle) * (rayLen * 0.6),
                sunCenterY + Math.sin(angle) * (rayLen * 0.6),
                rayLen
            );
            grad.addColorStop(0, 'rgba(255, 235, 170, 0.16)');
            grad.addColorStop(0.45, 'rgba(255, 215, 120, 0.08)');
            grad.addColorStop(1, 'rgba(255, 190, 80, 0)');

            ctx.beginPath();
            ctx.moveTo(sunCenterX, sunCenterY);
            ctx.lineTo(sunCenterX + Math.cos(angle - spread) * rayLen, sunCenterY + Math.sin(angle - spread) * rayLen);
            ctx.lineTo(sunCenterX + Math.cos(angle + spread) * rayLen, sunCenterY + Math.sin(angle + spread) * rayLen);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
        }

        ctx.restore();
    }

    function render3DRain() {
        ctx.save();
        ctx.lineCap = 'round';

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (!p.active) continue;

            // Parallax offset scales with depth z
            const renderX = p.x + currentParallaxX * (1 - p.z) * 15;
            const renderY = p.y + currentParallaxY * (1 - p.z) * 10;

            const angle = Math.min(windSpeed / 55, 1.3);
            const dx = angle * p.length;
            const dy = p.length;

            ctx.beginPath();
            ctx.moveTo(renderX, renderY);
            ctx.lineTo(renderX + dx, renderY + dy);

            // Shading: Foreground drops have specular highlight, distant drops are translucent
            if (p.z > 0.75) {
                ctx.strokeStyle = currentScene === 'thunder'
                    ? `rgba(235, 248, 255, ${p.alpha})`
                    : `rgba(215, 238, 255, ${p.alpha})`;
                ctx.lineWidth = p.size;
            } else if (p.z > 0.45) {
                ctx.strokeStyle = `rgba(185, 222, 255, ${p.alpha * 0.8})`;
                ctx.lineWidth = p.size * 0.85;
            } else {
                ctx.strokeStyle = `rgba(150, 195, 240, ${p.alpha * 0.5})`;
                ctx.lineWidth = Math.max(0.6, p.size * 0.7);
            }

            ctx.stroke();
        }

        ctx.restore();
    }

    function render3DSnow() {
        ctx.save();

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (!p.active) continue;

            const renderX = p.x + currentParallaxX * (1 - p.z) * 20;
            const renderY = p.y + currentParallaxY * (1 - p.z) * 12;

            ctx.save();
            ctx.translate(renderX, renderY);
            ctx.rotate(p.rotation);

            if (p.z > 0.7) {
                // Foreground crystalline 3D snowflake
                ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                    const a = (k * 60) * (Math.PI / 180);
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
                }
                ctx.stroke();

                // Core glow
                ctx.fillStyle = `rgba(220, 242, 255, ${p.alpha * 0.8})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Midground/distant soft snowflake sphere with depth glow
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
                grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
                grad.addColorStop(0.6, `rgba(215, 238, 255, ${p.alpha * 0.6})`);
                grad.addColorStop(1, 'rgba(200, 230, 255, 0)');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        ctx.restore();
    }

    function render3DSunMotes() {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (!p.active) continue;

            const renderX = p.x + currentParallaxX * (1 - p.z) * 25;
            const renderY = p.y + currentParallaxY * (1 - p.z) * 18;

            const pulse = 0.8 + Math.sin(p.phase) * 0.25;
            const radius = p.size * pulse;

            const grad = ctx.createRadialGradient(renderX, renderY, 0, renderX, renderY, radius * 2.2);
            grad.addColorStop(0, `rgba(255, 245, 190, ${p.alpha})`);
            grad.addColorStop(0.4, `rgba(255, 210, 110, ${p.alpha * 0.6})`);
            grad.addColorStop(1, 'rgba(255, 160, 60, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(renderX, renderY, radius * 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function render3DFog() {
        ctx.save();

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (!p.active) continue;

            const renderX = p.x + currentParallaxX * (1 - p.z) * 35;
            const renderY = (height * 0.65 + p.y * 0.35) + currentParallaxY * (1 - p.z) * 20;

            const grad = ctx.createRadialGradient(renderX, renderY, 0, renderX, renderY, p.size);
            grad.addColorStop(0, `rgba(220, 235, 255, ${p.alpha})`);
            grad.addColorStop(0.5, `rgba(180, 205, 235, ${p.alpha * 0.5})`);
            grad.addColorStop(1, 'rgba(160, 190, 220, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(renderX, renderY, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function render3DAtmosphericDust() {
        ctx.save();

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (!p.active) continue;

            const renderX = p.x + currentParallaxX * (1 - p.z) * 15;
            const renderY = p.y + currentParallaxY * (1 - p.z) * 10;

            ctx.fillStyle = `rgba(230, 240, 255, ${p.alpha * (0.8 + Math.sin(p.phase) * 0.2)})`;
            ctx.beginPath();
            ctx.arc(renderX, renderY, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function renderSplashes() {
        ctx.save();
        ctx.strokeStyle = 'rgba(215, 240, 255, 0.4)';
        ctx.fillStyle = 'rgba(230, 248, 255, 0.6)';

        for (let i = 0; i < MAX_SPLASHES; i++) {
            const s = splashes[i];
            if (!s.active) continue;

            // Expanding ripple ellipse
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, s.radius * 1.8, s.radius * 0.5, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(200, 235, 255, ${s.alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Tiny droplet bead
            ctx.beginPath();
            ctx.arc(s.x, s.y - s.radius * 0.6, Math.max(0.8, s.radius * 0.25), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(240, 250, 255, ${s.alpha * 1.2})`;
            ctx.fill();
        }

        ctx.restore();
    }

    // Main animation loop with delta time & frame rate smoothing
    function tick(currentTime) {
        const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;

        // Frame rate monitoring for auto-optimization
        if (dt > 0.024) { // Below 42fps
            frameDropCounter++;
            if (frameDropCounter > 50 && adaptiveScale > 0.55) {
                adaptiveScale = 0.65;
                reseedParticles();
            }
        } else {
            frameDropCounter = Math.max(0, frameDropCounter - 1);
        }

        if (!document.hidden) {
            updateParticles(dt);
            render3DScene();
        }

        animationFrameId = requestAnimationFrame(tick);
    }

    // Mouse movement listener for 3D Atmospheric Parallax
    function onMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        targetParallaxX = ((mouseX / width) - 0.5) * 2; // -1 to 1
        targetParallaxY = ((mouseY / height) - 0.5) * 2;

        // Apply 3D celestial parallax directly to CSS variables
        document.body.style.setProperty('--parallax-x', `${(targetParallaxX * 18).toFixed(1)}px`);
        document.body.style.setProperty('--parallax-y', `${(targetParallaxY * 12).toFixed(1)}px`);
    }

    // High-Realism Branching Lightning
    function triggerRealisticLightning() {
        if (currentScene !== 'thunder') return;

        // Sky flash
        ambientFlash = 1.0;

        // Screen micro-shake
        document.body.classList.add('camera-rumble');
        setTimeout(() => document.body.classList.remove('camera-rumble'), 220);

        if (activeLightningBolt) {
            activeLightningBolt.remove();
            activeLightningBolt = null;
        }

        const bolt = document.createElement('div');
        bolt.id = 'stormLightningBolt';
        bolt.setAttribute('aria-hidden', 'true');

        const startX = 20 + Math.random() * 60;
        const mainPath = generateFractalBolt(startX, 0, startX + (Math.random() - 0.5) * 15, 100, 5, 8);
        const branchPath1 = generateFractalBolt(startX - 5, 38, startX - 25, 65, 3, 5);
        const branchPath2 = generateFractalBolt(startX + 8, 52, startX + 28, 75, 3, 5);

        bolt.innerHTML = `
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <path class="lightning-glow" d="${mainPath}"></path>
                <path class="lightning-main" d="${mainPath}"></path>
                <path class="lightning-branch" d="${branchPath1}"></path>
                <path class="lightning-branch" d="${branchPath2}"></path>
            </svg>
        `;

        document.body.appendChild(bolt);
        activeLightningBolt = bolt;

        bolt.animate([
            { opacity: 0 },
            { opacity: 1, offset: 0.08 },
            { opacity: 0.25, offset: 0.2 },
            { opacity: 0.95, offset: 0.35 },
            { opacity: 0.15, offset: 0.5 },
            { opacity: 0, offset: 1 }
        ], {
            duration: 750,
            easing: 'ease-out'
        }).onfinish = () => {
            bolt.remove();
            if (activeLightningBolt === bolt) activeLightningBolt = null;
        };
    }

    function generateFractalBolt(x1, y1, x2, y2, depth, maxOffset) {
        if (depth === 0) {
            return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`;
        }

        const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * maxOffset;
        const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * (maxOffset * 0.4);

        const left = generateFractalBolt(x1, y1, midX, midY, depth - 1, maxOffset * 0.6);
        const right = generateFractalBolt(midX, midY, x2, y2, depth - 1, maxOffset * 0.6);

        return `${left} ${right.replace(/^M[^ ]+ [^ ]+ /, '')}`;
    }

    function startStormLightning() {
        clearInterval(stormTimer);
        if (currentScene !== 'thunder') return;

        stormTimer = setInterval(() => {
            if (Math.random() > 0.25) {
                triggerRealisticLightning();
            }
        }, 8000 + Math.random() * 9000);
    }

    // Dynamic Cloud Details & 3D Shading
    function updateCloudDetails() {
        const clouds = document.querySelectorAll('.sky-cloud');
        if (!clouds.length) return;

        const cover = Math.max(0, Math.min(100, Number(cloudCover) || 0));
        const coverFactor = cover / 100;
        const isCloudy = ['clouds', 'fog', 'rain', 'shower', 'drizzle', 'snow', 'thunder'].includes(currentScene);

        const baseOpacity = isCloudy ? Math.min(0.96, 0.2 + coverFactor * 0.76) : coverFactor * 0.35;

        clouds.forEach((cloud, index) => {
            const layerOpacity = Math.max(0, Math.min(1, baseOpacity * (1 - index * 0.1)));
            cloud.style.opacity = String(layerOpacity);

            if (currentScene === 'thunder') {
                cloud.style.filter = 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6)) brightness(0.65) saturate(0.8)';
            } else if (currentScene === 'rain' || currentScene === 'shower') {
                cloud.style.filter = 'drop-shadow(0 16px 32px rgba(0, 0, 0, 0.4)) brightness(0.8) saturate(0.85)';
            } else {
                cloud.style.filter = 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.2))';
            }
        });
    }

    function setScene(nextScene, nextWindSpeed = 0, nextPrecipitation = 0, nextCloudCover = 0, code = 0) {
        currentScene = normaliseScene(nextScene, code);
        windSpeed = Number(nextWindSpeed) || 0;
        precipitation = Number(nextPrecipitation) || 0;
        cloudCover = Number(nextCloudCover) || 0;
        weatherCode = Number(code) || 0;
        isDaytime = document.body.dataset.daytime !== 'night';

        document.body.dataset.scene = currentScene;

        updateCloudDetails();
        reseedParticles();
        startStormLightning();

        if (currentScene !== 'thunder' && activeLightningBolt) {
            activeLightningBolt.remove();
            activeLightningBolt = null;
        }
    }

    // Event Listeners
    document.addEventListener('weatherchange', event => {
        const detail = event.detail || {};
        setScene(
            detail.scene,
            detail.windSpeed,
            detail.precipitation,
            detail.cloudCover,
            detail.weatherCode
        );
    });

    document.addEventListener('thunder', triggerRealisticLightning);

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            lastTime = performance.now();
        }
    });

    // Device orientation for 3D Mobile Gyroscope tilt
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', e => {
            if (e.gamma !== null && e.beta !== null) {
                targetParallaxX = Math.max(-1, Math.min(1, e.gamma / 30));
                targetParallaxY = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
                document.body.style.setProperty('--parallax-x', `${(targetParallaxX * 16).toFixed(1)}px`);
                document.body.style.setProperty('--parallax-y', `${(targetParallaxY * 10).toFixed(1)}px`);
            }
        }, { passive: true });
    }

    // Public API
    window.WeatherEffects = { setScene, reseedParticles };

    // Initialization
    resize();
    updateCloudDetails();
    animationFrameId = requestAnimationFrame(tick);
})();
