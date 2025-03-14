/**
 * SettingsView Module
 * Handles application settings interface
 */
window.SettingsView = (() => {
  // DOM elements
  let viewElement = null;
  let backButton = null;
  let requestStorageBtn = null;
  let exportDataBtn = null;
  let importDataInput = null;

  /**
   * Initialize the settings view
   */
  function initialize() {
    // Cache DOM elements
    viewElement = document.getElementById(Constants.VIEWS.SETTINGS);
    backButton = document.getElementById("settings-back");
    requestStorageBtn = document.getElementById("request-storage-btn");
    exportDataBtn = document.getElementById("export-data-btn");
    importDataInput = document.getElementById("import-data-input");

    if (!viewElement) {
      console.error("SettingsView: Required elements not found");
      return;
    }

    // Create view HTML structure if empty
    if (viewElement.children.length === 0) {
      createViewStructure();
    }

    // Attach event listeners
    attachEventListeners();

    // Register with view manager
    ViewManager.registerView(Constants.VIEWS.SETTINGS, {
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
      <button class="back-btn" id="settings-back">←</button>
      <div class="settings-container">
        <h2>Settings</h2>

        <div class="settings-section">
          <h3>Storage</h3>
          <button id="request-storage-btn" class="btn btn-primary">
            Request Persistent Storage
          </button>
        </div>

        <div class="settings-section">
          <h3>Data Management</h3>
          <div class="settings-actions">
            <button id="export-data-btn" class="btn btn-secondary">
              Export Data
            </button>
            <label for="import-data-input" class="btn btn-secondary">Import Data</label>
            <input
              type="file"
              id="import-data-input"
              accept=".json"
              class="hidden"
            />
          </div>
        </div>
      </div>
    `;

    // Re-cache elements
    backButton = document.getElementById("settings-back");
    requestStorageBtn = document.getElementById("request-storage-btn");
    exportDataBtn = document.getElementById("export-data-btn");
    importDataInput = document.getElementById("import-data-input");
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

    // Request persistent storage button
    if (requestStorageBtn) {
      requestStorageBtn.addEventListener("click", requestPersistentStorage);
    }

    // Export data button
    if (exportDataBtn) {
      exportDataBtn.addEventListener("click", exportData);
    }

    // Import data input
    if (importDataInput) {
      importDataInput.addEventListener("change", handleFileImport);
    }
  }

  /**
   * Request persistent storage from the browser
   */
  async function requestPersistentStorage() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();

        if (isPersisted) {
          StatusMessage.show(
            "Successfully granted persistent storage!",
            2000,
            true
          );
          requestStorageBtn.disabled = true;
        } else {
          StatusMessage.show("Permission was denied for persistent storage");
        }
      } else {
        StatusMessage.show(
          "Persistent storage is not supported in this browser"
        );
      }
    } catch (error) {
      StatusMessage.show(
        "Error requesting storage permission: " + error.message
      );
    }
  }

  /**
   * Check if persistent storage is already granted
   */
  async function checkPersistentStorage() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();

        if (isPersisted) {
          StatusMessage.show("Persistent storage is already granted");
          requestStorageBtn.disabled = true;
        } else {
          requestStorageBtn.disabled = false;
        }
      } else {
        StatusMessage.show(
          "Persistent storage is not supported in this browser"
        );
        requestStorageBtn.disabled = true;
      }
    } catch (error) {
      StatusMessage.show("Error checking storage permission: " + error.message);
    }
  }

  /**
   * Export data to a JSON file
   */
  function exportData() {
    try {
      const dataToExport = Database.exportData();

      const blob = new Blob([dataToExport], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `vaata-mind-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      a.click();

      URL.revokeObjectURL(url);

      StatusMessage.show("Data exported successfully!", 2000, true);
    } catch (error) {
      StatusMessage.show("Error exporting data: " + error.message);
    }
  }

  /**
   * Handle importing data from file input
   * @param {Event} e - Change event from file input
   */
  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const success = Database.importData(event.target.result);

        if (success) {
          StatusMessage.show(
            `Successfully imported ${Database.getNbNotes()} notes!`,
            2000,
            true
          );
        } else {
          StatusMessage.show("Error importing data: Invalid format");
        }

        // Reset file input
        importDataInput.value = "";
      } catch (error) {
        StatusMessage.show("Error importing data: " + error.message);
      }
    };

    reader.onerror = () => {
      StatusMessage.show("Error reading the file");
    };

    reader.readAsText(file);
  }

  /**
   * Show the settings view
   */
  function show() {
    checkPersistentStorage();
  }

  /**
   * Hide the settings view
   */
  function hide() {
    // Optional cleanup
  }

  /**
   * Handle key down events in settings
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
