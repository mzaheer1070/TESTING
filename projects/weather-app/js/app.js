const form = document.getElementById("weather-form");
const result = document.getElementById("weather-result");
const statusEl = document.getElementById("weather-status");
const cityName = document.getElementById("city-name");
const tempEl = document.getElementById("temp");
const conditionEl = document.getElementById("condition");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const submitButton = form.querySelector("button[type='submit']");

let unit = "c";
let lastPlace = null;

const weatherLabels = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    95: "Thunderstorm"
};

function setStatus(message, type = "info") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.type = type;
    statusEl.hidden = !message;
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Loading…" : "Search";
}

async function geocodeCity(city) {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", city);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const response = await fetch(url);
    if (!response.ok) throw new Error("Could not look up that city.");

    const data = await response.json();
    if (!data.results?.length) throw new Error("City not found. Try another spelling.");

    return data.results[0];
}

async function fetchWeather(place) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(place.latitude));
    url.searchParams.set("longitude", String(place.longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code");
    url.searchParams.set("temperature_unit", unit === "c" ? "celsius" : "fahrenheit");
    url.searchParams.set("wind_speed_unit", "kmh");

    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather service is unavailable right now.");

    const data = await response.json();
    return data.current;
}

function renderWeather(place, current) {
    const label = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
    const code = current.weather_code;
    const unitLabel = unit === "c" ? "°C" : "°F";

    cityName.textContent = label;
    tempEl.textContent = `${Math.round(current.temperature_2m)}${unitLabel}`;
    conditionEl.textContent = weatherLabels[code] || "Current conditions";
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    result.hidden = false;
    setStatus("Live data from Open-Meteo.", "success");
}

async function showWeather(city) {
    setLoading(true);
    setStatus("Fetching live weather…", "info");
    result.hidden = true;

    try {
        const place = await geocodeCity(city);
        lastPlace = place;
        const current = await fetchWeather(place);
        renderWeather(place, current);
    } catch (error) {
        setStatus(error.message || "Something went wrong. Try again.", "error");
    } finally {
        setLoading(false);
    }
}

document.querySelectorAll(".unit-btn").forEach((button) => {
    button.addEventListener("click", async () => {
        unit = button.dataset.unit;
        document.querySelectorAll(".unit-btn").forEach((item) => {
            item.classList.toggle("is-active", item === button);
        });

        if (lastPlace) {
            setLoading(true);
            try {
                const current = await fetchWeather(lastPlace);
                renderWeather(lastPlace, current);
            } catch (error) {
                setStatus(error.message || "Could not refresh weather.", "error");
            } finally {
                setLoading(false);
            }
        }
    });
});

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const city = document.getElementById("city-input").value.trim();
    if (!city) return;
    showWeather(city);
});

showWeather("Karachi");
