import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ask } from "@tauri-apps/plugin-dialog";

(async () => {
  const update = await check();
  if (update) {
    if (globalThis.showStatus) globalThis.showStatus("Update Available");
    const yes = await ask(`Update ${update.version} is available!`, {
      title: "Update Available",
      kind: "info",
      okLabel: "Update now",
      cancelLabel: "Cancel",
    });
    if (yes) {
      await update.downloadAndInstall();
      if (globalThis.showStatus) globalThis.showStatus("Restarting...");
      await relaunch();
    }
  }
})();
