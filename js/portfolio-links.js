(function () {
    function portfolioBase() {
        const path = decodeURIComponent(`${window.location.pathname}${window.location.href}`)
            .replace(/\\/g, "/")
            .toLowerCase();

        if (
            path.includes("projects/weather-dashboard") ||
            path.includes("projects/weather-app") ||
            path.includes("projects/api-dashboard") ||
            path.includes("projects/todo-app")
        ) {
            return "../../";
        }

        return "";
    }

    // Direct, reliable navigation back to portfolio pages in the same tab
    window.returnToPortfolioTab = function (targetUrl) {
        const base = portfolioBase();
        let destination = targetUrl || `${base}projects.html`;
        if (destination === "back") {
            destination = `${base}projects.html`;
        }
        window.location.href = destination;
    };

    function applyPortfolioLinks() {
        const base = portfolioBase();

        document.querySelectorAll("[data-root-href]").forEach((element) => {
            const target = element.getAttribute("data-root-href");
            if (!target) return;
            element.setAttribute("href", `${base}${target}`);
        });

        document.querySelectorAll(".weather-back-link, [data-portfolio-return], .back-link").forEach((element) => {
            const target = element.getAttribute("data-portfolio-return") || element.getAttribute("href");
            if (target && target !== "back") {
                element.setAttribute("href", target);
            } else {
                element.setAttribute("href", `${base}projects.html`);
            }
        });
    }

    // Weather Dashboard Pro enhancement layer. Keeping this here lets the
    // weather page stay modular without changing its large core script.
    function loadWeatherEnhancements() {
        if (!window.location.pathname.toLowerCase().includes("projects/weather-dashboard")) return;
        if (document.querySelector('script[data-weather-enhancements]')) return;

        const script = document.createElement("script");
        script.src = "js/premium-enhancements.js";
        script.defer = true;
        script.dataset.weatherEnhancements = "true";
        document.head.appendChild(script);
    }

    function init() {
        applyPortfolioLinks();
        loadWeatherEnhancements();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
