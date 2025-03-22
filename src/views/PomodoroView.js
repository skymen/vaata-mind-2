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
              <button id="pomodoro-continue-task" class="btn btn-primary">Continue Working on It</button>
              <button id="pomodoro-task-not-done" class="btn btn-secondary">Move on to Another Task</button>
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
            <div class="trophy-animation"></div>
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
        if (tasks.length === 0) return;
        
        // Pause the timer
        if (!isPaused) {
          clearInterval(timer);
          timer = null;
          isPaused = true;
        }
        
        // Show the end prompt instead of an alert
        showEndPrompt();
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
    
    // Add click handlers to celebration overlays
    const celebration = document.getElementById("pomodoro-celebration");
    const grandCelebration = document.getElementById("pomodoro-grand-celebration");
    
    if (celebration) {
      celebration.addEventListener("click", () => {
        celebration.classList.remove("show");
      });
    }
    
    if (grandCelebration) {
      grandCelebration.addEventListener("click", () => {
        grandCelebration.classList.remove("show");
        ViewManager.showView(Constants.VIEWS.MENU);
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
    if (!endPromptContainer) return;
    
    if (isBreak) {
      // During breaks, just show a simple message
      endPromptContainer.innerHTML = `
        <h3>Break Time's Up!</h3>
        <p>Ready to start working?</p>
        <div class="pomodoro-end-buttons">
          <button id="pomodoro-continue-task" class="btn btn-primary">Start Next Session</button>
        </div>
      `;
      
      // Re-attach event listener for the continue button
      const continueBtn = endPromptContainer.querySelector("#pomodoro-continue-task");
      if (continueBtn) {
        continueBtn.addEventListener("click", () => {
          startNextPomodoroForCurrentTask();
          hideEndPrompt();
        });
      }
    } else {
      // During work sessions, show the full prompt
      endPromptContainer.innerHTML = `
        <h3>Time's up!</h3>
        <p>How would you like to proceed with this task?</p>
        <div class="pomodoro-end-buttons">
          <button id="pomodoro-task-done" class="btn btn-success">Mark as Done</button>
          <button id="pomodoro-continue-task" class="btn btn-primary">Continue Working on It</button>
          <button id="pomodoro-task-not-done" class="btn btn-secondary">Move on to Another Task</button>
        </div>
      `;
      
      // Re-attach event listeners
      const doneBtn = endPromptContainer.querySelector("#pomodoro-task-done");
      const notDoneBtn = endPromptContainer.querySelector("#pomodoro-task-not-done");
      const continueBtn = endPromptContainer.querySelector("#pomodoro-continue-task");
      
      if (doneBtn) {
        doneBtn.addEventListener("click", () => {
          completeTask();
          hideEndPrompt();
        });
      }
      
      if (notDoneBtn) {
        notDoneBtn.addEventListener("click", () => {
          moveToNextTask();
          hideEndPrompt();
        });
      }
      
      if (continueBtn) {
        continueBtn.addEventListener("click", () => {
          startNextPomodoroForCurrentTask();
          hideEndPrompt();
        });
      }
    }
    
    endPromptContainer.style.display = "flex";
    
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
      timer = null;
      startPauseButton.textContent = "Resume";
      startPauseButton.classList.remove("btn-secondary");
      startPauseButton.classList.add("btn-primary");
    } else {
      // Start or resume the timer
      // Always clear the existing timer first to prevent multiple timers
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      
      if (!timeRemaining) {
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
          
          // Update both the task display and task list
          updateTaskDisplay();
          updateTaskList(); // Make sure sidebar updates immediately
        }
      }

      // Always enable the skip button when timer is running
      skipButton.disabled = false;

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
   * Play a notification sound multiple times and focus the window
   * @param {number} count - Number of times to play the sound
   */
  function playTimerEndNotification(count = 3) {
    // Play sound multiple times
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        playNotification();
      }, i * 2000);
    }
    
    // Focus the window if it isn't focused
    if (!document.hasFocus()) {
      // Flash the title to get user's attention
      let originalTitle = document.title;
      let notificationTitle = "⏰ TIME'S UP! ⏰";
      let isOriginalTitle = false;
      
      // Flash the title between original and notification message
      const titleInterval = setInterval(() => {
        document.title = isOriginalTitle ? originalTitle : notificationTitle;
        isOriginalTitle = !isOriginalTitle;
      }, 1000);
      
      // Stop flashing when window gets focus
      window.addEventListener('focus', function stopTitleFlash() {
        clearInterval(titleInterval);
        document.title = originalTitle;
        window.removeEventListener('focus', stopTitleFlash);
      });
      
      // Try to focus the window (may be blocked by browser)
      try {
        window.focus();
      } catch (e) {
        console.log("Could not focus window due to browser restrictions");
      }
    }
  }

  /**
   * Update the timer every second
   */
  function updateTimer() {
    if (timeRemaining <= 0) {
      clearInterval(timer);
      timer = null;
      
      if (isBreak) {
        // Break is over
        playNotification(); // Simple notification for break endings
        isBreak = false;
        titleElement.textContent = "READY";
        
        // Start next task
        moveToNextTask();
      } else {
        // Work period is over - use enhanced notification
        playTimerEndNotification(3); // Play sound 3 times and focus window
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
    // Clear the current timer
    clearInterval(timer);
    timer = null;
    isPaused = true;
    taskInProgress = false;

    // Update UI
    startPauseButton.textContent = "Start";
    startPauseButton.classList.remove("btn-secondary");
    startPauseButton.classList.add("btn-primary");

    // Reset the timer
    startBreak();

    // Update the task display
    updateTaskDisplay();
    updateTaskList();
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

      // Remove the completed task from the list
      tasks.splice(currentTaskIndex, 1);
      saveTasksToStorage();

      // Reset the current task index if needed
      if (currentTaskIndex >= tasks.length) {
        currentTaskIndex = 0;
      }

      // Check if we're done with all tasks
      if (tasks.length === 0) {
        // Only show the grand celebration for all tasks completed
        showGrandCelebration();
        resetTimer();
        return;
      }

      // Only show regular celebration if it's not the last task
      showCelebration();

      // Start a break after completing a task
      startBreak();

      // Update the task display
      updateTaskDisplay();
      updateTaskList();
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
    startBreak();

    // Update the task display
    updateTaskDisplay();
    updateTaskList();
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
        if (currentTaskIndex === index) return;
        if (timer && !confirm("Timer is running. Switch tasks?")) return;
        
        currentTaskIndex = index;
        resetTimer();
        updateTaskDisplay();
        // update resumePause button text
        startPauseButton.textContent = "Start";
        startPauseButton.classList.remove("btn-secondary");
        startPauseButton.classList.add("btn-primary");
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
    
    // Store the task ID before removing
    const taskId = tasks[index].id;
    
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
    //localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks));
  }

  /**
   * Load tasks from localStorage
   */
  function loadTasksFromStorage() {
    return;
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
    
    // Reset any existing animation by removing and re-adding the element
    const celebrationContainer = celebration.querySelector(".celebration-container");
    const clonedContainer = celebrationContainer.cloneNode(true);
    celebrationContainer.parentNode.replaceChild(clonedContainer, celebrationContainer);
    
    celebration.classList.add("show");

    // Add random colors to confetti
    document.querySelectorAll(".confetti").forEach((confetti, index) => {
      const colors = [
        "#f44336", // red
        "#e91e63", // pink
        "#9c27b0", // purple
        "#673ab7", // deep purple
        "#3f51b5", // indigo
        "#2196f3", // blue
        "#03a9f4", // light blue
        "#00bcd4", // cyan
        "#009688", // teal
        "#4caf50", // green
        "#ffc107", // amber
        "#ff9800", // orange
        "#ff5722", // deep orange
      ];
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.backgroundColor = color;
      
      // Random size, rotation, and delay for more dynamic animation
      const size = 0.7 + Math.random() * 0.6;
      const rotation = Math.random() * 360;
      const delay = Math.random() * 0.5;
      
      // Add random horizontal offset for more natural motion
      const horizontalOffset = (Math.random() * 40) - 20; // -20px to +20px
      
      confetti.style.transform = `rotate(${rotation}deg) scale(${size})`;
      confetti.style.animationDelay = `${delay}s`;
      confetti.style.left = `calc(${confetti.style.left || '50%'} + ${horizontalOffset}px)`;
      
      // Reset animation
      confetti.style.animation = 'none';
      confetti.offsetHeight; // Trigger reflow
      confetti.style.animation = null;
    });

    // Keep the celebration visible for longer
    setTimeout(() => {
      celebration.classList.remove("show");
    }, 4000);
  }

  /**
   * Show the grand celebration animation
   */
  function showGrandCelebration() {
    const grandCelebration = document.getElementById(
      "pomodoro-grand-celebration"
    );
    
    // Reset any existing animation by removing and re-adding the element
    const grandCelebrationContainer = grandCelebration.querySelector(".grand-celebration-container");
    const clonedContainer = grandCelebrationContainer.cloneNode(true);
    grandCelebrationContainer.parentNode.replaceChild(clonedContainer, grandCelebrationContainer);
    
    grandCelebration.classList.add("show");

    // Add trophy sparkles
    const trophy = grandCelebration.querySelector(".trophy-animation");
    if (trophy) {
      // Add 8 sparkles around the trophy
      for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'trophy-sparkle';
        
        // Position sparkles in a circle around the trophy
        const angle = (i / 8) * Math.PI * 2;
        const radius = 60; // Distance from trophy center
        const left = 50 + Math.cos(angle) * radius;
        const top = 50 + Math.sin(angle) * radius;
        
        sparkle.style.left = `${left}px`;
        sparkle.style.top = `${top}px`;
        sparkle.style.animationDelay = `${i * 0.2}s`;
        
        trophy.appendChild(sparkle);
      }
    }

    // Add random colors to confetti with enhanced animations
    document.querySelectorAll(".grand-confetti").forEach((confetti, index) => {
      const colors = [
        "#f44336", // red
        "#e91e63", // pink
        "#9c27b0", // purple
        "#673ab7", // deep purple
        "#3f51b5", // indigo
        "#2196f3", // blue
        "#03a9f4", // light blue
        "#00bcd4", // cyan
        "#009688", // teal
        "#4caf50", // green
        "#ffc107", // amber
        "#ff9800", // orange
        "#ff5722", // deep orange
        "#ffeb3b", // yellow
        "#cddc39", // lime
      ];
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.backgroundColor = color;
      
      // Random size, rotation, and delay for more dynamic animation
      const size = 0.7 + Math.random() * 0.8;
      const rotation = Math.random() * 720 - 360; // -360 to 360 degrees
      const delay = Math.random() * 0.8;
      
      // Add random horizontal offset to make movement more natural
      const horizontalOffset = (Math.random() * 60) - 30; // -30px to +30px
      
      confetti.style.transform = `rotate(${rotation}deg) scale(${size})`;
      confetti.style.animationDelay = `${delay}s`;
      confetti.style.left = `calc(${confetti.style.left || '50%'} + ${horizontalOffset}px)`;
      
      // Reset animation
      confetti.style.animation = 'none';
      confetti.offsetHeight; // Trigger reflow
      confetti.style.animation = null;
      
      // Random animation duration for more varied motion
      const duration = 3 + Math.random() * 3;
      confetti.style.animationDuration = `${duration}s`;
    });

    // Keep the celebration visible for longer
    setTimeout(() => {
      grandCelebration.classList.remove("show");
      // Go back to the menu view after the celebration
      ViewManager.showView(Constants.VIEWS.MENU);
    }, 7000);
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
    
    // Ensure start/pause button shows "Start" initially
    if (startPauseButton) {
      startPauseButton.textContent = "Start";
      startPauseButton.classList.remove("btn-secondary");
      startPauseButton.classList.add("btn-primary");
    }
    
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

  /**
   * Start a break after completing a work session
   */
  function startBreak() {
    // Increment break count
    breakCount++;
    
    // Set break flag
    isBreak = true;
    
    // Set the timer based on break type (short or long)
    if (breakCount % 4 === 0) {
      // Long break after 4 pomodoros
      timeRemaining = Constants.POMODORO.LONG_BREAK;
      titleElement.textContent = "LONG BREAK";
    } else {
      // Short break
      timeRemaining = Constants.POMODORO.SHORT_BREAK;
      titleElement.textContent = "SHORT BREAK";
    }
    
    // Update the display
    updateTimerDisplay();
    updateProgress();
    
    // Auto-start the break timer
    isPaused = true; // Set to true first so togglePauseResume will set to false
    togglePauseResume();
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