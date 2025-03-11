// Register the service worker for PWA functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "ServiceWorker registration successful with scope:",
          registration.scope
        );
      })
      .catch((err) => {
        console.error("ServiceWorker registration failed:", err);
      });
  });

  // Handle service worker updates
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  // Setup for PWA install prompt
  let deferredPrompt;
  const installButton = document.createElement("button");
  installButton.style.display = "none";
  installButton.style.position = "absolute";
  installButton.style.top = "1.5em";
  installButton.classList.add("btn", "btn-primary");
  installButton.textContent = "Install App";
  document.querySelector(".mode-selector").after(installButton);

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Store the event so it can be triggered later
    deferredPrompt = e;
    // Update UI to notify the user they can install the PWA
    installButton.style.display = "block";

    // Event listener for the install button
    installButton.addEventListener("click", async () => {
      if (!deferredPrompt) return;

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User ${outcome} the installation`);

      // We no longer need the prompt
      deferredPrompt = null;

      // Hide the install button
      installButton.style.display = "none";
    });
  });

  // Add event listener for when the app is successfully installed
  window.addEventListener("appinstalled", (evt) => {
    console.log("Vaata Mind was installed");
    installButton.style.display = "none";
  });
}

// Add URL handling for PWA shortcuts
window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode");

  if (mode) {
    const editorView = document.getElementById("editor-view");
    const menuView = document.getElementById("menu-view");
    const exploreView = document.getElementById("explore-view");
    const recommendationView = document.getElementById("recommendation-view");
    const tableView = document.getElementById("table-view");

    // Hide all views
    editorView.classList.add("hidden");
    menuView.classList.add("hidden");
    exploreView.classList.add("hidden");
    recommendationView.classList.add("hidden");
    tableView.classList.add("hidden");

    // Show requested view
    if (mode === "editor") {
      editorView.classList.remove("hidden");
      // Clear editor
      document.getElementById("note-editor").value = "";
      document.getElementById("note-editor").focus();
    } else if (mode === "explore") {
      exploreView.classList.remove("hidden");
      // Update filters and graph visualization (assuming these functions exist)
      if (typeof updateFilters === "function") updateFilters();
      if (typeof updateProgressFilters === "function") updateProgressFilters();
      if (typeof createGraphVisualization === "function")
        createGraphVisualization();
    } else if (mode === "recommendation") {
      recommendationView.classList.remove("hidden");
      // Reset viewed notes and update (assuming these variables/functions exist)
      if (typeof viewedNoteIds !== "undefined") viewedNoteIds.clear();
      if (typeof updateRecommendationView === "function")
        updateRecommendationView();
    } else if (mode === "table") {
      tableView.classList.remove("hidden");
      // Update table (assuming these functions exist)
      if (typeof updateTagFilters === "function") updateTagFilters();
      if (typeof renderNotesTable === "function") renderNotesTable();
    }
  }
});
