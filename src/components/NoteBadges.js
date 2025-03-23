/**
 * NoteBadges Component
 * Displays badges for note metadata like due date and importance
 */
const NoteBadges = (() => {
  // DOM elements
  let badgesContainer = null;
  
  /**
   * Initialize the badges container
   */
  function initialize() {
    badgesContainer = document.getElementById('note-badges');
    if (!badgesContainer) {
      console.error('NoteBadges: Badges container not found');
      return false;
    }
    return true;
  }
  
  /**
   * Update badges based on note data
   * @param {Object} noteData - Object with dueDate and important properties
   */
  function updateBadges(noteData) {
    if (!badgesContainer) return;
    
    // Clear existing badges
    badgesContainer.innerHTML = '';
    
    // Add importance badge if needed
    if (noteData.important) {
      const importanceBadge = document.createElement('div');
      importanceBadge.className = 'importance-badge';
      importanceBadge.textContent = '⭐ Important';
      badgesContainer.appendChild(importanceBadge);
    }
    
    // Add due date badge if needed
    if (noteData.dueDate) {
      const dueDateBadge = document.createElement('div');
      dueDateBadge.className = `due-date-badge ${NoteUtils.getDueDateClass(noteData.dueDate)}`;
      
      // Create the badge text
      const dueDateText = document.createElement('span');
      dueDateText.textContent = NoteUtils.formatDueDate(noteData.dueDate);
      dueDateBadge.appendChild(dueDateText);
      
      // Add clear button (x)
      const clearButton = document.createElement('span');
      clearButton.className = 'badge-close-button';
      clearButton.textContent = '×';
      clearButton.setAttribute('title', 'Remove due date');
      clearButton.addEventListener('click', function(e) {
        e.stopPropagation();
        // Call date picker's clearDueDate function
        if (typeof DatePicker !== 'undefined' && DatePicker.clearDueDate) {
          DatePicker.clearDueDate();
        }
      });
      
      dueDateBadge.appendChild(clearButton);
      badgesContainer.appendChild(dueDateBadge);
    }
  }
  
  // Public API
  return {
    initialize,
    updateBadges
  };
})();
