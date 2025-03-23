/**
 * Database Module
 * Handles data storage, retrieval, and manipulation
 */
const Database = (() => {
  // Private variables
  let notes = [];
  let probabilities = {}; // For recommendation mode - only used in memory, not saved

  /**
   * Generate a unique ID for a note
   * @returns {string} A unique ID
   */
  function generateId() {
    // Create a timestamp component
    const timestamp = new Date().getTime();
    
    // Create a random component (8 hex characters)
    const randomPart = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');
    
    // Combine them for a unique ID
    return `n-${timestamp}-${randomPart}`;
  }

  /**
   * Alias for save function - used in various places in the codebase
   */
  function saveChanges() {
    save();
  }

  /**
   * Initialize the database from localStorage
   * @returns {Object} The Database API
   */
  function init() {
    const savedData = localStorage.getItem(Constants.STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      notes = parsed.notes || [];
      // Don't load probabilities from storage, initialize fresh
      probabilities = {};
    }

    // Initialize probabilities for all notes
    notes.forEach((note) => {
      // Always start with fresh probabilities
      probabilities[note.id] = 1.0;

      // Ensure progress state is set for all notes
      if (!note.progress) {
        note.progress = Constants.PROGRESS_STATES.NOT_STARTED;
      }

      // Make sure dueDate and importance are initialized
      if (note.dueDate === undefined) {
        note.dueDate = null;
      }

      if (note.important === undefined) {
        note.important = false;
      }
    });

    return this; // Enable method chaining
  }

  /**
   * Save the current database state to localStorage
   * @returns {Object} The Database API
   */
  function save() {
    localStorage.setItem(
      Constants.STORAGE_KEY,
      JSON.stringify({
        notes: notes,
        // Don't save probabilities
      })
    );
    return this; // Enable method chaining
  }

  /**
   * Add a new note
   * @param {string} content - Note content
   * @param {string} progress - Progress state (from Constants.PROGRESS_STATES)
   * @param {string|null} dueDate - ISO date string or null for due date
   * @param {boolean} important - Whether the note is important
   * @returns {Object} New note object
   */
  function addNote(content, progress, dueDate = null, important = false) {
    const now = new Date().toISOString();
    const newNote = {
      id: generateId(),
      content: content,
      progress: progress || Constants.PROGRESS_STATES.NOT_STARTED,
      createdAt: now,
      updatedAt: now,
      dueDate: dueDate,
      important: important
    };

    notes.push(newNote);
    saveChanges();
    
    return newNote;
  }

  /**
   * Update an existing note
   * @param {string} id - ID of the note to update
   * @param {string} content - New content (or undefined to keep current)
   * @param {string} progress - New progress state (or undefined to keep current)
   * @param {string|null} dueDate - ISO date string or null/undefined to keep current
   * @param {boolean} important - Important flag or undefined to keep current
   * @returns {Object|null} Updated note or null if not found
   */
  function updateNote(id, content, progress, dueDate, important) {
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex === -1) return null;

    const now = new Date().toISOString();
    const updatedNote = { ...notes[noteIndex], updatedAt: now };

    // Only update properties that are explicitly provided
    if (content !== undefined) updatedNote.content = content;
    if (progress !== undefined) updatedNote.progress = progress;
    
    // Special case for dueDate - null means remove it, undefined means don't change
    if (dueDate !== undefined) {
      updatedNote.dueDate = dueDate;
    }
    
    // Special case for important - must be a boolean, except undefined means don't change
    if (important !== undefined) {
      updatedNote.important = Boolean(important);
    }

    notes[noteIndex] = updatedNote;
    saveChanges();
    
    return updatedNote;
  }

  /**
   * Delete a note from the database
   * @param {string} id - Note ID
   * @returns {boolean} Success status
   */
  function deleteNote(id) {
    const noteIndex = notes.findIndex((note) => note.id === id);
    if (noteIndex >= 0) {
      notes.splice(noteIndex, 1);
      delete probabilities[id];
      save();
      return true;
    }
    return false;
  }

  /**
   * Get a note by its ID
   * @param {string} id - Note ID
   * @returns {Object|undefined} The note or undefined if not found
   */
  function getNoteById(id) {
    return notes.find((note) => note.id === id);
  }

  /**
   * Get all unique hashtags from all notes
   * @returns {string[]} Array of unique hashtags
   */
  function getAllHashtags() {
    const hashtagSet = new Set();
    notes.forEach((note) => {
      // Use NoteUtils to extract hashtags from content instead of accessing a non-existent property
      if (note.content) {
        const extractedTags = NoteUtils.extractHashtags(note.content);
        extractedTags.forEach(tag => hashtagSet.add(tag));
      }
    });
    return Array.from(hashtagSet);
  }

  /**
   * Get a recommendation based on probabilities
   * @param {Set} viewedNoteIds - Set of note IDs that have already been viewed
   * @returns {Object|null} A recommended note or null
   */
  function getRecommendation(viewedNoteIds) {
    if (notes.length === 0) return null;

    // If all notes have been viewed, return null to trigger reshuffle
    if (viewedNoteIds.size >= notes.length) {
      return null;
    }

    // Calculate total probability only for notes not yet viewed
    let totalProb = 0;
    const availableNotes = notes.filter(
      (note) =>
        !viewedNoteIds.has(note.id) &&
        note.progress !== Constants.PROGRESS_STATES.DONE
    );

    if (availableNotes.length === 0) {
      return null; // Should never happen but just in case
    }

    // Calculate base probabilities with importance and due date factoring in
    availableNotes.forEach((note) => {
      // Start with base probability
      let noteProbability = probabilities[note.id] || 1.0;

      // Apply importance multiplier
      if (note.important) {
        noteProbability *= 2.0; // Important notes are twice as likely
      }

      // Apply due date factor
      if (note.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(note.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const daysUntilDue = Math.floor(
          (dueDate - today) / (1000 * 60 * 60 * 24)
        );

        // The closer to due date, the higher the probability
        if (daysUntilDue < 0) {
          // Overdue items get highest priority
          noteProbability *= 3.0;
        } else if (daysUntilDue === 0) {
          // Due today
          noteProbability *= 2.5;
        } else if (daysUntilDue === 1) {
          // Due tomorrow
          noteProbability *= 2.0;
        } else if (daysUntilDue <= 7) {
          // Due this week
          noteProbability *= 1.5;
        }
      }

      totalProb += noteProbability;
    });

    // Choose a note based on weighted probabilities
    let targetProb = Math.random() * totalProb;
    let cumulativeProb = 0;

    for (const note of availableNotes) {
      let noteProbability = probabilities[note.id] || 1.0;

      // Apply importance multiplier
      if (note.important) {
        noteProbability *= 2.0;
      }

      // Apply due date factor
      if (note.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(note.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const daysUntilDue = Math.floor(
          (dueDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDue < 0) {
          noteProbability *= 3.0;
        } else if (daysUntilDue === 0) {
          noteProbability *= 2.5;
        } else if (daysUntilDue === 1) {
          noteProbability *= 2.0;
        } else if (daysUntilDue <= 7) {
          noteProbability *= 1.5;
        }
      }

      cumulativeProb += noteProbability;
      if (cumulativeProb >= targetProb) {
        return note;
      }
    }

    // Fallback in case of floating point issues
    const randomNote =
      availableNotes[Math.floor(Math.random() * availableNotes.length)];
    return randomNote;
  }

  /**
   * Adjust probabilities after accepting a note
   * @param {string} acceptedNoteId - ID of the accepted note
   */
  function adjustProbabilitiesAccepted(acceptedNoteId) {
    const acceptedNote = notes.find((note) => note.id === acceptedNoteId);
    if (!acceptedNote) return;

    // Reduce probability of the accepted note
    probabilities[acceptedNoteId] *= 0.5;

    // Slightly increase probability of notes with similar hashtags
    const similarityBonus = (numSharedTags) => {
      // Linear interpolation from 1.0 to 2.0 based on number of shared hashtags, clamped
      return Math.min(2.0, 1.0 + numSharedTags * 0.1);
    };

    notes.forEach((note) => {
      if (note.id !== acceptedNoteId) {
        // Check for hashtag overlap
        const overlap = note.hashtags.filter((tag) =>
          acceptedNote.hashtags.includes(tag)
        );

        probabilities[note.id] *= similarityBonus(overlap.length);
      }
    });
  }

  /**
   * Adjust probabilities after rejecting a note
   * @param {string} rejectedNoteId - ID of the rejected note
   */
  function adjustProbabilitiesRejected(rejectedNoteId) {
    const rejectedNote = notes.find((note) => note.id === rejectedNoteId);
    if (!rejectedNote) return;

    // Reduce probability of the rejected note
    probabilities[rejectedNoteId] *= 0.5;

    // Slightly reduce probability of notes with similar hashtags
    const similarityPenalty = (numSharedTags) => {
      // Linear interpolation from 0.5 to 1.0 based on number of shared hashtags, clamped
      return Math.max(0.5, 1.0 - numSharedTags * 0.1);
    };

    notes.forEach((note) => {
      if (note.id !== rejectedNoteId) {
        // Check for hashtag overlap
        const overlap = note.hashtags.filter((tag) =>
          rejectedNote.hashtags.includes(tag)
        );

        probabilities[note.id] *= similarityPenalty(overlap.length);
      }
    });
  }

  /**
   * Reset all probabilities for recommendation system
   */
  function reshuffleRecommendations() {
    // Reset all probabilities
    notes.forEach((note) => {
      probabilities[note.id] = 1.0;
    });
  }

  /**
   * Export database as JSON string
   * @returns {string} JSON string of database
   */
  function exportData() {
    return JSON.stringify(
      {
        notes: notes,
        version: 1,
      },
      null,
      2
    );
  }

  /**
   * Import data from JSON string
   * @param {string} jsonData - JSON string to import
   * @returns {boolean} Success status
   */
  function importData(jsonData) {
    try {
      const importedData = JSON.parse(jsonData);

      // Validate import data has necessary structure
      if (!importedData.notes || !Array.isArray(importedData.notes)) {
        throw new Error("Invalid data format: missing notes array");
      }

      // Process imported notes
      notes = importedData.notes;

      // Ensure all notes have progress status, due date, and importance
      notes.forEach((note) => {
        if (!note.progress) {
          note.progress = Constants.PROGRESS_STATES.NOT_STARTED;
        }
        if (note.dueDate === undefined) {
          note.dueDate = null;
        }
        if (note.important === undefined) {
          note.important = false;
        }
      });

      // Reset probabilities
      probabilities = {};
      notes.forEach((note) => {
        probabilities[note.id] = 1.0;
      });

      // Save to localStorage
      save();
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }

  /**
   * Get all notes
   * @returns {Array} All notes
   */
  function getAllNotes() {
    return [...notes]; // Return a copy to prevent direct modification
  }

  /**
   * Get the number of notes
   * @returns {number} Number of notes
   */
  function getNbNotes() {
    return notes.length;
  }

  // Public API
  return {
    init,
    save,
    addNote,
    updateNote,
    deleteNote,
    getNoteById,
    getAllHashtags,
    getRecommendation,
    adjustProbabilitiesAccepted,
    adjustProbabilitiesRejected,
    reshuffleRecommendations,
    exportData,
    importData,
    getAllNotes,
    getNbNotes,
  };
})();
