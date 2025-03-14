/**
 * Autocomplete Component
 * Handles text editor autocompletion for hashtags and time markers
 */
const Autocomplete = (() => {
  // DOM element reference
  let container = null;

  // State
  let isVisible = false;
  let items = [];
  let selectedIndex = -1;
  let autocompleteType = null; // 'hashtag' or 'marker'
  let startPosition = -1;
  let editorElement = null;
  let noteEditor = null;

  /**
   * Initialize the component
   * @param {HTMLElement} editor - Text editor element
   */
  function initialize(editor) {
    // Create the container if it doesn't exist
    if (!container) {
      container = document.createElement("div");
      container.className = "autocomplete-container";
      container.style.display = "none";
      document.body.appendChild(container);
    }

    editorElement = editor;
    noteEditor = editor;

    // Attach event listeners to the editor
    attachEventListeners();
  }

  /**
   * Attach event listeners to the editor element
   */
  function attachEventListeners() {
    if (!noteEditor) return;

    // Add keydown handler to manage autocomplete navigation
    noteEditor.addEventListener("keydown", (e) => {
      if (!isVisible) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          moveSelection(1);
          break;

        case "ArrowUp":
          e.preventDefault();
          moveSelection(-1);
          break;

        case "Tab":
        case "Enter":
          if (e.ctrlKey) {
            e.preventDefault();
            if (
              typeof EditorView !== "undefined" &&
              EditorView.saveCurrentNote
            ) {
              EditorView.saveCurrentNote(true);
            }
            hide();
          } else if (selectedIndex >= 0) {
            e.preventDefault();
            selectItem(selectedIndex);
          } else if (items.length > 0) {
            e.preventDefault();
            selectItem(0);
          }
          break;

        case "Escape":
          e.preventDefault();
          hide();
          break;
      }
    });

    // Hide autocomplete when editor loses focus
    noteEditor.addEventListener("blur", (e) => {
      // Small delay to allow click events on autocomplete items
      setTimeout(() => {
        if (container && !container.contains(document.activeElement)) {
          hide();
        }
      }, 100);
    });

    // Handle cursor movement to check if autocomplete should be shown or hidden
    noteEditor.addEventListener("click", () => {
      checkForAutocomplete(
        noteEditor.value,
        noteEditor.selectionStart,
        Database.getAllHashtags
      );
    });

    noteEditor.addEventListener("keyup", (e) => {
      // Only check on keys that don't require special handling
      if (!["ArrowDown", "ArrowUp", "Tab", "Enter", "Escape"].includes(e.key)) {
        checkForAutocomplete(
          noteEditor.value,
          noteEditor.selectionStart,
          Database.getAllHashtags
        );
      }
    });

    // Hide autocomplete when scrolling the editor
    noteEditor.addEventListener("scroll", () => {
      if (isVisible) {
        hide();
      }
    });
  }

  /**
   * Show the autocomplete dropdown
   * @param {string} type - Type of autocomplete ('hashtag' or 'marker')
   * @param {Array} suggestions - Items to show in the dropdown
   * @param {number} position - Cursor position in the text
   */
  function show(type, suggestions, position) {
    // Save autocomplete state
    autocompleteType = type;
    items = suggestions;
    selectedIndex = -1;
    isVisible = true;

    // Position the container
    if (editorElement) {
      const editorRect = editorElement.getBoundingClientRect();
      const lineHeight = parseInt(
        window.getComputedStyle(editorElement).lineHeight
      );
      const cursorCoords = getCaretCoordinates(editorElement, position);

      container.style.left = `${editorRect.left + cursorCoords.left - 5}px`;
      container.style.top = `${
        editorRect.top + cursorCoords.top + lineHeight - 5
      }px`;
    }

    // Populate and show the container
    renderItems();
    container.style.display = "block";
  }

  /**
   * Hide the autocomplete dropdown
   */
  function hide() {
    container.style.display = "none";
    isVisible = false;
    autocompleteType = null;
    selectedIndex = -1;
    startPosition = -1;
  }

  /**
   * Render the dropdown items
   */
  function renderItems() {
    container.innerHTML = "";

    // Add info text based on type
    const infoText = document.createElement("div");
    infoText.className = "autocomplete-info";
    infoText.textContent =
      autocompleteType === "hashtag"
        ? "Select a hashtag or type a new one"
        : "Select a time marker";
    container.appendChild(infoText);

    // Add all items
    items.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.className = "autocomplete-item";

      if (autocompleteType === "hashtag") {
        itemElement.textContent = item;
      } else {
        // For time markers, show label and description
        itemElement.innerHTML = `<strong>${item.label}</strong> - ${item.description}`;
      }

      if (index === selectedIndex) {
        itemElement.classList.add("selected");
      }

      itemElement.addEventListener("click", () => {
        selectItem(index);
      });

      container.appendChild(itemElement);
    });

    // If no items, show message
    if (items.length === 0) {
      const emptyElement = document.createElement("div");
      emptyElement.className = "autocomplete-item";
      emptyElement.textContent =
        autocompleteType === "hashtag"
          ? "No matching hashtags. Type to create new."
          : "No matching time markers.";
      container.appendChild(emptyElement);
    }
  }

  /**
   * Select an item from the dropdown
   * @param {number} index - Index of the item to select
   */
  function selectItem(index) {
    if (index < 0 || index >= items.length || !noteEditor) return;

    // Get the selected value based on type
    const value =
      autocompleteType === "hashtag" ? items[index] : items[index].value;

    // Find the end of the current word to replace the entire word
    const text = noteEditor.value;
    let wordEndPos = startPosition;

    // Find where the current word ends (next whitespace or end of text)
    while (wordEndPos < text.length && !/\s/.test(text[wordEndPos])) {
      wordEndPos++;
    }

    // Get text before and after the complete word
    const textBeforeCursor = text.substring(0, startPosition);
    const textAfterWord = text.substring(wordEndPos);

    if (autocompleteType === "hashtag") {
      // For hashtags, we need to keep the # prefix
      noteEditor.value =
        textBeforeCursor + "#" + value.substring(1) + textAfterWord;
      // Position cursor after the hashtag
      noteEditor.selectionStart = noteEditor.selectionEnd =
        startPosition + value.length;
    } else {
      // For time markers, replace the entire marker
      noteEditor.value = textBeforeCursor + value + textAfterWord;
      // Position cursor after the time marker
      noteEditor.selectionStart = noteEditor.selectionEnd =
        startPosition + value.length;
    }

    hide();

    // Update UI and focus
    if (typeof EditorView !== "undefined") {
      if (EditorView.updateHashtagsDisplay) {
        EditorView.updateHashtagsDisplay();
      }

      if (EditorView.markNoteAsUnsaved) {
        EditorView.markNoteAsUnsaved();
      }
    }

    noteEditor.focus();
  }

  /**
   * Move the selection up or down
   * @param {number} direction - Direction to move (1 for down, -1 for up)
   */
  function moveSelection(direction) {
    // No items to select
    if (items.length === 0) return;

    // Calculate new index
    selectedIndex = (selectedIndex + direction) % items.length;
    if (selectedIndex < 0) selectedIndex = items.length - 1;

    // Render with new selection
    renderItems();

    // Scroll selected item into view
    const selectedItem = container.querySelector(".autocomplete-item.selected");
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  }

  /**
   * Check if the autocomplete should be shown based on the text and cursor position
   * @param {string} text - Text content
   * @param {number} cursorPosition - Current cursor position
   * @param {function} getAllHashtags - Function to get all available hashtags
   */
  function checkForAutocomplete(text, cursorPosition, getAllHashtags) {
    let currentWord = "";
    let currentWordAtCursor = "";

    // Get the current word being typed
    [currentWord, currentWordAtCursor] = getCurrentWord(text, cursorPosition);

    if (!currentWord) {
      hide();
      return;
    }

    // If we're already showing autocomplete, check if we should hide it
    if (isVisible) {
      if (autocompleteType === "hashtag" && !currentWord.startsWith("#")) {
        hide();
        return;
      }
      if (autocompleteType === "marker" && !currentWord.startsWith("!")) {
        hide();
        return;
      }
    }

    // Check for hashtag autocompletion
    if (currentWord.startsWith("#")) {
      const query = currentWord.substring(1).toLowerCase(); // Remove # prefix
      startPosition = cursorPosition - currentWordAtCursor.length;

      // Get all hashtags that match the query
      const matchingTags = getAllHashtags()
        .filter((tag) => tag.toLowerCase().includes(query))
        .sort((a, b) => {
          // Sort exact matches first, then by alphabetical order
          const aExact = a.toLowerCase() === "#" + query;
          const bExact = b.toLowerCase() === "#" + query;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return a.localeCompare(b);
        });

      // Hide autocomplete if there's only one exact match
      if (
        matchingTags.length === 1 &&
        matchingTags[0].substring(1).toLowerCase() === query
      ) {
        hide();
        return;
      }

      // Show autocomplete with matching hashtags
      show("hashtag", matchingTags, cursorPosition);
      return;
    }

    // Check for time marker autocompletion
    if (currentWord.startsWith("!") && currentWord.length > 1) {
      const query = currentWord.substring(1).toLowerCase(); // Remove ! prefix
      startPosition = cursorPosition - currentWordAtCursor.length;

      // Filter time markers that match the query
      const matchingMarkers = Constants.TIME_MARKER_OPTIONS.filter(
        (marker) =>
          marker.value.substring(1).toLowerCase().includes(query) ||
          marker.label.toLowerCase().includes(query)
      );

      // Hide autocomplete if there's no match or only one exact match
      if (
        matchingMarkers.length === 0 ||
        (matchingMarkers.length === 1 &&
          matchingMarkers[0].value.substring(1).toLowerCase() === query)
      ) {
        hide();
        return;
      }

      show("marker", matchingMarkers, cursorPosition);
      return;
    }

    // If no conditions met, hide autocomplete
    hide();
  }

  /**
   * Get the word currently being typed
   * @param {string} value - Text content
   * @param {number} position - Cursor position
   * @returns {Array} [fullWord, wordUpToCursor]
   */
  function getCurrentWord(value, position) {
    if (position <= 0) return ["", ""];

    // Find the start of the current word
    let start = position - 1;
    while (start >= 0 && !/\s/.test(value[start])) {
      start--;
    }
    start++; // Move past the whitespace

    let end = position;
    while (end < value.length && !/\s/.test(value[end])) {
      end++;
    }

    // Extract and return the word
    return [value.substring(start, end), value.substring(start, position)];
  }

  /**
   * Helper function to get caret (cursor) coordinates
   * @param {HTMLElement} element - Text input element
   * @param {number} position - Cursor position
   * @param {Object} options - Additional options
   * @returns {Object} Coordinates {top, left, height}
   */
  function getCaretCoordinates(element, position, options = {}) {
    const debug = options.debug || false;

    // Handle debug marker
    if (!globalThis.debugMarker && debug) {
      globalThis.debugMarker = document.createElement("div");
      globalThis.debugMarker.style.position = "absolute";
      globalThis.debugMarker.style.backgroundColor = "red";
      globalThis.debugMarker.style.width = "2px";
      globalThis.debugMarker.style.height = "5px";
      document.body.appendChild(globalThis.debugMarker);
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
    if (debug && globalThis.debugMarker) {
      const editorRect = element.getBoundingClientRect();
      globalThis.debugMarker.style.top = `${
        editorRect.top + coordinates.top
      }px`;
      globalThis.debugMarker.style.left = `${
        editorRect.left + coordinates.left
      }px`;
      globalThis.debugMarker.style.height = `${coordinates.height}px`;
    } else {
      // Clean up - remove the div
      document.body.removeChild(div);
    }

    return coordinates;
  }

  /**
   * Check if autocomplete is currently visible
   * @returns {boolean} Visibility state
   */
  function isAutocompleteVisible() {
    return isVisible;
  }

  // Public API
  return {
    initialize,
    show,
    hide,
    checkForAutocomplete,
    isAutocompleteVisible,
    getCurrentWord,
    getCaretCoordinates,
  };
})();
