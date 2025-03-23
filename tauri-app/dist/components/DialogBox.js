/**
 * DialogBox Component
 * Provides custom alert and confirm dialogs with animations
 */
const DialogBox = (() => {
  // DOM elements
  let dialogContainer = null;
  let dialogBox = null;
  let dialogTitle = null;
  let dialogMessage = null;
  let dialogButtonsContainer = null;
  let dialogBackdrop = null;
  
  // State
  let currentResolve = null;
  let isInitialized = false;
  
  /**
   * Initialize the dialog component
   */
  function initialize() {
    if (isInitialized) return;
    
    // Create dialog container
    dialogContainer = document.createElement('div');
    dialogContainer.className = 'dialog-container';
    dialogContainer.style.display = 'none';
    
    // Create backdrop
    dialogBackdrop = document.createElement('div');
    dialogBackdrop.className = 'dialog-backdrop';
    
    // Create dialog box
    dialogBox = document.createElement('div');
    dialogBox.className = 'dialog-box';
    
    // Create title
    dialogTitle = document.createElement('div');
    dialogTitle.className = 'dialog-title';
    
    // Create message
    dialogMessage = document.createElement('div');
    dialogMessage.className = 'dialog-message';
    
    // Create buttons container
    dialogButtonsContainer = document.createElement('div');
    dialogButtonsContainer.className = 'dialog-buttons';
    
    // Assemble dialog
    dialogBox.appendChild(dialogTitle);
    dialogBox.appendChild(dialogMessage);
    dialogBox.appendChild(dialogButtonsContainer);
    dialogContainer.appendChild(dialogBackdrop);
    dialogContainer.appendChild(dialogBox);
    
    // Add to body
    document.body.appendChild(dialogContainer);
    
    // Set initialized flag
    isInitialized = true;
  }
  
  /**
   * Show an alert dialog
   * @param {string} message - Message to display
   * @param {string} title - Optional title
   * @returns {Promise} Resolves when dialog is closed
   */
  function alert(message, title = 'Alert') {
    return new Promise((resolve) => {
      _showDialog(title, message, [
        {
          text: 'OK',
          primary: true,
          onClick: () => {
            _hideDialog();
            resolve(true);
          }
        }
      ]);
    });
  }
  
  /**
   * Show a confirm dialog
   * @param {string} message - Message to display
   * @param {string} title - Optional title
   * @returns {Promise<boolean>} Resolves with true if confirmed, false if canceled
   */
  function confirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
      currentResolve = resolve;
      
      _showDialog(title, message, [
        {
          text: 'Cancel',
          primary: false,
          onClick: () => {
            _hideDialog();
            resolve(false);
          }
        },
        {
          text: 'OK',
          primary: true,
          onClick: () => {
            _hideDialog();
            resolve(true);
          }
        }
      ]);
    });
  }
  
  /**
   * Show a dialog with custom buttons
   * @param {string} message - Message to display
   * @param {string} title - Title
   * @param {Array} buttons - Array of button objects {text, primary, onClick}
   * @returns {Promise} Resolves with the value returned by the button onClick
   */
  function custom(message, title, buttons) {
    return new Promise((resolve) => {
      _showDialog(title, message, buttons.map(btn => ({
        ...btn,
        onClick: () => {
          _hideDialog();
          resolve(btn.value !== undefined ? btn.value : true);
        }
      })));
    });
  }
  
  /**
   * Internal function to show dialog
   * @param {string} title - Title
   * @param {string} message - Message
   * @param {Array} buttons - Button definitions
   * @private
   */
  function _showDialog(title, message, buttons) {
    if (!isInitialized) {
      initialize();
    }
    
    // Set content
    dialogTitle.textContent = title;
    dialogMessage.textContent = message;
    
    // Clear existing buttons
    dialogButtonsContainer.innerHTML = '';
    
    // Add buttons
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.className = `dialog-button ${btn.primary ? 'primary' : 'secondary'}`;
      button.addEventListener('click', btn.onClick);
      dialogButtonsContainer.appendChild(button);
    });
    
    // Show dialog with animation
    dialogContainer.style.display = 'flex';
    
    // Trigger animation
    setTimeout(() => {
      dialogBackdrop.classList.add('visible');
      dialogBox.classList.add('visible');
    }, 10);
    
    // Add keyboard handlers
    document.addEventListener('keydown', _handleKeyDown);
  }
  
  /**
   * Internal function to hide dialog
   * @private
   */
  function _hideDialog() {
    // Remove animations
    dialogBackdrop.classList.remove('visible');
    dialogBox.classList.remove('visible');
    
    // Hide after animation completes
    setTimeout(() => {
      dialogContainer.style.display = 'none';
    }, 300);
    
    // Remove keyboard handlers
    document.removeEventListener('keydown', _handleKeyDown);
  }
  
  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   * @private
   */
  function _handleKeyDown(e) {
    if (e.key === 'Escape') {
      if (currentResolve) {
        _hideDialog();
        currentResolve(false);
        currentResolve = null;
      }
    } else if (e.key === 'Enter') {
      const primaryButton = dialogButtonsContainer.querySelector('.dialog-button.primary');
      if (primaryButton) {
        primaryButton.click();
      }
    }
  }
  
  // Override global alert and confirm
  if (typeof window !== 'undefined') {
    window._originalAlert = window.alert;
    window._originalConfirm = window.confirm;
    
    window.alert = function(message) {
      return DialogBox.alert(message);
    };
    
    window.confirm = function(message) {
      return DialogBox.confirm(message);
    };
  }
  
  // Public API
  return {
    initialize,
    alert,
    confirm,
    custom
  };
})();