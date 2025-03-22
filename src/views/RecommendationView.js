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
  let taskListContainer = null;
  let startPomodoroBtn = null;

  // State
  let currentRecommendation = null;
  let viewedNoteIds = new Set();
  let reshuffling = false;
  let selectedTasks = [];

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
    taskListContainer = document.getElementById("task-list-container");
    startPomodoroBtn = document.getElementById("start-pomodoro-btn");

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
        <div class="recommendation-main">
          <div class="note-card" id="recommendation-card">
            <p>No notes available yet. Start by creating some notes!</p>
          </div>
          <div class="recommendation-actions">
            <button class="btn btn-secondary" id="btn-reject">Reject</button>
            <button class="btn btn-primary" id="btn-accept">Accept</button>
          </div>
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
      <div class="task-list-container" id="task-list-container">
        <h3>Selected Tasks</h3>
        <div id="list-full-warning" class="list-full-warning">
          Maximum number of tasks reached. Remove a task before adding more.
        </div>
        <div class="task-list" id="task-list">
          <!-- Tasks will be added here -->
          <div class="empty-task-list">No tasks selected yet</div>
        </div>
        <button class="btn btn-primary start-pomodoro-btn" id="start-pomodoro-btn" disabled>
          Start Pomodoro
        </button>
      </div>
    `;

    // Re-cache elements
    recommendationCard = document.getElementById("recommendation-card");
    btnReject = document.getElementById("btn-reject");
    btnAccept = document.getElementById("btn-accept");
    reshuffleContainer = document.getElementById("reshuffle-container");
    backButton = document.getElementById("recommendation-back");
    taskListContainer = document.getElementById("task-list-container");
    startPomodoroBtn = document.getElementById("start-pomodoro-btn");
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

          // Instead of opening in editor, add to task list
          addToTaskList(currentRecommendation);

          // Show next recommendation
          updateRecommendationView();
        }
      });
    }

    // Start Pomodoro button
    if (startPomodoroBtn) {
      startPomodoroBtn.addEventListener("click", () => {
        if (selectedTasks.length > 0) {
          ViewManager.showView(Constants.VIEWS.POMODORO, {
            tasks: selectedTasks,
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
   * Add a note to the task list
   * @param {Object} note - Note to add to task list
   */
  function addToTaskList(note) {
    // Check if we've reached the maximum number of tasks
    if (selectedTasks.length >= Constants.POMODORO.MAX_TASKS) {
      const listFullWarning = document.getElementById("list-full-warning");
      if (listFullWarning) {
        listFullWarning.classList.add("show");

        // Hide the warning after 3 seconds
        setTimeout(() => {
          listFullWarning.classList.remove("show");
        }, 3000);
      }

      StatusMessage.show(
        `Cannot add more than ${Constants.POMODORO.MAX_TASKS} tasks!`,
        3000
      );
      return;
    }

    // Check if the note is already in the task list
    if (selectedTasks.some((task) => task.id === note.id)) {
      StatusMessage.show("This task is already in your list", 2000);
      return;
    }

    // Add to the selected tasks array
    selectedTasks.push(note);

    // Update the task list UI
    updateTaskListUI();
    
    // Also add to the Pomodoro task list
    PomodoroView.addTask(note);
  }

  /**
   * Update the task list UI
   */
  function updateTaskListUI() {
    const taskList = document.getElementById("task-list");
    if (!taskList) return;

    taskList.innerHTML = "";

    if (selectedTasks.length === 0) {
      taskList.innerHTML =
        '<div class="empty-task-list">No tasks selected yet</div>';
      if (startPomodoroBtn) {
        startPomodoroBtn.disabled = true;
      }
      return;
    }

    selectedTasks.forEach((task, index) => {
      const taskElement = document.createElement("div");
      taskElement.className = "task-item";

      // Highlight hashtags in the content
      const highlightedContent = task.content.replace(
        /#(\w+)/g,
        '<span class="tag">#$1</span>'
      );

      taskElement.innerHTML = `
        <div class="task-progress">
          <div class="progress-indicator ${task.progress}"></div>
        </div>
        <div class="task-content">${highlightedContent}</div>
        <div class="task-actions">
          <button class="task-remove-btn" data-index="${index}">×</button>
        </div>
      `;

      taskList.appendChild(taskElement);

      // Add event listener to remove button
      const removeBtn = taskElement.querySelector(".task-remove-btn");
      if (removeBtn) {
        removeBtn.addEventListener("click", (e) => {
          const idx = parseInt(e.target.getAttribute("data-index"));
          removeTaskFromList(idx);
        });
      }
    });

    // Update button state
    if (startPomodoroBtn) {
      startPomodoroBtn.disabled = selectedTasks.length === 0;
    }

    // Update container styling based on number of tasks
    if (taskListContainer) {
      taskListContainer.classList.remove("warning", "danger");

      if (selectedTasks.length > Constants.POMODORO.DANGER_TASKS) {
        taskListContainer.classList.add("danger");
      } else if (selectedTasks.length > Constants.POMODORO.WARNING_TASKS) {
        taskListContainer.classList.add("warning");
      }
    }
  }

  /**
   * Remove a task from the list by index
   * @param {number} index - Index of the task to remove
   */
  function removeTaskFromList(index) {
    if (index >= 0 && index < selectedTasks.length) {
      // Get the task ID before removing it
      const taskId = selectedTasks[index].id;
      
      // Remove from recommendation view
      selectedTasks.splice(index, 1);
      updateTaskListUI();
      
      // Also find and remove the task from the Pomodoro task list if it exists there
      // This maintains synchronization between the two views
      const pomodoroTasks = JSON.parse(localStorage.getItem('pomodoro_tasks') || '[]');
      const pomodoroTaskIndex = pomodoroTasks.findIndex(task => task.id === taskId);
      
      if (pomodoroTaskIndex !== -1) {
        pomodoroTasks.splice(pomodoroTaskIndex, 1);
        localStorage.setItem('pomodoro_tasks', JSON.stringify(pomodoroTasks));
      }
    }
  }

  /**
   * Load tasks from Pomodoro storage to keep views in sync
   */
  function loadTasksFromPomodoro() {
    const pomodoroTasks = JSON.parse(localStorage.getItem('pomodoro_tasks') || '[]');
    
    // Only add tasks that aren't already in the selected tasks list
    pomodoroTasks.forEach(task => {
      if (!selectedTasks.some(t => t.id === task.id)) {
        selectedTasks.push(task);
      }
    });
    
    updateTaskListUI();
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
      selectedTasks.forEach((task) => {
        viewedNoteIds.add(task.id);
      });
      updateRecommendationView();
    }, 2000); // 2 seconds for shuffle animation
  }

  /**
   * Show the recommendation view
   */
  function show() {
    // Load tasks from Pomodoro to sync the lists
    loadTasksFromPomodoro();
    
    // Reset viewed notes when entering recommendation mode
    viewedNoteIds.clear();
    updateRecommendationView();

    // Show the task list
    updateTaskListUI();
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
