# Claude Code Assistant Document for Vaata Mind

This document contains information and instructions for Claude to understand when working on this project.

## Vaata Mind

Vaata Mind is a note-taking application with task management features. It uses a module pattern for organization and localStorage for persistent data storage.

## Key Features

- **Note Taking**: Create and manage notes with hashtags and metadata
- **Task Management**: Track task progress (not-started, in-progress, done)
- **Pomodoro Timer**: Focus on tasks with 25-minute work periods
- **Views**: Different ways to interact with notes (Editor, Table, Explore, Pomodoro)

## Common Operations

### Linting and Testing

Run the following commands to lint the code:
```bash
# No specific linting commands defined yet
```

### Pomodoro Functionality

The Pomodoro timer follows these steps:
1. Add tasks to the queue from any view
2. Select a task to work on
3. Start the timer (25 min)
4. When timer ends, make a decision (mark as done, not done, or continue)
5. Take breaks between work sessions

### Progress States

Progress states for tasks are:
```javascript
PROGRESS_STATES: {
  NOT_STARTED: "not-started",
  IN_PROGRESS: "in-progress", 
  DONE: "done",
}
```

### Accessing Pomodoro

You can add tasks to Pomodoro from:
- Editor View: Click the ⏱️ Pomodoro button in the editor controls
- Table View: Click the ⏱️ button in the actions column
- Explore View: Shift+Click on any task node in the graph

### Important Files

- `/src/views/PomodoroView.js`: Pomodoro timer implementation
- `/src/views/EditorView.js`: Note editor interface
- `/src/views/TableView.js`: Table-based view of notes
- `/src/views/ExploreView.js`: Graph-based visualization
- `/src/modules/Database.js`: Data storage management
- `/src/modules/Constants.js`: Application constants
- `/src/modules/ViewManager.js`: View registration and navigation
- `/src/styles/pomodoro.css`: Styling for pomodoro interface

## Project Structure

The project follows a modular pattern with views handling different ways to interact with the application data.