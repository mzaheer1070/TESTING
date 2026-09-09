const PROBES = [
    { method: "GET", url: "https://jsonplaceholder.typicode.com/posts/1" },
    { method: "GET", url: "https://jsonplaceholder.typicode.com/users/1" },
    { method: "GET", url: "https://jsonplaceholder.typicode.com/todos/1" },
    { method: "GET", url: "https://api.github.com/zen" },
    {
        method: "POST",
        url: "https://jsonplaceholder.typicode.com/posts",
        body: JSON.stringify({ title: "health-check", body: "ping", userId: 1 }),
        headers: { "Content-Type": "application/json" }
    }
];

const statsGrid = document.getElementById("stats-grid");
const logList = document.getElementById("log-list");
const refreshButton = document.getElementById("refresh-log");
const statusLine = document.getElementById("dashboard-status");

let requestHistory = [];
let autoRefreshTimer = null;

function shortUrl(url) {
    try {
        const parsed = new URL(url);
        return `${parsed.hostname}${parsed.pathname}`;
    } catch (error) {
        return url;
    }
}

function statusClass(status, ok) {
    if (!ok || status === 0) return "error";
    if (status >= 200 && status < 300) return "ok";
    if (status >= 400) return "warn";
    return "warn";
}

async function runProbe(probe) {
    const start = performance.now();
    const options = {
        method: probe.method,
        headers: probe.headers || {}
    };

    if (probe.body) {
        options.body = probe.body;
    }

    try {
        const response = await fetch(probe.url, options);
        const latency = Math.round(performance.now() - start);

        return {
            method: probe.method,
            url: probe.url,
            status: response.status,
            latency,
            ok: response.ok,
            time: new Date()
        };
    } catch (error) {
        return {
            method: probe.method,
            url: probe.url,
            status: 0,
            latency: Math.round(performance.now() - start),
            ok: false,
            time: new Date()
        };
    }
}

function renderStats(results) {
    const total = results.length;
    const successes = results.filter((item) => item.ok).length;
    const errors = total - successes;
    const avgLatency = total
        ? Math.round(results.reduce((sum, item) => sum + item.latency, 0) / total)
        : 0;
    const successRate = total ? ((successes / total) * 100).toFixed(1) : "0.0";

    const stats = [
        { label: "Requests (this scan)", value: total },
        { label: "Success rate", value: `${successRate}%` },
        { label: "Avg latency (real)", value: `${avgLatency} ms` },
        { label: "Failed requests", value: errors }
    ];

    statsGrid.innerHTML = stats.map((stat) => `
        <article class="stat-box">
            <span>${stat.label}</span>
            <strong>${stat.value}</strong>
        </article>
    `).join("");
}

function renderLog(entries) {
    if (!entries.length) {
        logList.innerHTML = `<li class="log-empty">No requests yet.</li>`;
        return;
    }

    logList.innerHTML = entries.map((entry) => {
        const label = statusClass(entry.status, entry.ok);
        const statusText = entry.status === 0 ? "ERR" : entry.status;

        return `
            <li>
                <span class="status ${label}">${statusText}</span>
                <span>${entry.method} ${shortUrl(entry.url)}</span>
                <span>${entry.latency} ms</span>
            </li>
        `;
    }).join("");
}

async function scanApis() {
    refreshButton.disabled = true;
    refreshButton.textContent = "Scanning…";

    if (statusLine) {
        statusLine.textContent = "Calling live public APIs (JSONPlaceholder & GitHub)…";
        statusLine.dataset.type = "info";
    }

    const results = await Promise.all(PROBES.map((probe) => runProbe(probe)));

    requestHistory = [...results, ...requestHistory].slice(0, 12);
    renderStats(results);
    renderLog(requestHistory);

    const failures = results.filter((item) => !item.ok).length;

    if (statusLine) {
        statusLine.textContent = failures
            ? `${failures} request(s) failed — status codes and latency above are from real network calls.`
            : "All probes succeeded. Status codes and latency are from real network calls.";
        statusLine.dataset.type = failures ? "warn" : "success";
    }

    refreshButton.disabled = false;
    refreshButton.textContent = "Scan again";
}

refreshButton.addEventListener("click", () => {
    scanApis();
});

scanApis();
autoRefreshTimer = window.setInterval(scanApis, 30000);
