// Check if service workers are supported
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
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

  // We'll add the install button only when the DOM is fully loaded
  document.addEventListener("DOMContentLoaded", () => {
    const modeSelector = document.querySelector(".mode-selector");
    if (modeSelector) {
      const installButton = document.createElement("button");
      installButton.style.display = "none";
      installButton.style.position = "absolute";
      installButton.style.top = "1.5em";
      installButton.classList.add("btn", "btn-primary");
      installButton.textContent = "Install App";
      modeSelector.after(installButton);

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
    }
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Store the event so it can be triggered later
    deferredPrompt = e;

    // Update UI to notify the user they can install the PWA
    const installButton = document.querySelector(".btn.btn-primary");
    if (installButton) {
      installButton.style.display = "block";
    }
  });

  // Add event listener for when the app is successfully installed
  window.addEventListener("appinstalled", (evt) => {
    console.log("Vaata Mind was installed");
    const installButton = document.querySelector(".btn.btn-primary");
    if (installButton) {
      installButton.style.display = "none";
    }
  });
}
