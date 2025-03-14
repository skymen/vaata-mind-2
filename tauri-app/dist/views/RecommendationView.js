/**
 * RecommendationView Module
 * Handles the recommendation interface for surfacing relevant notes
 */
window.RecommendationView = (() => {
  // DOM elements
  let viewElement = null;
  let backButton = null;
  let recommendationCard = null;
  let btnReject = null;
  let btnAccept = null;
  let reshuffleContainer = null;

  // State
  let currentRecommendation = null;
  let viewedNoteIds = new Set();
  let reshuffling = false;

  /**
   * Initialize the recommendation view
   */
  function initialize() {
    // Cache DOM elements
    viewElement = document.getElementById(Constants.VIEWS.RECOMMENDATION);
    backButton = document.getElementById("recommendation-back");

    if (!viewElement) {
      console.error("RecommendationView: Required elements not found");
      return;
    }

    // Create view HTML structure if empty
    if (viewElement.children.length === 0) {
      createViewStructure();
    }

    // Cache references to newly created elements
    recommendationCard = document.getElementById("recommendation-card");
    btnReject = document.getElementById("btn-reject");
    btnAccept = document.getElementById("btn-accept");
    reshuffleContainer = document.getElementById("reshuffle-container");

    // Attach event listeners
    attachEventListeners();

    // Register with view manager
    ViewManager.registerView(Constants.VIEWS.RECOMMENDATION, {
      initialize: initialize,
      show: show,
      hide: hide,
    });
  }

  /**
   * Create the view's HTML structure
   */
  function createViewStructure() {
    viewElement.innerHTML = `
      <button class="back-btn" id="recommendation-back">←</button>
      <div class="recommendation-container">
        <div class="note-card" id="recommendation-card">
          <p>No notes available yet. Start by creating some notes!</p>
        </div>
        <div class="recommendation-actions">
          <button class="btn btn-secondary" id="btn-reject">Reject</button>
          <button class="btn btn-primary" id="btn-accept">Accept</button>
        </div>

        <!-- Reshuffle Animation -->
        <div id="reshuffle-container" class="reshuffle-container">
          <div class="reshuffle-animation">
            <div class="reshuffle-card"></div>
            <div class="reshuffle-card"></div>
            <div class="reshuffle-card"></div>
          </div>
          <div class="reshuffle-text">Reshuffling notes...</div>
        </div>
      </div>
    `;

    // Re-cache elements
    recommendationCard = document.getElementById("recommendation-card");
    btnReject = document.getElementById("btn-reject");
    btnAccept = document.getElementById("btn-accept");
    reshuffleContainer = document.getElementById("reshuffle-container");
    backButton = document.getElementById("recommendation-back");
  }

  /**
   * Attach event listeners to DOM elements
   */
  function attachEventListeners() {
    // Back button
    if (backButton) {
      backButton.addEventListener("click", () => {
        ViewManager.showView(Constants.VIEWS.MENU);
      });
    }

    // Recommendation actions
    if (btnReject) {
      btnReject.addEventListener("click", () => {
        if (currentRecommendation && !reshuffling) {
          Database.adjustProbabilitiesRejected(currentRecommendation.id);
          updateRecommendationView();
        }
      });
    }

    if (btnAccept) {
      btnAccept.addEventListener("click", () => {
        if (currentRecommendation && !reshuffling) {
          Database.adjustProbabilitiesAccepted(currentRecommendation.id);
          ViewManager.showView(Constants.VIEWS.EDITOR, {
            noteId: currentRecommendation.id,
          });
        }
      });
    }
  }

  /**
   * Update the recommendation view
   */
  function updateRecommendationView() {
    // If we're in the process of reshuffling, don't update
    if (reshuffling) return;

    currentRecommendation = Database.getRecommendation(viewedNoteIds);

    if (!currentRecommendation && Database.getAllNotes().length > 0) {
      // No recommendations available, show reshuffle animation
      showReshuffle();
      return;
    } else if (!currentRecommendation) {
      // No notes available to recommend
      recommendationCard.innerHTML = "No notes available to recommend";
      if (btnReject) btnReject.disabled = true;
      if (btnAccept) btnAccept.disabled = true;
      return;
    }

    // Add note to viewed set
    viewedNoteIds.add(currentRecommendation.id);

    // Highlight hashtags
    const highlightedContent = currentRecommendation.content.replace(
      /#(\w+)/g,
      '<span class="tag">#$1</span>'
    );

    // Create progress indicator
    recommendationCard.innerHTML = `
      <div style="display: flex; align-items: start; margin-bottom: 10px;">
        <div style="margin-right: 10px;" class="progress-indicator ${currentRecommendation.progress}"></div>
        <div>${highlightedContent}</div>
      </div>
    `;

    if (btnReject) btnReject.disabled = false;
    if (btnAccept) btnAccept.disabled = false;
  }

  /**
   * Show the reshuffle animation
   */
  function showReshuffle() {
    reshuffling = true;
    if (reshuffleContainer) reshuffleContainer.classList.add("show");

    // Wait for animation and then refresh recommendations
    setTimeout(() => {
      Database.reshuffleRecommendations();
      if (reshuffleContainer) reshuffleContainer.classList.remove("show");
      reshuffling = false;
      viewedNoteIds.clear();
      updateRecommendationView();
    }, 2000); // 2 seconds for shuffle animation
  }

  /**
   * Show the recommendation view
   */
  function show() {
    // Reset viewed notes when entering recommendation mode
    viewedNoteIds.clear();
    updateRecommendationView();
  }

  /**
   * Hide the recommendation view
   */
  function hide() {
    // No cleanup needed
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyDown(e) {
    // Escape to show menu
    if (e.key === "Escape") {
      e.preventDefault();
      ViewManager.showView(Constants.VIEWS.MENU);
      return;
    }

    // Ctrl+R to reshuffle
    if (e.key === "r" && e.ctrlKey) {
      e.preventDefault();
      showReshuffle();
      return;
    }

    // Left arrow to reject
    if (e.key === "ArrowLeft" && btnReject && !btnReject.disabled) {
      e.preventDefault();
      btnReject.click();
      return;
    }

    // Right arrow to accept
    if (e.key === "ArrowRight" && btnAccept && !btnAccept.disabled) {
      e.preventDefault();
      btnAccept.click();
      return;
    }
  }

  // Public API
  return {
    initialize,
    show,
    hide,
    handleKeyDown,
  };
})();
