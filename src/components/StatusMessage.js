/**
 * StatusMessage Component
 * Handles displaying temporary status messages to the user
 */
const StatusMessage = (() => {
  // DOM element cache
  let statusElement = null;
  let saveAnimationElement = null;

  // Timeout reference for clearing message
  let messageTimeout = null;

  /**
   * Initialize the component
   */
  function initialize() {
    statusElement = document.getElementById("status-message");
    saveAnimationElement = document.getElementById("save-animation");

    if (!statusElement) {
      console.error("StatusMessage: Could not find status element");
    }

    if (!saveAnimationElement) {
      console.error("StatusMessage: Could not find save animation element");
    }
  }

  /**
   * Show a status message
   * @param {string} message - Message to display
   * @param {number} duration - Duration in ms (default: 2000)
   * @param {boolean} showAnimation - Whether to show the save animation (default: false)
   */
  function show(message, duration = 2000, showAnimation = false) {
    if (!statusElement) {
      initialize();
    }

    // Clear any existing timeout
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }

    // Set the message
    statusElement.textContent = message;
    statusElement.classList.add("show");

    // Show save animation if requested
    if (showAnimation && saveAnimationElement) {
      saveAnimationElement.classList.remove("hidden");

      // Hide animation after it completes
      setTimeout(() => {
        saveAnimationElement.classList.add("hidden");
      }, 800);
    }

    // Set timeout to hide the message
    messageTimeout = setTimeout(() => {
      statusElement.classList.remove("show");
      messageTimeout = null;
    }, duration);
  }

  /**
   * Hide the status message immediately
   */
  function hide() {
    if (!statusElement) {
      initialize();
    }

    statusElement.classList.remove("show");

    if (messageTimeout) {
      clearTimeout(messageTimeout);
      messageTimeout = null;
    }
  }

  // Public API
  return {
    initialize,
    show,
    hide,
  };
})();
