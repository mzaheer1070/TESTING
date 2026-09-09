const STORAGE_KEY = "zaheer-todo-items";
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const emptyMsg = document.getElementById("empty-msg");
let tasks = [];
let filter = "all";

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        tasks = saved ? JSON.parse(saved) : [];
    } catch (error) {
        tasks = [];
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function visibleTasks() {
    if (filter === "active") return tasks.filter((task) => !task.done);
    if (filter === "done") return tasks.filter((task) => task.done);
    return tasks;
}

function render() {
    const items = visibleTasks();
    list.innerHTML = items.map((task) => `
        <li class="${task.done ? "is-done" : ""}">
            <input type="checkbox" data-id="${task.id}" ${task.done ? "checked" : ""} aria-label="Mark task done">
            <span>${escapeHtml(task.text)}</span>
            <button type="button" class="delete-btn" data-id="${task.id}">Delete</button>
        </li>
    `).join("");

    emptyMsg.hidden = tasks.length > 0;
    list.hidden = items.length === 0 && tasks.length > 0;
}

function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    tasks.unshift({
        id: crypto.randomUUID(),
        text,
        done: false
    });

    input.value = "";
    saveTasks();
    render();
});

list.addEventListener("click", (event) => {
    const target = event.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.matches('input[type="checkbox"]')) {
        tasks = tasks.map((task) => (task.id === id ? { ...task, done: target.checked } : task));
    }

    if (target.matches(".delete-btn")) {
        tasks = tasks.filter((task) => task.id !== id);
    }

    saveTasks();
    render();
});

document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
        filter = button.dataset.filter;
        document.querySelectorAll(".filter-btn").forEach((item) => {
            item.classList.toggle("is-active", item === button);
        });
        render();
    });
});

loadTasks();
render();
