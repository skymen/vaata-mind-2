/**
 * DatePicker Component
 * Handles due date selection UI and functionality
 */
const DatePicker = (() => {
  // DOM elements
  let datePillsContainer = null;
  let dueDateInput = null;
  let setDueDateBtn = null;
  let clearDueDateBtn = null;
  let toggleImportanceBtn = null;
  let dueDateControlsContainer = null;

  // State
  let datePills = [];
  let dateChangeCallback = null;
  let importanceChangeCallback = null;

  /**
   * Initialize the date picker
   * @param {function} onDateChange - Callback when date changes
   * @param {function} onImportanceChange - Callback when importance changes
   */
  function initialize(onDateChange, onImportanceChange) {
    // Cache DOM elements
    datePillsContainer = document.querySelector(".due-date-controls");
    dueDateInput = document.getElementById("due-date-input");
    setDueDateBtn = document.getElementById("set-due-date");
    clearDueDateBtn = document.getElementById("clear-due-date");
    toggleImportanceBtn = document.getElementById("toggle-importance");
    dueDateControlsContainer = document.querySelector(".due-date-selector");

    // Store callbacks
    dateChangeCallback = onDateChange;
    importanceChangeCallback = onImportanceChange;

    // Cache date pill elements
    datePills = document.querySelectorAll(".date-pill");

    // Set up event listeners
    if (setDueDateBtn) {
      setDueDateBtn.addEventListener("click", () => {
        const dateValue = dueDateInput.value;
        if (dateValue && dateChangeCallback) {
          dateChangeCallback(new Date(dateValue).toISOString());
        }
      });
    }

    if (clearDueDateBtn) {
      clearDueDateBtn.addEventListener("click", () => {
        if (dateChangeCallback) {
          dateChangeCallback(null);
          dueDateInput.value = "";
        }
      });
    }

    if (toggleImportanceBtn) {
      toggleImportanceBtn.addEventListener("click", () => {
        if (importanceChangeCallback) {
          importanceChangeCallback();
        }
      });
    }

    // Set up date pill listeners
    if (datePills) {
      datePills.forEach((pill) => {
        pill.addEventListener("click", () => {
          const marker = pill.getAttribute("data-marker");
          insertTimeMarker(marker);
        });
      });
    }
  }

  /**
   * Insert a time marker into the editor
   * @param {string} marker - Time marker to insert
   */
  function insertTimeMarker(marker) {
    // This needs to trigger callback to the editor to insert text
    if (
      window.EditorView &&
      typeof window.EditorView.insertTimeMarker === "function"
    ) {
      window.EditorView.insertTimeMarker(marker);
    }
  }

  /**
   * Set the date input value from ISO string
   * @param {string} isoDateString - ISO date string or null
   */
  function setDateValue(isoDateString) {
    if (!dueDateInput) return;

    if (isoDateString) {
      const dueDate = new Date(isoDateString);
      const formattedDate = dueDate.toISOString().split("T")[0];
      dueDateInput.value = formattedDate;
    } else {
      dueDateInput.value = "";
    }
  }

  /**
   * Show the date picker UI
   */
  function show() {
    if (datePillsContainer) datePillsContainer.classList.remove("hidden");
    if (dueDateControlsContainer)
      dueDateControlsContainer.classList.remove("hidden");
  }

  /**
   * Hide the date picker UI
   */
  function hide() {
    if (datePillsContainer) datePillsContainer.classList.add("hidden");
    if (dueDateControlsContainer)
      dueDateControlsContainer.classList.add("hidden");
  }

  // Public API
  return {
    initialize,
    setDateValue,
    show,
    hide,
  };
})();
