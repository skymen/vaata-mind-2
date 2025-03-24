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
          <h3>Local Storage</h3>
          <button id="request-storage-btn" class="btn btn-primary">
            Request Persistent Storage
          </button>
          <p class="settings-description">
            Enable persistent storage to ensure your notes aren't lost if your browser clears data.
          </p>
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
        
        <div class="settings-section" id="subscription-section">
          <h3>Subscription</h3>
          <div id="subscription-status" class="subscription-status">
            <div class="subscription-info">
              <p id="subscription-text">Sign in to see subscription options</p>
            </div>
            <div class="subscription-actions">
              <button id="subscription-btn" class="btn btn-primary" style="display: none;">
                Upgrade to Premium
              </button>
            </div>
          </div>
          
          <div id="subscription-features" class="subscription-features" style="display: none;">
            <div class="comparison-table">
              <div class="comparison-header">
                <div class="feature-column">Features</div>
                <div class="free-column">Free</div>
                <div class="premium-column">Premium</div>
              </div>
              <div class="comparison-row">
                <div class="feature-column">Local Storage</div>
                <div class="free-column">✓</div>
                <div class="premium-column">✓</div>
              </div>
              <div class="comparison-row">
                <div class="feature-column">Cloud Backup</div>
                <div class="free-column">✗</div>
                <div class="premium-column">✓</div>
              </div>
              <div class="comparison-row">
                <div class="feature-column">Multi-device Sync</div>
                <div class="free-column">✗</div>
                <div class="premium-column">✓</div>
              </div>
              <div class="comparison-row">
                <div class="feature-column">Offline Mode</div>
                <div class="free-column">✓</div>
                <div class="premium-column">✓</div>
              </div>
              <div class="comparison-row">
                <div class="feature-column">Automatic Syncing</div>
                <div class="free-column">✗</div>
                <div class="premium-column">✓</div>
              </div>
            </div>
            
            <div id="pricing-options" class="pricing-options">
              <!-- Pricing will be filled in dynamically -->
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
    
    // Account elements
    firebaseSignInBtn = document.getElementById("firebase-signin-btn");
    firebaseSignOutBtn = document.getElementById("firebase-signout-btn");
    firebaseStatusText = document.getElementById("firebase-status-text");
    
    // Subscription elements
    subscriptionSection = document.getElementById("subscription-section");
    subscriptionText = document.getElementById("subscription-text");
    subscriptionBtn = document.getElementById("subscription-btn");
    subscriptionFeatures = document.getElementById("subscription-features");
    pricingOptions = document.getElementById("pricing-options");
    
    // Cloud storage elements
    cloudStorageSection = document.getElementById("cloud-storage-section");
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
    
    // Subscription button
    if (subscriptionBtn) {
      subscriptionBtn.addEventListener("click", async () => {
        if (typeof Firebase !== 'undefined' && Firebase.isSignedIn()) {
          const isPremium = await Firebase.isPremiumUser();
          if (isPremium) {
            // Open customer portal for premium users
            try {
              StatusMessage.show("Opening subscription management...", 2000, true);
              const result = await Firebase.getCustomerPortalUrl();
              
              if (result.success && result.url) {
                window.location.assign(result.url);
              } else {
                StatusMessage.show("Failed to open subscription management", 3000, false);
              }
            } catch (error) {
              console.error("Portal error:", error);
              StatusMessage.show("Error: " + error.message, 3000, false);
            }
          } else {
            // Show upgrade prompt for free users
            showUpgradePrompt();
          }
        }
      });
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
  async function toggleFirebaseEnabled(e) {
    const isEnabled = e.target.checked;
    
    if (isEnabled) {
      // Enable Firebase
      if (typeof Firebase === 'undefined' || !Firebase.isSignedIn()) {
        // Can't enable Firebase if not signed in
        StatusMessage.show("You must sign in to Firebase first");
        e.target.checked = false;
        return;
      }
      
      // Check if user has premium subscription
      const isPremium = await Firebase.isPremiumUser();
      if (!isPremium) {
        StatusMessage.show("Premium subscription required for cloud storage", 3000, false);
        e.target.checked = false;
        
        // Show upgrade prompt
        showUpgradePrompt();
        return;
      }
      
      const success = await Database.enableFirebase();
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
   * Show upgrade to premium prompt
   */
  async function showUpgradePrompt() {
    try {
      // Get product information
      const products = await Firebase.getProducts();
      
      if (products.length === 0) {
        StatusMessage.show("No subscription plans available", 3000, false);
        return;
      }
      
      // Get the subscription product (there should only be one)
      const product = products[0];
      
      if (!product || !product.prices || product.prices.length === 0) {
        StatusMessage.show("Subscription plan information not available", 3000, false);
        return;
      }
      
      // Find monthly and yearly prices
      const monthlyPrice = product.prices.find(p => p.interval === 'month');
      const yearlyPrice = product.prices.find(p => p.interval === 'year');
      
      // Calculate pricing and savings information
      let monthlyHtml = '';
      let yearlyHtml = '';
      
      if (monthlyPrice) {
        const amount = (monthlyPrice.unit_amount / 100).toFixed(2);
        const currency = monthlyPrice.currency.toUpperCase();
        monthlyHtml = `
          <div class="pricing-option">
            <div class="option-header">Monthly</div>
            <div class="option-price">${currency} ${amount}</div>
            <div class="option-period">per month</div>
            <button class="btn btn-primary option-btn" id="monthly-option-btn">Subscribe Monthly</button>
          </div>
        `;
      }
      
      if (yearlyPrice) {
        const yearAmount = (yearlyPrice.unit_amount / 100).toFixed(2);
        const currency = yearlyPrice.currency.toUpperCase();
        
        if (monthlyPrice) {
          // Calculate savings when compared to monthly
          const monthlyTotal = monthlyPrice.unit_amount * 12 / 100;
          const yearlyTotal = yearlyPrice.unit_amount / 100;
          const savings = monthlyTotal - yearlyTotal;
          const savingsPercent = Math.round((savings / monthlyTotal) * 100);
          
          yearlyHtml = `
            <div class="pricing-option featured">
              <div class="best-value">Best Value</div>
              <div class="option-header">Yearly</div>
              <div class="option-price">${currency} ${yearAmount}</div>
              <div class="option-period">per year</div>
              <div class="option-savings">Save ${savingsPercent}%</div>
              <button class="btn btn-primary option-btn" id="yearly-option-btn">Subscribe Yearly</button>
            </div>
          `;
        } else {
          yearlyHtml = `
            <div class="pricing-option">
              <div class="option-header">Yearly</div>
              <div class="option-price">${currency} ${yearAmount}</div>
              <div class="option-period">per year</div>
              <button class="btn btn-primary option-btn" id="yearly-option-btn">Subscribe Yearly</button>
            </div>
          `;
        }
      }
      
      // Create enhanced premium dialog
      const dialogContent = `
        <div class="upgrade-dialog">
          <h3>Upgrade to Premium</h3>
          <div class="dialog-close" id="dialog-close-btn">×</div>
          
          <div class="premium-features">
            <h4>Premium Features</h4>
            <ul class="features-list">
              <li><span class="feature-icon">🔄</span> <strong>Cloud Synchronization</strong> - Keep your notes in sync across all your devices</li>
              <li><span class="feature-icon">💾</span> <strong>Automatic Backup</strong> - Never lose your important notes again</li>
              <li><span class="feature-icon">📱</span> <strong>Multi-device Support</strong> - Access from anywhere</li>
              <li><span class="feature-icon">⚡</span> <strong>Offline Mode</strong> - Work without internet connection</li>
            </ul>
          </div>
          
          <div class="pricing-options-container">
            <h4>Choose Your Plan</h4>
            <div class="pricing-options-row">
              ${monthlyHtml}
              ${yearlyHtml}
            </div>
          </div>
          
          <div class="upgrade-footer">
            <p class="secure-payment">🔒 Secure payment with Stripe</p>
            <button id="cancel-upgrade-btn" class="btn btn-secondary">No Thanks</button>
          </div>
        </div>
      `;
      
      // Show the dialog
      const dialogElement = document.createElement('div');
      dialogElement.className = 'dialog-overlay';
      dialogElement.innerHTML = dialogContent;
      document.body.appendChild(dialogElement);
      
      // Add event listeners for closing the dialog
      const closeDialog = () => {
        document.body.removeChild(dialogElement);
      };
      
      const cancelBtn = document.getElementById('cancel-upgrade-btn');
      const closeBtn = document.getElementById('dialog-close-btn');
      if (cancelBtn) cancelBtn.addEventListener('click', closeDialog);
      if (closeBtn) closeBtn.addEventListener('click', closeDialog);
      
      // Add event listeners for the subscription options
      const monthlyBtn = document.getElementById('monthly-option-btn');
      const yearlyBtn = document.getElementById('yearly-option-btn');
      
      if (monthlyBtn && monthlyPrice) {
        monthlyBtn.addEventListener('click', () => {
          closeDialog();
          handleSubscription(monthlyPrice.id);
        });
      }
      
      if (yearlyBtn && yearlyPrice) {
        yearlyBtn.addEventListener('click', () => {
          closeDialog();
          handleSubscription(yearlyPrice.id);
        });
      }
      
    } catch (error) {
      console.error("Error showing upgrade prompt:", error);
      StatusMessage.show("Error preparing subscription information", 3000, false);
    }
  }
  
  /**
   * Update the Firebase UI based on authentication state
   */
  async function updateFirebaseUI() {
    if (typeof Firebase === 'undefined') {
      // Update account section
      firebaseStatusText.textContent = "Firebase not loaded";
      firebaseSignInBtn.style.display = "inline-block";
      firebaseSignOutBtn.style.display = "none";
      
      // Update subscription section
      if (subscriptionText) {
        subscriptionText.textContent = "Sign in to see subscription options";
      }
      
      if (subscriptionBtn) {
        subscriptionBtn.style.display = "none";
      }
      
      if (subscriptionFeatures) {
        subscriptionFeatures.style.display = "none";
      }
      
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
      firebaseStatusText.textContent = `Signed in as: ${user.email || user.displayName || 'Unknown user'}`;
      firebaseSignInBtn.style.display = "none";
      firebaseSignOutBtn.style.display = "inline-block";
      
      // Update subscription section
      if (subscriptionText) {
        if (isPremium) {
          subscriptionText.textContent = "You currently have a Premium subscription";
          subscriptionText.className = "premium-active";
        } else {
          subscriptionText.textContent = "You are currently on the Free plan";
          subscriptionText.className = "";
        }
      }
      
      if (subscriptionBtn) {
        subscriptionBtn.style.display = "inline-block";
        subscriptionBtn.textContent = isPremium ? "Manage Subscription" : "Upgrade to Premium";
        subscriptionBtn.className = isPremium ? "btn btn-secondary" : "btn btn-primary";
        
        // Remove existing event listeners by cloning the button
        const newBtn = subscriptionBtn.cloneNode(true);
        subscriptionBtn.parentNode.replaceChild(newBtn, subscriptionBtn);
        subscriptionBtn = newBtn;
        
        // Add click event
        subscriptionBtn.addEventListener("click", async () => {
          if (isPremium) {
            // Open customer portal for existing subscribers
            try {
              StatusMessage.show("Opening subscription management...", 2000, true);
              const result = await Firebase.getCustomerPortalUrl();
              
              if (result.success && result.url) {
                window.location.assign(result.url);
              } else {
                StatusMessage.show("Failed to open subscription management", 3000, false);
              }
            } catch (error) {
              console.error("Portal error:", error);
              StatusMessage.show("Error: " + error.message, 3000, false);
            }
          } else {
            // Show upgrade prompt for free users
            showUpgradePrompt();
          }
        });
      }
      
      // Show subscription features and populate pricing options
      if (subscriptionFeatures) {
        subscriptionFeatures.style.display = "block";
        updatePricingOptions();
      }
      
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
      if (subscriptionText) {
        subscriptionText.textContent = "Sign in to see subscription options";
        subscriptionText.className = "";
      }
      
      if (subscriptionBtn) {
        subscriptionBtn.style.display = "none";
      }
      
      if (subscriptionFeatures) {
        subscriptionFeatures.style.display = "none";
      }
      
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
      // Clear existing content
      pricingOptions.innerHTML = '<div class="loading-pricing">Loading pricing options...</div>';
      
      // Get products from Firebase
      const products = await Firebase.getProducts();
      
      if (products.length === 0) {
        pricingOptions.innerHTML = '<p>No subscription plans available</p>';
        return;
      }
      
      // We only have one product, but it might have multiple pricing options
      const product = products[0];
      
      if (!product || !product.prices || product.prices.length === 0) {
        pricingOptions.innerHTML = '<p>Subscription details not available</p>';
        return;
      }
      
      // Sort prices by interval (monthly, then yearly)
      const sortedPrices = [...product.prices].sort((a, b) => {
        const intervals = { month: 1, year: 2 };
        return intervals[a.interval] - intervals[b.interval];
      });
      
      // Find monthly and yearly prices
      const monthlyPrice = sortedPrices.find(p => p.interval === 'month');
      const yearlyPrice = sortedPrices.find(p => p.interval === 'year');
      
      if (!monthlyPrice && !yearlyPrice) {
        pricingOptions.innerHTML = '<p>No pricing options available</p>';
        return;
      }
      
      // Create pricing cards HTML
      let pricingHTML = '<div class="pricing-cards">';
      
      if (monthlyPrice) {
        const monthlyAmount = (monthlyPrice.unit_amount / 100).toFixed(2);
        const monthlyCurrency = monthlyPrice.currency.toUpperCase();
        
        pricingHTML += `
          <div class="pricing-card">
            <div class="pricing-header">Monthly</div>
            <div class="pricing-price">${monthlyCurrency} ${monthlyAmount}</div>
            <div class="pricing-period">per month</div>
            <button class="btn btn-primary btn-block monthly-plan-btn">Select Monthly</button>
          </div>
        `;
      }
      
      if (yearlyPrice) {
        const yearlyAmount = (yearlyPrice.unit_amount / 100).toFixed(2);
        const yearlyCurrency = yearlyPrice.currency.toUpperCase();
        
        // Calculate monthly equivalent and savings
        if (monthlyPrice) {
          const effectiveMonthly = (yearlyPrice.unit_amount / 12 / 100).toFixed(2);
          const monthlyCost = monthlyPrice.unit_amount / 100;
          const yearlyCost = yearlyPrice.unit_amount / 100;
          const annualSavings = ((monthlyCost * 12) - yearlyCost).toFixed(2);
          const savingsPercent = Math.round(((monthlyCost * 12) - yearlyCost) / (monthlyCost * 12) * 100);
          
          pricingHTML += `
            <div class="pricing-card featured">
              <div class="pricing-badge">Best Value</div>
              <div class="pricing-header">Yearly</div>
              <div class="pricing-price">${yearlyCurrency} ${yearlyAmount}</div>
              <div class="pricing-period">per year</div>
              <div class="pricing-savings">
                <span class="monthly-equiv">Just ${yearlyCurrency} ${effectiveMonthly}/mo</span>
                <span class="save-text">Save ${savingsPercent}%</span>
              </div>
              <button class="btn btn-primary btn-block yearly-plan-btn">Select Yearly</button>
            </div>
          `;
        } else {
          pricingHTML += `
            <div class="pricing-card">
              <div class="pricing-header">Yearly</div>
              <div class="pricing-price">${yearlyCurrency} ${yearlyAmount}</div>
              <div class="pricing-period">per year</div>
              <button class="btn btn-primary btn-block yearly-plan-btn">Select Yearly</button>
            </div>
          `;
        }
      }
      
      pricingHTML += '</div>';
      
      // Set the HTML content
      pricingOptions.innerHTML = pricingHTML;
      
      // Add event listeners
      const monthlyBtn = pricingOptions.querySelector('.monthly-plan-btn');
      const yearlyBtn = pricingOptions.querySelector('.yearly-plan-btn');
      
      if (monthlyBtn && monthlyPrice) {
        monthlyBtn.addEventListener('click', () => handleSubscription(monthlyPrice.id));
      }
      
      if (yearlyBtn && yearlyPrice) {
        yearlyBtn.addEventListener('click', () => handleSubscription(yearlyPrice.id));
      }
      
    } catch (error) {
      console.error('Error updating pricing options:', error);
      pricingOptions.innerHTML = '<p>Error loading pricing options</p>';
    }
  }
  
  /**
   * Handle subscription selection
   * @param {string} priceId - The selected price ID
   */
  async function handleSubscription(priceId) {
    try {
      StatusMessage.show("Starting checkout process...", 2000, true);
      const result = await Firebase.createCheckoutSession(priceId);
      
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
    showUpgradePrompt, // Expose this method so MenuView can call it
  };
})();
