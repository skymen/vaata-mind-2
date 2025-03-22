/**
 * MenuView Module
 * Handles the main menu interface
 */
window.MenuView = (() => {
  // DOM elements
  let viewElement = null;
  let modeButtons = [];
  let settingsButton = null;
  let versionElement = null;

  /**
   * Initialize the menu view
   */
  function initialize() {
    // Cache DOM elements
    viewElement = document.getElementById(Constants.VIEWS.MENU);
    settingsButton = document.getElementById("settings-button");
    versionElement = document.getElementById("version-number");

    if (!viewElement) {
      console.error("MenuView: Required elements not found");
      return;
    }

    // Create view HTML structure if empty
    if (viewElement.children.length === 0) {
      createViewStructure();
    }

    // Gather mode buttons
    modeButtons = document.querySelectorAll(".mode-btn");

    // Attach event listeners
    attachEventListeners();

    // Register with view manager
    ViewManager.registerView(Constants.VIEWS.MENU, {
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
      <button id="settings-button" class="settings-btn">⚙️</button>
      <img class="app-logo" src="./logo.svg" alt="Vaata Mind Logo" />
      <h1 class="app-title">Vaata Mind</h1>
      <div class="mode-selector">
        <button class="mode-btn" data-mode="editor">
          <span class="mode-btn-icon">📝</span>
          New Note
          <span class="mode-btn-tip">[N]</span>
        </button>
        <button class="mode-btn" data-mode="search">
          <span class="mode-btn-icon">🔎</span>
          Search Notes
          <span class="mode-btn-tip">[S]</span>
        </button>
        <button class="mode-btn" data-mode="explore">
          <span class="mode-btn-icon">🔍</span>
          Explore Mode
          <span class="mode-btn-tip">[E]</span>
        </button>
        <button class="mode-btn" data-mode="recommendation">
          <span class="mode-btn-icon">🎲</span>
          Recommendation Mode
          <span class="mode-btn-tip">[R]</span>
        </button>
        <button class="mode-btn" data-mode="table">
          <span class="mode-btn-icon">📋</span>
          Table Mode
          <span class="mode-btn-tip">[T]</span>
        </button>
      </div>
      <div id="version-number"></div>
    `;

    // Re-cache elements
    settingsButton = document.getElementById("settings-button");
    versionElement = document.getElementById("version-number");
    modeButtons = document.querySelectorAll(".mode-btn");
  }

  /**
   * Attach event listeners to DOM elements
   */
  function attachEventListeners() {
    // Mode buttons
    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        handleModeSelection(mode);
      });
    });

    // Settings button
    if (settingsButton) {
      settingsButton.addEventListener("click", () => {
        ViewManager.showView(Constants.VIEWS.SETTINGS);
      });
    }
  }

  /**
   * Handle mode selection
   * @param {string} mode - Selected mode
   */
  function handleModeSelection(mode) {
    switch (mode) {
      case "editor":
        ViewManager.showView(Constants.VIEWS.EDITOR);
        break;
      case "search":
        ViewManager.showView(Constants.VIEWS.SEARCH);
        break;
      case "explore":
        ViewManager.showView(Constants.VIEWS.EXPLORE);
        break;
      case "recommendation":
        ViewManager.showView(Constants.VIEWS.RECOMMENDATION);
        break;
      case "table":
        ViewManager.showView(Constants.VIEWS.TABLE);
        break;
    }
  }

  /**
   * Show the menu view
   */
  function show() {
    // Optional initialization when showing
  }

  /**
   * Hide the menu view
   */
  function hide() {
    // Optional cleanup
  }

  /**
   * Handle key down events in the menu
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyDown(e) {
    // Escape to create new note
    if (e.key === "Escape") {
      e.preventDefault();
      ViewManager.showView(Constants.VIEWS.EDITOR);
      return;
    }

    // N for note
    if (e.key === "n") {
      e.preventDefault();
      ViewManager.showView(Constants.VIEWS.EDITOR);
      return;
    }
    
    // S for search
    if (e.key === "s") {
      e.preventDefault();
      ViewManager.showView(Constants.VIEWS.SEARCH);
      return;
    }

    // E for explore
    if (e.key === "e") {
      e.preventDefault();
      ViewManager.showView(Constants.VIEWS.EXPLORE);
      return;
    }

    // R for recommendation
    if (e.key === "r") {
      e.preventDefault();
      ViewManager.showView(Constants.VIEWS.RECOMMENDATION);
      return;
    }

    // T for table
    if (e.key === "t") {
      e.preventDefault();
      ViewManager.showView(Constants.VIEWS.TABLE);
      return;
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
