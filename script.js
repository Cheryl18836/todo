/* =========================================================
   Tasks — To-Do App Logic
   Add / complete / delete / filter / clear / theme + localStorage
   ========================================================= */

(function () {
  "use strict";

  /* ---------- State ---------- */
  const STORAGE_KEY = "tasks.app.v1";
  const THEME_KEY = "tasks.app.theme";

  /** @type {{id:number, text:string, completed:boolean}[]} */
  let tasks = loadTasks();
  let currentFilter = "all"; // all | active | completed

  /* ---------- DOM refs ---------- */
  const form = document.getElementById("taskForm");
  const input = document.getElementById("taskInput");
  const taskList = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");
  const footer = document.getElementById("footer");
  const countLabel = document.getElementById("countLabel");
  const clearBtn = document.getElementById("clearCompleted");
  const filters = document.getElementById("filters");
  const themeToggle = document.getElementById("themeToggle");
  const dateLabel = document.getElementById("dateLabel");

  /* ---------- Init ---------- */
  initTheme();
  renderDate();
  render();

  /* ---------- Events ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask();
  });

  taskList.addEventListener("click", (e) => {
    const taskEl = e.target.closest(".task");
    if (!taskEl) return;
    const id = Number(taskEl.dataset.id);

    if (e.target.closest(".task__delete")) {
      removeTask(id, taskEl);
    }
  });

  taskList.addEventListener("change", (e) => {
    if (e.target.matches(".task__checkbox input")) {
      const taskEl = e.target.closest(".task");
      const id = Number(taskEl.dataset.id);
      toggleTask(id);
    }
  });

  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    setFilter(btn.dataset.filter);
  });

  clearBtn.addEventListener("click", clearCompleted);
  themeToggle.addEventListener("click", toggleTheme);

  /* ---------- Core actions ---------- */
  function addTask() {
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    tasks.unshift({
      id: Date.now(),
      text: text,
      completed: false,
    });
    input.value = "";
    save();
    render();
  }

  function toggleTask(id) {
    const t = tasks.find((t) => t.id === id);
    if (!t) return;
    t.completed = !t.completed;
    save();
    render();
  }

  function removeTask(id, taskEl) {
    // Animate out, then remove from state
    if (taskEl) {
      taskEl.classList.add("task--removing");
      const done = () => {
        tasks = tasks.filter((t) => t.id !== id);
        save();
        render();
      };
      taskEl.addEventListener("animationend", done, { once: true });
      // Fallback in case animation event doesn't fire
      setTimeout(done, 220);
    } else {
      tasks = tasks.filter((t) => t.id !== id);
      save();
      render();
    }
  }

  function clearCompleted() {
    const had = tasks.some((t) => t.completed);
    if (!had) return;
    tasks = tasks.filter((t) => !t.completed);
    save();
    render();
  }

  function setFilter(name) {
    if (name === currentFilter) return;
    currentFilter = name;
    document.querySelectorAll(".filter").forEach((b) => {
      b.classList.toggle("filter--active", b.dataset.filter === name);
    });
    render();
  }

  /* ---------- Rendering ---------- */
  function render() {
    const visible = filterTasks(tasks, currentFilter);

    // Build list
    taskList.innerHTML = "";
    visible.forEach((t) => taskList.appendChild(createTaskEl(t)));

    // Empty state
    const isEmpty = visible.length === 0;
    emptyState.hidden = !isEmpty;
    taskList.hidden = isEmpty;

    // Footer
    const remaining = tasks.filter((t) => !t.completed).length;
    const hasAny = tasks.length > 0;
    footer.hidden = !hasAny;
    countLabel.textContent =
      remaining + (remaining === 1 ? " item left" : " items left");

    // Disable "clear completed" when nothing is completed
    const hasCompleted = tasks.some((t) => t.completed);
    clearBtn.disabled = !hasCompleted;
    clearBtn.style.opacity = hasCompleted ? "1" : "0.4";
    clearBtn.style.cursor = hasCompleted ? "pointer" : "default";
  }

  function createTaskEl(t) {
    const li = document.createElement("li");
    li.className = "task" + (t.completed ? " task--completed" : "");
    li.dataset.id = t.id;

    const checkbox = document.createElement("label");
    checkbox.className = "task__checkbox";
    const cbInput = document.createElement("input");
    cbInput.type = "checkbox";
    cbInput.checked = t.completed;
    cbInput.setAttribute("aria-label", "Mark task complete");
    const check = document.createElement("span");
    check.className = "task__check";
    checkbox.appendChild(cbInput);
    checkbox.appendChild(check);

    const text = document.createElement("span");
    text.className = "task__text";
    text.textContent = t.text;

    const del = document.createElement("button");
    del.className = "task__delete";
    del.type = "button";
    del.setAttribute("aria-label", "Delete task");
    del.textContent = "×";

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(del);
    return li;
  }

  function filterTasks(list, filter) {
    if (filter === "active") return list.filter((t) => !t.completed);
    if (filter === "completed") return list.filter((t) => t.completed);
    return list;
  }

  function renderDate() {
    const opts = { weekday: "long", month: "long", day: "numeric" };
    const today = new Date().toLocaleDateString("en-US", opts);
    dateLabel.textContent = today;
  }

  /* ---------- Persistence ---------- */
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      /* storage might be unavailable; ignore */
    }
  }

  /* ---------- Theme ---------- */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      /* ignore */
    }
  }
})();
