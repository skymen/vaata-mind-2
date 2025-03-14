/**
 * Database Module
 * Handles data storage, retrieval, and manipulation
 */
const Database = (() => {
  // Private variables
  let notes = [];
  let probabilities = {}; // For recommendation mode - only used in memory, not saved

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
   * Add a new note to the database
   * @param {string} content - Note content
   * @returns {Object} The newly created note
   */
  function addNote(content) {
    const hashtags = NoteUtils.extractHashtags(content);
    const timeData = NoteUtils.extractTimeMarkers(content);
    const id = Date.now().toString();
    const newNote = {
      id,
      content,
      hashtags,
      progress: Constants.PROGRESS_STATES.NOT_STARTED,
      dueDate: timeData.dueDate,
      important: timeData.important,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    notes.push(newNote);
    probabilities[id] = 1.0;
    save();
    return newNote;
  }

  /**
   * Update an existing note
   * @param {string} id - Note ID
   * @param {string} content - Updated note content
   * @param {string} progress - Progress state (optional)
   * @param {string} dueDate - Due date (optional)
   * @param {boolean} important - Importance flag (optional)
   * @returns {Object|null} The updated note or null if not found
   */
  function updateNote(id, content, progress, dueDate, important) {
    const noteIndex = notes.findIndex((note) => note.id === id);
    if (noteIndex >= 0) {
      const hashtags = NoteUtils.extractHashtags(content);
      const timeData = NoteUtils.extractTimeMarkers(content);

      // Use provided values or extract from content
      const newDueDate = dueDate !== undefined ? dueDate : timeData.dueDate;
      const isImportant =
        important !== undefined ? important : timeData.important;

      notes[noteIndex] = {
        ...notes[noteIndex],
        content,
        hashtags,
        progress: progress !== undefined ? progress : notes[noteIndex].progress,
        dueDate: newDueDate,
        important: isImportant,
        updatedAt: new Date().toISOString(),
      };
      save();
      return notes[noteIndex];
    }
    return null;
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
      note.hashtags.forEach((tag) => hashtagSet.add(tag));
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
