/**
 * EditorView Module
 * Handles the note editor interface and functionality
 */
window.EditorView = (() => {
  // DOM elements
  let viewElement = null;
  let noteEditor = null;
  let hashtagsDisplay = null;
  let backButton = null;
  let deleteNoteBtn = null;
  let noteStatus = null;

  // State
  let currentNoteId = null;
  let lastSavedNoteContent = "";
  let lastNoteWasSaved = true;

  /**
   * Initialize the editor view
   */
  function initialize() {
    console.log("EditorView: Initializing...");

    // Cache DOM elements
    viewElement = document.getElementById(Constants.VIEWS.EDITOR);

    if (!viewElement) {
      console.error(
        'EditorView: View element not found. Make sure the HTML contains a div with id "editor-view"'
      );
      return false;
    }

    // Create view HTML structure if empty
    if (viewElement.children.length === 0) {
      createViewStructure();
    }

    // Cache elements that should now exist
    noteEditor = document.getElementById("note-editor");
    hashtagsDisplay = document.getElementById("hashtags-display");
    backButton = document.getElementById("editor-back");
    deleteNoteBtn = document.getElementById("delete-note");
    noteStatus = document.getElementById("note-status");

    // Check if elements were found
    if (
      !noteEditor ||
      !hashtagsDisplay ||
      !backButton ||
      !deleteNoteBtn ||
      !noteStatus
    ) {
      console.error(
        "EditorView: Required elements not found after structure creation"
      );
      console.log("EditorView: noteEditor =", noteEditor);
      console.log("EditorView: hashtagsDisplay =", hashtagsDisplay);
      console.log("EditorView: backButton =", backButton);
      console.log("EditorView: deleteNoteBtn =", deleteNoteBtn);
      console.log("EditorView: noteStatus =", noteStatus);
      return false;
    }

    // Initialize components with safety checks
    try {
      if (typeof ProgressMenu !== "undefined") {
        ProgressMenu.initialize(handleProgressChange);
      }

      if (typeof DatePicker !== "undefined") {
        DatePicker.initialize(handleDueDateChange, handleImportanceToggle);
      }

      if (typeof NoteBadges !== "undefined") {
        NoteBadges.initialize();
      }

      if (typeof Autocomplete !== "undefined") {
        Autocomplete.initialize(noteEditor);
      }
    } catch (error) {
      console.error("EditorView: Error initializing components:", error);
    }

    // Attach event listeners
    attachEventListeners();

    // Register with view manager
    ViewManager.registerView(Constants.VIEWS.EDITOR, {
      initialize: initialize,
      show: show,
      hide: hide,
    });

    console.log("EditorView: Initialization complete");
    return true;
  }

  /**
   * Create the view's HTML structure
   */
  function createViewStructure() {
    console.log("EditorView: Creating view structure");
    viewElement.innerHTML = `
      <button class="back-btn" id="editor-back">←</button>
      <div class="editor-controls">
        <div class="editor-actions">
          <div id="progress-button" class="progress-indicator not-started"></div>
          <div id="progress-menu" class="progress-menu hidden">
            <div class="progress-option" data-progress="not-started">
              <div class="progress-indicator not-started"></div>
              Not Started
            </div>
            <div class="progress-option" data-progress="in-progress">
              <div class="progress-indicator in-progress"></div>
              In Progress
            </div>
            <div class="progress-option" data-progress="done">
              <div class="progress-indicator done"></div>
              Done
            </div>
          </div>
          <div id="note-status"></div>
        </div>
        <button id="delete-note" class="btn-icon btn-danger">🗑️ Delete</button>
      </div>

      <!-- Due Date and Importance Controls -->
      <div class="note-badges" id="note-badges">
        <!-- Will be populated dynamically -->
      </div>
      <div id="hashtags-display"></div>
      <div class="due-date-selector">
        <span>Due date:</span>
        <input type="date" id="due-date-input" />
        <button id="set-due-date">Set</button>
        <button id="clear-due-date">Clear</button>
        <button id="toggle-importance">⭐ Toggle Importance</button>
      </div>
      <div class="due-date-controls">
        <div class="date-pill" data-marker="!today">Today</div>
        <div class="date-pill" data-marker="!tomorrow">Tomorrow</div>
        <div class="date-pill" data-marker="!nextweek">Next Week</div>
        <div class="date-pill" data-marker="!nextmonth">Next Month</div>
      </div>

      <div class="editor">
        <textarea
          id="note-editor"
          placeholder="Start typing your note... (Use #hashtags for categorization, !today/!tomorrow for due dates, and !important for priority)"
        ></textarea>
      </div>
      <div class="status-bar">
        <div>Press Esc to open menu, Ctrl+Enter to save & close, Ctrl+S to save</div>
      </div>
    `;
  }

  /**
   * Attach event listeners to DOM elements
   */
  function attachEventListeners() {
    console.log("EditorView: Attaching event listeners");

    // Back button
    if (backButton) {
      backButton.addEventListener("click", () => {
        ViewManager.showView(Constants.VIEWS.MENU);
      });
    }

    // Delete button
    if (deleteNoteBtn) {
      deleteNoteBtn.addEventListener("click", deleteCurrentNote);
    }

    // Note editor input event
    if (noteEditor) {
      noteEditor.addEventListener("input", () => {
        updateHashtagsDisplay();
        markNoteAsUnsaved();
        if (typeof Autocomplete !== "undefined") {
          Autocomplete.checkForAutocomplete(
            noteEditor.value,
            noteEditor.selectionStart,
            Database.getAllHashtags
          );
        }
      });

      // Handle editor focus/blur events for autocomplete
      noteEditor.addEventListener("blur", (e) => {
        // Small delay to allow click events on autocomplete items
        setTimeout(() => {
          const autocompleteContainer = document.querySelector(
            ".autocomplete-container"
          );
          if (
            autocompleteContainer &&
            !autocompleteContainer.contains(document.activeElement)
          ) {
            if (typeof Autocomplete !== "undefined") {
              Autocomplete.hide();
            }
          }
        }, 100);
      });

      // Handle editor click to manage autocomplete position
      noteEditor.addEventListener("click", () => {
        if (typeof Autocomplete !== "undefined") {
          Autocomplete.checkForAutocomplete(
            noteEditor.value,
            noteEditor.selectionStart,
            Database.getAllHashtags
          );
        }
      });

      // Handle editor scroll to hide autocomplete
      noteEditor.addEventListener("scroll", () => {
        if (
          typeof Autocomplete !== "undefined" &&
          Autocomplete.isAutocompleteVisible()
        ) {
          Autocomplete.hide();
        }
      });

      // Handle editor keydown events
      // document.addEventListener("keydown", handleKeyDown);
    }
  }

  /**
   * Handle key down events in the editor
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyDown(e) {
    // Let autocomplete handle its own keys first
    if (Autocomplete.isAutocompleteVisible()) {
      const handled = Autocomplete.handleKeyDown(e);
      if (handled) return;
    }

    // Ctrl+Enter to save and close
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      saveCurrentNote(true);
      return;
    }

    // Ctrl+S to save
    if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
      saveCurrentNote(false);
      return;
    }

    // Escape to show menu
    if (e.key === "Escape") {
      e.preventDefault();
      ViewManager.showView(Constants.VIEWS.MENU);
      return;
    }
  }

  /**
   * Show the editor view
   * @param {Object} options - Optional data to pass to the view
   */
  function show(options = {}) {
    // If note ID is provided, load that note
    if (options.noteId) {
      const note = Database.getNoteById(options.noteId);
      if (note) {
        setEditorContent(note.content, note.id);
      }
    } else {
      setEditorContent("");
    }

    // Focus the editor
    setTimeout(() => {
      noteEditor.focus();
    }, 0);
  }

  /**
   * Hide the editor view
   */
  function hide() {
    // Optional cleanup
  }

  /**
   * Set content in the editor
   * @param {string} content - Content to set
   * @param {string} noteId - ID of the note (optional)
   */
  function setEditorContent(content, noteId = null) {
    if (!lastNoteWasSaved && noteEditor.value !== content) {
      return;
    }

    noteEditor.value = content || "";
    currentNoteId = noteId;
    lastSavedNoteContent = noteEditor.value;

    updateHashtagsDisplay();
    updateProgressIndicator();
    updateNoteStatus();
    updateNoteBadges();
    updateEditorUI();
  }

  /**
   * Update the hashtags display
   */
  function updateHashtagsDisplay() {
    const hashtags = NoteUtils.extractHashtags(noteEditor.value);
    hashtagsDisplay.innerHTML = hashtags
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join(" ");
  }

  /**
   * Update the progress indicator
   */
  function updateProgressIndicator() {
    if (!currentNoteId) {
      ProgressMenu.updateProgressIndicator(
        Constants.PROGRESS_STATES.NOT_STARTED
      );
      return;
    }

    const note = Database.getNoteById(currentNoteId);
    if (note) {
      ProgressMenu.updateProgressIndicator(note.progress);
    } else {
      ProgressMenu.updateProgressIndicator(
        Constants.PROGRESS_STATES.NOT_STARTED
      );
    }
  }

  /**
   * Update the note status display
   */
  function updateNoteStatus() {
    if (!lastNoteWasSaved) {
      noteStatus.classList.add("note-unsaved");
    } else {
      noteStatus.classList.remove("note-unsaved");
    }

    if (!currentNoteId) {
      noteStatus.textContent = "New Note";
      return;
    }

    const note = Database.getNoteById(currentNoteId);
    if (note) {
      const date = new Date(note.updatedAt).toLocaleString();
      noteStatus.textContent = `Last updated: ${date}`;
    } else {
      noteStatus.textContent = "";
    }
  }

  /**
   * Update UI elements that depend on having a current note
   */
  function updateEditorUI() {
    if (!currentNoteId) {
      DatePicker.hide();
      ProgressMenu.hide();
      deleteNoteBtn.classList.add("hidden");
      return;
    }

    DatePicker.show();
    ProgressMenu.show();
    deleteNoteBtn.classList.remove("hidden");
  }

  /**
   * Update the note badges
   */
  function updateNoteBadges() {
    if (!currentNoteId) {
      NoteBadges.hide();
      return;
    }

    const note = Database.getNoteById(currentNoteId);
    if (note) {
      NoteBadges.updateBadges(note);
      DatePicker.setDateValue(note.dueDate);
      NoteBadges.show();
    } else {
      NoteBadges.hide();
    }
  }

  /**
   * Mark the note as unsaved
   */
  function markNoteAsUnsaved() {
    lastNoteWasSaved = noteEditor.value === lastSavedNoteContent;
    updateNoteStatus();
  }

  /**
   * Save the current note
   * @param {boolean} closeAfterSave - Whether to clear editor after saving
   */
  function saveCurrentNote(closeAfterSave = false) {
    const content = noteEditor.value;

    // Don't save empty notes when closing
    if (content === "" && closeAfterSave && !currentNoteId) {
      return;
    }

    if (currentNoteId) {
      Database.updateNote(currentNoteId, content);
    } else {
      const newNote = Database.addNote(content);
      currentNoteId = newNote.id;
      updateEditorUI();
    }

    lastNoteWasSaved = true;
    lastSavedNoteContent = content;

    updateProgressIndicator();
    updateNoteStatus();
    updateNoteBadges();

    StatusMessage.show("Note saved", 2000, true);

    if (closeAfterSave) {
      setEditorContent("");
      currentNoteId = null;
    }
  }

  /**
   * Delete the current note
   */
  function deleteCurrentNote() {
    if (!currentNoteId) return;

    // Check for shift key or confirm
    if (
      App.isShiftPressed() ||
      confirm("Are you sure you want to delete this note?")
    ) {
      Database.deleteNote(currentNoteId);
      setEditorContent("");
      currentNoteId = null;
      StatusMessage.show("Note deleted", 2000, true);
    }
  }

  /**
   * Handle progress change from progress menu
   * @param {string} progress - New progress state
   */
  function handleProgressChange(progress) {
    if (!currentNoteId) return;

    Database.updateNote(currentNoteId, noteEditor.value, progress);
    updateProgressIndicator();
    markNoteAsUnsaved();
  }

  /**
   * Handle due date change from date picker
   * @param {string} dateString - ISO date string or null
   */
  function handleDueDateChange(dateString) {
    if (!currentNoteId) return;

    const note = Database.getNoteById(currentNoteId);
    Database.updateNote(
      currentNoteId,
      noteEditor.value,
      note.progress,
      dateString,
      note.important
    );

    updateNoteBadges();
    StatusMessage.show(dateString ? "Due date set" : "Due date cleared");
  }

  /**
   * Handle importance toggle
   */
  function handleImportanceToggle() {
    if (!currentNoteId) return;

    const note = Database.getNoteById(currentNoteId);
    const newImportance = !note.important;

    Database.updateNote(
      currentNoteId,
      noteEditor.value,
      note.progress,
      note.dueDate,
      newImportance
    );

    updateNoteBadges();
    StatusMessage.show(
      newImportance ? "Marked as important" : "Importance removed"
    );
  }

  /**
   * Handle autocomplete selection
   * @param {string} value - Selected value
   * @param {number} startPos - Start position in the text
   * @param {string} type - Type of autocomplete ('hashtag' or 'marker')
   */
  function handleAutocompleteSelection(value, startPos, type) {
    const text = noteEditor.value;

    // Find where the current word ends
    let endPos = startPos;
    while (endPos < text.length && !/\s/.test(text[endPos])) {
      endPos++;
    }

    // Get text before and after the word
    const textBeforeWord = text.substring(0, startPos);
    const textAfterWord = text.substring(endPos);

    if (type === "hashtag") {
      // For hashtags, keep the # prefix
      noteEditor.value = textBeforeWord + value + textAfterWord;
      noteEditor.selectionStart = noteEditor.selectionEnd =
        startPos + value.length;
    } else {
      // For time markers, replace the entire marker
      noteEditor.value = textBeforeWord + value + textAfterWord;
      noteEditor.selectionStart = noteEditor.selectionEnd =
        startPos + value.length;
    }

    updateHashtagsDisplay();
    markNoteAsUnsaved();
    noteEditor.focus();
  }

  /**
   * Insert a time marker at the current cursor position
   * @param {string} marker - Time marker to insert
   */
  function insertTimeMarker(marker) {
    // Get cursor position
    const cursorPos = noteEditor.selectionStart;
    const text = noteEditor.value;

    // Insert the marker at the current cursor position
    const newText =
      text.slice(0, cursorPos) + " " + marker + " " + text.slice(cursorPos);
    noteEditor.value = newText;

    // Update the cursor position after the marker
    noteEditor.selectionStart = noteEditor.selectionEnd =
      cursorPos + marker.length + 2;

    // Update display
    updateHashtagsDisplay();
    markNoteAsUnsaved();

    // Focus back on the editor
    noteEditor.focus();
  }

  // Public API
  return {
    initialize,
    show,
    hide,
    setEditorContent,
    saveCurrentNote,
    deleteCurrentNote,
    insertTimeMarker,
    handleKeyDown,
  };
})();
