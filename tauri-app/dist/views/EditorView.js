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
  let addToPomodoroBtn = null;
  let noteStatus = null;

  // State
  let currentNoteId = null;
  let lastSavedNoteContent = "";
  let lastNoteWasSaved = true;
  let currentDueDate = null;
  let currentImportance = false;

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
    addToPomodoroBtn = document.getElementById("add-to-pomodoro");
    noteStatus = document.getElementById("note-status");

    // Check if elements were found
    if (
      !noteEditor ||
      !hashtagsDisplay ||
      !backButton ||
      !deleteNoteBtn ||
      !addToPomodoroBtn ||
      !noteStatus
    ) {
      console.error(
        "EditorView: Required elements not found after structure creation"
      );
      console.log("EditorView: noteEditor =", noteEditor);
      console.log("EditorView: hashtagsDisplay =", hashtagsDisplay);
      console.log("EditorView: backButton =", backButton);
      console.log("EditorView: deleteNoteBtn =", deleteNoteBtn);
      console.log("EditorView: addToPomodoroBtn =", addToPomodoroBtn);
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
        <div class="editor-buttons">
          <button id="add-to-pomodoro" class="btn-icon btn-secondary" title="Add to Pomodoro">⏱️ Pomodoro</button>
          <button id="delete-note" class="btn-icon btn-danger">🗑️ Delete</button>
        </div>
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
    
    // Add to Pomodoro button
    if (addToPomodoroBtn) {
      addToPomodoroBtn.addEventListener("click", addCurrentNoteToPomodoro);
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
      
      // Handle editor keyup events
      noteEditor.addEventListener("keyup", handleEditorKeyUp);
    }
  }

  /**
   * Handle key down events in the editor
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyDown(e) {
    // Check if autocomplete is visible before attempting to handle keys
    if (typeof Autocomplete !== "undefined" && Autocomplete.isAutocompleteVisible && Autocomplete.isAutocompleteVisible()) {
      // Only try to call handleKeyDown if it exists
      if (typeof Autocomplete.handleKeyDown === 'function') {
        const handled = Autocomplete.handleKeyDown(e);
        if (handled) return;
      }
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
   * Handle key events in the editor
   * @param {Event} e - Key event
   */
  function handleEditorKeyUp(e) {
    // Regular input handling
    updateHashtagsDisplay();
    markNoteAsUnsaved();
    
    // Check for "due:" marker to show calendar
    if (NoteUtils.isCursorAfterDueMarker(noteEditor.value, noteEditor.selectionStart)) {
      DatePicker.showCalendarAtCursor(noteEditor, noteEditor.selectionStart);
    }
    
    // Process time markers in real-time
    processTimeMarkersInRealTime();
  }
  
  /**
   * Process time markers in real-time while typing
   */
  function processTimeMarkersInRealTime() {
    if (!noteEditor) return;
    
    const content = noteEditor.value;
    const result = NoteUtils.extractTimeMarkers(content);
    
    // Only update if markers were found and text changed
    if (result.updatedText !== content) {
      // Save cursor position
      const cursorPos = noteEditor.selectionStart;
      const textDiff = content.length - result.updatedText.length;
      
      // Update editor content - removes markers
      noteEditor.value = result.updatedText;
      
      // Restore cursor position, adjusted for removed text
      noteEditor.selectionStart = noteEditor.selectionEnd = Math.max(0, cursorPos - textDiff);
      
      // Update due date and importance
      currentDueDate = result.dueDate;
      currentImportance = result.important;
      
      // Update badges display
      updateNoteBadges();
    }
  }

  /**
   * Show the editor view
   * @param {Object} options - Optional data to pass to the view
   */
  async function show(options = {}) {
    // If note ID is provided, load that note
    if (options.noteId) {
      const note = Database.getNoteById(options.noteId);
      if (note) {
        await setEditorContent(note.content, options.noteId);
      }
    } else {
      // Reset current note (no need for confirmation dialog when starting a new note)
      createNewNote();
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
   * @returns {Promise<boolean>} Whether the content was set successfully
   */
  async function setEditorContent(content, noteId = null) {
    // Check for unsaved changes
    if (!lastNoteWasSaved && noteEditor.value.trim() !== "") {
      // Only prompt if we're actually changing to a different note
      if (content !== noteEditor.value) {
        const confirmed = await DialogBox.confirm(
          "You have unsaved changes. Do you want to save them before proceeding?",
          "Unsaved Changes"
        );
        
        if (confirmed) {
          const saved = await saveCurrentNote(false);
          if (!saved) {
            // If saving failed, don't continue
            return false;
          }
        }
      }
    }

    // Update editor content
    noteEditor.value = content || "";
    currentNoteId = noteId;
    lastSavedNoteContent = noteEditor.value;
    lastNoteWasSaved = true;

    // Update UI
    updateHashtagsDisplay();
    updateProgressIndicator();
    updateNoteStatus();
    updateNoteBadges();
    updateEditorUI();
    
    return true;
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
      DatePicker.hideCalendar();
      ProgressMenu.hide();
      deleteNoteBtn.classList.add("hidden");
      return;
    }

    ProgressMenu.show();
    deleteNoteBtn.classList.remove("hidden");
  }

  /**
   * Update the note badges
   */
  function updateNoteBadges() {
    const noteData = {
      dueDate: currentDueDate,
      important: currentImportance
    };
    
    NoteBadges.updateBadges(noteData);
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
   * @returns {Promise<boolean>} Whether the save was successful
   */
  async function saveCurrentNote(closeAfterSave = false) {
    const content = noteEditor.value;

    // Don't save empty notes when closing
    if (content === "" && closeAfterSave && !currentNoteId) {
      return true;
    }

    // Process any time markers in the content
    const timeData = NoteUtils.extractTimeMarkers(content);
    const processedContent = timeData.updatedText;
    
    // Update current metadata
    if (timeData.dueDate !== undefined) {
      currentDueDate = timeData.dueDate;
    }
    if (timeData.important !== undefined) {
      currentImportance = timeData.important;
    }

    try {
      if (currentNoteId) {
        // Update existing note - explicitly pass all properties
        await Database.updateNote(
          currentNoteId,
          processedContent,
          undefined, // Don't change progress
          currentDueDate,
          currentImportance
        );
      } else {
        // Create new note - explicitly pass all properties
        const newNote = await Database.addNote(
          processedContent,
          Constants.PROGRESS_STATES.NOT_STARTED,
          currentDueDate,
          currentImportance
        );
        currentNoteId = newNote.id;
        updateEditorUI();
      }

      // Update state
      lastNoteWasSaved = true;
      lastSavedNoteContent = processedContent;

      // Update UI
      updateProgressIndicator();
      updateNoteStatus();
      updateNoteBadges();

      StatusMessage.show("Note saved", 2000, true);

      if (closeAfterSave) {
        setEditorContent("");
        currentNoteId = null;
        
        // Reset metadata when creating a new note
        currentDueDate = null;
        currentImportance = false;
        updateNoteBadges();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save note:', error);
      StatusMessage.show("Failed to save note", 2000, false);
      return false;
    }
  }

  /**
   * Delete the current note
   */
  async function deleteCurrentNote() {
    if (!currentNoteId) return;

    // Check for shift key or confirm
    if (
      App.isShiftPressed() ||
      await DialogBox.confirm("Are you sure you want to delete this note?", "Confirm Delete")
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
    // Update current due date
    currentDueDate = dateString;
    
    // Update badges
    updateNoteBadges();
    
    // Mark as unsaved
    markNoteAsUnsaved();
    
    // Show status message
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
   * Add the current note to the Pomodoro
   */
  async function addCurrentNoteToPomodoro() {
    // First save the current note if it's new or has unsaved changes
    if (!currentNoteId || !lastNoteWasSaved) {
      saveCurrentNote(false);
    }
    
    if (!currentNoteId) {
      StatusMessage.show("Please create a note first", 2000, true);
      return;
    }
    
    // Ask if the user wants to switch to pomodoro view
    const switchToPomodoro = await DialogBox.confirm(
      "Add this note to Pomodoro and switch to Pomodoro view?", 
      "Add to Pomodoro"
    );
    
    // Add the note to pomodoro
    const added = PomodoroView.addTaskFromView(currentNoteId, false, switchToPomodoro);
    
    if (added && !switchToPomodoro) {
      StatusMessage.show("Added to Pomodoro queue", 2000, true);
    }
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

  /**
   * Load a note into the editor
   * @param {string} id - Note ID to load
   */
  function loadNote(id) {
    if (!id) return;
    
    const note = Database.getNoteById(id);
    if (!note) {
      console.error(`Note with ID ${id} not found`);
      return;
    }
    
    // Set content and note ID
    noteEditor.value = note.content || "";
    currentNoteId = note.id;
    lastSavedNoteContent = noteEditor.value;
    lastNoteWasSaved = true;
    
    // Load metadata
    currentDueDate = note.dueDate || null;
    currentImportance = note.important || false;
    
    // Update UI
    updateHashtagsDisplay();
    updateProgressIndicator();
    updateNoteStatus();
    updateNoteBadges();
    updateEditorUI();
  }

  /**
   * Create a new note
   */
  function createNewNote() {
    if (!lastNoteWasSaved) {
      return;
    }
    // Reset content and ID
    noteEditor.value = "";
    currentNoteId = null;
    lastSavedNoteContent = "";
    lastNoteWasSaved = true;
    
    // Reset metadata
    currentDueDate = null;
    currentImportance = false;
    
    // Update UI
    updateHashtagsDisplay();
    updateProgressIndicator();
    updateNoteStatus();
    updateNoteBadges();
    updateEditorUI();
  }

  // For public access from DatePicker.js
  window.EditorView = {
    insertTimeMarker: (marker) => {
      // This functionality is no longer needed
      // Time markers are processed in real-time
    }
  };

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
    loadNote,
    createNewNote,
  };
})();
