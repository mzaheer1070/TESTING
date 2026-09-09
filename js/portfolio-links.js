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

    function applyPortfolioLinks() {
        const base = portfolioBase();

        document.querySelectorAll("[data-root-href]").forEach((element) => {
            const target = element.getAttribute("data-root-href");
            if (!target) return;
            element.setAttribute("href", `${base}${target}`);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyPortfolioLinks);
    } else {
        applyPortfolioLinks();
    }
})();
