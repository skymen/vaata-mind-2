import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

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
