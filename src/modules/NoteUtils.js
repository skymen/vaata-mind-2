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
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map((tag) => tag.trim()) : [];
  }

  /**
   * Extract time markers from text
   * @param {string} text - Text to extract time markers from
   * @returns {Object} Object with dueDate and important properties
   */
  function extractTimeMarkers(text) {
    const result = {
      dueDate: null,
      important: false,
    };

    // Check for importance marker
    if (text.includes(Constants.TIME_MARKERS.IMPORTANT)) {
      result.important = true;
    }

    // Check for date markers
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (text.includes(Constants.TIME_MARKERS.TODAY)) {
      result.dueDate = today.toISOString();
    } else if (text.includes(Constants.TIME_MARKERS.TOMORROW)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      result.dueDate = tomorrow.toISOString();
    } else if (text.includes(Constants.TIME_MARKERS.NEXT_WEEK)) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      result.dueDate = nextWeek.toISOString();
    } else if (text.includes(Constants.TIME_MARKERS.NEXT_MONTH)) {
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      result.dueDate = nextMonth.toISOString();
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

    const daysUntilDue = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return `Overdue: ${date.toLocaleDateString()}`;
    } else if (date.getTime() === today.getTime()) {
      return "Due Today";
    } else if (date.getTime() === tomorrow.getTime()) {
      return "Due Tomorrow";
    } else {
      return `Due: ${date.toLocaleDateString()}`;
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

    const daysUntilDue = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return "Overdue!";
    } else if (date.getTime() === today.getTime()) {
      return "Today";
    } else if (date.getTime() === tomorrow.getTime()) {
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

    const daysUntilDue = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return "due-today"; // Use the same urgent styling
    } else if (date.getTime() === today.getTime()) {
      return "due-today";
    } else if (date.getTime() === tomorrow.getTime()) {
      return "due-tomorrow";
    } else if (daysUntilDue <= 7) {
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
  };
})();
