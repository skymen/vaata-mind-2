/**
 * ProgressMenu Component
 * Handles the progress state dropdown menu
 */
const ProgressMenu = (() => {
  // DOM element references
  let progressButton = null;
  let progressMenu = null;

  // State
  let isMenuOpen = false;
  let changeCallback = null;

  /**
   * Initialize the progress menu
   * @param {function} onProgressChange - Callback for when progress changes
   */
  function initialize(onProgressChange) {
    progressButton = document.getElementById("progress-button");
    progressMenu = document.getElementById("progress-menu");

    if (!progressButton || !progressMenu) {
      console.error("ProgressMenu: Required elements not found");
      return;
    }

    // Set the callback
    changeCallback = onProgressChange;

    // Attach event listeners
    progressButton.addEventListener("click", toggleMenu);

    // Attach click event to progress options
    document.querySelectorAll(".progress-option").forEach((option) => {
      option.addEventListener("click", () => {
        const progress = option.getAttribute("data-progress");
        if (changeCallback) {
          changeCallback(progress);
        }
        toggleMenu();
      });
    });

    // Click outside to close menu
    document.addEventListener("click", (e) => {
      if (
        isMenuOpen &&
        !progressButton.contains(e.target) &&
        !progressMenu.contains(e.target)
      ) {
        toggleMenu();
      }
    });
  }

  /**
   * Toggle the progress menu visibility
   */
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;

    if (isMenuOpen) {
      const rect = progressButton.getBoundingClientRect();
      progressMenu.style.top = `${rect.bottom + 5}px`;
      progressMenu.style.left = `${rect.left}px`;
      progressMenu.classList.remove("hidden");
    } else {
      progressMenu.classList.add("hidden");
    }
  }

  /**
   * Update the progress indicator appearance
   * @param {string} progressState - The progress state to display
   */
  function updateProgressIndicator(progressState) {
    if (!progressButton) return;

    // Clear all classes first
    progressButton.classList.remove(
      Constants.PROGRESS_STATES.NOT_STARTED,
      Constants.PROGRESS_STATES.IN_PROGRESS,
      Constants.PROGRESS_STATES.DONE
    );

    // Add the current class
    progressButton.classList.add(
      progressState || Constants.PROGRESS_STATES.NOT_STARTED
    );
  }

  /**
   * Show the progress button
   */
  function show() {
    if (progressButton) {
      progressButton.classList.remove("hidden");
    }
  }

  /**
   * Hide the progress button
   */
  function hide() {
    if (progressButton) {
      progressButton.classList.add("hidden");
    }

    // Also hide the menu if it's open
    if (isMenuOpen) {
      toggleMenu();
    }
  }

  // Public API
  return {
    initialize,
    updateProgressIndicator,
    show,
    hide,
  };
})();
