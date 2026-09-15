(() => {
    'use strict';

    const button = document.getElementById('soundToggle');
    if (!button) return;

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    let audioContext;
    let masterGain;
    let ambientGain;
    let ambientSource;
    let playing = false;
    let currentScene = 'idle';
    let birdTimer = null;
    let thunderCooldown = false;

    const sounds = new Map();

    const files = {
        sun: ['sounds/sunny/nature.mp3'],
        birds: [
            'sounds/sunny/birds-01.mp3',
            'sounds/sunny/birds-02.mp3'
        ],
        clouds: ['sounds/wind/smooth-wind.mp3'],
        fog: ['sounds/wind/smooth-wind.mp3'],
        drizzle: [
            'sounds/rain/rain-light.mp3',
            'sounds/rain/drizzle.mp3'
        ],
        shower: [
            'sounds/rain/rain-shower.mp3',
            'sounds/rain/shower.mp3'
        ],
        rain: [
            'sounds/rain/rain-medium.mp3',
            'sounds/rain/rain-steady.mp3'
        ],
        thunderRain: [
            'sounds/rain/rain-heavy.mp3',
            'sounds/rain/thunder-rain.mp3'
        ],
        snow: ['sounds/snow/soft-winter-wind.mp3'],
        thunder: [
            'sounds/thunder/thunder-01.mp3',
            'sounds/thunder/thunder-02.mp3',
            'sounds/thunder/thunder-03.mp3'
        ]
    };

    // Deliberately softer than the previous mix: weather ambience should sit behind the UI.
    const volumes = {
        idle: 0.012,
        sun: 0.055,
        clouds: 0.045,
        fog: 0.035,
        drizzle: 0.055,
        shower: 0.075,
        rain: 0.095,
        thunder: 0.075,
        snow: 0.045
    };

    const WMO_LABELS = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Rime fog',
        51: 'Light drizzle',
        53: 'Drizzle',
        55: 'Heavy drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Light rain',
        63: 'Rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Light snow',
        73: 'Snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Light rain shower',
        81: 'Rain shower',
        82: 'Heavy rain shower',
        85: 'Light snow shower',
        86: 'Heavy snow shower',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Severe thunderstorm with hail'
    };

    function normaliseScene(scene, weatherCode) {
        const code = Number(weatherCode);
        if (code >= 95) return 'thunder';
        if (code >= 80 && code <= 82) return 'shower';
        if (code >= 61 && code <= 65) return 'rain';
        if (code >= 51 && code <= 55) return 'drizzle';
        if (code >= 71 && code <= 77) return 'snow';
        if (code === 45 || code === 48) return 'fog';
        return scene || 'idle';
    }

    function setupAudioContext() {
        if (!AudioContextClass || audioContext) return;

        audioContext = new AudioContextClass();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.48;
        masterGain.connect(audioContext.destination);

        createFallbackAmbient();
    }

    function createFallbackAmbient() {
        const duration = 10;
        const buffer = audioContext.createBuffer(
            1,
            audioContext.sampleRate * duration,
            audioContext.sampleRate
        );

        const data = buffer.getChannelData(0);
        let previous = 0;

        for (let index = 0; index < data.length; index += 1) {
            previous = previous * 0.96 + (Math.random() * 2 - 1) * 0.04;
            data[index] = previous * 1.8;
        }

        ambientSource = audioContext.createBufferSource();
        const filter = audioContext.createBiquadFilter();

        ambientGain = audioContext.createGain();
        ambientGain.gain.value = 0;

        ambientSource.buffer = buffer;
        ambientSource.loop = true;

        filter.type = 'lowpass';
        filter.frequency.value = 1300;

        ambientSource.connect(filter).connect(ambientGain).connect(masterGain);
        ambientSource.start();
    }

    function setFallbackVolume(scene) {
        if (!ambientGain || !audioContext) return;

        const sceneVolume = {
            idle: 0.006,
            sun: 0.006,
            clouds: 0.018,
            fog: 0.014,
            drizzle: 0.018,
            shower: 0.028,
            rain: 0.038,
            thunder: 0.032,
            snow: 0.012
        };

        ambientGain.gain.cancelScheduledValues(audioContext.currentTime);
        ambientGain.gain.setTargetAtTime(
            sceneVolume[scene] || 0.012,
            audioContext.currentTime,
            1.2
        );
    }

    function createAudio(src, loop = false) {
        const audio = new Audio(src);
        audio.loop = loop;
        audio.preload = 'auto';
        audio.volume = 0;

        audio.addEventListener('error', () => {
            console.warn(`Audio file unavailable: ${src}`);
            setFallbackVolume(currentScene);
        });

        return audio;
    }

    function getAudio(src, loop = false) {
        if (!sounds.has(src)) sounds.set(src, createAudio(src, loop));
        return sounds.get(src);
    }

    function randomItem(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    function playAudio(audio, volume) {
        if (!audio || !playing) return;
        audio.volume = volume;
        return audio.play().catch(() => setFallbackVolume(currentScene));
    }

    function fadeAudio(audio, target, duration = 1200) {
        if (!audio) return;

        const start = audio.volume;
        const change = target - start;
        const started = performance.now();

        if (target > 0 && audio.paused) playAudio(audio, 0);

        function update(now) {
            const progress = Math.min((now - started) / duration, 1);
            const eased = progress * progress * (3 - 2 * progress);
            audio.volume = Math.max(0, Math.min(1, start + change * eased));

            if (progress < 1) {
                requestAnimationFrame(update);
            } else if (target === 0) {
                audio.pause();
                audio.currentTime = 0;
            }
        }

        requestAnimationFrame(update);
    }

    function stopAllSounds() {
        sounds.forEach(audio => fadeAudio(audio, 0));

        if (ambientGain && audioContext) {
            ambientGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.5);
        }
    }

    function stopTimers() {
        clearInterval(birdTimer);
        birdTimer = null;
    }

    function backgroundSoundFor(scene) {
        if (scene === 'thunder') return randomItem(files.thunderRain);
        return randomItem(files[scene] || files.clouds);
    }

    function playBackground(scene) {
        stopAllSounds();

        const background = getAudio(backgroundSoundFor(scene), true);
        playAudio(background, 0);
        fadeAudio(background, volumes[scene] || volumes.clouds, 1500);
        setFallbackVolume(scene);

        if (scene === 'sun') startBirds();
    }

    function playBird() {
        if (!playing || currentScene !== 'sun') return;
        const bird = getAudio(randomItem(files.birds));
        bird.currentTime = 0;
        playAudio(bird, 0.055);
    }

    function startBirds() {
        clearInterval(birdTimer);
        birdTimer = setInterval(() => {
            if (Math.random() > .35) playBird();
        }, 14000 + Math.random() * 10000);
    }

    function playFallbackThunder() {
        if (!audioContext || !masterGain || !playing) return;

        const duration = 2.8;
        const buffer = audioContext.createBuffer(
            1,
            Math.floor(audioContext.sampleRate * duration),
            audioContext.sampleRate
        );

        const data = buffer.getChannelData(0);
        let previous = 0;

        for (let index = 0; index < data.length; index += 1) {
            const progress = index / data.length;
            const decay = Math.pow(1 - progress, 1.8);
            previous = previous * 0.985 + (Math.random() * 2 - 1) * 0.08;
            data[index] = previous * decay * 0.9;
        }

        const source = audioContext.createBufferSource();
        const filter = audioContext.createBiquadFilter();
        const gain = audioContext.createGain();

        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 360;

        gain.gain.setValueAtTime(.001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(.065, audioContext.currentTime + .16);
        gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);

        source.connect(filter).connect(gain).connect(masterGain);
        source.start();
    }

    function playThunderSound() {
        if (!playing || currentScene !== 'thunder' || thunderCooldown) return;

        thunderCooldown = true;
        const thunder = getAudio(randomItem(files.thunder));
        thunder.currentTime = 0;
        thunder.volume = 0.055;
        thunder.play().catch(playFallbackThunder);

        setTimeout(() => {
            thunderCooldown = false;
        }, 7500);
    }

    function updateScene(scene, weatherCode) {
        currentScene = normaliseScene(scene, weatherCode);
        stopTimers();
        if (playing) playBackground(currentScene);
    }

    async function startSound() {
        setupAudioContext();
        if (!audioContext) throw new Error('Web Audio is not supported.');

        if (audioContext.state === 'suspended') await audioContext.resume();

        playing = true;
        playBackground(currentScene);
        button.textContent = '🔊 Ambient sound on';
        button.setAttribute('aria-pressed', 'true');
        document.body.classList.add('sound-active');
    }

    function stopSound() {
        playing = false;
        stopTimers();
        stopAllSounds();
        button.textContent = '🔇 Ambient sound off';
        button.setAttribute('aria-pressed', 'false');
        document.body.classList.remove('sound-active');
    }

    button.addEventListener('click', () => {
        if (playing) {
            stopSound();
        } else {
            startSound().catch(error => {
                console.error('Sound could not start:', error);
                button.textContent = '🔇 Sound unavailable';
            });
        }
    });

    /* ---------------- Weather UI polish ---------------- */
    function injectWeatherPolish() {
        if (document.getElementById('weather-polish-style')) return;

        const style = document.createElement('style');
        style.id = 'weather-polish-style';
        style.textContent = `
            /* Remove the decorative star above the title. */
            .header .brand-mark { display: none !important; }

            /* Quick-city cards: black in dark mode, white in light mode. */
            .quick-cities-list { gap: 10px !important; }
            .quick-chip {
                min-height: 44px;
                padding: 9px 15px !important;
                color: #fff !important;
                background: #050505 !important;
                border: 1px solid rgba(255,255,255,.16) !important;
                border-radius: 12px !important;
                box-shadow: 0 8px 20px rgba(0,0,0,.22) !important;
                transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease !important;
            }
            .quick-chip:hover,
            .quick-chip.is-active {
                border-color: rgba(174,190,255,.65) !important;
                box-shadow: 0 10px 26px rgba(0,0,0,.3), 0 0 18px rgba(110,160,255,.12) !important;
            }
            body[data-theme="light"] .quick-chip {
                color: #172033 !important;
                background: #fff !important;
                border-color: rgba(23,32,51,.16) !important;
                box-shadow: 0 8px 22px rgba(24,45,90,.13) !important;
            }
            body[data-theme="light"] .quick-chip:hover,
            body[data-theme="light"] .quick-chip.is-active {
                border-color: rgba(82,104,199,.45) !important;
            }

            /* Make the search feel like a real command/search control. */
            .search-section { position: relative; }
            .search-box { width: min(100%, 820px) !important; gap: 10px !important; }
            .search-field {
                min-height: 60px;
                border: 1px solid rgba(255,255,255,.14) !important;
                background: rgba(7,10,18,.88) !important;
                box-shadow: 0 14px 40px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.07) !important;
                backdrop-filter: blur(18px);
            }
            .search-field:focus-within {
                transform: translateY(-1px) !important;
                border-color: rgba(142,167,255,.7) !important;
                box-shadow: 0 0 0 3px rgba(142,167,255,.16), 0 16px 42px rgba(0,0,0,.32) !important;
            }
            .search-symbol { color: #aebeff !important; }
            .search-input { color: #fff !important; font-size: 1rem; }
            .search-input::placeholder { color: rgba(255,255,255,.48) !important; }
            .search-btn {
                width: 48px !important;
                height: 48px !important;
                color: #fff !important;
                background: #1d2a55 !important;
                border: 1px solid rgba(142,167,255,.25) !important;
                border-radius: 50% !important;
            }
            .location-btn {
                width: 60px !important;
                height: 60px !important;
                color: #fff !important;
                background: #050505 !important;
                border-color: rgba(255,255,255,.14) !important;
                border-radius: 50% !important;
            }
            body[data-theme="light"] .search-field {
                background: rgba(255,255,255,.96) !important;
                border-color: rgba(23,32,51,.13) !important;
                box-shadow: 0 14px 38px rgba(24,45,90,.14), inset 0 1px rgba(255,255,255,.9) !important;
            }
            body[data-theme="light"] .search-input { color: #172033 !important; }
            body[data-theme="light"] .search-input::placeholder { color: rgba(23,32,51,.48) !important; }
            body[data-theme="light"] .location-btn { color: #fff !important; background: #111 !important; }
            body[data-theme="light"] .search-btn { background: #5268c7 !important; }

            /* The old global ray layer was centered independently of the sun. Hide it;
               the sun itself now owns the ray origin below. */
            .sky-rays { opacity: 0 !important; }
            .sky-sun::after {
                content: "";
                position: absolute;
                inset: -260%;
                border-radius: 50%;
                background: repeating-conic-gradient(
                    from 250deg at 50% 50%,
                    rgba(255,226,145,.10) 0deg 7deg,
                    transparent 7deg 18deg
                );
                filter: blur(9px);
                opacity: .72;
                animation: sunOwnedRays 24s linear infinite;
                pointer-events: none;
            }
            @keyframes sunOwnedRays {
                to { transform: rotate(360deg); }
            }
            body[data-scene="sun"] #weatherCanvas { opacity: .38 !important; }

            /* Softer, layered clouds rather than flat translucent blobs. */
            .sky-cloud {
                background:
                    radial-gradient(circle at 30% 35%, rgba(255,255,255,.98) 0 18%, transparent 19%),
                    radial-gradient(circle at 52% 18%, rgba(255,255,255,.96) 0 24%, transparent 25%),
                    radial-gradient(circle at 72% 38%, rgba(245,250,255,.94) 0 20%, transparent 21%),
                    linear-gradient(180deg, rgba(255,255,255,.95), rgba(216,228,242,.82));
                box-shadow: 0 18px 30px rgba(40,65,95,.18), inset 0 8px 16px rgba(255,255,255,.48);
                filter: blur(1px) drop-shadow(0 12px 16px rgba(25,45,70,.16));
            }
            .sky-cloud::before { background: linear-gradient(180deg, #fff, #dfeaf5); box-shadow: inset 6px 6px 14px rgba(255,255,255,.7); }
            .sky-cloud::after { background: linear-gradient(180deg, #fff, #d7e4f1); box-shadow: inset 5px 5px 12px rgba(255,255,255,.6); }

            /* Give each weather condition a visibly different intensity. */
            body[data-rain-intensity="drizzle"] #weatherCanvas { opacity: .48; }
            body[data-rain-intensity="light-rain"] #weatherCanvas { opacity: .62; }
            body[data-rain-intensity="rain"] #weatherCanvas { opacity: .78; }
            body[data-rain-intensity="heavy-rain"] #weatherCanvas { opacity: .94; }
            body[data-rain-intensity="shower"] #weatherCanvas { opacity: .86; }
            body[data-rain-intensity="storm"] #weatherCanvas { opacity: 1; }

            .weather-intensity {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                margin-top: 9px;
                padding: 5px 10px;
                border: 1px solid rgba(255,255,255,.12);
                border-radius: 999px;
                color: var(--muted);
                background: rgba(255,255,255,.06);
                font-size: .78rem;
                font-weight: 700;
            }
            body[data-theme="light"] .weather-intensity { border-color: rgba(23,32,51,.12); background: rgba(23,32,51,.04); }

            @media (max-width: 700px) {
                .search-box { flex-wrap: wrap !important; }
                .search-field { flex: 1 1 calc(100% - 70px) !important; }
                .location-btn { flex: 0 0 60px !important; }
            }
        `;
        document.head.appendChild(style);

        // Remove the star immediately even before any weather data is loaded.
        document.querySelector('.header .brand-mark')?.remove();

        // Add a clear/search affordance without changing the existing HTML structure.
        const input = document.getElementById('searchInput');
        const field = document.querySelector('.search-field');
        if (input && field && !field.querySelector('.search-clear')) {
            const clear = document.createElement('button');
            clear.type = 'button';
            clear.className = 'search-clear';
            clear.setAttribute('aria-label', 'Clear search');
            clear.textContent = '×';
            clear.style.cssText = 'display:none;width:34px;height:34px;margin-right:3px;border-radius:50%;color:inherit;background:transparent;font-size:1.35rem;line-height:1;';
            field.insertBefore(clear, document.getElementById('searchBtn'));
            const syncClear = () => { clear.style.display = input.value ? 'grid' : 'none'; clear.style.placeItems = 'center'; };
            input.addEventListener('input', syncClear);
            clear.addEventListener('click', () => { input.value = ''; input.focus(); input.dispatchEvent(new Event('input', { bubbles: true })); });
        }
    }

    function applyWeatherLabel(detail) {
        const code = Number(detail.weatherCode);
        const description = document.getElementById('weatherDescription');
        if (description && WMO_LABELS[code]) description.textContent = WMO_LABELS[code];

        const intensityMap = {
            51: 'drizzle', 53: 'drizzle', 55: 'drizzle',
            61: 'light-rain', 63: 'rain', 65: 'heavy-rain',
            80: 'shower', 81: 'shower', 82: 'shower',
            95: 'storm', 96: 'storm', 99: 'storm'
        };

        const intensity = intensityMap[code] || '';
        document.body.dataset.rainIntensity = intensity;

        const locationInfo = document.querySelector('.location-info');
        if (locationInfo) {
            let badge = locationInfo.querySelector('.weather-intensity');
            if (intensity && WMO_LABELS[code]) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'weather-intensity';
                    locationInfo.appendChild(badge);
                }
                badge.textContent = `🌧️ ${WMO_LABELS[code]}`;
            } else if (badge) {
                badge.remove();
            }
        }
    }

    injectWeatherPolish();

    document.addEventListener('weatherchange', event => {
        const detail = event.detail || {};
        const code = Number(detail.weatherCode);
        currentScene = normaliseScene(detail.scene, code);
        applyWeatherLabel(detail);
        updateScene(currentScene, code);
    });

    document.addEventListener('thunder', playThunderSound);
})();