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
  ],

  // View ids
  VIEWS: {
    EDITOR: "editor-view",
    MENU: "menu-view",
    EXPLORE: "explore-view",
    RECOMMENDATION: "recommendation-view",
    TABLE: "table-view",
    SETTINGS: "settings-view",
  },

  // Local storage key
  STORAGE_KEY: "minimalist_notes_db",

  // Application version key
  VERSION_KEY: "vaata_mind_version",
};
