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
  let firebaseSignInBtn = null;
  let firebaseSignOutBtn = null;
  let firebaseStatusText = null;
  let firebaseEnabledToggle = null;
  let manualSyncButton = null;
  let lastSyncTimeElement = null;
  let syncIntervalInput = null;

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
          <h3>Cloud Storage (Firebase)</h3>
          <div class="firebase-status">
            <p id="firebase-status-text">Not connected to Firebase</p>
            <div class="firebase-buttons">
              <button id="firebase-signin-btn" class="btn btn-primary">
                Sign in with Google
              </button>
              <button id="firebase-signout-btn" class="btn btn-secondary" style="display: none;">
                Sign Out
              </button>
              <div class="firebase-toggle" style="margin-top: 10px;">
                <input type="checkbox" id="firebase-enabled-toggle" />
                <label for="firebase-enabled-toggle">Use Firebase for data storage</label>
              </div>
              <div class="sync-controls" style="margin-top: 10px;">
                <button id="manual-sync-button" class="btn btn-secondary">
                  <i class="fa fa-sync"></i> Sync Now
                </button>
                <span id="last-sync-time" style="margin-left: 10px; font-size: 0.8em; color: #666;">Never synced</span>
              </div>
              <div class="sync-interval" style="margin-top: 10px;">
                <label for="sync-interval-input">Sync every</label>
                <select id="sync-interval-input" class="form-control">
                  <option value="1">1 minute</option>
                  <option value="5" selected>5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
            </div>
          </div>
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
    firebaseSignInBtn = document.getElementById("firebase-signin-btn");
    firebaseSignOutBtn = document.getElementById("firebase-signout-btn");
    firebaseStatusText = document.getElementById("firebase-status-text");
    firebaseEnabledToggle = document.getElementById("firebase-enabled-toggle");
    manualSyncButton = document.getElementById("manual-sync-button");
    lastSyncTimeElement = document.getElementById("last-sync-time");
    syncIntervalInput = document.getElementById("sync-interval-input");
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
    
    // Firebase sign in button
    if (firebaseSignInBtn) {
      firebaseSignInBtn.addEventListener("click", signInWithFirebase);
    }
    
    // Firebase sign out button
    if (firebaseSignOutBtn) {
      firebaseSignOutBtn.addEventListener("click", signOutFromFirebase);
    }
    
    // Firebase enabled toggle
    if (firebaseEnabledToggle) {
      firebaseEnabledToggle.addEventListener("change", toggleFirebaseEnabled);
    }
    
    // Manual sync button
    if (manualSyncButton) {
      manualSyncButton.addEventListener("click", triggerManualSync);
    }
    
    // Sync interval input
    if (syncIntervalInput) {
      syncIntervalInput.addEventListener("change", changeSyncInterval);
      
      // Load saved interval from localStorage
      const savedInterval = localStorage.getItem('syncIntervalMinutes');
      if (savedInterval) {
        syncIntervalInput.value = savedInterval;
      }
    }
    
    // Listen for Firebase auth state changes
    window.addEventListener('firebase-user-signed-in', updateFirebaseUI);
    window.addEventListener('firebase-user-signed-out', updateFirebaseUI);
  }
  
  /**
   * Sign in with Firebase using Google authentication
   */
  async function signInWithFirebase() {
    try {
      // Check if Firebase module is available
      if (typeof Firebase === 'undefined') {
        // Load Firebase dynamically
        await loadFirebaseModule();
      }
      
      // Show loading status
      firebaseStatusText.textContent = "Signing in...";
      
      // Sign in with Google
      const result = await Firebase.signInWithGoogle();
      
      if (result.success) {
        StatusMessage.show("Successfully signed in to Firebase!", 2000, true);
      } else {
        StatusMessage.show("Failed to sign in: " + result.error);
      }
      
      updateFirebaseUI();
    } catch (error) {
      console.error("Error signing in to Firebase:", error);
      StatusMessage.show("Error connecting to Firebase: " + error.message);
      firebaseStatusText.textContent = "Error connecting to Firebase";
    }
  }
  
  /**
   * Sign out from Firebase
   */
  async function signOutFromFirebase() {
    try {
      if (typeof Firebase === 'undefined') {
        return;
      }
      
      firebaseStatusText.textContent = "Signing out...";
      
      const result = await Firebase.signOut();
      
      if (result.success) {
        StatusMessage.show("Successfully signed out", 2000, true);
      } else {
        StatusMessage.show("Failed to sign out: " + result.error);
      }
      
      updateFirebaseUI();
    } catch (error) {
      console.error("Error signing out from Firebase:", error);
      StatusMessage.show("Error signing out: " + error.message);
    }
  }
  
  /**
   * Toggle Firebase enabled state
   */
  function toggleFirebaseEnabled(e) {
    const isEnabled = e.target.checked;
    
    if (isEnabled) {
      // Enable Firebase
      if (typeof Firebase === 'undefined' || !Firebase.isSignedIn()) {
        // Can't enable Firebase if not signed in
        StatusMessage.show("You must sign in to Firebase first");
        e.target.checked = false;
        return;
      }
      
      const success = Database.enableFirebase();
      if (success) {
        StatusMessage.show("Firebase storage enabled! Your notes will sync to the cloud.", 3000, true);
      } else {
        StatusMessage.show("Failed to enable Firebase storage");
        e.target.checked = false;
      }
    } else {
      // Disable Firebase
      Database.disableFirebase();
      StatusMessage.show("Firebase storage disabled. Your notes will only be stored locally.", 3000, true);
    }
  }
  
  /**
   * Update the Firebase UI based on authentication state
   */
  function updateFirebaseUI() {
    if (typeof Firebase === 'undefined') {
      firebaseStatusText.textContent = "Firebase not loaded";
      firebaseSignInBtn.style.display = "inline-block";
      firebaseSignOutBtn.style.display = "none";
      firebaseEnabledToggle.disabled = true;
      firebaseEnabledToggle.checked = false;
      
      // Disable sync controls
      if (manualSyncButton) manualSyncButton.disabled = true;
      if (syncIntervalInput) syncIntervalInput.disabled = true;
      return;
    }
    
    if (Firebase.isSignedIn()) {
      const user = Firebase.getCurrentUser();
      firebaseStatusText.textContent = `Signed in as: ${user.email || user.displayName || 'Unknown user'}`;
      firebaseSignInBtn.style.display = "none";
      firebaseSignOutBtn.style.display = "inline-block";
      firebaseEnabledToggle.disabled = false;
      firebaseEnabledToggle.checked = Database.isFirebaseEnabled();
      
      // Update sync controls
      const isEnabled = Database.isFirebaseEnabled();
      if (manualSyncButton) manualSyncButton.disabled = !isEnabled;
      if (syncIntervalInput) syncIntervalInput.disabled = !isEnabled;
      
      // Update last sync time
      if (isEnabled) {
        updateLastSyncTime();
      }
    } else {
      firebaseStatusText.textContent = "Not signed in to Firebase";
      firebaseSignInBtn.style.display = "inline-block";
      firebaseSignOutBtn.style.display = "none";
      firebaseEnabledToggle.disabled = true;
      firebaseEnabledToggle.checked = false;
      
      // Disable sync controls
      if (manualSyncButton) manualSyncButton.disabled = true;
      if (syncIntervalInput) syncIntervalInput.disabled = true;
    }
  }
  
  /**
   * Load the Firebase module dynamically
   */
  async function loadFirebaseModule() {
    try {
      if (typeof Firebase !== 'undefined') {
        return Promise.resolve();
      }
      
      // Load Firebase script
      const script = document.createElement('script');
      script.src = 'modules/Firebase.js';
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
      
      // Load Firebase SDK
      await Firebase.loadFirebase();
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error loading Firebase module:", error);
      return Promise.reject(error);
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
          //StatusMessage.show("Persistent storage is already granted");
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
    
    // Try to load and initialize Firebase if not already loaded
    if (typeof Firebase === 'undefined') {
      loadFirebaseModule().then(() => {
        updateFirebaseUI();
      }).catch(error => {
        console.error("Failed to load Firebase:", error);
      });
    } else {
      // If Firebase is already loaded, we don't need to attempt login manually
      // Just update the UI to reflect current state
      updateFirebaseUI();
    }
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

  /**
   * Trigger a manual sync with Firebase
   */
  async function triggerManualSync() {
    try {
      if (typeof Firebase === 'undefined' || !Firebase.isSignedIn() || !Database.isFirebaseEnabled()) {
        StatusMessage.show("Cannot sync: Firebase is not enabled or you're not signed in");
        return;
      }
      
      // Show syncing state
      manualSyncButton.disabled = true;
      manualSyncButton.innerHTML = '<i class="fa fa-sync fa-spin"></i> Syncing...';
      
      // Trigger sync
      const result = await Firebase.performSync('manual');
      
      if (result.success) {
        StatusMessage.show("Successfully synced with cloud!", 2000, true);
      } else {
        StatusMessage.show("Sync failed: " + (result.error || "Unknown error"));
      }
      
      // Update UI with last sync time
      updateLastSyncTime();
      
    } catch (error) {
      console.error("Error syncing with Firebase:", error);
      StatusMessage.show("Sync error: " + error.message);
    } finally {
      // Reset button state
      manualSyncButton.disabled = false;
      manualSyncButton.innerHTML = '<i class="fa fa-sync"></i> Sync Now';
    }
  }
  
  /**
   * Change the sync interval
   * @param {Event} e - Change event from select input
   */
  function changeSyncInterval(e) {
    const minutes = parseInt(e.target.value, 10);
    
    if (typeof Firebase !== 'undefined') {
      Firebase.setSyncInterval(minutes);
      StatusMessage.show(`Sync interval set to ${minutes} minute${minutes === 1 ? '' : 's'}`, 2000, true);
    }
  }
  
  /**
   * Update the last sync time display
   */
  function updateLastSyncTime() {
    if (!lastSyncTimeElement || typeof Firebase === 'undefined') return;
    
    const lastSync = Firebase.getLastSyncTime();
    
    if (lastSync) {
      const timeAgo = getTimeAgo(lastSync);
      lastSyncTimeElement.textContent = `Last synced: ${timeAgo}`;
    } else {
      lastSyncTimeElement.textContent = 'Never synced';
    }
  }
  
  /**
   * Get human-readable time ago string
   * @param {Date} date - Date to format
   * @returns {string} Human readable string
   */
  function getTimeAgo(date) {
    if (!date) return 'never';
    
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Public API
  return {
    initialize,
    show,
    hide,
    handleKeyDown,
  };
})();
