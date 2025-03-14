/**
 * ViewManager Module
 * Handles view registration, activation, and navigation
 */
const ViewManager = (() => {
  // Private variables
  const registeredViews = {};
  let currentView = null;
  let debugMode = false;

  /**
   * Register a view with the manager
   * @param {string} viewId - DOM id of the view
   * @param {Object} viewController - Object with initialize(), show(), and hide() methods
   */
  function registerView(viewId, viewController) {
    if (!viewId || !viewController) {
      console.error(
        "ViewManager: Cannot register view without id or controller"
      );
      return;
    }

    // Validate required methods on the controller
    if (
      !viewController.initialize ||
      !viewController.show ||
      !viewController.hide
    ) {
      console.error(
        `ViewManager: View ${viewId} must implement initialize(), show(), and hide() methods`
      );
      return;
    }

    registeredViews[viewId] = viewController;
    if (debugMode) {
      console.log(`ViewManager: Registered view ${viewId}`);
    }
  }

  /**
   * Show a specific view and hide others
   * @param {string} viewId - DOM id of the view to show
   * @param {Object} options - Optional data to pass to the view
   */
  async function showView(viewId, options = {}) {
    // Check if the view element exists in DOM
    const viewElement = document.getElementById(viewId);
    if (!viewElement) {
      console.error(
        `ViewManager: View element with id ${viewId} not found in DOM`
      );
      return;
    }

    // Check if the view is registered
    if (!registeredViews[viewId]) {
      console.error(`ViewManager: Cannot show unregistered view ${viewId}`);
      // Don't return here, try to show the view anyway if the element exists
    }

    // Hide the current view if there is one
    if (currentView && registeredViews[currentView]) {
      try {
        await registeredViews[currentView].hide();
      } catch (error) {
        console.error(`Error hiding view ${currentView}:`, error);
      }

      const currentElement = document.getElementById(currentView);
      if (currentElement) {
        currentElement.classList.add("hidden");
      }
    }

    // Show the requested view
    viewElement.classList.remove("hidden");

    // Call the show method if available
    if (
      registeredViews[viewId] &&
      typeof registeredViews[viewId].show === "function"
    ) {
      try {
        await registeredViews[viewId].show(options);
      } catch (error) {
        console.error(`Error showing view ${viewId}:`, error);
      }
    }

    // Update current view
    currentView = viewId;

    if (debugMode) {
      console.log(`ViewManager: Showed view ${viewId}`);
    }
  }

  /**
   * Get the current view's id
   * @returns {string} Current view id
   */
  function getCurrentView() {
    return currentView;
  }

  /**
   * Get all registered view ids
   * @returns {string[]} Array of registered view ids
   */
  function getRegisteredViewIds() {
    return Object.keys(registeredViews);
  }

  /**
   * Initialize all registered views
   */
  async function initializeAllViews() {
    const viewIds = getRegisteredViewIds();

    for (const viewId of viewIds) {
      try {
        await registeredViews[viewId].initialize();
        if (debugMode) {
          console.log(`ViewManager: Initialized view ${viewId}`);
        }
      } catch (error) {
        console.error(`Error initializing view ${viewId}:`, error);
      }
    }
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether debug mode should be enabled
   */
  function setDebugMode(enabled) {
    debugMode = !!enabled;
  }

  /**
   * Check if a view is registered
   * @param {string} viewId - The view ID to check
   * @returns {boolean} Whether the view is registered
   */
  function isViewRegistered(viewId) {
    return !!registeredViews[viewId];
  }

  // Public API
  return {
    registerView,
    showView,
    getCurrentView,
    getRegisteredViewIds,
    initializeAllViews,
    setDebugMode,
    isViewRegistered,
  };
})();
