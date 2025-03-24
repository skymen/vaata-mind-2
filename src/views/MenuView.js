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
  let premiumBanner = null;
  let premiumUpgradeBtn = null;
  let premiumCloseBtn = null; // Added for close button

  // Constants for premium banner dismissal
  const PREMIUM_BANNER_HIDDEN_KEY = 'premium_banner_hidden_until';
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

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
      <div id="premium-banner" class="premium-banner" style="display: none;">
        <button id="premium-close-btn" class="premium-close-btn" title="Hide for 2 weeks">✕</button>
        <div class="premium-content">
          <span class="premium-icon">⭐</span>
          <span class="premium-text">Upgrade to Premium for cloud sync</span>
          <button id="premium-upgrade-btn" class="btn btn-primary btn-sm">Upgrade</button>
        </div>
      </div>
      <div id="version-number"></div>
    `;

    // Re-cache elements
    settingsButton = document.getElementById("settings-button");
    versionElement = document.getElementById("version-number");
    modeButtons = document.querySelectorAll(".mode-btn");
    premiumBanner = document.getElementById("premium-banner");
    premiumUpgradeBtn = document.getElementById("premium-upgrade-btn");
    premiumCloseBtn = document.getElementById("premium-close-btn");
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
    
    // Premium upgrade button
    if (premiumUpgradeBtn) {
      premiumUpgradeBtn.addEventListener("click", () => {
        // Go to settings view to handle the upgrade
        ViewManager.showView(Constants.VIEWS.SETTINGS);
        
        // Open the upgrade dialog if possible
        if (typeof SettingsView !== 'undefined' && typeof SettingsView.showUpgradePrompt === 'function') {
          setTimeout(() => {
            SettingsView.showUpgradePrompt();
          }, 300); // Small delay to allow settings view to load
        }
      });
    }
    
    // Premium close button
    if (premiumCloseBtn) {
      premiumCloseBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering parent container clicks
        dismissPremiumBanner();
      });
    }
  }
  
  /**
   * Dismiss premium banner for two weeks
   */
  function dismissPremiumBanner() {
    if (!premiumBanner) return;
    
    // Add animation class
    premiumBanner.classList.add('hidden');
    
    // Store the timestamp until when the banner should stay hidden
    const hiddenUntil = Date.now() + TWO_WEEKS_MS;
    localStorage.setItem(PREMIUM_BANNER_HIDDEN_KEY, hiddenUntil.toString());
    
    // Hide the banner after animation completes
    setTimeout(() => {
      premiumBanner.style.display = 'none';
      premiumBanner.classList.remove('hidden');
    }, 300);
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
    // Check if premium banner should be shown
    updatePremiumBanner();
  }
  
  /**
   * Update the premium banner based on Firebase auth status and dismissal preference
   */
  async function updatePremiumBanner() {
    if (!premiumBanner) return;
    
    try {
      // Check if the banner is currently dismissed
      const hiddenUntilStr = localStorage.getItem(PREMIUM_BANNER_HIDDEN_KEY);
      if (hiddenUntilStr) {
        const hiddenUntil = parseInt(hiddenUntilStr, 10);
        // If the dismissal period hasn't expired, keep the banner hidden
        if (Date.now() < hiddenUntil) {
          premiumBanner.style.display = 'none';
          return;
        } else {
          // Clear the expired preference
          localStorage.removeItem(PREMIUM_BANNER_HIDDEN_KEY);
        }
      }
      
      // If Firebase is not available or user is not signed in, show banner
      if (typeof Firebase === 'undefined' || !Firebase.isSignedIn()) {
        premiumBanner.style.display = 'block';
        return;
      }
      
      // Check if user already has premium status
      const isPremium = await Firebase.isPremiumUser();
      
      // Show banner only for non-premium users
      if (!isPremium) {
        premiumBanner.style.display = 'block';
      } else {
        premiumBanner.style.display = 'none';
      }
    } catch (error) {
      console.error("Error checking premium status:", error);
      premiumBanner.style.display = 'none';
    }
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