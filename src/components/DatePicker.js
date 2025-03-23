/**
 * DatePicker Component
 * Handles due date selection UI and functionality
 */
const DatePicker = (() => {
  // DOM elements
  let inlineCalendarContainer = null;
  let calendarElement = null;
  let selectButton = null;
  
  // State
  let cursorCoordinates = null;
  let dateChangeCallback = null;
  let currentEditorElement = null;
  let currentEditorValue = "";
  let currentEditorPosition = 0;
  let isCalendarVisible = false;
  
  /**
   * Initialize the date picker
   * @param {function} onDateChange - Callback when date changes
   */
  function initialize(onDateChange) {
    // Store callbacks
    dateChangeCallback = onDateChange;
    
    // Create inline calendar container if it doesn't exist
    if (!inlineCalendarContainer) {
      createInlineCalendar();
    }
  }
  
  /**
   * Create the inline calendar element
   */
  function createInlineCalendar() {
    // Create container for inline calendar
    inlineCalendarContainer = document.createElement('div');
    inlineCalendarContainer.className = 'inline-calendar-container';
    inlineCalendarContainer.style.display = 'none';
    inlineCalendarContainer.style.position = 'absolute';
    inlineCalendarContainer.style.zIndex = '1000';
    
    // Create calendar element
    calendarElement = document.createElement('input');
    calendarElement.type = 'date';
    calendarElement.className = 'inline-calendar';
    
    // Set today's date as default
    const today = new Date();
    calendarElement.value = today.toISOString().split('T')[0];
    
    // Create select button
    selectButton = document.createElement('button');
    selectButton.textContent = 'Select';
    selectButton.className = 'calendar-select-button';
    selectButton.addEventListener('click', handleCalendarDateChange);
    
    // Add event listeners
    calendarElement.addEventListener('change', function(e) {
      // Don't process date change immediately to keep the focus in the editor
      // Instead let the user click the Select button
      e.stopPropagation();
    });
    
    // Add Enter key support to select date
    calendarElement.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCalendarDateChange();
      }
    });
    
    // Handle click on the calendar without taking focus
    calendarElement.addEventListener('mousedown', function(e) {
      // Prevent the default focus behavior
      e.preventDefault();
      this.focus();
    });
    
    // Replace mouseleave with a more reliable click outside handler
    document.addEventListener('click', function(e) {
      if (isCalendarVisible && 
          !inlineCalendarContainer.contains(e.target) && 
          e.target !== currentEditorElement) {
        hideCalendar();
      }
    });
    
    // Append elements to container
    inlineCalendarContainer.appendChild(calendarElement);
    inlineCalendarContainer.appendChild(selectButton);
    document.body.appendChild(inlineCalendarContainer);
  }
  
  /**
   * Show the inline calendar at cursor position
   * @param {HTMLElement} editorElement - The textarea element
   * @param {number} cursorPosition - Current cursor position
   */
  function showCalendarAtCursor(editorElement, cursorPosition) {
    if (!inlineCalendarContainer || !calendarElement) {
      createInlineCalendar();
    }
    
    // Store reference to editor and position
    currentEditorElement = editorElement;
    currentEditorValue = editorElement.value;
    currentEditorPosition = cursorPosition;
    
    // Get cursor coordinates
    cursorCoordinates = NoteUtils.getCaretCoordinates(editorElement, cursorPosition);
    
    // Position the calendar at cursor
    const editorRect = editorElement.getBoundingClientRect();
    inlineCalendarContainer.style.top = `${editorRect.top + cursorCoordinates.top + cursorCoordinates.height + window.scrollY}px`;
    inlineCalendarContainer.style.left = `${editorRect.left + cursorCoordinates.left + window.scrollX}px`;
    
    // Show the calendar
    inlineCalendarContainer.style.display = 'block';
    isCalendarVisible = true;
    
    // Don't focus the calendar, keep focus in editor
    // This allows the user to continue typing
  }
  
  /**
   * Hide the inline calendar
   */
  function hideCalendar() {
    if (inlineCalendarContainer) {
      inlineCalendarContainer.style.display = 'none';
      isCalendarVisible = false;
    }
  }
  
  /**
   * Handle date change from calendar
   */
  function handleCalendarDateChange() {
    if (!calendarElement || !currentEditorElement || !dateChangeCallback) return;
    
    const selectedDate = new Date(calendarElement.value);
    
    if (isNaN(selectedDate.getTime())) {
      hideCalendar();
      return;
    }
    
    // Format date as MM/DD/YYYY
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const year = selectedDate.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;
    
    // Get current content of the editor
    const currentText = currentEditorElement.value;
    
    // Find and remove existing markers
    // This will handle both !due: and due: formats along with any stray exclamation points
    let updatedText = currentText;
    
    // First look for a due marker specifically
    const beforeCursor = currentEditorValue.substring(0, currentEditorPosition);
    const afterCursor = currentEditorValue.substring(currentEditorPosition);
    
    // Find the position of "due:" or "!due:" before cursor
    let dueMarkerPos = beforeCursor.lastIndexOf('due:');
    if (dueMarkerPos < 0) {
      dueMarkerPos = beforeCursor.lastIndexOf('!due:');
    }
    
    if (dueMarkerPos >= 0) {
      // Check if there's an exclamation point right before
      const hasExclamation = dueMarkerPos > 0 && beforeCursor[dueMarkerPos - 1] === '!';
      const actualMarkerPos = hasExclamation ? dueMarkerPos - 1 : dueMarkerPos;
      
      // Remove the marker entirely
      updatedText = beforeCursor.substring(0, actualMarkerPos) + afterCursor;
    }
    
    // Also remove any other time markers that might exist
    updatedText = updatedText.replace(/\s*!(?:today|tomorrow|nextweek|nextmonth|important|noDueDate|due\:)\s*/g, " ")
                             .replace(/\s*due\:\s*/g, " ")
                             .replace(/\s+/g, " ")
                             .trim();
    
    // Update the editor text
    currentEditorElement.value = updatedText;
    
    // Call the callback with the date
    if (dateChangeCallback) {
      dateChangeCallback(selectedDate.toISOString());
    }
    
    // Hide the calendar
    hideCalendar();
    
    // Make sure editor has focus
    currentEditorElement.focus();
  }
  
  /**
   * Clear the due date
   */
  function clearDueDate() {
    if (!dateChangeCallback) return;
    
    // Call callback with null to clear the date
    dateChangeCallback(null);
    
    // Hide the calendar if it's visible
    hideCalendar();
  }
  
  /**
   * Set the date input value from ISO string
   * @param {string} isoDateString - ISO date string or null
   */
  function setDateValue(isoDateString) {
    if (calendarElement && isoDateString) {
      const dueDate = new Date(isoDateString);
      const formattedDate = dueDate.toISOString().split("T")[0];
      calendarElement.value = formattedDate;
    }
  }
  
  /**
   * Check if calendar is currently visible
   * @returns {boolean} True if calendar is visible
   */
  function isVisible() {
    return isCalendarVisible;
  }
  
  // Public API
  return {
    initialize,
    showCalendarAtCursor,
    hideCalendar,
    setDateValue,
    clearDueDate,
    isVisible
  };
})();
