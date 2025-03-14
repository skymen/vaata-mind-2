/**
 * TableView Module
 * Handles the tabular view of notes with filtering and management
 */
window.TableView = (() => {
  // DOM elements
  let viewElement = null;
  let tableBody = null;
  let backButton = null;
  let bulkDeleteBtn = null;
  let tableSelectAllBtn = null;
  let tableDeselectAllBtn = null;
  let selectAllCheckbox = null;
  let tableProgressFilter = null;
  let tableImportanceFilter = null;
  let tableDateFilter = null;
  let tableTagFilters = null;
  let tableEmptyMessage = null;

  // State
  let selectedNoteIds = new Set();
  let tableFilters = {
    progress: "all",
    importance: "all",
    date: "all",
    tags: new Set(),
  };

  /**
   * Initialize the table view
   */
  function initialize() {
    // Cache DOM elements
    viewElement = document.getElementById(Constants.VIEWS.TABLE);

    if (!viewElement) {
      console.error("TableView: Required elements not found");
      return;
    }

    // Create view HTML structure if empty
    if (viewElement.children.length === 0) {
      createViewStructure();
    }

    // Cache references to newly created elements
    backButton = document.getElementById("table-back");
    tableBody = document.getElementById("table-body");
    bulkDeleteBtn = document.getElementById("bulk-delete-btn");
    tableSelectAllBtn = document.getElementById("table-select-all-btn");
    tableDeselectAllBtn = document.getElementById("table-deselect-all-btn");
    selectAllCheckbox = document.getElementById("select-all-checkbox");
    tableProgressFilter = document.getElementById("table-progress-filter");
    tableImportanceFilter = document.getElementById("table-importance-filter");
    tableDateFilter = document.getElementById("table-date-filter");
    tableTagFilters = document.getElementById("table-tag-filters");
    tableEmptyMessage = document.getElementById("table-empty-message");

    // Attach event listeners
    attachEventListeners();

    // Register with view manager
    ViewManager.registerView(Constants.VIEWS.TABLE, {
      initialize: initialize,
      show: show,
      hide: hide,
    });
  }

  /**
   * Create the view's HTML structure
   */
  function createViewStructure() {
    viewElement.innerHTML = `
      <button class="back-btn" id="table-back">←</button>
      <div class="table-container">
        <div class="table-top-bar">
          <div class="table-actions">
            <button id="bulk-delete-btn" class="btn btn-danger" disabled>
              Delete Selected
            </button>
            <button id="table-select-all-btn" class="btn btn-secondary">
              Select All
            </button>
            <button id="table-deselect-all-btn" class="btn btn-secondary">
              Deselect All
            </button>
          </div>
          <div class="table-filters">
            <select id="table-progress-filter">
              <option value="all">All Progress</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select id="table-importance-filter">
              <option value="all">All Importance</option>
              <option value="important">Important Only</option>
              <option value="normal">Normal Only</option>
            </select>
            <select id="table-date-filter">
              <option value="all">All Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="tomorrow">Due Tomorrow</option>
              <option value="week">Due This Week</option>
              <option value="future">Future</option>
              <option value="no-date">No Due Date</option>
            </select>
            <div id="table-tag-filters"></div>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="notes-table">
            <thead>
              <tr>
                <th width="40px">
                  <input type="checkbox" id="select-all-checkbox" />
                </th>
                <th width="40px">Status</th>
                <th width="40px">⭐</th>
                <th>Content</th>
                <th>Tags</th>
                <th>Due Date</th>
                <th width="80px">Actions</th>
              </tr>
            </thead>
            <tbody id="table-body">
              <!-- Notes will be populated here -->
            </tbody>
          </table>
        </div>
        <div id="table-empty-message" class="empty-message">
          No notes match the current filters
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to DOM elements
   */
  function attachEventListeners() {
    // Back button
    if (backButton) {
      backButton.addEventListener("click", () => {
        ViewManager.showView(Constants.VIEWS.MENU);
      });
    }

    // Select all checkbox
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          selectAllNotes();
        } else {
          deselectAllNotes();
        }
      });
    }

    // Bulk action buttons
    if (tableSelectAllBtn) {
      tableSelectAllBtn.addEventListener("click", selectAllNotes);
    }

    if (tableDeselectAllBtn) {
      tableDeselectAllBtn.addEventListener("click", deselectAllNotes);
    }

    if (bulkDeleteBtn) {
      bulkDeleteBtn.addEventListener("click", bulkDeleteNotes);
    }

    // Filter changes
    if (tableProgressFilter) {
      tableProgressFilter.addEventListener("change", (e) => {
        tableFilters.progress = e.target.value;
        renderNotesTable();
      });
    }

    if (tableImportanceFilter) {
      tableImportanceFilter.addEventListener("change", (e) => {
        tableFilters.importance = e.target.value;
        renderNotesTable();
      });
    }

    if (tableDateFilter) {
      tableDateFilter.addEventListener("change", (e) => {
        tableFilters.date = e.target.value;
        renderNotesTable();
      });
    }
  }

  /**
   * Select all visible notes
   */
  function selectAllNotes() {
    const visibleNotes = filterNotesForTable();
    visibleNotes.forEach((note) => {
      selectedNoteIds.add(note.id);
    });
    renderNotesTable();
  }

  /**
   * Deselect all notes
   */
  function deselectAllNotes() {
    selectedNoteIds.clear();
    renderNotesTable();
  }

  /**
   * Bulk delete selected notes
   */
  function bulkDeleteNotes() {
    if (selectedNoteIds.size === 0) return;

    // Check for shift key or confirm
    if (
      App.isShiftPressed() ||
      confirm(`Are you sure you want to delete ${selectedNoteIds.size} notes?`)
    ) {
      selectedNoteIds.forEach((id) => {
        Database.deleteNote(id);
      });

      selectedNoteIds.clear();
      renderNotesTable();
      StatusMessage.show("Notes deleted", 2000, true);
    }
  }

  /**
   * Update bulk action buttons
   */
  function updateBulkActionButtons() {
    if (!bulkDeleteBtn) return;

    bulkDeleteBtn.disabled = selectedNoteIds.size === 0;

    if (selectAllCheckbox) {
      selectAllCheckbox.checked =
        selectedNoteIds.size > 0 &&
        selectedNoteIds.size === filterNotesForTable().length;
    }
  }

  /**
   * Update tag filters
   */
  function updateTagFilters() {
    if (!tableTagFilters) return;

    // Clear existing tag filters
    tableTagFilters.innerHTML = "";

    // Get all unique tags
    const allTags = Database.getAllHashtags();

    // Create tag filter buttons
    allTags.forEach((tag) => {
      const tagButton = document.createElement("span");
      tagButton.className = `table-tag-filter ${
        tableFilters.tags.has(tag) ? "active" : ""
      }`;
      tagButton.textContent = tag;

      tagButton.addEventListener("click", () => {
        if (tableFilters.tags.has(tag)) {
          tableFilters.tags.delete(tag);
          tagButton.classList.remove("active");
        } else {
          tableFilters.tags.add(tag);
          tagButton.classList.add("active");
        }
        renderNotesTable();
      });

      tableTagFilters.appendChild(tagButton);
    });
  }

  /**
   * Filter notes based on table filter settings
   * @returns {Array} Filtered notes
   */
  function filterNotesForTable() {
    let notes = Database.getAllNotes();

    // Filter by progress
    if (tableFilters.progress !== "all") {
      notes = notes.filter((note) => note.progress === tableFilters.progress);
    } else {
      // Default to exclude done notes
      notes = notes.filter(
        (note) => note.progress !== Constants.PROGRESS_STATES.DONE
      );
    }

    // Filter by importance
    if (tableFilters.importance === "important") {
      notes = notes.filter((note) => note.important);
    } else if (tableFilters.importance === "normal") {
      notes = notes.filter((note) => !note.important);
    }

    // Filter by due date
    if (tableFilters.date !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const oneWeek = new Date(today);
      oneWeek.setDate(oneWeek.getDate() + 7);

      if (tableFilters.date === "no-date") {
        notes = notes.filter((note) => !note.dueDate);
      } else if (tableFilters.date === "overdue") {
        notes = notes.filter((note) => {
          if (!note.dueDate) return false;
          const dueDate = new Date(note.dueDate);
          return dueDate < today;
        });
      } else if (tableFilters.date === "today") {
        notes = notes.filter((note) => {
          if (!note.dueDate) return false;
          const dueDate = new Date(note.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
      } else if (tableFilters.date === "tomorrow") {
        notes = notes.filter((note) => {
          if (!note.dueDate) return false;
          const dueDate = new Date(note.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === tomorrow.getTime();
        });
      } else if (tableFilters.date === "week") {
        notes = notes.filter((note) => {
          if (!note.dueDate) return false;
          const dueDate = new Date(note.dueDate);
          return dueDate >= today && dueDate <= oneWeek;
        });
      } else if (tableFilters.date === "future") {
        notes = notes.filter((note) => {
          if (!note.dueDate) return false;
          const dueDate = new Date(note.dueDate);
          return dueDate > oneWeek;
        });
      }
    }

    // Filter by tags
    if (tableFilters.tags.size > 0) {
      notes = notes.filter((note) =>
        note.hashtags.some((tag) => tableFilters.tags.has(tag))
      );
    }

    return notes;
  }

  /**
   * Render the notes table
   */
  function renderNotesTable() {
    if (!tableBody) return;

    const filteredNotes = filterNotesForTable();

    // Clear table
    tableBody.innerHTML = "";

    // Update empty message visibility
    if (tableEmptyMessage) {
      if (filteredNotes.length === 0) {
        tableEmptyMessage.style.display = "block";
        tableBody.style.display = "none";
      } else {
        tableEmptyMessage.style.display = "none";
        tableBody.style.display = "table-row-group";
      }
    }

    // Render each note
    filteredNotes.forEach((note) => {
      const row = document.createElement("tr");
      row.setAttribute("data-note-id", note.id);
      if (selectedNoteIds.has(note.id)) {
        row.classList.add("table-row-selected");
      }

      // Checkbox cell
      const checkboxCell = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selectedNoteIds.has(note.id);
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          selectedNoteIds.add(note.id);
          row.classList.add("table-row-selected");
        } else {
          selectedNoteIds.delete(note.id);
          row.classList.remove("table-row-selected");
        }
        updateBulkActionButtons();
      });
      checkbox.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      checkboxCell.appendChild(checkbox);
      row.appendChild(checkboxCell);

      // Status cell
      const statusCell = document.createElement("td");
      const statusIndicator = document.createElement("div");
      statusIndicator.className = `progress-indicator ${note.progress} table-progress-indicator`;
      statusCell.appendChild(statusIndicator);
      row.appendChild(statusCell);

      // Importance cell
      const importanceCell = document.createElement("td");
      importanceCell.textContent = note.important ? "⭐" : "";
      importanceCell.style.textAlign = "center";
      row.appendChild(importanceCell);

      // Content cell
      const contentCell = document.createElement("td");
      const content = document.createElement("div");
      content.className = "table-content";
      content.textContent = note.content.replace(
        /!important|!today|!tomorrow|!nextweek|!nextmonth/g,
        ""
      );
      content.title = "Click to expand/collapse";

      content.addEventListener("click", () => {
        content.classList.toggle("table-content-full");
      });

      contentCell.appendChild(content);
      row.appendChild(contentCell);

      // Tags cell
      const tagsCell = document.createElement("td");
      const tagsContainer = document.createElement("div");
      tagsContainer.className = "table-tags";
      note.hashtags.forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.className = "table-tag";
        tagSpan.textContent = tag;
        tagsContainer.appendChild(tagSpan);
      });
      tagsCell.appendChild(tagsContainer);
      row.appendChild(tagsCell);

      // Due date cell
      const dueDateCell = document.createElement("td");
      dueDateCell.className = "table-due-date";
      if (note.dueDate) {
        dueDateCell.textContent = NoteUtils.formatShortDueDate(note.dueDate);
        dueDateCell.className += " " + NoteUtils.getDueDateClass(note.dueDate);
      } else {
        dueDateCell.textContent = "—";
      }
      row.appendChild(dueDateCell);

      // Actions cell
      const actionsCell = document.createElement("td");
      actionsCell.className = "table-actions-cell";

      const editBtn = document.createElement("button");
      editBtn.className = "table-action-btn";
      editBtn.innerHTML = "✏️";
      editBtn.title = "Edit";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        ViewManager.showView(Constants.VIEWS.EDITOR, { noteId: note.id });
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "table-action-btn";
      deleteBtn.innerHTML = "🗑️";
      deleteBtn.title = "Delete";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (
          App.isShiftPressed() ||
          confirm("Are you sure you want to delete this note?")
        ) {
          Database.deleteNote(note.id);
          renderNotesTable();
          StatusMessage.show("Note deleted", 2000, true);
        }
      });

      row.addEventListener("click", (e) => {
        if (App.isShiftPressed() || selectedNoteIds.size > 0) {
          checkbox.click();
        } else {
          editBtn.click();
        }
      });

      actionsCell.appendChild(editBtn);
      actionsCell.appendChild(deleteBtn);
      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    });

    updateBulkActionButtons();
  }

  /**
   * Show the table view
   */
  function show() {
    updateTagFilters();
    renderNotesTable();
  }

  /**
   * Hide the table view
   */
  function hide() {
    // Optional cleanup
  }

  /**
   * Handle key down events in table view
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      ViewManager.showView(Constants.VIEWS.MENU);
    }
  }

  // Public API
  return {
    initialize,
    show,
    hide,
    handleKeyDown,
  };
})();
