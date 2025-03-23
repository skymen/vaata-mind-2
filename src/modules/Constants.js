/**
 * Application Constants
 */
const Constants = {
  // Progress states
  PROGRESS_STATES: {
    NOT_STARTED: "not-started",
    IN_PROGRESS: "in-progress",
    DONE: "done",
  },

  // Time markers for notes
  TIME_MARKERS: {
    TODAY: "!today",
    TOMORROW: "!tomorrow",
    NEXT_WEEK: "!nextweek",
    NEXT_MONTH: "!nextmonth",
    IMPORTANT: "!important",
    DUE: "!due:",
    NO_DUE_DATE: "!noDueDate",
  },

  // Time marker options for autocomplete
  TIME_MARKER_OPTIONS: [
    {
      value: "!important",
      label: "Important",
      description: "Mark as important",
    },
    { value: "!today", label: "Today", description: "Due today" },
    { value: "!tomorrow", label: "Tomorrow", description: "Due tomorrow" },
    { value: "!nextweek", label: "Next Week", description: "Due next week" },
    { value: "!nextmonth", label: "Next Month", description: "Due next month" },
    { value: "!due:", label: "Due Date", description: "Set custom due date" },
    { value: "!noDueDate", label: "No Due Date", description: "Remove due date" },
  ],

  // View ids
  VIEWS: {
    EDITOR: "editor-view",
    MENU: "menu-view",
    EXPLORE: "explore-view",
    RECOMMENDATION: "recommendation-view",
    TABLE: "table-view",
    SETTINGS: "settings-view",
    POMODORO: "pomodoro-view",
    SEARCH: "search-view",
  },

  // Local storage key
  STORAGE_KEY: "minimalist_notes_db",

  // Application version key
  VERSION_KEY: "vaata_mind_version",

  // Pomodoro settings
  POMODORO: {
    WORK_TIME: 25 * 60, // 25 minutes in seconds
    SHORT_BREAK: 5 * 60, // 5 minutes in seconds
    LONG_BREAK: 15 * 60, // 15 minutes in seconds
    MAX_TASKS: 7,
    WARNING_TASKS: 3, // Turn orange at this many tasks
    DANGER_TASKS: 5, // Turn red at this many tasks
  },
};
