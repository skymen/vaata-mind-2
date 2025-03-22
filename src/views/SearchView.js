/**
 * SearchView Module
 * Handles searching and filtering notes
 */
window.SearchView = (() => {
  // DOM elements
  let viewElement = null;
  let backButton = null;
  let searchInput = null;
  let searchResults = null;
  let emptyMessage = null;
  let filterContainer = null;
  let progressFilters = null;
  let dateFilters = null;
  let importanceFilters = null;
  let tagFiltersContainer = null;

  // State
  let searchTerm = "";
  let searchFilters = {
    progress: "all",
    date: "all",
    importance: "all",
    tags: new Set()
  };

  /**
   * Initialize the search view
   */
  function initialize() {
    // Cache DOM elements
    viewElement = document.getElementById(Constants.VIEWS.SEARCH);

    if (!viewElement) {
      console.error("SearchView: Required elements not found");
      return;
    }

    // Create view HTML structure if empty
    if (viewElement.children.length === 0) {
      createViewStructure();
    }

    // Cache references to newly created elements
    backButton = document.getElementById("search-back");
    searchInput = document.getElementById("search-input");
    searchResults = document.getElementById("search-results");
    emptyMessage = document.getElementById("search-empty-message");
    filterContainer = document.getElementById("search-filters");
    progressFilters = document.getElementById("search-progress-filter");
    dateFilters = document.getElementById("search-date-filter");
    importanceFilters = document.getElementById("search-importance-filter");
    tagFiltersContainer = document.getElementById("search-tag-filters");

    // Attach event listeners
    attachEventListeners();

    // Register with view manager
    ViewManager.registerView(Constants.VIEWS.SEARCH, {
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
      <button class="back-btn" id="search-back">←</button>
      <div class="search-container">
        <div class="search-header">
          <div class="search-input-container">
            <input type="text" id="search-input" placeholder="Search notes..." autofocus class="search-input">
            <div class="search-icon">🔍</div>
          </div>
        </div>
        <div class="search-filters" id="search-filters">
          <select id="search-progress-filter">
            <option value="all">All Progress</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select id="search-importance-filter">
            <option value="all">All Importance</option>
            <option value="important">Important Only</option>
            <option value="normal">Normal Only</option>
          </select>
          <select id="search-date-filter">
            <option value="all">All Dates</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="tomorrow">Due Tomorrow</option>
            <option value="week">Due This Week</option>
            <option value="future">Future</option>
            <option value="no-date">No Due Date</option>
          </select>
          <div id="search-tag-filters" class="search-tag-filters"></div>
        </div>
        <div class="search-results" id="search-results"></div>
        <div id="search-empty-message" class="empty-message">
          No notes match your search
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

    // Search input
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value.trim().toLowerCase();
        performSearch();
      });

      // Focus search input when view is shown
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          ViewManager.showView(Constants.VIEWS.MENU);
        }
      });
    }

    // Filter changes
    if (progressFilters) {
      progressFilters.addEventListener("change", (e) => {
        searchFilters.progress = e.target.value;
        performSearch();
      });
    }

    if (importanceFilters) {
      importanceFilters.addEventListener("change", (e) => {
        searchFilters.importance = e.target.value;
        performSearch();
      });
    }

    if (dateFilters) {
      dateFilters.addEventListener("change", (e) => {
        searchFilters.date = e.target.value;
        performSearch();
      });
    }
  }

  /**
   * Update tag filters based on all available hashtags
   */
  function updateTagFilters() {
    if (!tagFiltersContainer) return;

    // Clear existing tag filters
    tagFiltersContainer.innerHTML = "";

    // Get all unique tags
    const allTags = Database.getAllHashtags();

    // Create tag filter buttons
    allTags.forEach((tag) => {
      const tagButton = document.createElement("span");
      tagButton.className = `search-tag-filter ${
        searchFilters.tags.has(tag) ? "active" : ""
      }`;
      tagButton.textContent = tag;

      tagButton.addEventListener("click", () => {
        if (searchFilters.tags.has(tag)) {
          searchFilters.tags.delete(tag);
          tagButton.classList.remove("active");
        } else {
          searchFilters.tags.add(tag);
          tagButton.classList.add("active");
        }
        performSearch();
      });

      tagFiltersContainer.appendChild(tagButton);
    });
  }

  /**
   * Filter notes based on search term and filters
   * @returns {Array} Filtered notes
   */
  function filterNotes() {
    // Get all notes
    let notes = Database.getAllNotes();

    // Filter by search term
    if (searchTerm !== "") {
      notes = notes.filter(note => {
        // Search in content
        if (note.content.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in hashtags
        if (note.hashtags.some(tag => tag.toLowerCase().includes(searchTerm))) {
          return true;
        }
        
        return false;
      });
    }

    // Filter by progress
    if (searchFilters.progress !== "all") {
      notes = notes.filter((note) => note.progress === searchFilters.progress);
    }

    // Filter by importance
    if (searchFilters.importance === "important") {
      notes = notes.filter((note) => note.important);
    } else if (searchFilters.importance === "normal") {
      notes = notes.filter((note) => !note.important);
    }

    // Filter by due date
    if (searchFilters.date !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const oneWeek = new Date(today);
      oneWeek.setDate(oneWeek.getDate() + 7);

      if (searchFilters.date === "no-date") {
        notes = notes.filter((note) => !note.dueDate);
      } else if (searchFilters.date === "overdue") {
        notes = notes.filter((note) => {
          if (!note.dueDate) return false;
          const dueDate = new Date(note.dueDate);
          return dueDate < today;
        });
      } else if (searchFilters.date === "today") {
        notes = notes.filter((note) => {
          if (!note.dueDate) return false;
          const dueDate = new Date(note.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
      } else if (searchFilters.date === "tomorrow") {
        notes = notes.filter((note) => {
          if (!note.dueDate) return false;
          const dueDate = new Date(note.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === tomorrow.getTime();
        });
      } else if (searchFilters.date === "week") {
        notes = notes.filter((note) => {
          if (!note.dueDate) return false;
          const dueDate = new Date(note.dueDate);
          return dueDate >= today && dueDate <= oneWeek;
        });
      } else if (searchFilters.date === "future") {
        notes = notes.filter((note) => {
          if (!note.dueDate) return false;
          const dueDate = new Date(note.dueDate);
          return dueDate > oneWeek;
        });
      }
    }

    // Filter by tags
    if (searchFilters.tags.size > 0) {
      notes = notes.filter((note) =>
        note.hashtags.some((tag) => searchFilters.tags.has(tag))
      );
    }

    return notes;
  }

  /**
   * Perform search and update results
   */
  function performSearch() {
    if (!searchResults || !emptyMessage) return;

    const filteredNotes = filterNotes();

    // Clear results
    searchResults.innerHTML = "";

    // Update empty message visibility
    if (filteredNotes.length === 0) {
      emptyMessage.style.display = "block";
      searchResults.style.display = "none";
    } else {
      emptyMessage.style.display = "none";
      searchResults.style.display = "flex";
    }

    // Display search results
    filteredNotes.forEach((note) => {
      const resultCard = document.createElement("div");
      resultCard.className = `search-result-card ${
        note.progress === Constants.PROGRESS_STATES.DONE ? "done" : ""
      }`;
      resultCard.setAttribute("data-note-id", note.id);

      // Highlight matching text if there's a search term
      let displayContent = note.content;
      if (searchTerm !== "") {
        // Simple highlighting by splitting and joining with highlight span
        const regex = new RegExp(searchTerm, "gi");
        displayContent = displayContent.replace(
          regex,
          (match) => `<span class="search-highlight">${match}</span>`
        );
      }

      // Create card content
      resultCard.innerHTML = `
        <div class="search-result-header">
          <div class="progress-indicator ${note.progress}"></div>
          ${note.important ? '<div class="search-result-important">⭐</div>' : ''}
          ${note.dueDate ? `<div class="search-result-due ${NoteUtils.getDueDateClass(note.dueDate)}">${NoteUtils.formatShortDueDate(note.dueDate)}</div>` : ''}
        </div>
        <div class="search-result-content">${displayContent}</div>
        <div class="search-result-tags">
          ${note.hashtags.map(tag => `<span class="search-result-tag">${tag}</span>`).join('')}
        </div>
        <div class="search-result-actions">
          <button class="search-result-edit" title="Edit">✏️</button>
          <button class="search-result-delete" title="Delete">🗑️</button>
        </div>
      `;

      // Add event listeners
      resultCard.addEventListener("click", () => {
        ViewManager.showView(Constants.VIEWS.EDITOR, { noteId: note.id });
      });

      // Edit button
      const editBtn = resultCard.querySelector(".search-result-edit");
      if (editBtn) {
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          ViewManager.showView(Constants.VIEWS.EDITOR, { noteId: note.id });
        });
      }

      // Delete button
      const deleteBtn = resultCard.querySelector(".search-result-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (
            App.isShiftPressed() ||
            confirm("Are you sure you want to delete this note?")
          ) {
            Database.deleteNote(note.id);
            performSearch();
            StatusMessage.show("Note deleted", 2000, true);
          }
        });
      }

      searchResults.appendChild(resultCard);
    });
  }

  /**
   * Show the search view
   */
  function show() {
    // Update tag filters
    updateTagFilters();

    // Focus search input
    if (searchInput) {
      setTimeout(() => {
        searchInput.focus();
      }, 0);
    }

    // Perform initial search
    performSearch();
  }

  /**
   * Hide the search view
   */
  function hide() {
    // No cleanup needed
  }

  /**
   * Handle key down events in search view
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