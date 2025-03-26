/**
 * SyncBubble Component
 * Displays a bubble in the bottom right corner indicating sync status
 */
const SyncBubble = (() => {
  // DOM elements
  let bubbleElement = null;
  let tooltipElement = null;
  let logoElement = null;
  
  // State
  let syncState = 'idle'; // idle, syncing, success, error
  let lastSyncTime = null;
  let animationTimeout = null;
  
  /**
   * Initialize the component
   */
  function initialize() {
    if (bubbleElement) return; // Already initialized
    
    // Create the bubble container
    bubbleElement = document.createElement('div');
    bubbleElement.className = 'sync-bubble idle';
    
    // Create the logo element (initially hidden)
    logoElement = document.createElement('div');
    logoElement.className = 'sync-bubble-logo';
    logoElement.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 601 609" width="100%" height="100%">
        <path fill="currentColor" d="m456.5 1.3c12.5-3.3 25.3 4.1 28.7 16.5 11 40.2 32.9 123.2 34.3 150.9q0.2 5.9 0.6 11.6c1.3 24.2 2.6 46.9-3.7 70.9 13.8 16 22.8 34 32.4 52.9l0.2 0.4q2.4 4.9 5 9.9c12.7 24.8 35 107.7 45.6 148.1 3.2 12.5-4.2 25.3-16.6 28.8-40.3 11.1-123.3 33.1-151.1 34.5q-5.8 0.3-11.6 0.7c-20.8 1.2-40.6 2.3-61.1-1.5-15.8 13.6-33.6 22.5-52.2 31.9l-4.6 2.3-5.8 2.9c-24.7 12.7-107.7 35.1-148.1 45.6-12.5 3.2-25.3-4.1-28.7-16.6-11.1-40.2-33.1-123.3-34.6-151q-0.3-5.9-0.6-11.7c-1.3-22.6-2.5-43.9 2.5-66.2-15.6-16.8-25.1-35.9-35.3-56.2l-0.2-0.4q-2.5-4.9-5.1-9.9c-12.6-24.8-35-107.7-45.5-148.1-3.3-12.5 4.1-25.3 16.5-28.7 40.3-11.1 123.3-33.1 151.1-34.6l2.1-0.1 6-0.3 3.5-0.2h0.3c21.8-1.3 42.4-2.5 63.9 2 16.3-14.4 34.6-23.7 54-33.4l0.7-0.4q4.8-2.4 9.6-4.9c24.7-12.7 107.5-35.1 147.8-45.7zm-24.8 296.1c-1.7-11.9-5.4-25.3-10.1-36.4-4.6-10.8-11.5-22.5-18.7-31.7-7.1-9-16.6-18.3-25.8-25.1-9-6.7-20.3-13-30.7-17.2-10.2-4-22.4-7-33.3-8.3-10.6-1.1-22.9-0.9-33.4 0.7-10.3 1.6-21.8 4.9-31.3 9.1-9.2 4.1-19.2 10.2-27 16.6-7.6 6.2-15.5 14.4-21.2 22.4-5.6 7.7-10.8 17.5-14.2 26.4-3.3 8.7-5.7 19.2-6.6 28.4-0.8 9-0.4 19.4 1.1 28.2 1.5 8.6 4.5 18.3 8.2 26.2 3.6 7.7 8.8 15.9 14.3 22.4 5.3 6.2 12.3 12.6 19 17.2 6.6 4.5 14.7 8.7 22.2 11.3 7.2 2.5 15.9 4.3 23.5 4.8 7.3 0.5 15.9 0 23.1-1.5 6.9-1.4 14.7-4 21-7.2 6.1-3.1 12.7-7.5 17.7-12.1 4.9-4.4 9.8-10.1 13.3-15.7 3.4-5.3 6.5-11.8 8.3-17.8 1.8-5.8 3-12.6 3.1-18.6 0.2-5.8-0.5-12.4-1.8-18-1.3-5.3-3.6-11.2-6.3-15.9-2.6-4.6-6.2-9.4-9.9-13-3.5-3.5-8-7-12.3-9.4-4-2.3-9.1-4.3-13.6-5.4-2.1-0.5-4.4-0.9-6.7-1.1-2.4-0.3-4.8-0.3-7-0.3-4.1 0.2-8.8 1-12.8 2.3-3.6 1.2-7.6 3.2-10.8 5.4-3 2-6.1 4.8-8.4 7.6-2.1 2.6-4.1 5.9-5.4 8.9-1.2 2.9-2.1 6.3-2.4 9.4-0.3 2.8-0.2 6 0.3 8.8 0.5 2.5 1.5 5.3 2.7 7.6 1.1 2 2.8 4.2 4.4 5.8 1.5 1.4 3.5 2.8 5.4 3.6 1.7 0.8 3.8 1.4 5.6 1.5 1.6 0.1 3.5 0 5.1-0.5 1.3-0.4 2.8-1.2 3.9-2.1 1-0.8 1.9-2 2.4-3.1 0.5-1 0.8-2.3 0.7-3.5-0.1-1-0.5-2.2-1-3.1-0.6-0.9-1-2.1-1.1-3.1 0-1.2 0.3-2.5 0.7-3.5 0.5-1.1 1.5-2.3 2.4-3.1 0.7-0.5 1.4-1 2.2-1.4q0.9-0.4 1.8-0.7c1.5-0.5 3.4-0.6 5-0.5 1.9 0.2 3.9 0.7 5.6 1.5 1.9 0.8 3.9 2.2 5.4 3.6 1.7 1.6 3.3 3.8 4.4 5.8 1.2 2.3 2.2 5.1 2.7 7.6 0.5 2.8 0.7 6 0.4 8.8-0.4 3.1-1.3 6.5-2.5 9.4-1.3 3-3.3 6.3-5.4 8.9-2.3 2.8-5.4 5.6-8.3 7.6-3.2 2.2-7.2 4.2-10.9 5.4-3.9 1.3-8.6 2.1-12.8 2.3-4.3 0.1-9.4-0.4-13.7-1.4-4.5-1.1-9.5-3.1-13.6-5.4-2.1-1.2-4.2-2.6-6.2-4.1-2.2-1.7-4.3-3.5-6.1-5.3-3.7-3.6-7.3-8.4-9.8-13-2.7-4.7-5-10.6-6.3-15.9-1.4-5.6-2.1-12.2-1.9-17.9 0.2-6.1 1.3-12.9 3.1-18.7 1.8-6 4.9-12.5 8.3-17.8 3.5-5.6 8.4-11.3 13.3-15.7 5.1-4.6 11.6-9 17.7-12.1 6.3-3.2 14.1-5.8 21.1-7.2 7.2-1.5 15.7-2 23.1-1.5 7.6 0.5 16.2 2.3 23.4 4.8 7.5 2.6 15.7 6.8 22.2 11.3 6.7 4.6 13.8 11 19 17.2 5.5 6.5 10.8 14.7 14.3 22.4 3.7 7.9 6.7 17.6 8.2 26.2 1.6 8.8 1.9 19.2 1.1 28.2-0.9 9.2-3.3 19.7-6.6 28.4-3.3 8.9-8.6 18.7-14.1 26.4-5.8 8-13.6 16.2-21.2 22.4-7.9 6.4-17.9 12.5-27.1 16.6-9.5 4.2-21 7.5-31.2 9.1-4.7 0.7-9.7 1.2-14.7 1.3l0.1 0.1c74.4 0 152.4-27.7 154.5-122.5q-0.1-2.7-0.3-5.4-0.3-3.4-0.8-6.7z"/>
      </svg>
    `;
    
    // Create tooltip
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'sync-bubble-tooltip';
    tooltipElement.textContent = 'Never synced';
    
    // Add elements to the DOM
    bubbleElement.appendChild(logoElement);
    document.body.appendChild(tooltipElement);
    document.body.appendChild(bubbleElement);
    
    // Add event listeners for hover
    bubbleElement.addEventListener('mouseenter', () => {
      tooltipElement.classList.add('visible');
    });
    
    bubbleElement.addEventListener('mouseleave', () => {
      tooltipElement.classList.remove('visible');
    });
    
    // Add click event to trigger manual sync
    bubbleElement.addEventListener('click', () => {
      if (syncState !== 'syncing' && typeof Firebase !== 'undefined') {
        Firebase.performSync('manual');
      }
    });
    
    updateTooltip();
  }
  
  /**
   * Set the sync state
   * @param {string} state - The sync state ('idle', 'syncing', 'success', 'error')
   * @param {Date} time - The time of the sync event
   */
  function setSyncState(state, time = null) {
    if (time) {
      lastSyncTime = time;
    }
    
    if (!bubbleElement) {
      initialize();
    }
    
    // Clear any pending animations
    if (animationTimeout) {
      clearTimeout(animationTimeout);
      animationTimeout = null;
    }
    
    // Update state
    syncState = state;
    
    // Reset any existing classes and apply the new state class
    bubbleElement.className = 'sync-bubble'; // Clear all classes
    bubbleElement.classList.add(state);      // Add state-specific class
    
    // Handle logo visibility based on state
    if (state === 'syncing') {
      // Show logo for syncing state
      logoElement.classList.add('visible');
      bubbleElement.classList.add('animate-syncing');
    } else {
      // Hide logo for other states
      logoElement.classList.remove('visible');
      
      if (state === 'success') {
        bubbleElement.classList.add('animate-success');
        
        // Return to idle after animation completes
        animationTimeout = setTimeout(() => {
          bubbleElement.className = 'sync-bubble idle';
          syncState = 'idle';
          updateTooltip();
        }, 1000);
      } else if (state === 'error') {
        bubbleElement.classList.add('animate-error');
        
        // Return to idle after animation completes
        animationTimeout = setTimeout(() => {
          bubbleElement.className = 'sync-bubble idle';
          syncState = 'idle';
          updateTooltip();
        }, 3000);
      }
    }
    
    updateTooltip();
  }
  
  /**
   * Update the tooltip text based on current state
   */
  function updateTooltip() {
    if (!tooltipElement) return;
    
    switch (syncState) {
      case 'idle':
        if (lastSyncTime) {
          tooltipElement.textContent = `Last synced: ${getTimeAgo(lastSyncTime)}`;
        } else {
          tooltipElement.textContent = 'Never synced';
        }
        break;
      case 'syncing':
        tooltipElement.textContent = 'Syncing in progress...';
        break;
      case 'success':
        tooltipElement.textContent = 'Sync successful!';
        break;
      case 'error':
        tooltipElement.textContent = 'Sync failed! Click to retry.';
        break;
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
  
  // Public API
  return {
    initialize,
    setSyncState
  };
})();