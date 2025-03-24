/**
 * Firebase Module
 * Handles Firebase integration, authentication, and Firestore data storage
 */
const Firebase = (() => {
  // Firebase SDK objects
  let firebaseApp = null;
  let auth = null;
  let firestore = null;
  let analytics = null;
  let currentUser = null;
  let isInitialized = false;
  let isOffline = false;
  let attemptedAutoLogin = false;
  
  // Sync management
  let syncInterval = null;
  let syncIntervalMinutes = 5;
  let isSyncing = false;
  let lastSyncTime = null;
  
  // Config
  const firebaseConfig = {
    apiKey: "AIzaSyBmvJOjmGWll8ysQ89HZCm5pJsqS_htSh8",
    authDomain: "vaata-mind.firebaseapp.com",
    projectId: "vaata-mind",
    storageBucket: "vaata-mind.firebasestorage.app",
    messagingSenderId: "557148045075",
    appId: "1:557148045075:web:6c6c5ed5db343b2c5e24e6",
    measurementId: "G-4PS0QV3J5B"
  };
  
  /**
   * Dynamically load Firebase scripts and initialize
   * @returns {Promise} Promise that resolves when Firebase is loaded
   */
  async function loadFirebase() {
    if (isInitialized) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      try {
        // Create script elements
        const firebaseAppScript = document.createElement('script');
        firebaseAppScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
        firebaseAppScript.type = 'module';
        
        const firebaseAuthScript = document.createElement('script');
        firebaseAuthScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
        firebaseAuthScript.type = 'module';
        
        const firestoreScript = document.createElement('script');
        firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
        firestoreScript.type = 'module';
        
        const analyticsScript = document.createElement('script');
        analyticsScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js';
        analyticsScript.type = 'module';
        
        // Create a wrapper script that will initialize Firebase once all scripts are loaded
        const initScript = document.createElement('script');
        initScript.type = 'module';
        initScript.textContent = `
          import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
          import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
          import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
          import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js';
          
          const firebaseConfig = {
            apiKey: "AIzaSyBmvJOjmGWll8ysQ89HZCm5pJsqS_htSh8",
            authDomain: "vaata-mind.firebaseapp.com",
            projectId: "vaata-mind",
            storageBucket: "vaata-mind.firebasestorage.app",
            messagingSenderId: "557148045075",
            appId: "1:557148045075:web:6c6c5ed5db343b2c5e24e6",
            measurementId: "G-4PS0QV3J5B"
          };
          
          // Initialize Firebase
          const app = initializeApp(firebaseConfig);
          const auth = getAuth(app);
          const firestore = getFirestore(app);
          const analytics = getAnalytics(app);
          
          // Enable offline persistence for Firestore
          enableIndexedDbPersistence(firestore)
            .catch((err) => {
              console.error('Firebase offline persistence error:', err);
            });
          
          // Make Firebase modules available globally so our Firebase.js module can access them
          window.firebaseApp = app;
          window.firebaseAuth = auth;
          window.firebaseFirestore = firestore;
          window.firebaseAnalytics = analytics;
          window.GoogleAuthProvider = GoogleAuthProvider;
          window.firebaseAuthFunctions = {
            signInWithPopup,
            signOut
          };
          window.firebaseFirestoreFunctions = {
            collection,
            doc,
            setDoc,
            getDoc,
            getDocs,
            updateDoc,
            deleteDoc
          };
          
          // Notify our module that Firebase is initialized
          window.dispatchEvent(new CustomEvent('firebase-initialized'));
        `;
        
        // Add the scripts to the document
        document.head.appendChild(firebaseAppScript);
        document.head.appendChild(firebaseAuthScript);
        document.head.appendChild(firestoreScript);
        document.head.appendChild(analyticsScript);
        document.head.appendChild(initScript);
        
        // Listen for the initialization event
        window.addEventListener('firebase-initialized', () => {
          // Get the Firebase objects from the window
          firebaseApp = window.firebaseApp;
          auth = window.firebaseAuth;
          firestore = window.firebaseFirestore;
          analytics = window.firebaseAnalytics;
          
          // Set up auth state change listener
          window.firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
              currentUser = user;
              // Dispatch event for other modules
              window.dispatchEvent(new CustomEvent('firebase-user-signed-in', { detail: user }));
            } else {
              currentUser = null;
              // Dispatch event for other modules
              window.dispatchEvent(new CustomEvent('firebase-user-signed-out'));
            }
          });
          
          isInitialized = true;
          resolve();
        }, { once: true });
        
      } catch (error) {
        console.error('Error loading Firebase:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Initialize Firebase module
   */
  function init() {
    // Check for network connectivity
    window.addEventListener('online', () => {
      isOffline = false;
      StatusMessage.show('You are online. Syncing data...', 3000, true);
      performSync('online');
    });
    
    window.addEventListener('offline', () => {
      isOffline = true;
      StatusMessage.show('You are offline. Changes will sync when connected.', 3000);
      stopPeriodicSync(); // Stop sync when offline
    });
    
    // Setup focus/visibility events for smart sync
    window.addEventListener('focus', () => {
      if (Database.isFirebaseEnabled() && isSignedIn() && !isOffline) {
        performSync('focus');
      }
    });
    
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && 
          Database.isFirebaseEnabled() && isSignedIn() && !isOffline) {
        performSync('visibility');
      }
    });
    
    // Handle user sign-in/out events
    window.addEventListener('firebase-user-signed-in', () => {
      if (Database.isFirebaseEnabled() && !isOffline) {
        startPeriodicSync();
        performSync('sign-in');
      }
    });
    
    window.addEventListener('firebase-user-signed-out', () => {
      stopPeriodicSync();
    });
    
    isOffline = !navigator.onLine;
    
    // Start periodic sync if needed
    if (Database.isFirebaseEnabled() && isSignedIn() && !isOffline) {
      startPeriodicSync();
    }
  }
  
  /**
   * Start periodic sync at regular intervals
   */
  function startPeriodicSync() {
    if (syncInterval) {
      stopPeriodicSync();
    }
    
    syncInterval = setInterval(() => {
      performSync('periodic');
    }, syncIntervalMinutes * 60 * 1000);
    
    console.log(`Periodic sync started: every ${syncIntervalMinutes} minutes`);
  }
  
  /**
   * Stop periodic sync
   */
  function stopPeriodicSync() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
      console.log('Periodic sync stopped');
    }
  }
  
  /**
   * Perform sync operation with specified trigger
   * @param {string} trigger - What triggered the sync
   * @returns {Promise} Promise that resolves when sync is complete
   */
  async function performSync(trigger) {
    if (isSyncing || isOffline || !isSignedIn() || !Database.isFirebaseEnabled()) {
      return { success: false };
    }
    
    try {
      isSyncing = true;
      
      if (trigger !== 'silent') {
        StatusMessage.show(`Syncing data (${trigger})...`, 2000, true);
      }
      
      const result = await syncData();
      
      lastSyncTime = new Date();
      
      if (trigger !== 'silent' && result.success) {
        StatusMessage.show('Sync complete', 2000, true);
      }
      
      // Update sync button state if it exists
      const syncButton = document.getElementById('manual-sync-button');
      if (syncButton) {
        syncButton.classList.remove('syncing');
        syncButton.title = `Sync with cloud (Last: ${getTimeAgo(lastSyncTime)})`;
      }
      
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      StatusMessage.show('Sync failed', 2000, false);
      return { success: false, error };
    } finally {
      isSyncing = false;
    }
  }
  
  /**
   * Get a human-readable time ago string
   * @param {Date} date - The date to format
   * @returns {string} Human readable time ago
   */
  function getTimeAgo(date) {
    if (!date) return 'Never';
    
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
  
  /**
   * Set the sync interval in minutes
   * @param {number} minutes - Minutes between syncs
   */
  function setSyncInterval(minutes) {
    if (minutes < 1) minutes = 1;
    syncIntervalMinutes = minutes;
    
    // Restart sync if it's running
    if (syncInterval) {
      startPeriodicSync();
    }
    
    // Save preference to localStorage
    localStorage.setItem('syncIntervalMinutes', minutes);
  }
  
  /**
   * Check if sync is in progress
   * @returns {boolean} True if syncing
   */
  function isSyncInProgress() {
    return isSyncing;
  }
  
  /**
   * Get the last sync time
   * @returns {Date|null} Last sync time or null
   */
  function getLastSyncTime() {
    return lastSyncTime;
  }

  /**
   * Sign in with Google
   * @returns {Promise} Promise that resolves when signed in
   */
  async function signInWithGoogle() {
    if (!isInitialized) {
      await loadFirebase();
    }
    
    try {
      const provider = new window.GoogleAuthProvider();
      const result = await window.firebaseAuthFunctions.signInWithPopup(auth, provider);
      currentUser = result.user;
      return {
        success: true,
        user: currentUser
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Sign out
   * @returns {Promise} Promise that resolves when signed out
   */
  async function signOut() {
    if (!isInitialized || !currentUser) {
      return { success: true }; // Already signed out
    }
    
    try {
      await window.firebaseAuthFunctions.signOut(auth);
      currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Check if user is signed in
   * @returns {boolean} True if signed in
   */
  function isSignedIn() {
    return !!currentUser;
  }
  
  /**
   * Get current user
   * @returns {Object|null} User object or null if not signed in
   */
  function getCurrentUser() {
    return currentUser;
  }
  
  /**
   * Sync data with Firestore
   * @returns {Promise} Promise that resolves when data is synced
   */
  async function syncData() {
    if (!isInitialized || !currentUser || isOffline) {
      return {
        success: false,
        error: isOffline ? 'Offline mode' : 'Not signed in'
      };
    }
    
    try {
      // Pull data from Firestore
      await pullFromFirestore();
      
      // Push local data to Firestore
      await pushToFirestore();
      
      return { success: true };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Pull data from Firestore to local storage
   * @returns {Promise} Promise that resolves when data is pulled
   */
  async function pullFromFirestore() {
    if (!isInitialized || !currentUser) {
      return {
        success: false,
        error: 'Not signed in'
      };
    }
    
    try {
      const notesCollection = window.firebaseFirestoreFunctions.collection(
        firestore, 
        `users/${currentUser.uid}/notes`
      );
      
      const snapshot = await window.firebaseFirestoreFunctions.getDocs(notesCollection);
      const firestoreNotes = [];
      
      snapshot.forEach(doc => {
        firestoreNotes.push(doc.data());
      });
      
      if (firestoreNotes.length > 0) {
        // Import notes from Firestore to local storage
        const success = Database.mergeFirestoreData(firestoreNotes);
        
        if (success) {
          StatusMessage.show('Successfully synced notes from cloud!', 3000, true);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error pulling from Firestore:', error);
      StatusMessage.show('Error syncing from cloud: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Push local data to Firestore
   * @returns {Promise} Promise that resolves when data is pushed
   */
  async function pushToFirestore() {
    if (!isInitialized || !currentUser) {
      return {
        success: false,
        error: 'Not signed in'
      };
    }
    
    try {
      const notes = Database.getAllNotes();
      const batch = [];
      
      // Create a batch of promises to update Firestore
      for (const note of notes) {
        const docRef = window.firebaseFirestoreFunctions.doc(
          firestore, 
          `users/${currentUser.uid}/notes/${note.id}`
        );
        
        batch.push(
          window.firebaseFirestoreFunctions.setDoc(docRef, note, { merge: true })
        );
      }
      
      // Execute all promises
      await Promise.all(batch);
      
      StatusMessage.show('Successfully saved notes to cloud!', 3000, true);
      return { success: true };
    } catch (error) {
      console.error('Error pushing to Firestore:', error);
      StatusMessage.show('Error saving to cloud: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Add a new note to Firestore
   * @param {Object} note - The note to add
   * @returns {Promise} Promise that resolves when the note is added
   */
  async function addNote(note) {
    if (!isInitialized || !currentUser || isOffline) {
      return { success: false };
    }
    
    try {
      const docRef = window.firebaseFirestoreFunctions.doc(
        firestore, 
        `users/${currentUser.uid}/notes/${note.id}`
      );
      
      await window.firebaseFirestoreFunctions.setDoc(docRef, note);
      return { success: true };
    } catch (error) {
      console.error('Error adding note to Firestore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update a note in Firestore
   * @param {Object} note - The note to update
   * @returns {Promise} Promise that resolves when the note is updated
   */
  async function updateNote(note) {
    if (!isInitialized || !currentUser || isOffline) {
      return { success: false };
    }
    
    try {
      const docRef = window.firebaseFirestoreFunctions.doc(
        firestore, 
        `users/${currentUser.uid}/notes/${note.id}`
      );
      
      await window.firebaseFirestoreFunctions.updateDoc(docRef, note);
      return { success: true };
    } catch (error) {
      console.error('Error updating note in Firestore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Delete a note from Firestore
   * @param {string} noteId - The ID of the note to delete
   * @returns {Promise} Promise that resolves when the note is deleted
   */
  async function deleteNote(noteId) {
    if (!isInitialized || !currentUser || isOffline) {
      return { success: false };
    }
    
    try {
      const docRef = window.firebaseFirestoreFunctions.doc(
        firestore, 
        `users/${currentUser.uid}/notes/${noteId}`
      );
      
      await window.firebaseFirestoreFunctions.deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting note from Firestore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Check if Firebase is initialized
   * @returns {boolean} True if Firebase is initialized
   */
  function getInitializationStatus() {
    return isInitialized;
  }
  
  /**
   * Try to automatically restore previous Firebase session
   * @param {boolean} silent - Whether to show status messages
   * @returns {Promise} Promise that resolves with login status
   */
  async function tryAutoLogin(silent = false) {
    if (attemptedAutoLogin) {
      return { success: isSignedIn() };
    }
    
    attemptedAutoLogin = true;
    
    if (!isInitialized) {
      try {
        await loadFirebase();
      } catch (error) {
        console.error('Error loading Firebase during auto-login:', error);
        return { success: false, error };
      }
    }
    
    // Wait a short time for Firebase auth to initialize and restore session
    return new Promise(resolve => {
      // If already signed in, resolve immediately
      if (isSignedIn()) {
        if (!silent) {
          const user = getCurrentUser();
          StatusMessage.show(`Welcome back, ${user.displayName || user.email || 'User'}!`, 2000, true);
        }
        
        // If Firebase is enabled in Database, start syncing
        if (Database.isFirebaseEnabled() && !isOffline) {
          startPeriodicSync();
          performSync('auto-login');
        }
        
        resolve({ success: true, user: currentUser });
        return;
      }
      
      // Otherwise, wait briefly to see if auth state changes
      const timeout = setTimeout(() => {
        resolve({ success: isSignedIn(), user: currentUser });
      }, 2000);
      
      // If auth state changes before timeout, resolve early
      const authStateListener = () => {
        if (isSignedIn()) {
          clearTimeout(timeout);
          
          if (!silent) {
            const user = getCurrentUser();
            StatusMessage.show(`Welcome back, ${user.displayName || user.email || 'User'}!`, 2000, true);
          }
          
          // If Firebase is enabled in Database, start syncing
          if (Database.isFirebaseEnabled() && !isOffline) {
            startPeriodicSync();
            performSync('auto-login');
          }
          
          window.removeEventListener('firebase-user-signed-in', authStateListener);
          resolve({ success: true, user: currentUser });
        }
      };
      
      window.addEventListener('firebase-user-signed-in', authStateListener);
    });
  }
  
  // Public API
  return {
    init,
    loadFirebase,
    signInWithGoogle,
    signOut,
    isSignedIn,
    getCurrentUser,
    syncData,
    addNote,
    updateNote,
    deleteNote,
    startPeriodicSync,
    stopPeriodicSync,
    performSync,
    setSyncInterval,
    isSyncInProgress,
    getLastSyncTime,
    getInitializationStatus,
    tryAutoLogin
  };
})();