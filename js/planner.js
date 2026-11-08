/* ==========================================================================
   planner.js — Academic Planner (interactive task management system)
   Add tasks, mark them completed, delete them, filter, sort and save them.
   Tasks are kept in an array and saved to localStorage.
   ========================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "hoPortfolioTasks";
  var PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

  // DOM references
  var form = document.getElementById("task-form");
  var titleInput = document.getElementById("task-title");
  var courseInput = document.getElementById("task-course");
  var dueInput = document.getElementById("task-due");
  var priorityInput = document.getElementById("task-priority");
  var errorEl = document.getElementById("task-error");
  var body = document.getElementById("task-body");
  var emptyState = document.getElementById("empty-state");
  var emptyText = document.getElementById("empty-text");
  var sortSelect = document.getElementById("task-sort");
  var clearBtn = document.getElementById("clear-done");
  var viewButtons = document.querySelectorAll("[data-view]");

  // state
  var tasks = loadTasks();
  var currentView = "all";
  var newestId = null;

  /* ---------- helpers ---------- */
  function todayISO() {
    var d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function addDays(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    if (!iso) return "No date";
    var parts = iso.split("-");
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function isOverdue(task) {
    return !task.done && task.due && task.due < todayISO();
  }

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function escapeHTML(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /* ---------- storage ---------- */
  function loadTasks() {
    try {
      var stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(stored)) return stored;
    } catch (err) { /* ignore */ }
    // sample tasks for a first visit
    return [
      { id: makeId(), title: "Submit COS 106 term project", course: "COS 106", due: addDays(5), priority: "high", done: false, created: Date.now() - 3000 },
      { id: makeId(), title: "Revise TCP/IP model notes", course: "CYB 101", due: addDays(2), priority: "medium", done: false, created: Date.now() - 2000 },
      { id: makeId(), title: "Read chapter 3: HTML forms & tables", course: "COS 106", due: addDays(-1), priority: "low", done: true, created: Date.now() - 1000 }
    ];
  }

  function saveTasks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch (err) { /* storage unavailable */ }
  }

  /* ---------- task actions ---------- */
  function addTask(title, course, due, priority) {
    var task = { id: makeId(), title: title, course: course, due: due, priority: priority, done: false, created: Date.now() };
    tasks.push(task);
    newestId = task.id;
    saveTasks();
    render();
    window.showToast && window.showToast("Task added: " + title);
  }

  function toggleTask(id) {
    tasks = tasks.map(function (t) {
      return t.id === id ? Object.assign({}, t, { done: !t.done }) : t;
    });
    saveTasks();
    render();
  }

  function deleteTask(id, row) {
    var task = tasks.find(function (t) { return t.id === id; });
    var finish = function () {
      tasks = tasks.filter(function (t) { return t.id !== id; });
      saveTasks();
      render();
      if (task && window.showToast) window.showToast("Deleted: " + task.title);
    };
    if (row) {
      row.classList.add("is-leaving");
      setTimeout(finish, 280);
    } else {
      finish();
    }
  }

  function clearCompleted() {
    var count = tasks.filter(function (t) { return t.done; }).length;
    if (!count) { window.showToast && window.showToast("There are no completed tasks to clear."); return; }
    tasks = tasks.filter(function (t) { return !t.done; });
    saveTasks();
    render();
    window.showToast && window.showToast(count + " completed task" + (count > 1 ? "s" : "") + " cleared.");
  }

  /* ---------- filtering & sorting ---------- */
  function getVisibleTasks() {
    var list = tasks.filter(function (t) {
      if (currentView === "active") return !t.done;
      if (currentView === "done") return t.done;
      return true;
    });
    var sortBy = sortSelect ? sortSelect.value : "due";
    return list.slice().sort(function (a, b) {
      if (sortBy === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortBy === "newest") return b.created - a.created;
      return (a.due || "9999").localeCompare(b.due || "9999");
    });
  }

  /* ---------- rendering (DOM manipulation) ---------- */
  function rowTemplate(task) {
    var overdue = isOverdue(task);
    var label = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    return '' +
      '<td class="c-check"><button class="check" type="button" data-action="toggle" aria-pressed="' + task.done + '" aria-label="Mark ' + escapeHTML(task.title) + ' as ' + (task.done ? "not completed" : "completed") + '">' +
        '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6.5l2.5 2.5L10 3.5"/></svg></button></td>' +
      '<td class="task-cell"><strong>' + escapeHTML(task.title) + '</strong>' + (task.done ? '<small>Completed</small>' : overdue ? '<small class="overdue">Overdue</small>' : '') + '</td>' +
      '<td class="c-course" data-label="Course">' + escapeHTML(task.course) + '</td>' +
      '<td class="c-due' + (overdue ? ' overdue' : '') + '" data-label="Due">' + formatDate(task.due) + '</td>' +
      '<td class="c-priority"><span class="pill pill--' + task.priority + '">' + label + '</span></td>' +
      '<td class="c-actions"><button class="icon-btn" type="button" data-action="delete" aria-label="Delete ' + escapeHTML(task.title) + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></td>';
  }

  function render() {
    var visible = getVisibleTasks();
    body.innerHTML = "";

    visible.forEach(function (task) {
      var tr = document.createElement("tr");
      tr.dataset.id = task.id;
      if (task.done) tr.classList.add("is-done");
      if (task.id === newestId) tr.classList.add("is-new");
      tr.innerHTML = rowTemplate(task);
      body.appendChild(tr);
    });
    newestId = null;

    // empty state
    var isEmpty = visible.length === 0;
    emptyState.hidden = !isEmpty;
    if (isEmpty) {
      emptyText.textContent = tasks.length === 0
        ? "Add a task above and it'll show up in this list."
        : currentView === "done" ? "No completed tasks yet. You've got this." : "Everything's done. Time for a break!";
    }

    updateStats();
  }

  function updateStats() {
    var total = tasks.length;
    var done = tasks.filter(function (t) { return t.done; }).length;
    var overdue = tasks.filter(isOverdue).length;
    var pct = total ? Math.round((done / total) * 100) : 0;

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-done").textContent = done;
    document.getElementById("stat-pending").textContent = total - done;
    document.getElementById("stat-overdue").textContent = overdue;
    document.getElementById("progress-pct").textContent = pct + "%";
    document.getElementById("progress-fill").style.width = pct + "%";
    document.getElementById("progress-bar").setAttribute("aria-valuenow", pct);

    var note = "Add your first task to get started.";
    if (total) {
      if (pct === 100) note = "Everything's done. Brilliant work!";
      else if (pct >= 60) note = "Almost there, keep going.";
      else if (pct >= 30) note = "Good progress so far.";
      else note = "One task at a time.";
    }
    document.getElementById("progress-note").textContent = note;

    var counts = { all: total, active: total - done, done: done };
    document.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = counts[el.getAttribute("data-count")];
    });
  }

  /* ---------- events ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var title = titleInput.value.trim();
    if (!title) {
      errorEl.textContent = "Please describe the task before adding it.";
      titleInput.parentElement.classList.add("has-error");
      titleInput.focus();
      return;
    }
    if (title.length < 3) {
      errorEl.textContent = "That's a bit short. Use at least 3 characters.";
      titleInput.parentElement.classList.add("has-error");
      titleInput.focus();
      return;
    }
    errorEl.textContent = "";
    titleInput.parentElement.classList.remove("has-error");
    addTask(title, courseInput.value, dueInput.value, priorityInput.value);
    titleInput.value = "";
    dueInput.value = addDays(7);
    titleInput.focus();
  });

  titleInput.addEventListener("input", function () {
    if (titleInput.value.trim()) {
      errorEl.textContent = "";
      titleInput.parentElement.classList.remove("has-error");
    }
  });

  // one listener handles every row (event delegation)
  body.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    var row = btn.closest("tr");
    var id = row.dataset.id;
    if (btn.dataset.action === "toggle") toggleTask(id);
    if (btn.dataset.action === "delete") deleteTask(id, row);
  });

  viewButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      currentView = btn.getAttribute("data-view");
      viewButtons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      render();
    });
  });

  if (sortSelect) sortSelect.addEventListener("change", render);
  if (clearBtn) clearBtn.addEventListener("click", clearCompleted);

  /* ---------- init ---------- */
  dueInput.value = addDays(7);
  var todayLabel = document.getElementById("today-label");
  if (todayLabel) todayLabel.textContent = formatDate(todayISO());
  render();
})();
