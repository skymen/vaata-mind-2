import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

(async () => {
  const update = await check();
  if (update) {
    if (globalThis.showStatus)
      globalThis.showStatus("Update Available. Downloading...");
    await update.downloadAndInstall();

    if (globalThis.showStatus) globalThis.showStatus("Restarting...");
    await relaunch();
  }
})();
