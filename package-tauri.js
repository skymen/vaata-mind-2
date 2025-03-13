// move code from src to tauri-app/src

const fs = require("fs");
const path = require("path");

const srcPath = path.join(__dirname, "src");
const tauriAppPath = path.join(__dirname, "tauri-app/dist");

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        removeDir(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach((file) => {
    const curPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.lstatSync(curPath).isDirectory()) {
      copyDir(curPath, destPath);
    } else {
      fs.copyFileSync(curPath, destPath);
    }
  });
}

console.log("removing tauri-app/dist");
removeDir(tauriAppPath);

console.log("Copying files from src to tauri-app/dist");
copyDir(srcPath, tauriAppPath);

// remove service-worker.js from tauri-app/src
console.log("Removing service-worker.js from tauri-app/dist");
fs.unlinkSync(path.join(tauriAppPath, "service-worker.js"));

//empty content of service-worker-registration.js
console.log("Emptying service-worker-registration.js");
fs.writeFileSync(path.join(tauriAppPath, "service-worker-registration.js"), "");
