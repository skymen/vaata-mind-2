/**
 * PomodoroView Module
 * Handles the Pomodoro timer functionality and task management
 */
window.PomodoroView = (() => {
  // DOM elements
  let viewElement = null;
  let timerDisplay = null;
  let taskDisplay = null;
  let actionButtons = null;
  let backButton = null;
  let startPauseButton = null;
  let skipButton = null;
  let taskListContainer = null;
  let endPromptContainer = null;
  let taskDoneBtn = null;
  let taskNotDoneBtn = null;
  let continueTaskBtn = null;
  let timerProgress = null;
  let titleElement = null;
  let taskProgressIndicator = null;

  // State
  let tasks = [];
  let currentTaskIndex = 0;
  let timer = null;
  let timeRemaining = 0;
  let isPaused = true;
  let isBreak = false;
  let breakCount = 0;
  let taskInProgress = false;
  let audio = null;

  /**
   * Initialize the Pomodoro view
   */
  function initialize() {
    // Cache DOM elements
    viewElement = document.getElementById(Constants.VIEWS.POMODORO);

    if (!viewElement) {
      console.error("PomodoroView: Required elements not found");
      return;
    }

    // Create view HTML structure if empty
    if (viewElement.children.length === 0) {
      createViewStructure();
    }

    // Cache references to newly created elements
    timerDisplay = document.getElementById("pomodoro-timer");
    taskDisplay = document.getElementById("pomodoro-task");
    actionButtons = document.getElementById("pomodoro-actions");
    backButton = document.getElementById("pomodoro-back");
    startPauseButton = document.getElementById("pomodoro-start-pause");
    skipButton = document.getElementById("pomodoro-skip");
    taskListContainer = document.getElementById("pomodoro-task-list");
    endPromptContainer = document.getElementById("pomodoro-end-prompt");
    taskDoneBtn = document.getElementById("pomodoro-task-done");
    taskNotDoneBtn = document.getElementById("pomodoro-task-not-done");
    continueTaskBtn = document.getElementById("pomodoro-continue-task");
    timerProgress = document.querySelector(".pomodoro-progress-ring-circle");
    titleElement = document.getElementById("pomodoro-state");
    taskProgressIndicator = document.getElementById("pomodoro-task-progress");

    // Attach event listeners
    attachEventListeners();

    // Load stored tasks from localStorage
    loadTasksFromStorage();

    // Register with view manager
    ViewManager.registerView(Constants.VIEWS.POMODORO, {
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
      <button class="back-btn" id="pomodoro-back">←</button>
      <div class="pomodoro-container">
        <div class="pomodoro-timer-section">
          <div class="pomodoro-progress-container">
            <svg class="pomodoro-progress-ring" width="300" height="300">
              <circle class="pomodoro-progress-ring-bg" cx="150" cy="150" r="140" />
              <circle class="pomodoro-progress-ring-circle" cx="150" cy="150" r="140" />
            </svg>
            <div class="pomodoro-timer" id="pomodoro-timer">25:00</div>
            <div class="pomodoro-state" id="pomodoro-state">WORK</div>
          </div>
          
          <div class="pomodoro-actions" id="pomodoro-actions">
            <button id="pomodoro-start-pause" class="btn btn-primary">Start</button>
            <button id="pomodoro-skip" class="btn btn-secondary" disabled>Skip</button>
          </div>
          
          <div class="pomodoro-end-prompt" id="pomodoro-end-prompt">
            <h3>Time's up!</h3>
            <p>How would you like to proceed with this task?</p>
            <div class="pomodoro-end-buttons">
              <button id="pomodoro-task-done" class="btn btn-success">Mark as Done</button>
              <button id="pomodoro-task-not-done" class="btn btn-secondary">Not Done Yet</button>
              <button id="pomodoro-continue-task" class="btn btn-primary">Continue Working on It</button>
            </div>
          </div>
        </div>
        
        <div class="pomodoro-task-section">
          <div class="pomodoro-task" id="pomodoro-task">
            <div class="pomodoro-task-header">
              <div class="pomodoro-task-progress">
                <div id="pomodoro-task-progress" class="progress-indicator not-started"></div>
              </div>
              <h3>Current Task</h3>
            </div>
            <div class="pomodoro-task-content">Select a task to start</div>
          </div>
          
          <div class="pomodoro-task-list-wrapper">
            <h3>Task Queue</h3>
            <div class="pomodoro-task-list" id="pomodoro-task-list">
              <!-- Tasks will be displayed here -->
            </div>
          </div>
        </div>
      </div>
      
      <div class="pomodoro-celebration" id="pomodoro-celebration">
        <div class="celebration-container">
          <div class="celebration-text">Task Completed!</div>
          <div class="celebration-animation">
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
          </div>
        </div>
      </div>
      
      <div class="pomodoro-grand-celebration" id="pomodoro-grand-celebration">
        <div class="grand-celebration-container">
          <div class="grand-celebration-text">All Tasks Completed!</div>
          <div class="grand-celebration-animation">
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
            <div class="grand-confetti"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to DOM elements
   */
  function attachEventListeners() {
    // Back button
    if (backButton) {
      backButton.addEventListener("click", () => {
        if (timer) {
          if (confirm("Timer is running. Are you sure you want to exit?")) {
            clearInterval(timer);
            timer = null;
            ViewManager.showView(Constants.VIEWS.MENU);
          }
        } else {
          ViewManager.showView(Constants.VIEWS.MENU);
        }
      });
    }

    // Start/Pause button
    if (startPauseButton) {
      startPauseButton.addEventListener("click", togglePauseResume);
    }

    // Skip button
    if (skipButton) {
      skipButton.addEventListener("click", () => {
        if (confirm("Are you sure you want to skip this task?")) {
          moveToNextTask();
        }
      });
    }

    // End prompt buttons
    if (taskDoneBtn) {
      taskDoneBtn.addEventListener("click", () => {
        completeTask();
        hideEndPrompt();
      });
    }

    if (taskNotDoneBtn) {
      taskNotDoneBtn.addEventListener("click", () => {
        moveToNextTask();
        hideEndPrompt();
      });
    }

    if (continueTaskBtn) {
      continueTaskBtn.addEventListener("click", () => {
        startNextPomodoroForCurrentTask();
        hideEndPrompt();
      });
    }
  }

  /**
   * Hide the end prompt
   */
  function hideEndPrompt() {
    if (endPromptContainer) {
      endPromptContainer.style.display = "none";
    }
    
    if (actionButtons) {
      actionButtons.style.display = "flex";
    }
  }

  /**
   * Show the end prompt
   */
  function showEndPrompt() {
    if (endPromptContainer) {
      endPromptContainer.style.display = "flex";
    }
    
    if (actionButtons) {
      actionButtons.style.display = "none";
    }
  }

  /**
   * Toggle pause/resume timer
   */
  function togglePauseResume() {
    if (!tasks.length) return;

    isPaused = !isPaused;

    if (isPaused) {
      // Pause the timer
      clearInterval(timer);
      startPauseButton.textContent = "Resume";
      startPauseButton.classList.remove("btn-secondary");
      startPauseButton.classList.add("btn-primary");
    } else {
      // Start or resume the timer
      if (!timer) {
        // If this is the first start
        timeRemaining = Constants.POMODORO.WORK_TIME;
        updateTimerDisplay();
        updateProgress();

        // Enable controls
        skipButton.disabled = false;

        // Update task status to In Progress
        if (tasks[currentTaskIndex] && !taskInProgress) {
          taskInProgress = true;
          
          // Update database
          const task = tasks[currentTaskIndex];
          Database.updateNote(
            task.id,
            task.content,
            Constants.PROGRESS_STATES.IN_PROGRESS
          );
          
          // Update local task status
          tasks[currentTaskIndex].progress = Constants.PROGRESS_STATES.IN_PROGRESS;
          
          // Update the task display and progress indicator
          updateTaskDisplay();
          
          // Save updated tasks
          saveTasksToStorage();
        }
      }

      timer = setInterval(updateTimer, 1000);
      startPauseButton.textContent = "Pause";
      startPauseButton.classList.remove("btn-primary");
      startPauseButton.classList.add("btn-secondary");
    }
  }

  /**
   * Play a notification sound
   */
  function playNotification() {
    audio = audio || new Audio("assets/notification.mp3");
    audio.currentTime = 0;
    audio.play();
  }

  /**
   * Update the timer every second
   */
  function updateTimer() {
    if (timeRemaining <= 0) {
      clearInterval(timer);
      timer = null;
      playNotification();
      
      if (isBreak) {
        // Break is over
        isBreak = false;
        titleElement.textContent = "READY";
        
        // Start next task
        moveToNextTask();
      } else {
        // Work period is over
        titleElement.textContent = "TIME'S UP";
        
        // Show end prompt to decide what to do with the task
        showEndPrompt();
      }
      return;
    }

    timeRemaining--;
    updateTimerDisplay();
    updateProgress();
  }

  /**
   * Update the timer display
   */
  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * Update the progress ring
   */
  function updateProgress() {
    const circumference = 2 * Math.PI * 140; // 140 is the radius of our circle

    const totalTime = isBreak
      ? breakCount % 4 === 0
        ? Constants.POMODORO.LONG_BREAK
        : Constants.POMODORO.SHORT_BREAK
      : Constants.POMODORO.WORK_TIME;

    const dashoffset = circumference * (1 - timeRemaining / totalTime);

    timerProgress.style.strokeDashoffset = dashoffset;
    timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
  }

  /**
   * Start the next pomodoro for the current task
   */
  function startNextPomodoroForCurrentTask() {
    // Reset the timer
    clearInterval(timer);
    timer = null;
    isPaused = true;
    timeRemaining = Constants.POMODORO.WORK_TIME;
    isBreak = false;
    
    // Update UI
    titleElement.textContent = "WORK";
    updateTimerDisplay();
    updateProgress();
    
    // Auto-start the timer
    togglePauseResume();
  }

  /**
   * Complete the current task
   */
  function completeTask() {
    const task = tasks[currentTaskIndex];

    if (task) {
      // Mark the task as done in the database
      Database.updateNote(
        task.id,
        task.content,
        Constants.PROGRESS_STATES.DONE
      );

      // Update local task state
      tasks[currentTaskIndex].progress = Constants.PROGRESS_STATES.DONE;
      saveTasksToStorage();

      // Show celebration
      showCelebration();

      // Move to the next task after a delay
      setTimeout(() => {
        // Remove the completed task from the list
        tasks.splice(currentTaskIndex, 1);
        saveTasksToStorage();

        // Reset the current task index if needed
        if (currentTaskIndex >= tasks.length) {
          currentTaskIndex = 0;
        }

        // Check if we're done with all tasks
        if (tasks.length === 0) {
          showGrandCelebration();
          resetTimer();
          return;
        }

        // Move to next task
        updateTaskDisplay();
        updateTaskList();
        resetTimer();
      }, 1000);
    }
  }

  /**
   * Move to the next task without marking as done
   */
  function moveToNextTask() {
    // Clear the current timer
    clearInterval(timer);
    timer = null;
    isPaused = true;
    taskInProgress = false;

    // Update UI
    startPauseButton.textContent = "Start";
    startPauseButton.classList.remove("btn-secondary");
    startPauseButton.classList.add("btn-primary");

    // Move to next task if we have any
    if (tasks.length > 0) {
      currentTaskIndex = (currentTaskIndex + 1) % tasks.length;
    }

    // Reset the timer
    resetTimer();

    // Update the task display
    updateTaskDisplay();
  }

  /**
   * Reset the timer to initial state
   */
  function resetTimer() {
    clearInterval(timer);
    timer = null;
    timeRemaining = Constants.POMODORO.WORK_TIME;
    isBreak = false;
    isPaused = true;
    taskInProgress = false;
    
    // Update UI
    titleElement.textContent = "READY";
    updateTimerDisplay();
    updateProgress();

    // Disable controls
    skipButton.disabled = true;
    
    // Hide end prompt if visible
    hideEndPrompt();
  }

  /**
   * Update the task display
   */
  function updateTaskDisplay() {
    const taskContent = document.querySelector(".pomodoro-task-content");
    
    if (!taskContent) return;

    if (tasks.length === 0) {
      taskContent.textContent =
        "No tasks available. Add tasks from other views.";
        
      if (taskProgressIndicator) {
        taskProgressIndicator.className = "progress-indicator not-started";
      }
      return;
    }

    const task = tasks[currentTaskIndex];
    if (task) {
      // Highlight hashtags in the content
      const highlightedContent = task.content.replace(
        /#(\w+)/g,
        '<span class="tag">#$1</span>'
      );

      // Update task progress indicator
      if (taskProgressIndicator) {
        taskProgressIndicator.className = `progress-indicator ${task.progress}`;
      }

      taskContent.innerHTML = highlightedContent;
    } else {
      taskContent.textContent = "Error: Task not found";
      
      if (taskProgressIndicator) {
        taskProgressIndicator.className = "progress-indicator not-started";
      }
    }
    
    // Update task list
    updateTaskList();
  }

  /**
   * Update the pomodoro task list
   */
  function updateTaskList() {
    if (!taskListContainer) return;
    
    taskListContainer.innerHTML = "";
    
    if (tasks.length === 0) {
      taskListContainer.innerHTML = '<div class="empty-task-list">No tasks in queue</div>';
      return;
    }
    
    tasks.forEach((task, index) => {
      const taskElement = document.createElement("div");
      taskElement.className = `pomodoro-task-item ${index === currentTaskIndex ? 'current' : ''}`;
      
      // Highlight hashtags in the content
      const highlightedContent = task.content.replace(
        /#(\w+)/g,
        '<span class="tag">#$1</span>'
      );
      
      taskElement.innerHTML = `
        <div class="task-item-content">
          <div class="task-progress">
            <div class="progress-indicator ${task.progress}"></div>
          </div>
          <div class="task-content">${highlightedContent}</div>
        </div>
        <div class="task-item-actions">
          <button class="task-remove-btn" data-index="${index}" title="Remove Task">×</button>
        </div>
      `;
      
      // Add event listener to task element for selecting
      taskElement.addEventListener("click", (e) => {
        // Ignore if clicking the remove button
        if (e.target.classList.contains('task-remove-btn')) return;
        
        if (timer && !confirm("Timer is running. Switch tasks?")) return;
        
        currentTaskIndex = index;
        resetTimer();
        updateTaskDisplay();
      });
      
      // Add event listener to remove button
      const removeBtn = taskElement.querySelector(".task-remove-btn");
      if (removeBtn) {
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const idx = parseInt(e.target.getAttribute("data-index"));
          removeTask(idx);
        });
      }
      
      taskListContainer.appendChild(taskElement);
    });
  }

  /**
   * Remove a task from the list
   * @param {number} index - Index of the task to remove
   */
  function removeTask(index) {
    if (index < 0 || index >= tasks.length) return;
    
    // Check if removing the current task
    const isCurrentTask = index === currentTaskIndex;
    
    // Remove the task
    tasks.splice(index, 1);
    
    // Adjust current task index if needed
    if (isCurrentTask) {
      // Reset to first task, or just reset the timer
      currentTaskIndex = tasks.length > 0 ? 0 : 0;
      resetTimer();
    } else if (index < currentTaskIndex) {
      // Adjust current task index if we removed a task before it
      currentTaskIndex--;
    }
    
    // Save changes
    saveTasksToStorage();
    
    // Update UI
    updateTaskDisplay();
    updateTaskList();
  }

  /**
   * Add a task to the pomodoro queue
   * @param {Object} task - The task to add
   */
  function addTask(task) {
    // Check if the task is already in the list
    const taskExists = tasks.some(t => t.id === task.id);
    
    if (taskExists) {
      return false;
    }
    
    // Add the task
    tasks.push(task);
    
    // Save changes
    saveTasksToStorage();
    
    // Update UI
    updateTaskDisplay();
    updateTaskList();
    
    return true;
  }

  /**
   * Save tasks to localStorage
   */
  function saveTasksToStorage() {
    localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks));
  }

  /**
   * Load tasks from localStorage
   */
  function loadTasksFromStorage() {
    const savedTasks = localStorage.getItem('pomodoro_tasks');
    
    if (savedTasks) {
      try {
        tasks = JSON.parse(savedTasks);
        currentTaskIndex = 0;
      } catch (e) {
        console.error('Error loading pomodoro tasks:', e);
        tasks = [];
      }
    }
  }

  /**
   * Show the celebration animation
   */
  function showCelebration() {
    const celebration = document.getElementById("pomodoro-celebration");
    celebration.classList.add("show");

    // Add random colors to confetti
    document.querySelectorAll(".confetti").forEach((confetti) => {
      const colors = [
        "#f44336",
        "#e91e63",
        "#9c27b0",
        "#673ab7",
        "#3f51b5",
        "#2196f3",
        "#03a9f4",
        "#00bcd4",
        "#009688",
        "#4caf50",
      ];
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
    });

    setTimeout(() => {
      celebration.classList.remove("show");
    }, 3000);
  }

  /**
   * Show the grand celebration animation
   */
  function showGrandCelebration() {
    const grandCelebration = document.getElementById(
      "pomodoro-grand-celebration"
    );
    grandCelebration.classList.add("show");

    // Add random colors to confetti
    document.querySelectorAll(".grand-confetti").forEach((confetti) => {
      const colors = [
        "#f44336",
        "#e91e63",
        "#9c27b0",
        "#673ab7",
        "#3f51b5",
        "#2196f3",
        "#03a9f4",
        "#00bcd4",
        "#009688",
        "#4caf50",
      ];
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];

      // Random rotation and size for more diversity
      confetti.style.transform = `rotate(${Math.random() * 360}deg) scale(${
        0.8 + Math.random() * 0.5
      })`;
    });

    setTimeout(() => {
      grandCelebration.classList.remove("show");

      // Go back to the menu view after the celebration
      ViewManager.showView(Constants.VIEWS.MENU);
    }, 5000);
  }

  /**
   * Set the tasks for the Pomodoro
   * @param {Array} taskList - List of tasks to work on
   * @param {boolean} replace - Whether to replace existing tasks
   */
  function setTasks(taskList, replace = false) {
    if (replace) {
      tasks = [...taskList];
    } else {
      // Filter out tasks that are already in the list
      const newTasks = taskList.filter(
        task => !tasks.some(t => t.id === task.id)
      );
      
      tasks = [...tasks, ...newTasks];
    }
    
    currentTaskIndex = 0;
    saveTasksToStorage();

    // Reset the timer
    resetTimer();

    // Update task display
    updateTaskDisplay();
    updateTaskList();
  }

  /**
   * Show the Pomodoro view
   * @param {Object} options - Options passed to the view
   */
  function show(options = {}) {
    // Set tasks if provided
    if (options.tasks && Array.isArray(options.tasks)) {
      const replace = options.replace === true;
      setTasks(options.tasks, replace);
    }
    
    // Add single task if provided
    if (options.task) {
      const added = addTask(options.task);
      if (added && options.autoStart === true) {
        // Set the current task index to the last task (the one we just added)
        currentTaskIndex = tasks.length - 1;
        updateTaskDisplay();
        // Auto start the pomodoro
        setTimeout(() => {
          togglePauseResume();
        }, 500);
      }
    }

    // Initialize timer display
    resetTimer();

    // Setup circle animation
    const circle = document.querySelector(".pomodoro-progress-ring-circle");
    const circumference = 2 * Math.PI * 140;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;
    
    // Hide end prompt
    hideEndPrompt();
  }

  /**
   * Hide the Pomodoro view
   */
  function hide() {
    // Optional cleanup
  }

  /**
   * Handle key down events in the Pomodoro view
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (timer) {
        if (confirm("Timer is running. Are you sure you want to exit?")) {
          clearInterval(timer);
          timer = null;
          ViewManager.showView(Constants.VIEWS.MENU);
        }
      } else {
        ViewManager.showView(Constants.VIEWS.MENU);
      }
    }
  }

  /**
   * Utility function to add a task to pomodoro from any view
   * @param {string} noteId - ID of the note to add as a task
   * @param {boolean} autoStart - Whether to auto-start the timer
   * @param {boolean} switchToPomodoro - Whether to switch to pomodoro view
   * @returns {boolean} Success status
   */
  function addTaskFromView(noteId, autoStart = false, switchToPomodoro = true) {
    // Get the note from the database
    const note = Database.getNoteById(noteId);
    if (!note) return false;
    
    // Add the task to the pomodoro
    const added = addTask(note);
    
    // If added successfully and switchToPomodoro is true, switch to pomodoro view
    if (added && switchToPomodoro) {
      const options = {
        task: note,
        autoStart: autoStart
      };
      
      ViewManager.showView(Constants.VIEWS.POMODORO, options);
    }
    
    return added;
  }

  // Public API
  return {
    initialize,
    show,
    hide,
    handleKeyDown,
    setTasks,
    addTask,
    addTaskFromView,
  };
})();