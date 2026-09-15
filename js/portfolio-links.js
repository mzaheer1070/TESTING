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

        // Ensure data-root-href elements have proper relative hrefs
        document.querySelectorAll("[data-root-href]").forEach((element) => {
            const target = element.getAttribute("data-root-href");
            if (!target) return;
            element.setAttribute("href", `${base}${target}`);
        });

        // Ensure back-links have proper relative hrefs
        document.querySelectorAll(".weather-back-link, [data-portfolio-return], .back-link").forEach((element) => {
            const target = element.getAttribute("data-portfolio-return") || element.getAttribute("href");
            if (target && target !== "back") {
                element.setAttribute("href", target);
            } else {
                element.setAttribute("href", `${base}projects.html`);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyPortfolioLinks);
    } else {
        applyPortfolioLinks();
    }
})();
