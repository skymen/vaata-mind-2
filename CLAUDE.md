# Vaata Mind Development Guide

## Build & Run Commands
- `npm run package-tauri` - Package web app for Tauri
- `npm run build-tauri` - Build Tauri application
- `npm run deploy` - Run deployment script (updates versions)

## Code Style Guidelines

### Structure
- Use module pattern: `const Module = (() => { /* private scope */ return { /* public API */ }; })();`
- Export public methods via object return at module end

### Naming Conventions
- Modules/Components/Views: PascalCase (EditorView, Database)
- Functions/Variables: camelCase (getNoteById, currentNote)
- Constants: UPPER_SNAKE_CASE (TIME_MARKERS, PROGRESS_STATES)

### Formatting
- 2-space indentation
- Use semicolons consistently
- Double quotes for strings
- JSDoc comments for documentation

### Error Handling
- Use try/catch blocks with specific error messages
- Log errors via console.error with context

### Types
- Use JSDoc for indicating types in comments
- Document parameters and return values

### File Organization
- /src/components/ - UI components
- /src/modules/ - Core functionality
- /src/views/ - View controllers
- /src/styles/ - CSS styles