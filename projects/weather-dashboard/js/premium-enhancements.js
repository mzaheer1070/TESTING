(() => {
    'use strict';

    const WEATHER = 'https://api.open-meteo.com/v1/forecast';
    const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
    const CACHE_KEY = 'weather-premium-v1';
    const CACHE_TTL = 10 * 60 * 1000;

    const $ = id => document.getElementById(id);
    const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));

    const weatherLabel = code => ({
        0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
        61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow',
        75: 'Heavy snow', 77: 'Snow grains', 80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
        85: 'Light snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm',
        96: 'Thunderstorm with hail', 99: 'Severe thunderstorm'
    }[Number(code)] || 'Variable conditions');

    const weatherEmoji = code => {
        const c = Number(code);
        if (c >= 95) return '⛈️';
        if (c >= 80) return c >= 85 ? '🌨️' : '🌦️';
        if (c >= 71) return '❄️';
        if (c >= 51) return '🌧️';
        if (c === 45 || c === 48) return '🌫️';
        if (c === 3) return '☁️';
        if (c === 2) return '⛅';
        if (c === 1) return '🌤️';
        return '☀️';
    };

    const toC = value => Number(value);
    const formatHour = value => new Date(value).toLocaleTimeString([], { hour: 'numeric' });
    const formatDay = value => new Date(value).toLocaleDateString([], { weekday: 'short' });

    function ensureStyles() {
        if ($('premium-weather-style')) return;
        const style = document.createElement('style');
        style.id = 'premium-weather-style';
        style.textContent = `
            #premiumWeatherFeatures { display:grid; gap:18px; margin-top:18px; }
            .premium-panel { position:relative; overflow:hidden; border:1px solid rgba(255,255,255,.11); border-radius:22px; padding:24px; background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.035)); box-shadow:0 16px 48px rgba(0,0,0,.14); backdrop-filter:blur(18px); }
            body[data-theme="light"] .premium-panel { background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(240,244,252,.9)); border-color:rgba(23,32,51,.1); box-shadow:0 16px 42px rgba(35,53,96,.10); }
            .premium-kicker { margin:0 0 5px; font-size:.72rem; letter-spacing:.16em; font-weight:800; opacity:.64; }
            .premium-title { margin:0; font-size:1.35rem; }
            .premium-head { display:flex; justify-content:space-between; align-items:flex-start; gap:18px; margin-bottom:18px; }
            .premium-badge { padding:8px 11px; border-radius:999px; background:rgba(104,136,255,.12); border:1px solid rgba(104,136,255,.22); font-weight:800; font-size:.78rem; white-space:nowrap; }
            .insight-grid { display:grid; grid-template-columns:1.3fr .7fr; gap:14px; }
            .insight-main { padding:18px; border-radius:18px; background:rgba(0,0,0,.12); }
            body[data-theme="light"] .insight-main { background:rgba(36,54,94,.045); }
            .insight-main p { margin:0; line-height:1.65; }
            .insight-actions { display:grid; gap:10px; grid-template-columns:repeat(3,1fr); }
            .insight-pill { display:flex; align-items:center; gap:10px; padding:13px 14px; border-radius:16px; background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.08); }
            body[data-theme="light"] .insight-pill { background:rgba(35,53,96,.035); border-color:rgba(35,53,96,.07); }
            .insight-pill-icon { font-size:1.1rem; }
            .insight-pill strong { display:block; font-size:.9rem; }
            .insight-pill span:last-child { display:block; margin-top:2px; opacity:.68; font-size:.76rem; }
            .hourly-scroller { display:grid; grid-auto-flow:column; grid-auto-columns:minmax(88px,1fr); gap:10px; overflow-x:auto; padding:3px 2px 8px; scrollbar-width:thin; }
            .hour-card { min-width:88px; padding:13px 10px; text-align:center; border-radius:17px; background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.07); transition:transform .2s ease,border-color .2s ease; }
            body[data-theme="light"] .hour-card { background:rgba(35,53,96,.035); border-color:rgba(35,53,96,.07); }
            .hour-card:hover { transform:translateY(-3px); border-color:rgba(124,151,255,.4); }
            .hour-card.now { background:linear-gradient(145deg,rgba(115,144,255,.18),rgba(115,144,255,.06)); border-color:rgba(124,151,255,.38); }
            .hour-time { font-size:.75rem; font-weight:800; opacity:.72; }
            .hour-icon { font-size:1.5rem; margin:8px 0 5px; }
            .hour-temp { font-size:1.06rem; font-weight:900; }
            .hour-rain { margin-top:5px; font-size:.7rem; opacity:.7; }
            .trend-wrap { display:grid; gap:12px; }
            .trend-meta { display:flex; justify-content:space-between; gap:12px; align-items:center; }
            .trend-meta strong { font-size:1rem; }
            .trend-svg { width:100%; height:150px; display:block; }
            .trend-labels { display:grid; grid-template-columns:repeat(7,1fr); gap:8px; font-size:.7rem; text-align:center; opacity:.67; }
            .premium-loading { min-height:84px; display:grid; place-items:center; opacity:.7; }
            .premium-source { margin-top:14px; font-size:.7rem; opacity:.52; }
            @media (max-width:760px) {
                .premium-panel { padding:18px; border-radius:18px; }
                .premium-head { align-items:center; }
                .insight-grid { grid-template-columns:1fr; }
                .insight-actions { grid-template-columns:1fr; }
                .trend-svg { height:125px; }
            }
        `;
        document.head.appendChild(style);
    }

    function ensureMount() {
        const dashboard = $('weatherDashboard');
        if (!dashboard || $('premiumWeatherFeatures')) return $('premiumWeatherFeatures');

        const mount = document.createElement('div');
        mount.id = 'premiumWeatherFeatures';
        mount.innerHTML = `
            <section class="premium-panel" id="weatherIntelligencePanel">
                <div class="premium-head">
                    <div><p class="premium-kicker">WEATHER INTELLIGENCE</p><h3 class="premium-title">What today's weather actually means</h3></div>
                    <span class="premium-badge" id="outdoorScore">Waiting…</span>
                </div>
                <div class="insight-grid">
                    <div class="insight-main"><p id="weatherStory">Analyzing conditions…</p></div>
                    <div class="insight-actions">
                        <div class="insight-pill"><span class="insight-pill-icon">👕</span><div><strong>What to wear</strong><span id="wearAdvice">Analyzing…</span></div></div>
                        <div class="insight-pill"><span class="insight-pill-icon">☂️</span><div><strong>Rain plan</strong><span id="rainAdvice">Analyzing…</span></div></div>
                        <div class="insight-pill"><span class="insight-pill-icon">🌿</span><div><strong>Outdoor feel</strong><span id="outdoorAdvice">Analyzing…</span></div></div>
                    </div>
                </div>
                <p class="premium-source">Personalized from the current forecast, wind, temperature and precipitation data.</p>
            </section>
            <section class="premium-panel">
                <div class="premium-head">
                    <div><p class="premium-kicker">NEXT 24 HOURS</p><h3 class="premium-title">Hourly outlook</h3></div>
                    <span class="premium-badge" id="hourlyRange">Updating…</span>
                </div>
                <div id="premiumHourly" class="hourly-scroller"><div class="premium-loading">Loading hourly forecast…</div></div>
            </section>
            <section class="premium-panel">
                <div class="premium-head">
                    <div><p class="premium-kicker">TEMPERATURE TREND</p><h3 class="premium-title">Your week at a glance</h3></div>
                    <span class="premium-badge" id="weeklyRange">Updating…</span>
                </div>
                <div id="premiumTrend" class="trend-wrap"><div class="premium-loading">Building the temperature trend…</div></div>
            </section>
        `;

        const forecastSection = dashboard.querySelector('.forecast-section');
        if (forecastSection) forecastSection.before(mount);
        else dashboard.appendChild(mount);
        return mount;
    }

    async function geocode(city) {
        const url = `${GEO}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Location lookup failed');
        const data = await response.json();
        const result = data.results?.[0];
        if (!result) throw new Error('Location not found');
        return { latitude: result.latitude, longitude: result.longitude };
    }

    function cacheRead(city) {
        try {
            const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            const item = raw[city.toLowerCase()];
            return item && Date.now() - item.savedAt < CACHE_TTL ? item.data : null;
        } catch { return null; }
    }

    function cacheWrite(city, data) {
        try {
            const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            raw[city.toLowerCase()] = { savedAt: Date.now(), data };
            const entries = Object.entries(raw).sort((a, b) => b[1].savedAt - a[1].savedAt).slice(0, 6);
            localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
        } catch { /* Storage is optional. */ }
    }

    async function fetchForecast(city) {
        const cached = cacheRead(city);
        if (cached) return cached;
        const location = await geocode(city);
        const params = new URLSearchParams({
            latitude: location.latitude,
            longitude: location.longitude,
            timezone: 'auto',
            forecast_days: '7',
            hourly: 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m',
            daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code'
        });
        const response = await fetch(`${WEATHER}?${params}`);
        if (!response.ok) throw new Error('Forecast unavailable');
        const data = await response.json();
        cacheWrite(city, data);
        return data;
    }

    function currentHourIndex(times) {
        const now = Date.now();
        let best = 0;
        let bestDelta = Infinity;
        times.forEach((time, index) => {
            const delta = Math.abs(new Date(time).getTime() - now);
            if (delta < bestDelta) { best = index; bestDelta = delta; }
        });
        return best;
    }

    function renderHourly(data) {
        const target = $('premiumHourly');
        if (!target || !data.hourly?.time?.length) return;
        const index = currentHourIndex(data.hourly.time);
        const start = Math.max(0, index);
        const end = Math.min(data.hourly.time.length, start + 24);
        const unit = (localStorage.getItem('weather-dashboard-units-v1') === 'imperial') ? '°F' : '°C';
        const convert = value => unit === '°F' ? (Number(value) * 9 / 5 + 32) : Number(value);

        target.innerHTML = data.hourly.time.slice(start, end).map((time, offset) => {
            const i = start + offset;
            const rain = Number(data.hourly.precipitation_probability?.[i] ?? 0);
            return `<div class="hour-card ${offset === 0 ? 'now' : ''}">
                <div class="hour-time">${offset === 0 ? 'Now' : escapeHtml(formatHour(time))}</div>
                <div class="hour-icon">${weatherEmoji(data.hourly.weather_code?.[i])}</div>
                <div class="hour-temp">${Math.round(convert(data.hourly.temperature_2m[i]))}${unit}</div>
                <div class="hour-rain">💧 ${Math.round(rain)}%</div>
            </div>`;
        }).join('');

        const first = data.hourly.temperature_2m?.[start];
        const last = data.hourly.temperature_2m?.[end - 1];
        if ($('hourlyRange')) $('hourlyRange').textContent = `${Math.round(convert(first))}${unit} → ${Math.round(convert(last))}${unit}`;
    }

    function renderTrend(data) {
        const target = $('premiumTrend');
        if (!target || !data.daily?.time?.length) return;
        const days = Math.min(7, data.daily.time.length);
        const unit = (localStorage.getItem('weather-dashboard-units-v1') === 'imperial') ? '°F' : '°C';
        const convert = value => unit === '°F' ? (Number(value) * 9 / 5 + 32) : Number(value);
        const highs = data.daily.temperature_2m_max.slice(0, days).map(convert);
        const lows = data.daily.temperature_2m_min.slice(0, days).map(convert);
        const all = highs.concat(lows);
        const min = Math.min(...all) - 2;
        const max = Math.max(...all) + 2;
        const range = Math.max(1, max - min);
        const width = 900, height = 150, padX = 30, padY = 18;
        const x = i => padX + (i * (width - padX * 2) / Math.max(1, days - 1));
        const y = value => height - padY - ((value - min) / range) * (height - padY * 2);
        const highPoints = highs.map((value, i) => `${x(i).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
        const lowPoints = lows.map((value, i) => `${x(i).toFixed(1)},${y(value).toFixed(1)}`).join(' ');

        target.innerHTML = `
            <div class="trend-meta"><strong>${Math.round(Math.min(...lows))}${unit} low</strong><strong>${Math.round(Math.max(...highs))}${unit} high</strong></div>
            <svg class="trend-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="Seven day temperature trend">
                <defs><linearGradient id="premiumTrendGradient" x1="0" x2="1"><stop offset="0" stop-color="#8da7ff" stop-opacity=".18"/><stop offset="1" stop-color="#77d6ff" stop-opacity=".02"/></linearGradient></defs>
                <path d="M ${highPoints} L ${x(days - 1)} ${height - padY} L ${x(0)} ${height - padY} Z" fill="url(#premiumTrendGradient)"/>
                <polyline points="${highPoints}" fill="none" stroke="#8da7ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="${lowPoints}" fill="none" stroke="#77d6ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="7 7"/>
                ${highs.map((value, i) => `<circle cx="${x(i)}" cy="${y(value)}" r="4.5" fill="#fff" stroke="#8da7ff" stroke-width="3"/>`).join('')}
                ${lows.map((value, i) => `<circle cx="${x(i)}" cy="${y(value)}" r="4" fill="#fff" stroke="#77d6ff" stroke-width="2.5"/>`).join('')}
            </svg>
            <div class="trend-labels">${data.daily.time.slice(0, days).map(formatDay).map(escapeHtml).map(day => `<span>${day}</span>`).join('')}</div>
        `;
        if ($('weeklyRange')) $('weeklyRange').textContent = `${Math.round(Math.min(...lows))}${unit}–${Math.round(Math.max(...highs))}${unit}`;
    }

    function readCurrentStats() {
        const tempText = $('temperature')?.textContent || '';
        const windText = $('windSpeed')?.textContent || '';
        const precipText = $('precipitation')?.textContent || '';
        const humidityText = $('humidity')?.textContent || '';
        const description = $('weatherDescription')?.textContent || 'Variable conditions';
        const temp = Number.parseFloat(tempText.replace(/[^-0-9.]/g, ''));
        const wind = Number.parseFloat(windText.replace(/[^0-9.]/g, ''));
        const rain = Number.parseFloat(precipText.replace(/[^0-9.]/g, ''));
        const humidity = Number.parseFloat(humidityText.replace(/[^0-9.]/g, ''));
        return { temp, wind, rain, humidity, description };
    }

    function renderIntelligence(data) {
        const stats = readCurrentStats();
        if (!Number.isFinite(stats.temp)) return;
        const currentCode = data?.hourly?.weather_code?.[currentHourIndex(data.hourly.time)] ?? 0;
        const label = weatherLabel(currentCode);
        const likelyRain = Math.max(Number(data?.daily?.precipitation_probability_max?.[0] ?? 0), Number(data?.hourly?.precipitation_probability?.[currentHourIndex(data.hourly.time)] ?? 0));
        const isStorm = Number(currentCode) >= 95;
        const isSnow = Number(currentCode) >= 71 && Number(currentCode) <= 86;
        const wet = Number(currentCode) >= 51 && Number(currentCode) <= 82;

        let score = 82;
        score -= Math.min(30, stats.wind * 0.8);
        score -= Math.min(25, likelyRain * 0.28);
        if (stats.temp < 8 || stats.temp > 34) score -= 18;
        if (isStorm) score -= 35;
        if (isSnow) score -= 12;
        score = Math.max(5, Math.min(98, Math.round(score)));

        const story = isStorm
            ? 'Storm conditions are the main story today. Keep outdoor plans flexible and avoid exposed areas while lightning is active.'
            : wet
                ? `Expect ${label.toLowerCase()} conditions. The main thing to plan around is moisture${likelyRain >= 60 ? ' and a high chance of more rain' : ''}.`
                : stats.temp >= 29
                    ? `Warm conditions dominate today. ${stats.wind >= 18 ? 'There is enough breeze to help a little, but heat can still build up.' : 'Try to avoid long periods in direct midday sun.'}`
                    : stats.temp <= 9
                        ? `Cool conditions dominate today. ${stats.wind >= 18 ? 'The breeze will make it feel colder than the thermometer suggests.' : 'A warm layer will make outdoor time more comfortable.'}`
                        : `${label} with a ${stats.wind >= 18 ? 'noticeable' : 'gentle'} breeze. Overall, this looks like a ${score >= 70 ? 'comfortable' : 'mixed'} day for being outside.`;

        let wear = 'Light everyday layers should work well.';
        if (isStorm || wet) wear = stats.temp < 17 ? 'Water-resistant jacket and closed shoes.' : 'Light clothing plus rain protection.';
        else if (isSnow || stats.temp < 8) wear = 'Warm layers, with extra protection for wind.';
        else if (stats.temp >= 30) wear = 'Light, breathable clothing and sun protection.';
        else if (stats.temp < 17) wear = 'A light jacket or extra layer is a good idea.';

        const rainAdvice = isStorm ? 'Avoid exposed areas.' : likelyRain >= 70 ? 'Umbrella strongly recommended.' : likelyRain >= 35 ? 'Keep an umbrella nearby.' : 'Low rain risk for now.';
        const outdoor = score >= 75 ? 'Good for plans' : score >= 50 ? 'Mixed conditions' : 'Plan around weather';

        if ($('weatherStory')) $('weatherStory').textContent = story;
        if ($('outdoorScore')) $('outdoorScore').textContent = `${score}/100 • ${outdoor}`;
        if ($('wearAdvice')) $('wearAdvice').textContent = wear;
        if ($('rainAdvice')) $('rainAdvice').textContent = rainAdvice;
        if ($('outdoorAdvice')) $('outdoorAdvice').textContent = stats.humidity >= 75 ? 'Humid' : stats.wind >= 22 ? 'Breezy' : 'Comfortable';
    }

    let activeCity = '';
    let refreshTimer = null;

    async function refresh() {
        const city = ($('cityName')?.textContent || '').trim();
        if (!city || city === activeCity && $('premiumHourly')?.dataset.ready === '1') return;
        activeCity = city;
        ensureStyles();
        ensureMount();
        try {
            const data = await fetchForecast(city);
            renderHourly(data);
            renderTrend(data);
            renderIntelligence(data);
            if ($('premiumHourly')) $('premiumHourly').dataset.ready = '1';
        } catch (error) {
            console.warn('Premium weather enhancement unavailable:', error);
            if ($('weatherStory')) $('weatherStory').textContent = 'The main weather dashboard is still available; enhanced hourly insights could not be loaded right now.';
        }
    }

    function observeDashboard() {
        const city = $('cityName');
        if (!city) return;
        const observer = new MutationObserver(() => {
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => refresh(), 120);
        });
        observer.observe(city, { childList: true, characterData: true, subtree: true });
        refresh();
    }

    function init() {
        ensureStyles();
        observeDashboard();
        window.addEventListener('weatherchange', () => setTimeout(refresh, 250));
        window.addEventListener('storage', event => {
            if (event.key === 'weather-dashboard-units-v1') {
                activeCity = '';
                refresh();
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
