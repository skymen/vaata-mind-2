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
  let pauseButton = null;
  let skipButton = null;
  let doneButton = null;
  let notDoneButton = null;
  let continueButton = null;
  let timerProgress = null;

  // State
  let tasks = [];
  let currentTaskIndex = 0;
  let timer = null;
  let timeRemaining = 0;
  let isPaused = true;
  let isBreak = false;
  let breakCount = 0;

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
    pauseButton = document.getElementById("pomodoro-pause");
    skipButton = document.getElementById("pomodoro-skip");
    doneButton = document.getElementById("pomodoro-done");
    notDoneButton = document.getElementById("pomodoro-not-done");
    continueButton = document.getElementById("pomodoro-continue");
    timerProgress = document.getElementById("pomodoro-progress-ring");

    // Attach event listeners
    attachEventListeners();

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
            <svg class="pomodoro-progress-ring" id="pomodoro-progress-ring" width="300" height="300">
              <circle class="pomodoro-progress-ring-bg" cx="150" cy="150" r="140" />
              <circle class="pomodoro-progress-ring-circle" cx="150" cy="150" r="140" />
            </svg>
            <div class="pomodoro-timer" id="pomodoro-timer">25:00</div>
            <div class="pomodoro-state" id="pomodoro-state">WORK</div>
          </div>
        </div>
        
        <div class="pomodoro-task-section">
          <div class="pomodoro-task" id="pomodoro-task">
            <div class="pomodoro-task-header" id="pomodoro-task-header">
              <h3>Current Task</h3>
            </div>
            <div class="pomodoro-task-content">Select a task to start</div>
          </div>
          
          <div class="pomodoro-actions" id="pomodoro-actions">
            <button id="pomodoro-pause" class="btn btn-primary">Start</button>
            <button id="pomodoro-skip" class="btn btn-secondary" disabled>Skip</button>
          </div>
          
          <div class="pomodoro-task-actions" id="pomodoro-task-actions">
            <button id="pomodoro-done" class="btn btn-success" disabled>Mark as Done</button>
            <button id="pomodoro-not-done" class="btn btn-secondary" disabled>Not Done Yet</button>
          </div>
          
          <div class="pomodoro-break-actions" id="pomodoro-break-actions">
            <button id="pomodoro-continue" class="btn btn-primary">Continue to Next Task</button>
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

    // Re-cache elements
    timerDisplay = document.getElementById("pomodoro-timer");
    taskDisplay = document.getElementById("pomodoro-task");
    actionButtons = document.getElementById("pomodoro-actions");
    backButton = document.getElementById("pomodoro-back");
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
            ViewManager.showView(Constants.VIEWS.RECOMMENDATION);
          }
        } else {
          ViewManager.showView(Constants.VIEWS.RECOMMENDATION);
        }
      });
    }

    // Pause/Resume button
    if (pauseButton) {
      pauseButton.addEventListener("click", togglePauseResume);
    }

    // Skip button
    if (skipButton) {
      skipButton.addEventListener("click", skipTask);
    }

    // Done button
    if (doneButton) {
      doneButton.addEventListener("click", completeTask);
    }

    // Not done button
    if (notDoneButton) {
      notDoneButton.addEventListener("click", moveToNextTask);
    }

    // Continue button
    if (continueButton) {
      continueButton.addEventListener("click", startNextTask);
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
      pauseButton.textContent = "Resume";
      pauseButton.classList.remove("btn-secondary");
      pauseButton.classList.add("btn-primary");
    } else {
      // Start or resume the timer
      if (!timer) {
        // If this is the first start
        timeRemaining = Constants.POMODORO.WORK_TIME;
        updateTimerDisplay();
        updateProgress();

        // Enable controls
        skipButton.disabled = false;
        doneButton.disabled = false;
        notDoneButton.disabled = false;

        // Update task status
        if (tasks[currentTaskIndex]) {
          Database.updateNote(
            tasks[currentTaskIndex].id,
            tasks[currentTaskIndex].content,
            Constants.PROGRESS_STATES.IN_PROGRESS
          );

          // Update the task display
          updateTaskDisplay();
        }
      }

      timer = setInterval(updateTimer, 1000);
      pauseButton.textContent = "Pause";
      pauseButton.classList.remove("btn-primary");
      pauseButton.classList.add("btn-secondary");
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
        // Break is over, move to the next task
        isBreak = false;
        document.getElementById("pomodoro-state").textContent = "READY";
        document.getElementById("pomodoro-break-actions").style.display =
          "flex";
        document.getElementById("pomodoro-actions").style.display = "none";
        document.getElementById("pomodoro-task-actions").style.display = "none";
      } else {
        // Work period is over, start a break
        isBreak = true;

        // Show celebration
        showCelebration();

        // Determine break length (long break after every 4 pomodoros)
        breakCount++;
        if (breakCount % 4 === 0) {
          timeRemaining = Constants.POMODORO.LONG_BREAK;
          document.getElementById("pomodoro-state").textContent = "LONG BREAK";
        } else {
          timeRemaining = Constants.POMODORO.SHORT_BREAK;
          document.getElementById("pomodoro-state").textContent = "SHORT BREAK";
        }

        // Restart the timer for the break
        updateTimerDisplay();
        updateProgress(true);
        timer = setInterval(updateTimer, 1000);
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
  function updateProgress(isBreak = false) {
    const progressRing = document.querySelector(
      ".pomodoro-progress-ring-circle"
    );
    const circumference = 2 * Math.PI * 140; // 140 is the radius of our circle

    const totalTime = isBreak
      ? breakCount % 4 === 0
        ? Constants.POMODORO.LONG_BREAK
        : Constants.POMODORO.SHORT_BREAK
      : Constants.POMODORO.WORK_TIME;

    const dashoffset = circumference * (1 - timeRemaining / totalTime);

    progressRing.style.strokeDashoffset = dashoffset;
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
  }

  /**
   * Skip the current task
   */
  function skipTask() {
    if (confirm("Are you sure you want to skip this task?")) {
      moveToNextTask();
    }
  }

  /**
   * Complete the current task
   */
  function completeTask() {
    const task = tasks[currentTaskIndex];

    if (task) {
      // Mark the task as done
      Database.updateNote(
        task.id,
        task.content,
        Constants.PROGRESS_STATES.DONE
      );

      // Show celebration
      showCelebration();

      // Remove the task from the list
      tasks.splice(currentTaskIndex, 1);

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
      moveToNextTask(true);
    }
  }

  /**
   * Move to the next task without marking as done
   * @param {boolean} skipCounting - Whether to skip incrementing the current task index
   */
  function moveToNextTask(skipCounting = false) {
    // Clear the current timer
    clearInterval(timer);
    timer = null;
    isPaused = true;

    // Update UI
    pauseButton.textContent = "Start";
    pauseButton.classList.remove("btn-secondary");
    pauseButton.classList.add("btn-primary");

    // Move to next task if we have any
    if (!skipCounting) {
      currentTaskIndex = (currentTaskIndex + 1) % tasks.length;
    }

    // Reset the timer
    resetTimer();

    // Update the task display
    updateTaskDisplay();
  }

  /**
   * Start the next task after a break
   */
  function startNextTask() {
    document.getElementById("pomodoro-break-actions").style.display = "none";
    document.getElementById("pomodoro-actions").style.display = "flex";
    document.getElementById("pomodoro-task-actions").style.display = "flex";
    document.getElementById("pomodoro-state").textContent = "WORK";

    // Reset and start the timer
    resetTimer();
    isPaused = true; // So that togglePauseResume will start the timer
    togglePauseResume();
  }

  /**
   * Reset the timer to initial state
   */
  function resetTimer() {
    clearInterval(timer);
    timer = null;
    timeRemaining = Constants.POMODORO.WORK_TIME;
    isBreak = false;
    updateTimerDisplay();
    updateProgress();

    // Disable controls
    skipButton.disabled = true;
    doneButton.disabled = true;
    notDoneButton.disabled = true;
  }

  /**
   * Update the task display
   */
  function updateTaskDisplay() {
    const taskContent = document.querySelector(".pomodoro-task-content");
    const taskHeader = document.querySelector(".pomodoro-task-header");

    if (!taskHeader || !taskContent) return;

    if (tasks.length === 0) {
      taskContent.textContent =
        "No tasks available. Add tasks from the recommendation view.";
      taskHeader.innerHTML = "<h3>Current Task</h3>";
      return;
    }

    const task = tasks[currentTaskIndex];
    if (task) {
      // Highlight hashtags in the content
      const highlightedContent = task.content.replace(
        /#(\w+)/g,
        '<span class="tag">#$1</span>'
      );

      // Add the progress indicator in the header
      taskHeader.innerHTML = `
        <div class="pomodoro-task-progress">
          <div class="progress-indicator ${task.progress}"></div>
        </div>
        <h3>Current Task</h3>
      `;

      taskContent.innerHTML = highlightedContent;
    } else {
      taskContent.textContent = "Error: Task not found";
      taskHeader.innerHTML = "<h3>Current Task</h3>";
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

      // Go back to the recommendation view after the celebration
      ViewManager.showView(Constants.VIEWS.RECOMMENDATION);
    }, 5000);
  }

  /**
   * Set the tasks for the Pomodoro
   * @param {Array} taskList - List of tasks to work on
   */
  function setTasks(taskList) {
    tasks = [...taskList];
    currentTaskIndex = 0;

    // Reset the timer
    resetTimer();

    // Update task display
    updateTaskDisplay();
  }

  /**
   * Show the Pomodoro view
   * @param {Object} options - Options passed to the view
   */
  function show(options = {}) {
    // Set tasks if provided
    if (options.tasks && Array.isArray(options.tasks)) {
      setTasks(options.tasks);
    }

    // Initialize the UI
    document.getElementById("pomodoro-break-actions").style.display = "none";
    document.getElementById("pomodoro-actions").style.display = "flex";
    document.getElementById("pomodoro-task-actions").style.display = "flex";
    document.getElementById("pomodoro-state").textContent = "WORK";

    // Initialize timer display
    resetTimer();

    // Setup circle animation
    const circle = document.querySelector(".pomodoro-progress-ring-circle");
    const circumference = 2 * Math.PI * 140;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;
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
          ViewManager.showView(Constants.VIEWS.RECOMMENDATION);
        }
      } else {
        ViewManager.showView(Constants.VIEWS.RECOMMENDATION);
      }
    }
  }

  // Public API
  return {
    initialize,
    show,
    hide,
    handleKeyDown,
    setTasks,
  };
})();
