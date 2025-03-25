import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { openUrl } from '@tauri-apps/plugin-opener';
import callbackTemplate from './callbackTemplate.js'; // Assuming you have this template in a separate file
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

(async () => {
  const update = await check();
  if (update) {
    if (StatusMessage && StatusMessage.show)
      StatusMessage.show("Update Available");
    const yes = await DialogBox.confirm(
      `Update ${update.version} is available! Would you like to update now?`,
      "Update Available"
    );
    if (yes) {
      await update.downloadAndInstall();
      if (StatusMessage && StatusMessage.show)
        StatusMessage.show("Restarting...");
      await relaunch();
    }
  }
})();

(async () => {
  await onOpenUrl((urls) => {
    console.log("Received URL:", urls);
    window.__TAURI__.window.appWindow.setFocus();
  });
})();

const openBrowserToConsent = (port) => {
  // Replace CLIEN_ID_FROM_FIREBASE
  // Must allow localhost as redirect_uri for CLIENT_ID on GCP: https://console.cloud.google.com/apis/credentials
  return openUrl('https://accounts.google.com/o/oauth2/auth?' +
    'response_type=token&' +
    'client_id=557148045075-52gu7aug421s9ju6hhqitpggmsgri5hh.apps.googleusercontent.com&' +
    `redirect_uri=http%3A//localhost:${port}&` +
    'scope=email%20profile%20openid&' +
    'prompt=consent'
  );
};

const openGoogleSignIn = (port) => {
  return new Promise((resolve, reject) => {
    openBrowserToConsent(port).then(resolve).catch(reject);
  });
};

window.signInWithOAuth = function (auth, provider) {
  return new Promise((resolve, reject) => {
    // Set up the OAuth callback listener from the Tauri plugin.
    // This listener waits for the URL containing the access token.
    listen('oauth://url', (event) => {
      try {
        const callbackUrl = new URL(event.payload);
        // Extract the access token from the URL hash.
        const accessToken = new URLSearchParams(callbackUrl.hash.substring(1)).get('access_token');
        if (!accessToken) {
          return reject(new Error('No access token found in callback URL.'));
        }
        // Create a Firebase credential with the obtained access token.
        const credential = provider.credential(null, accessToken);
        // Sign in with the credential, then resolve with a result similar to signInWithPopup.
        window.firebaseAuthFunctions.signInWithCredential(auth, credential)
          .then((result) => {
            resolve({
              success: true,
              user: result.user,
            });
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    }).catch(reject); // Handle errors from setting up the listener.

    // Start the Tauri OAuth plugin process.
    invoke('plugin:oauth|start', {
      config: {
        // Use a custom callback page/template for a friendlier experience.
        response: callbackTemplate,
      },
    })
      .then((port) => {
        // Open the browser for the user to grant consent.
        openGoogleSignIn(port)
          .catch(reject);
      })
      .catch(reject);
  });
}