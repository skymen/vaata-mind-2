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
  let importDataBtn = null;
  let importDataInput = null;

  // Account elements
  let firebaseSignInBtn = null;
  let firebaseSignOutBtn = null;
  let firebaseStatusText = null;

  // Subscription elements
  let subscriptionSection = null;
  let subscriptionText = null;
  let subscriptionBtn = null;
  let subscriptionFeatures = null;
  let pricingOptions = null;

  // Cloud storage elements
  let cloudStorageSection = null;
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
    importDataBtn = document.getElementById("export-data-btn");
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
        
        <div class="settings-section" id="subscription-section">
          <div class="subscription-header">
            <h3 class="upgrade-to-premium">Upgrade to Premium</h3>
            <button class="subscription-toggle" id="subscription-toggle">
              <span class="subscription-toggle-icon">✕</span>
            </button>
          </div>
          <div class="subscription-content">
            <div class="premium-features">
              <h4>Premium Features</h4>
              <ul class="features-list">
                <li><span class="feature-icon">🔄</span> <strong>Cloud Synchronization</strong> <br> Keep your notes in sync across all your devices</li>
                <li><span class="feature-icon">💾</span> <strong>Automatic Backup</strong> <br> Never lose your important notes again</li>
              </ul>
            </div>
            <div id="pricing-options" class="pricing-options">
              <div class="loading-pricing">
                <div class="price-loader">
                  <div></div><div></div><div></div><div></div>
                </div>
                <p>Loading pricing options...</p>
              </div>
            </div>
            <p class="secure-payment">🔒 Secure payment with Stripe</p>
          </div>
          <button class="upgrade-button hidden" id="upgrade-premium-btn">
            Upgrade to Premium
          </button>
        </div>

        <div class="settings-section">
          <h3>Account</h3>
          <div class="firebase-account">
            <p id="firebase-status-text">Not signed in</p>
            <div class="account-buttons">
              <button id="firebase-signin-btn" class="btn btn-primary">
                Sign in with Google
              </button>
              <button id="firebase-signout-btn" class="btn btn-secondary" style="display: none;">
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div class="settings-section" id="cloud-storage-section" style="display: none;">
          <h3>Cloud Storage Settings</h3>
          <div class="firebase-toggle">
            <input type="checkbox" id="firebase-enabled-toggle" />
            <label for="firebase-enabled-toggle">Enable cloud storage</label>
          </div>
          <div class="sync-controls" style="margin-top: 15px;">
            <button id="manual-sync-button" class="btn btn-secondary">
              <i class="fa fa-sync"></i> Sync Now
            </button>
            <span id="last-sync-time" style="margin-left: 10px; font-size: 0.8em; color: #666;">Never synced</span>
          </div>
          <div class="sync-interval" style="margin-top: 15px;">
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

        <div class="settings-section">
          <h3>Appearance</h3>
          <div class="theme-selector">
            <h4>Theme</h4>
            <div class="theme-options">
              <label class="theme-option">
                <input type="radio" name="theme" value="light" id="theme-light">
                <span class="theme-preview light-preview">
                  <span class="theme-preview-header"></span>
                  <span class="theme-preview-content">
                    <span class="theme-preview-line"></span>
                    <span class="theme-preview-line"></span>
                  </span>
                </span>
                <span class="theme-name">Light</span>
              </label>
              <label class="theme-option">
                <input type="radio" name="theme" value="dark" id="theme-dark">
                <span class="theme-preview dark-preview">
                  <span class="theme-preview-header"></span>
                  <span class="theme-preview-content">
                    <span class="theme-preview-line"></span>
                    <span class="theme-preview-line"></span>
                  </span>
                </span>
                <span class="theme-name">Dark</span>
              </label>
              <label class="theme-option">
                <input type="radio" name="theme" value="system" id="theme-system">
                <span class="theme-preview system-preview">
                  <span class="theme-preview-header"></span>
                  <span class="theme-preview-content">
                    <span class="theme-preview-line"></span>
                    <span class="theme-preview-line"></span>
                  </span>
                </span>
                <span class="theme-name">System</span>
              </label>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h3>Local Storage</h3>
          <button id="request-storage-btn" class="btn btn-primary">
            Request Persistent Storage
          </button>
          <p class="settings-description">
            Enable persistent storage to ensure your notes aren't lost if your browser clears data.
          </p>
        </div>

        <div class="settings-section">
          <h3>Data Management</h3>
          <div class="settings-actions">
            <button id="export-data-btn" class="btn btn-secondary">
              Export Data
            </button>
            <button id="import-data-btn" class="btn btn-secondary">
              Import Data
            </button>
            <input
              type="file"
              id="import-data-input"
              accept=".json"
              class="hidden"
            />
          </div>
        </div>

        <div class="settings-section">
          <h3>About</h3>
          <div class="settings-actions">
            <button id="view-source-btn" class="btn btn-secondary">
              View Source Code
            </button>
            <button id="report-issue-btn" class="btn btn-secondary">
              Report an Issue
            </button>
          </div>
        </div>
      </div>
    `;

    // Re-cache elements
    backButton = document.getElementById("settings-back");
    requestStorageBtn = document.getElementById("request-storage-btn");
    exportDataBtn = document.getElementById("export-data-btn");
    importDataInput = document.getElementById("import-data-input");

    // Account elements
    firebaseSignInBtn = document.getElementById("firebase-signin-btn");
    firebaseSignOutBtn = document.getElementById("firebase-signout-btn");
    firebaseStatusText = document.getElementById("firebase-status-text");

    // Subscription elements
    subscriptionSection = document.getElementById("subscription-section");
    pricingOptions = document.getElementById("pricing-options");

    // Cloud storage elements
    cloudStorageSection = document.getElementById("cloud-storage-section");
    firebaseEnabledToggle = document.getElementById("firebase-enabled-toggle");
    manualSyncButton = document.getElementById("manual-sync-button");
    lastSyncTimeElement = document.getElementById("last-sync-time");
    syncIntervalInput = document.getElementById("sync-interval-input");

    // New element: subscription toggle button
    const subscriptionToggle = document.getElementById("subscription-toggle");
  }

  /**
   * Handle theme change when user selects a different theme
   * @param {Event} e - Change event from radio input
   */
  function handleThemeChange(e) {
    const theme = e.target.value;
    setTheme(theme);
    localStorage.setItem('theme', theme);
    StatusMessage.show(`Theme changed to ${theme}`, 2000, true);
  }

  /**
   * Set the theme on the HTML element
   * @param {string} theme - Theme to set ('light', 'dark', or 'system')
   */
  function setTheme(theme) {
    if (theme === 'system') {
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
      document.documentElement.setAttribute('data-theme', theme);
    }
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

    // Theme selector
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    if (themeRadios.length > 0) {
      themeRadios.forEach(radio => {
        radio.addEventListener('change', handleThemeChange);
      });
      
      // Set the initial checked state based on current theme
      const currentTheme = localStorage.getItem('theme') || 'system';
      document.getElementById(`theme-${currentTheme}`).checked = true;
    }

    // Request persistent storage button
    if (requestStorageBtn) {
      requestStorageBtn.addEventListener("click", requestPersistentStorage);
    }

    // Export data button
    if (exportDataBtn) {
      exportDataBtn.addEventListener("click", exportData);
    }

    // Import data button
    if (importDataBtn) {
      importDataBtn.addEventListener("click", () => {
        importDataInput.click();
      });
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
      const savedInterval = localStorage.getItem("syncIntervalMinutes");
      if (savedInterval) {
        syncIntervalInput.value = savedInterval;
      }
    }


    // Check if section should be collapsed by default
    let item = localStorage.getItem('subscription_section_collapsed');
    const isCollapsed = !item || item === 'true'
    // Subscription toggle button
    const subscriptionToggle = document.getElementById("subscription-toggle");
    if (subscriptionSection && subscriptionToggle) {
      subscriptionToggle.addEventListener("click", toggleSubscriptionSection);
      if (!isCollapsed) {
        toggleSubscriptionSection();
      }
    }

    // Upgrade button
    const upgradeButton = document.getElementById("upgrade-premium-btn");
    if (upgradeButton) {
      upgradeButton.addEventListener("click", () => {
        toggleSubscriptionSection();
      });
    }

    // Listen for Firebase auth state changes
    window.addEventListener("firebase-user-signed-in", updateFirebaseUI);
    window.addEventListener("firebase-user-signed-out", updateFirebaseUI);

    // Source code button
    const sourceBtn = document.getElementById("view-source-btn");
    if (sourceBtn) {
      sourceBtn.addEventListener("click", () => {
        window.open("https://github.com/skymen/vaata-mind-2", "_blank");
      });
    }

    // Report issue button
    const reportBtn = document.getElementById("report-issue-btn");
    if (reportBtn) {
      reportBtn.addEventListener("click", () => {
        window.open("https://github.com/skymen/vaata-mind-2/issues", "_blank");
      });
    }
  }

  /**
   * Sign in with Firebase using Google authentication
   */
  async function signInWithFirebase() {
    try {
      // Check if Firebase module is available
      if (typeof Firebase === "undefined") {
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
      if (typeof Firebase === "undefined") {
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
  async function toggleFirebaseEnabled(e) {
    const isEnabled = e.target.checked;

    if (isEnabled) {
      // Enable Firebase
      if (typeof Firebase === "undefined" || !Firebase.isSignedIn()) {
        // Can't enable Firebase if not signed in
        StatusMessage.show("You must sign in to Firebase first");
        e.target.checked = false;
        return;
      }

      // Check if user has premium subscription
      const isPremium = await Firebase.isPremiumUser();
      if (!isPremium) {
        StatusMessage.show(
          "Premium subscription required for cloud storage",
          3000,
          false
        );
        e.target.checked = false;

        // Show upgrade prompt
        updatePricingOptions();
        subscriptionSection.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const success = await Database.enableFirebase();
      if (success) {
        StatusMessage.show(
          "Firebase storage enabled! Your notes will sync to the cloud.",
          3000,
          true
        );
      } else {
        StatusMessage.show("Failed to enable Firebase storage");
        e.target.checked = false;
      }
    } else {
      // Disable Firebase
      Database.disableFirebase();
      StatusMessage.show(
        "Firebase storage disabled. Your notes will only be stored locally.",
        3000,
        true
      );
    }
  }

  /**
 * Update the subscription section HTML structure
 * This function should be called from createViewStructure or a similar initialization function
 */
  function createSubscriptionSection() {
    const subscriptionSection = document.getElementById('subscription-section');

    if (!subscriptionSection) return;

    // Get current content (if any)
    const currentContent = subscriptionSection.innerHTML;

    // Add the header with toggle button
    const headerHTML = `
    <div class="subscription-header">
      <h3>Premium Subscription</h3>
      <button class="subscription-toggle" id="subscription-toggle">
        <span>Hide</span>
        <span class="subscription-toggle-icon">▲</span>
      </button>
    </div>
  `;

    // Replace just the header portion if it exists
    if (currentContent.includes('<h3>')) {
      subscriptionSection.innerHTML = currentContent.replace(/<h3>.*?<\/h3>/, headerHTML);
    } else {
      // If no content yet, add a basic structure
      subscriptionSection.innerHTML = `
      ${headerHTML}
      <div class="subscription-content">
        <div class="premium-features">
          <h4>Premium Features</h4>
          <ul class="features-list">
            <li>
              <span class="feature-icon">☁️</span>
              <span>Cloud sync across all your devices</span>
            </li>
            <li>
              <span class="feature-icon">🔒</span>
              <span>Secure encrypted storage</span>
            </li>
            <li>
              <span class="feature-icon">🏆</span>
              <span>Priority support</span>
            </li>
          </ul>
        </div>
        <div class="pricing-options">
          <div class="loading-pricing">
            <div class="price-loader">
              <div></div><div></div><div></div><div></div>
            </div>
            <p>Loading pricing options...</p>
          </div>
        </div>
      </div>
    `;
    }

    // Add event listener to toggle button
    const toggleButton = document.getElementById('subscription-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', toggleSubscriptionSection);
    }

    // Check if section should be collapsed by default (stored preference)
    let item = localStorage.getItem('subscription_section_collapsed');
    const isCollapsed = !item || item === 'true'
    if (isCollapsed) {
      subscriptionSection.classList.add('collapsed');
      if (toggleButton) {
        toggleButton.querySelector('span:not(.subscription-toggle-icon)').textContent = 'Show';
      }
    }
  }

  /**
   * Toggle the subscription section between expanded and collapsed states
   */
  function toggleSubscriptionSection() {
    if (!subscriptionSection) return;

    const toggleButton = document.getElementById("subscription-toggle");
    const upgradeButton = document.getElementById("upgrade-premium-btn");
    const content = subscriptionSection.querySelector(".subscription-content");

    if (!toggleButton || !upgradeButton || !content) return;

    const isCollapsed = subscriptionSection.classList.contains("collapsed");

    if (isCollapsed) {
      subscriptionSection.classList.remove("collapsed");
      content.classList.remove("hidden");
      upgradeButton.classList.add("hidden");
      toggleButton.querySelector(".subscription-toggle-icon").textContent = "✕";
    } else {
      subscriptionSection.classList.add("collapsed");
      content.classList.add("hidden");
      upgradeButton.classList.remove("hidden");
      toggleButton.querySelector(".subscription-toggle-icon").textContent = "✕";
    }

    localStorage.setItem("subscription_section_collapsed", isCollapsed);

    if (!isCollapsed && typeof updatePricingOptions === 'function') {
      updatePricingOptions();
    }
  }

  /**
   * Add this to an existing loadPricingOptions function or create it if it doesn't exist
   */
  function loadPricingOptions() {
    const pricingContainer = document.querySelector('.pricing-options');

    if (!pricingContainer) return;

    // Show loading animation
    pricingContainer.innerHTML = `
    <div class="loading-pricing">
      <div class="price-loader">
        <div></div><div></div><div></div><div></div>
      </div>
      <p>Loading pricing options...</p>
    </div>
  `;

    // Your existing code to fetch pricing from an API would go here...
    // This is a placeholder that simulates loading
    setTimeout(() => {
      // This is dummy content - replace with your actual pricing data
      pricingContainer.innerHTML = `
      <h4>Pricing Options</h4>
      <div class="pricing-options-row">
        <div class="pricing-option">
          <div class="option-header">Monthly</div>
          <div class="option-price">EUR 1.99</div>
          <div class="option-period">per month</div>
          <button class="btn btn-primary option-btn">Select</button>
          <span class="trial-mention">Includes 7-day free trial</span>
        </div>
        
        <div class="pricing-option featured">
          <div class="best-value">Best Value</div>
          <div class="option-header">Yearly</div>
          <div class="option-price">EUR 14.99</div>
          <div class="option-period">per year</div>
          <div class="option-savings">Save 17%</div>
          <button class="btn btn-primary option-btn">Select</button>
          <span class="trial-mention">Includes 7-day free trial</span>
        </div>
      </div>
      <p class="secure-payment">🔒 Secure payment with Stripe</p>
    `;
    }, 1500); // Simulate loading delay for demonstration
  }

  /**
   * Show the expanded upgrade prompt
   * This function can be called from other parts of the app
   */
  function showUpgradePrompt() {
    const subscriptionSection = document.getElementById('subscription-section');

    if (!subscriptionSection) return;

    // Make sure section is expanded
    if (subscriptionSection.classList.contains('collapsed')) {
      toggleSubscriptionSection();
    }
  }

  /**
   * Update the Firebase UI based on authentication state
   */
  async function updateFirebaseUI() {
    if (typeof Firebase === "undefined") {
      // Update account section
      firebaseStatusText.textContent = "Firebase not loaded";
      firebaseSignInBtn.style.display = "inline-block";
      firebaseSignOutBtn.style.display = "none";

      // Update subscription section
      updatePricingOptions();

      // Hide cloud storage section
      if (cloudStorageSection) {
        cloudStorageSection.style.display = "none";
      }

      return;
    }

    if (Firebase.isSignedIn()) {
      const user = Firebase.getCurrentUser();

      // Check premium status
      const isPremium = await Firebase.isPremiumUser();

      // Update account section
      firebaseStatusText.textContent = `Signed in as: ${user.email || user.displayName || "Unknown user"
        }`;
      firebaseSignInBtn.style.display = "none";
      firebaseSignOutBtn.style.display = "inline-block";

      // Update subscription section
      updatePricingOptions();

      // Update Cloud Storage section
      if (cloudStorageSection) {
        // Only show cloud storage section for premium users
        cloudStorageSection.style.display = isPremium ? "block" : "none";

        if (isPremium) {
          // Update toggle and sync controls
          if (firebaseEnabledToggle) {
            firebaseEnabledToggle.checked = Database.isFirebaseEnabled();
          }

          const isEnabled = Database.isFirebaseEnabled();
          if (manualSyncButton) manualSyncButton.disabled = !isEnabled;
          if (syncIntervalInput) syncIntervalInput.disabled = !isEnabled;

          // Update last sync time if enabled
          if (isEnabled) {
            updateLastSyncTime();
          }
        } else {
          // If user downgraded from premium to free, disable Firebase
          if (Database.isFirebaseEnabled()) {
            Database.disableFirebase();
          }
        }
      }
    } else {
      // Not signed in
      firebaseStatusText.textContent = "Not signed in";
      firebaseSignInBtn.style.display = "inline-block";
      firebaseSignOutBtn.style.display = "none";

      // Update subscription section
      updatePricingOptions();

      // Hide cloud storage section
      if (cloudStorageSection) {
        cloudStorageSection.style.display = "none";
      }
    }
  }

  /**
  * Update the pricing options display
  */
  async function updatePricingOptions() {
    if (!pricingOptions) return;

    try {
      // Check if Firebase is loaded and user is signed in
      const isSignedIn = typeof Firebase !== "undefined" && Firebase.isSignedIn();
      let isPremium = false;

      // Reset subscription section when user is not signed in or not premium
      // This is the key fix - we need to restore the original structure when signing out
      if (!isSignedIn || (isSignedIn && !(await Firebase.isPremiumUser()))) {
        // Restore the original subscription section structure if it's currently in premium mode
        if (subscriptionSection && subscriptionSection.classList.contains("premium")) {
          subscriptionSection.classList.remove("premium");
          // Re-create the original subscription structure
          subscriptionSection.innerHTML = `
          <div class="subscription-header">
            <h3 class="upgrade-to-premium">Upgrade to Premium</h3>
            <button class="subscription-toggle" id="subscription-toggle">
              <span class="subscription-toggle-icon">✕</span>
            </button>
          </div>
          <div class="subscription-content">
            <div class="premium-features">
              <h4>Premium Features</h4>
              <ul class="features-list">
                <li><span class="feature-icon">🔄</span> <strong>Cloud Synchronization</strong> <br> Keep your notes in sync across all your devices</li>
                <li><span class="feature-icon">💾</span> <strong>Automatic Backup</strong> <br> Never lose your important notes again</li>
              </ul>
            </div>
            <div id="pricing-options" class="pricing-options">
              <div class="loading-pricing">
                <div class="price-loader">
                  <div></div><div></div><div></div><div></div>
                </div>
                <p>Loading pricing options...</p>
              </div>
            </div>
            <p class="secure-payment">🔒 Secure payment with Stripe</p>
          </div>
          <button class="upgrade-button hidden" id="upgrade-premium-btn">
            Upgrade to Premium
          </button>
        `;

          // Re-cache the pricing options element
          pricingOptions = document.getElementById("pricing-options");

          // Re-attach event listeners
          const subscriptionToggle = document.getElementById("subscription-toggle");
          if (subscriptionToggle) {
            subscriptionToggle.addEventListener("click", toggleSubscriptionSection);
          }

          const upgradeButton = document.getElementById("upgrade-premium-btn");
          if (upgradeButton) {
            upgradeButton.addEventListener("click", () => {
              toggleSubscriptionSection();
            });
          }
        }
      }

      if (isSignedIn) {
        isPremium = await Firebase.isPremiumUser();

        // If user is premium, show simplified content
        if (isPremium) {
          // Update the entire subscription section with a simpler version
          if (subscriptionSection) {
            // Replace the whole section content
            subscriptionSection.innerHTML = `
            <h3>Subscription</h3>
            <div class="settings-content">
              <p>You currently have an active premium subscription.</p>
              <button id="manage-subscription-btn" class="btn btn-secondary">Manage Subscription</button>
            </div>
          `;

            subscriptionSection.classList.remove("collapsed");
            subscriptionSection.classList.add("premium");

            // Add event listener for manage subscription button
            const manageSubBtn = document.getElementById("manage-subscription-btn");
            if (manageSubBtn) {
              manageSubBtn.addEventListener("click", async () => {
                try {
                  StatusMessage.show("Opening subscription management...", 2000, true);
                  SubscriptionAnimation.show("Opening customer portal");
                  const result = await Firebase.getCustomerPortalUrl();
                  SubscriptionAnimation.hide();

                  if (result.success && result.url) {
                    window.location.assign(result.url);
                  } else {
                    StatusMessage.show("Failed to open subscription management", 3000, false);
                  }
                } catch (error) {
                  console.error("Portal error:", error);
                  StatusMessage.show("Error: " + error.message, 3000, false);
                }
              });
            }
          }
          return;
        }
      }

      // Show sign-in message if not signed in
      if (!isSignedIn) {
        pricingOptions.innerHTML = `
        <div class="pricing-signin-prompt">
          <p>Sign in to access premium features</p>
          <button id="pricing-signin-btn" class="btn btn-primary">Sign in with Google</button>
        </div>
      `;

        // Add event listener for sign-in button
        const pricingSignInBtn = document.getElementById("pricing-signin-btn");
        if (pricingSignInBtn) {
          pricingSignInBtn.addEventListener("click", signInWithFirebase);
        }

        return;
      }

      // Rest of the function remains the same...
      // Continue with loading subscription options for non-premium signed-in users
      const product = await Firebase.getProduct();

      // [... Rest of the existing function code ...]
      if (!product || !product.prices || product.prices.length === 0) {
        pricingOptions.innerHTML = "<p>Subscription details not available</p>";
        return;
      }

      // Sort prices by interval (monthly, then yearly)
      const sortedPrices = [...product.prices].sort((a, b) => {
        const intervals = { month: 1, year: 2 };
        return intervals[a.interval] - intervals[b.interval];
      });

      // Find monthly and yearly prices
      const monthlyPrice = sortedPrices.find((p) => p.interval === "month");
      const yearlyPrice = sortedPrices.find((p) => p.interval === "year");

      if (!monthlyPrice && !yearlyPrice) {
        pricingOptions.innerHTML = "<p>No pricing options available</p>";
        return;
      }

      // Create pricing options HTML
      let pricingHTML = '<div class="pricing-options-row">';

      if (monthlyPrice) {
        const amount = (monthlyPrice.unit_amount / 100).toFixed(2);
        const currency = monthlyPrice.currency.toUpperCase();
        pricingHTML += `
        <div class="pricing-option">
          <div class="option-header">Monthly</div>
          <div class="option-price">${currency} ${amount}</div>
          <div class="option-period">per month</div>
          <button class="btn btn-primary option-btn" id="monthly-option-btn">Subscribe Monthly</button>
          <span class="trial-mention">Includes 7-day free trial</span>
        </div>
      `;
      }

      if (yearlyPrice) {
        const yearAmount = (yearlyPrice.unit_amount / 100).toFixed(2);
        const currency = yearlyPrice.currency.toUpperCase();

        if (monthlyPrice) {
          // Calculate savings when compared to monthly
          const monthlyTotal = (monthlyPrice.unit_amount * 12) / 100;
          const yearlyTotal = yearlyPrice.unit_amount / 100;
          const savings = monthlyTotal - yearlyTotal;
          const savingsPercent = Math.round((savings / monthlyTotal) * 100);

          pricingHTML += `
          <div class="pricing-option featured">
            <div class="best-value">Best Value</div>
            <div class="option-header">Yearly</div>
            <div class="option-price">${currency} ${yearAmount}</div>
            <div class="option-period">per year</div>
            <div class="option-savings">Save ${savingsPercent}%</div>
            <button class="btn btn-primary option-btn" id="yearly-option-btn">Subscribe Yearly</button>
            <span class="trial-mention">Includes 7-day free trial</span>
          </div>
        `;
        } else {
          pricingHTML += `
          <div class="pricing-option">
            <div class="option-header">Yearly</div>
            <div class="option-price">${currency} ${yearAmount}</div>
            <div class="option-period">per year</div>
            <button class="btn btn-primary option-btn" id="yearly-option-btn">Subscribe Yearly</button>
            <span class="trial-mention">Includes 7-day free trial</span>
          </div>
        `;
        }
      }

      pricingHTML += '</div>';

      // Set the HTML content
      pricingOptions.innerHTML = pricingHTML;

      // Add event listeners
      const monthlyBtn = document.getElementById("monthly-option-btn");
      const yearlyBtn = document.getElementById("yearly-option-btn");

      if (monthlyBtn && monthlyPrice) {
        monthlyBtn.addEventListener("click", () => handleSubscription(monthlyPrice.id));
      }

      if (yearlyBtn && yearlyPrice) {
        yearlyBtn.addEventListener("click", () => handleSubscription(yearlyPrice.id));
      }
    } catch (error) {
      console.error("Error updating pricing options:", error);
      pricingOptions.innerHTML = "<p>Error loading pricing options</p>";
    }
  }

  /**
   * Handle subscription selection
   * @param {string} priceId - The selected price ID
   */
  async function handleSubscription(priceId) {
    try {
      StatusMessage.show("Starting checkout process...", 2000, true);
      SubscriptionAnimation.show("Starting checkout process");
      const result = await Firebase.createCheckoutSession(priceId);
      SubscriptionAnimation.hide();
      if (result.success && result.url) {
        window.location.assign(result.url);
      } else {
        StatusMessage.show("Failed to create checkout session", 3000, false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      StatusMessage.show("Error: " + error.message, 3000, false);
    }
  }

  /**
   * Load the Firebase module dynamically
   */
  async function loadFirebaseModule() {
    try {
      if (typeof Firebase !== "undefined") {
        return Promise.resolve();
      }

      // Load Firebase script
      const script = document.createElement("script");
      script.src = "modules/Firebase.js";
      document.head.appendChild(script);

      // Wait for script to load
      await new Promise((resolve, reject) => {
        script.onload = () => {
          if (typeof Firebase !== "undefined") {
            // Initialize Firebase
            Firebase.init();
            resolve();
          } else {
            reject(new Error("Firebase module not found after loading script"));
          }
        };
        script.onerror = () =>
          reject(new Error("Failed to load Firebase script"));
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
    if (typeof Firebase === "undefined") {
      loadFirebaseModule()
        .then(() => {
          updateFirebaseUI();
        })
        .catch((error) => {
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
      if (
        typeof Firebase === "undefined" ||
        !Firebase.isSignedIn() ||
        !Database.isFirebaseEnabled()
      ) {
        StatusMessage.show(
          "Cannot sync: Firebase is not enabled or you're not signed in"
        );
        return;
      }

      // Show syncing state
      manualSyncButton.disabled = true;
      manualSyncButton.innerHTML =
        '<i class="fa fa-sync fa-spin"></i> Syncing...';

      // Trigger sync
      const result = await Firebase.performSync("manual");

      if (result.success) {
        // StatusMessage.show("Successfully synced with cloud!", 2000, true);
      } else {
        // StatusMessage.show("Sync failed: " + (result.error || "Unknown error"));
      }

      // Update UI with last sync time
      updateLastSyncTime();
    } catch (error) {
      console.error("Error syncing with Firebase:", error);
      // StatusMessage.show("Sync error: " + error.message);
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

    if (typeof Firebase !== "undefined") {
      Firebase.setSyncInterval(minutes);
      StatusMessage.show(
        `Sync interval set to ${minutes} minute${minutes === 1 ? "" : "s"}`,
        2000,
        true
      );
    }
  }

  /**
   * Update the last sync time display
   */
  function updateLastSyncTime() {
    if (!lastSyncTimeElement || typeof Firebase === "undefined") return;

    const lastSync = Firebase.getLastSyncTime();

    if (lastSync) {
      const timeAgo = getTimeAgo(lastSync);
      lastSyncTimeElement.textContent = `Last synced: ${timeAgo}`;
    } else {
      lastSyncTimeElement.textContent = "Never synced";
    }
  }

  /**
   * Get human-readable time ago string
   * @param {Date} date - Date to format
   * @returns {string} Human readable string
   */
  function getTimeAgo(date) {
    if (!date) return "never";

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";

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
    createSubscriptionSection,
    toggleSubscriptionSection,
    loadPricingOptions,
    showUpgradePrompt,
    handleThemeChange,
    setTheme
  };
})();