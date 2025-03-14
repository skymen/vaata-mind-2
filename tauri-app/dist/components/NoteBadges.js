/**
 * NoteBadges Component
 * Handles visual indicators (badges) for note metadata
 */
const NoteBadges = (() => {
  // DOM element reference
  let badgesContainer = null;

  /**
   * Initialize the component
   */
  function initialize() {
    badgesContainer = document.getElementById("note-badges");

    if (!badgesContainer) {
      console.error("NoteBadges: Badge container not found");
    }
  }

  /**
   * Update badges based on note data
   * @param {Object} note - Note object with metadata
   */
  function updateBadges(note) {
    if (!badgesContainer) {
      initialize();
    }

    // Clear existing badges
    badgesContainer.innerHTML = "";

    if (!note) return;

    // Create due date badge if applicable
    if (note.dueDate) {
      const dueDateBadge = document.createElement("div");
      dueDateBadge.className = `due-date-badge ${NoteUtils.getDueDateClass(
        note.dueDate
      )}`;
      dueDateBadge.textContent = NoteUtils.formatDueDate(note.dueDate);
      badgesContainer.appendChild(dueDateBadge);
    }

    // Create importance badge if applicable
    if (note.important) {
      const importanceBadge = document.createElement("div");
      importanceBadge.className = "importance-badge";
      importanceBadge.textContent = "⭐ Important";
      badgesContainer.appendChild(importanceBadge);
    }
  }

  /**
   * Create a badge element
   * @param {string} type - Badge type ('due-date' or 'importance')
   * @param {string} text - Badge text content
   * @param {string} className - Additional CSS class
   * @returns {HTMLElement} Badge element
   */
  function createBadge(type, text, className = "") {
    const badge = document.createElement("div");
    badge.className = `${type}-badge ${className}`;
    badge.textContent = text;
    return badge;
  }

  /**
   * Show the badges container
   */
  function show() {
    if (badgesContainer) {
      badgesContainer.classList.remove("hidden");
    }
  }

  /**
   * Hide the badges container
   */
  function hide() {
    if (badgesContainer) {
      badgesContainer.classList.add("hidden");
    }
  }

  // Public API
  return {
    initialize,
    updateBadges,
    createBadge,
    show,
    hide,
  };
})();
