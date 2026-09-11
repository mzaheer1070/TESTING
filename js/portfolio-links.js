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

    // Return to the user's active portfolio tab and close the current standalone tab
    window.returnToPortfolioTab = function (targetUrl) {
        const base = portfolioBase();
        const fallbackUrl = targetUrl || `${base}projects.html`;

        // 1. If opened from the portfolio hub tab and opener is active
        if (window.opener && !window.opener.closed) {
            try {
                if (targetUrl && targetUrl !== "back") {
                    const targetUrlObj = new URL(targetUrl, window.location.href);
                    if (window.opener.location.pathname !== targetUrlObj.pathname) {
                        window.opener.location.href = targetUrl;
                    }
                }
                window.opener.focus();
            } catch (e) {
                try {
                    window.opener.focus();
                } catch (ignore) {}
            }

            // Close this standalone project tab so user returns to their original portfolio tab
            window.close();

            // Fallback if browser security refused to close the tab
            setTimeout(() => {
                if (!document.hidden) {
                    window.location.href = fallbackUrl;
                }
            }, 250);
            return;
        }

        // 2. Opener is null (user refreshed or opened directly).
        // Try focusing/navigating the existing named portfolio tab
        try {
            const portWin = window.open(fallbackUrl, "zaheer_portfolio_hub");
            if (portWin) {
                portWin.focus();
                window.close();
                return;
            }
        } catch (e) {}

        // 3. Try window.close()
        window.close();

        // 4. Default fallback: navigate current tab
        setTimeout(() => {
            window.location.href = fallbackUrl;
        }, 150);
    };

    function applyPortfolioLinks() {
        const base = portfolioBase();

        document.querySelectorAll("[data-root-href]").forEach((element) => {
            const target = element.getAttribute("data-root-href");
            if (!target) return;
            const fullHref = `${base}${target}`;
            element.setAttribute("href", fullHref);

            element.addEventListener("click", function (e) {
                e.preventDefault();
                window.returnToPortfolioTab(fullHref);
            });
        });

        document.querySelectorAll(".weather-back-link, [data-portfolio-return], .back-link").forEach((element) => {
            element.addEventListener("click", function (e) {
                e.preventDefault();
                const target = this.getAttribute("data-portfolio-return") || this.getAttribute("href") || `${base}projects.html`;
                window.returnToPortfolioTab(target);
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyPortfolioLinks);
    } else {
        applyPortfolioLinks();
    }
})();
