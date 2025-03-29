/**
 * Main Application
 * Initializes the application and handles global functionality
 */
const App = (() => {
  // Track application load time for optimized loading screen
  const appLoadStartTime = Date.now();

  // Global state
  let shiftPressed = false;
  let ctrlPressed = false;
  let appInitialized = false;

  /**
   * Initialize the application
   */
  async function initialize() {
    console.log("App: Initializing...");

    // Initialize theme system
    initializeTheme();

    // Set up loading screen
    setupLoadingScreen();

    try {
      // Create any missing view containers
      ensureViewContainers();

      // Initialize core modules first
      if (typeof StatusMessage !== "undefined") {
        StatusMessage.initialize();
      }

      // Initialize the database
      if (typeof Database !== "undefined") {
        Database.init();
      }
      
      // Initialize Firebase if available and try to auto-login
      if (typeof Firebase !== "undefined") {
        Firebase.init();
        // Auto login immediately after initialization
        tryAutoLoginFirebase();
      } else {
        // Dynamically load Firebase and then try to auto-login
        loadFirebaseAndLogin();
      }

      // Register keyboard event handlers
      registerGlobalKeyboardHandlers();

      // Initialize all view modules in sequence with proper error handling
      await initializeViewModules();

      // Load version info
      loadVersionInfo();

      // Successfully initialized
      appInitialized = true;
      console.log("App: Initialization complete");

      // Show the menu view by default
      showInitialView();
    } catch (error) {
      console.error("App: Error during initialization:", error);
    } finally {
      // Hide loading screen regardless of initialization success
      hideLoadingScreen();
    }
  }

  /**
   * Ensure all view containers exist in the DOM
   */
  function ensureViewContainers() {
    console.log("App: Ensuring view containers exist");

    // List of all view IDs
    const viewIds = [
      Constants.VIEWS.EDITOR,
      Constants.VIEWS.MENU,
      Constants.VIEWS.EXPLORE,
      Constants.VIEWS.RECOMMENDATION,
      Constants.VIEWS.TABLE,
      Constants.VIEWS.SETTINGS,
      Constants.VIEWS.POMODORO,
      Constants.VIEWS.SEARCH,
    ];

    // Check each view container and create if missing
    viewIds.forEach((viewId) => {
      let container = document.getElementById(viewId);
      if (!container) {
        console.log(`App: Creating missing container for ${viewId}`);
        container = document.createElement("div");
        container.id = viewId;
        container.className = "container hidden";
        document.body.appendChild(container);
      }
    });
  }

  /**
   * Initialize all view modules in sequence
   */
  async function initializeViewModules() {
    console.log("App: Initializing view modules");

    // Define the order of initialization (menu first, then others)
    const viewModuleOrder = [
      { name: "MenuView", id: Constants.VIEWS.MENU },
      { name: "EditorView", id: Constants.VIEWS.EDITOR },
      { name: "ExploreView", id: Constants.VIEWS.EXPLORE },
      { name: "RecommendationView", id: Constants.VIEWS.RECOMMENDATION },
      { name: "TableView", id: Constants.VIEWS.TABLE },
      { name: "SettingsView", id: Constants.VIEWS.SETTINGS },
      { name: "PomodoroView", id: Constants.VIEWS.POMODORO },
      { name: "SearchView", id: Constants.VIEWS.SEARCH },
    ];

    // Initialize each view module
    for (const module of viewModuleOrder) {
      try {
        if (typeof window[module.name] !== "undefined") {
          console.log(`App: Initializing ${module.name}`);
          await window[module.name].initialize();
        } else {
          console.warn(`App: Module ${module.name} not found`);
        }
      } catch (error) {
        console.error(`App: Error initializing ${module.name}:`, error);
      }
    }
  }

  /**
   * Show the initial view
   */
  function showInitialView() {
    console.log("App: Showing initial view");

    // Fallback to editor view
    try {
      if (ViewManager.isViewRegistered(Constants.VIEWS.EDITOR)) {
        ViewManager.showView(Constants.VIEWS.EDITOR);
        return;
      }
    } catch (error) {
      console.error("App: Failed to show editor view:", error);
    }

    // Last resort - try all views in sequence
    const allViewIds = ViewManager.getRegisteredViewIds();
    if (allViewIds.length > 0) {
      try {
        ViewManager.showView(allViewIds[0]);
      } catch (error) {
        console.error("App: Failed to show any view:", error);
      }
    } else {
      console.error("App: No views registered, cannot show initial view");
    }
  }

  /**
   * Set up the loading screen animation
   */
  function setupLoadingScreen() {
    setTimeout(() => {
      const loadingContainer = document.querySelector(".loading-container");
      if (loadingContainer) {
        loadingContainer.style.opacity = "1";
      }
    }, 20);
  }

  /**
   * Hide the loading screen
   */
  function hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    if (!loadingScreen) return;

    const loadTime = Date.now() - appLoadStartTime;

    // If the app loaded in less than 300ms, skip the transition animation
    if (loadTime < 300) {
      // Apply styles directly without transition
      loadingScreen.style.transition =
        "opacity 0.07s ease-out, visibility 0.07s ease-out";
      loadingScreen.style.opacity = "0";
      loadingScreen.style.visibility = "hidden";
      // Force a reflow to ensure the 'none' transition takes effect immediately
      loadingScreen.offsetHeight;
    } else {
      // Regular fade-out transition for slower loads
      loadingScreen.style.transition =
        "opacity 0.3s ease-out, visibility 0.3s ease-out";
      loadingScreen.style.opacity = "0";
      loadingScreen.style.visibility = "hidden";
      loadingScreen.offsetHeight;
    }
  }

  /**
   * Load and display application version
   */
  function loadVersionInfo() {
    fetch("./version.json")
      .then((response) => response.json())
      .then((data) => {
        const versionElement = document.getElementById("version-number");
        if (versionElement) {
          versionElement.textContent = `v${data[0]}`;
        }
      })
      .catch((error) => {
        console.error("Failed to load version info:", error);
      });
  }

  /**
   * Register global keyboard handlers
   */
  function registerGlobalKeyboardHandlers() {
    // Track modifier keys
    document.addEventListener("keydown", (e) => {
      if (e.key === "Shift") {
        shiftPressed = true;
      }
      if (e.key === "Control") {
        ctrlPressed = true;
      }

      // Dispatch to current view's handler if it exists
      const currentViewId = ViewManager.getCurrentView();
      if (currentViewId) {
        const viewControllerName = getViewControllerName(currentViewId);
        if (
          window[viewControllerName] &&
          typeof window[viewControllerName].handleKeyDown === "function"
        ) {
          window[viewControllerName].handleKeyDown(e);
        }
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === "Shift") {
        shiftPressed = false;
      }
      if (e.key === "Control") {
        ctrlPressed = false;
      }
    });
  }

  /**
   * Get controller name from view ID
   * @param {string} viewId - View ID (e.g., 'editor-view')
   * @returns {string} Controller name (e.g., 'EditorView')
   */
  function getViewControllerName(viewId) {
    // Convert 'editor-view' to 'EditorView'
    return viewId
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  }

  /**
   * Check if shift key is currently pressed
   * @returns {boolean} Shift key state
   */
  function isShiftPressed() {
    return shiftPressed;
  }

  /**
   * Check if ctrl key is currently pressed
   * @returns {boolean} Ctrl key state
   */
  function isCtrlPressed() {
    return ctrlPressed;
  }

  /**
   * Get a view class name from a view ID
   * @param {string} viewId - ID of the view (e.g., 'editor-view')
   * @returns {string} Class name (e.g., 'EditorView')
   */
  function getViewClassNameFromId(viewId) {
    return viewId
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  }

  /**
   * Check if app is initialized
   * @returns {boolean} Initialization state
   */
  function isInitialized() {
    return appInitialized;
  }

  /**
   * Try to automatically log in to Firebase using previous credentials
   */
  async function tryAutoLoginFirebase() {
    try {
      if (typeof Firebase === 'undefined') return;
      
      console.log("App: Attempting automatic Firebase login...");
      
      // Use the new Firebase.tryAutoLogin method
      const result = await Firebase.tryAutoLogin(false);
      
      if (result.success) {
        console.log("App: Firebase auto-login successful");
      } else {
        console.log("App: Firebase auto-login - no session to restore");
      }
    } catch (error) {
      console.error("App: Error during Firebase auto-login:", error);
    }
  }
  
  /**
   * Load Firebase module dynamically and try to login
   */
  async function loadFirebaseAndLogin() {
    try {
      console.log("App: Loading Firebase module dynamically...");
      
      // Load Firebase script
      const script = document.createElement('script');
      script.src = './modules/Firebase.js';
      document.head.appendChild(script);
      
      // Wait for script to load
      await new Promise((resolve, reject) => {
        script.onload = () => {
          if (typeof Firebase !== 'undefined') {
            // Initialize Firebase
            Firebase.init();
            resolve();
          } else {
            reject(new Error('Firebase module not found after loading script'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load Firebase script'));
      });
      
      // Try to auto-login after Firebase is loaded
      tryAutoLoginFirebase();
      
    } catch (error) {
      console.error("App: Error loading Firebase module:", error);
    }
  }

  /**
   * Initialize the theme system based on user preference
   */
  function initializeTheme() {
    // Call the theme utility from SettingsView if it exists
    if (typeof SettingsView !== "undefined" && typeof SettingsView.setTheme === "function") {
      const savedTheme = localStorage.getItem('theme') || 'system';
      SettingsView.setTheme(savedTheme);
      return;
    }
    
    // Fallback implementation if SettingsView isn't loaded yet
    const savedTheme = localStorage.getItem('theme') || 'system';
    
    if (savedTheme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('theme') === 'system') {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    } else {
      // Use user selected theme
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  // Initialize on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", initialize);

  // Public API
  return {
    isShiftPressed,
    isCtrlPressed,
    getViewClassNameFromId,
    isInitialized,
    initializeTheme,
  };
})();
