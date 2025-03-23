/**
 * NoteUtils Module
 * Utility functions for note manipulation and formatting
 */
const NoteUtils = (() => {
  /**
   * Extract hashtags from text
   * @param {string} text - Text to extract hashtags from
   * @returns {string[]} Array of hashtags
   */
  function extractHashtags(text) {
    if (!text) return [];
    
    const hashtags = [];
    const regex = /#(\w+)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      hashtags.push(match[1]);
    }
    
    return hashtags;
  }

  /**
   * Extract time markers from text
   * @param {string} text - Text to extract time markers from
   * @returns {Object} Object with dueDate, important properties, and updatedText
   */
  function extractTimeMarkers(text) {
    if (!text) {
      return {
        dueDate: null,
        important: false,
        updatedText: text
      };
    }

    const result = {
      dueDate: null,
      important: false,
      updatedText: text
    };

    // Check for importance marker
    if (text.includes(Constants.TIME_MARKERS.IMPORTANT)) {
      result.important = true;
      result.updatedText = result.updatedText.replace(Constants.TIME_MARKERS.IMPORTANT, '').trim();
    }

    // Check for no due date marker first
    if (text.includes(Constants.TIME_MARKERS.NO_DUE_DATE)) {
      // Clear the due date
      result.dueDate = null;
      result.updatedText = result.updatedText.replace(Constants.TIME_MARKERS.NO_DUE_DATE, '').trim();
      return result; // No need to process other date markers
    }

    // Look for the date markers in order of priority
    let dateMarkerFound = false;
    
    // Process custom due date first (due:DD/MM/YYYY or due:MM/DD/YYYY)
    // Support both due: and !due: formats with international date formats
    const dueRegex = /(?:!?due:)(\d{1,2}\/\d{1,2}\/\d{4})/g;
    const dueMatch = dueRegex.exec(text);
    
    if (dueMatch) {
      const dateParts = dueMatch[1].split('/');
      
      // Create date object with day and month reversed both ways to determine which is valid
      // Assume DD/MM/YYYY format first (international format)
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      
      let customDate = new Date(year, month, day);
      
      // Check if the date is valid - if not, try MM/DD/YYYY format
      if (isNaN(customDate.getTime()) || customDate.getDate() !== day) {
        // Try MM/DD/YYYY format (US format)
        const month = parseInt(dateParts[0], 10) - 1;
        const day = parseInt(dateParts[1], 10);
        customDate = new Date(year, month, day);
      }
      
      // If date is valid, use it
      if (!isNaN(customDate.getTime())) {
        result.dueDate = customDate.toISOString();
        result.updatedText = result.updatedText.replace(dueMatch[0], '').trim();
        dateMarkerFound = true;
        
        // Manually hide the calendar if it's visible
        if (typeof DatePicker !== 'undefined' && DatePicker.isVisible && DatePicker.isVisible()) {
          DatePicker.hideCalendar();
        }
      }
    }
    
    // Look for just due: or !due: without a date (for calendar trigger)
    if (!dateMarkerFound) {
      // If we find a bare !due: or due: without date, don't modify the text yet
      // The calendar will handle it when a date is selected
      const bareRegex = /(?:!?due:)(?!\d)/;
      if (bareRegex.test(text)) {
        return result;
      }
    }
    
    // Only process other markers if no due: was found
    if (!dateMarkerFound) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const timeMarkers = [
        {
          marker: Constants.TIME_MARKERS.TODAY,
          date: today.toISOString()
        },
        {
          marker: Constants.TIME_MARKERS.TOMORROW,
          date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
          marker: Constants.TIME_MARKERS.NEXT_WEEK,
          date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          marker: Constants.TIME_MARKERS.NEXT_MONTH,
          date: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString()
        }
      ];
      
      for (const { marker, date } of timeMarkers) {
        if (text.includes(marker)) {
          result.dueDate = date;
          result.updatedText = result.updatedText.replace(marker, '').trim();
          break;
        }
      }
    }

    return result;
  }

  /**
   * Format due date for display
   * @param {string} dateStr - ISO date string
   * @returns {string|null} Formatted date string or null if no date
   */
  function formatDueDate(dateStr) {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeekDate = new Date(today);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);

    // Compare date equality by comparing year, month, day
    const isSameDate = (d1, d2) => {
      return d1.getFullYear() === d2.getFullYear() && 
             d1.getMonth() === d2.getMonth() && 
             d1.getDate() === d2.getDate();
    };

    if (date < today) {
      return `Overdue: ${date.toLocaleDateString()}`;
    } else if (isSameDate(date, today)) {
      return "Due Today";
    } else if (isSameDate(date, tomorrow)) {
      return "Due Tomorrow";
    } else {
      const daysUntilDue = Math.floor((date - today) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 7) {
        if (isSameDate(date, nextWeekDate)) {
          return "Due Next Week";
        }
        return `Due in ${daysUntilDue} days`;
      } else {
        return `Due: ${date.toLocaleDateString()}`;
      }
    }
  }

  /**
   * Format due date in short form
   * @param {string} dateStr - ISO date string
   * @returns {string} Short formatted date
   */
  function formatShortDueDate(dateStr) {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Compare date equality by comparing year, month, day
    const isSameDate = (d1, d2) => {
      return d1.getFullYear() === d2.getFullYear() && 
             d1.getMonth() === d2.getMonth() && 
             d1.getDate() === d2.getDate();
    };

    if (date < today) {
      return "Overdue!";
    } else if (isSameDate(date, today)) {
      return "Today";
    } else if (isSameDate(date, tomorrow)) {
      return "Tomorrow";
    } else {
      // Return short format like "Oct 15"
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
  }

  /**
   * Get CSS class for due date
   * @param {string} dateStr - ISO date string
   * @returns {string} CSS class name
   */
  function getDueDateClass(dateStr) {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Compare date equality by comparing year, month, day
    const isSameDate = (d1, d2) => {
      return d1.getFullYear() === d2.getFullYear() && 
             d1.getMonth() === d2.getMonth() && 
             d1.getDate() === d2.getDate();
    };

    if (date < today) {
      return "due-today"; // Use the same urgent styling
    } else if (isSameDate(date, today)) {
      return "due-today";
    } else if (isSameDate(date, tomorrow)) {
      return "due-tomorrow";
    } else if (Math.floor((date - today) / (1000 * 60 * 60 * 24)) <= 7) {
      return "due-week";
    } else {
      return "due-later";
    }
  }

  /**
   * Get text color for due date
   * @param {string} dateStr - ISO date string
   * @returns {string} Color code
   */
  function getDueDateTextColor(dateStr) {
    if (!dateStr) return "#333";

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysUntilDue = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return "#f44336"; // Red for overdue
    } else if (daysUntilDue === 0) {
      return "#ff9800"; // Orange for today
    } else if (daysUntilDue === 1) {
      return "#ffc107"; // Amber for tomorrow
    } else {
      return "#4caf50"; // Green for future dates
    }
  }

  /**
   * Helper function to get coordinates of cursor position within a text area
   * @param {HTMLElement} element - Text input element
   * @param {number} position - Cursor position
   * @param {Object} options - Additional options
   * @returns {Object} Coordinates {top, left, height}
   */
  function getCaretCoordinates(element, position, options = {}) {
    const debug = options.debug || false;

    // Handle debug marker
    if (!window.debugMarker && debug) {
      window.debugMarker = document.createElement("div");
      window.debugMarker.style.position = "absolute";
      window.debugMarker.style.backgroundColor = "red";
      window.debugMarker.style.width = "2px";
      window.debugMarker.style.height = "5px";
      document.body.appendChild(window.debugMarker);
    }

    // We'll copy the properties below into the mirror div.
    // Note that some browsers, such as Firefox, do not concatenate properties
    // into their shorthand (e.g. padding-top, padding-bottom etc. -> padding),
    // so we have to list every single property explicitly.
    const properties = [
      "direction", // RTL support
      "boxSizing",
      "width", // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
      "height",
      "overflowX",
      "overflowY", // copy the scrollbar for IE

      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
      "borderStyle",

      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",

      "fontStyle",
      "fontVariant",
      "fontWeight",
      "fontStretch",
      "fontSize",
      "fontSizeAdjust",
      "lineHeight",
      "fontFamily",

      "textAlign",
      "textTransform",
      "textIndent",
      "textDecoration",

      "letterSpacing",
      "wordSpacing",

      "tabSize",
      "MozTabSize",
    ];

    const isFirefox =
      typeof window !== "undefined" && window.mozInnerScreenX != null;
    const isInput = element.nodeName === "INPUT";

    // Create a mirror div to replicate the textarea's style
    const div = document.createElement("div");
    div.id = "input-textarea-caret-position-mirror-div";

    // Set basic styles
    const style = div.style;
    const computed = window.getComputedStyle
      ? window.getComputedStyle(element)
      : element.currentStyle;

    // Default textarea styles
    style.whiteSpace = "pre-wrap";
    if (!isInput) {
      style.wordWrap = "break-word"; // only for textarea-s
    }

    // Position off-screen
    style.position = "absolute";
    if (!debug) {
      style.visibility = "hidden";
    }

    // Transfer the element's properties to the div
    properties.forEach((prop) => {
      if (isInput && prop === "lineHeight") {
        // Special case for <input>s because text is rendered centered and line height may be != height
        if (computed.boxSizing === "border-box") {
          const height = parseInt(computed.height);
          const outerHeight =
            parseInt(computed.paddingTop) +
            parseInt(computed.paddingBottom) +
            parseInt(computed.borderTopWidth) +
            parseInt(computed.borderBottomWidth);
          const targetHeight = outerHeight + parseInt(computed.lineHeight);
          if (height > targetHeight) {
            style.lineHeight = height - outerHeight + "px";
          } else if (height === targetHeight) {
            style.lineHeight = computed.lineHeight;
          } else {
            style.lineHeight = 0;
          }
        } else {
          style.lineHeight = computed.height;
        }
      } else {
        style[prop] = computed[prop];
      }
    });

    // Firefox-specific handling
    if (isFirefox) {
      // Firefox lies about the overflow property for textareas
      if (element.scrollHeight > parseInt(computed.height)) {
        style.overflowY = "scroll";
      }
    } else {
      style.overflow = "hidden"; // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
    }

    // Add to DOM to start measuring
    document.body.appendChild(div);

    // Set content and create span for cursor position
    div.textContent = element.value.substring(0, position);

    // Special handling for input type="text" vs textarea
    if (isInput) {
      div.textContent = div.textContent.replace(/\s/g, "\u00a0"); // Replace spaces with non-breaking spaces
    }

    const span = document.createElement("span");
    // Add content after cursor position to ensure proper text wrapping
    span.textContent = element.value.substring(position) || ".";
    div.appendChild(span);

    // Calculate coordinates
    const coordinates = {
      top: span.offsetTop + parseInt(computed.borderTopWidth),
      left: span.offsetLeft + parseInt(computed.borderLeftWidth),
      height: parseInt(computed.lineHeight),
    };

    // Update debug marker if needed
    if (debug && window.debugMarker) {
      const editorRect = element.getBoundingClientRect();
      window.debugMarker.style.top = `${editorRect.top + coordinates.top}px`;
      window.debugMarker.style.left = `${editorRect.left + coordinates.left}px`;
      window.debugMarker.style.height = `${coordinates.height}px`;
    } else {
      // Clean up - remove the div
      document.body.removeChild(div);
    }

    return coordinates;
  }

  /**
   * Get the word being typed at the current cursor position
   * @param {string} value - Text content
   * @param {number} position - Cursor position
   * @returns {Array} Array with [fullWord, wordUpToCursor]
   */
  function getCurrentWord(value, position) {
    if (position <= 0) return ["", ""];

    // Find the start of the current word
    let start = position - 1;
    while (start >= 0 && !/\s/.test(value[start])) {
      start--;
    }
    start++; // Move past the whitespace

    // Find the end of the current word
    let end = position;
    while (end < value.length && !/\s/.test(value[end])) {
      end++;
    }

    // Extract and return the word
    return [value.substring(start, end), value.substring(start, position)];
  }

  /**
   * Checks if cursor is at a position where date picker should appear
   * @param {string} value - Text content
   * @param {number} position - Cursor position
   * @returns {boolean} True if cursor is after "due:"
   */
  function isCursorAfterDueMarker(value, position) {
    if (!value || position < 4) return false;
    
    // Look for both "due:" and "!due:" formats at or before the cursor position
    const textBeforeCursor = value.substring(0, position);
    
    // Check for standard due: format
    let dueMarkerPos = textBeforeCursor.lastIndexOf('due:');
    let markerLength = 4; // Length of "due:"
    
    // If not found, check for !due: format
    if (dueMarkerPos < 0) {
      dueMarkerPos = textBeforeCursor.lastIndexOf('!due:');
      markerLength = 5; // Length of "!due:"
    }
    
    // If neither format found, return false
    if (dueMarkerPos < 0) return false;
    
    // Check if the marker is at the cursor position or very close to it
    // This prevents showing the calendar when cursor is far away from the marker
    const cursorDistanceFromMarker = position - (dueMarkerPos + markerLength);
    
    // Only show calendar if cursor is right after the marker or within a few characters
    // This helps with the issue where calendar shows when cursor is far away
    if (cursorDistanceFromMarker > 3) return false;
    
    // Make sure the marker is not part of a longer word
    // Check if there's a space or beginning of text before the marker
    if (dueMarkerPos > 0 && !/\s/.test(value[dueMarkerPos - 1])) {
      // If the character before is not a space and not '!', it's part of another word
      if (value[dueMarkerPos] !== '!' && value[dueMarkerPos - 1] !== '!') {
        return false;
      }
    }
    
    // Check if there's a number right after the marker (already being typed)
    const textAfterMarker = textBeforeCursor.substring(dueMarkerPos + markerLength);
    if (/\d/.test(textAfterMarker)) {
      return false; // Don't show calendar if user is already typing a date
    }
    
    return true;
  }

  // Public API
  return {
    extractHashtags,
    extractTimeMarkers,
    formatDueDate,
    formatShortDueDate,
    getDueDateClass,
    getDueDateTextColor,
    getCaretCoordinates,
    getCurrentWord,
    isCursorAfterDueMarker
  };
})();
