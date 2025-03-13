// move code from src to tauri-app/src

const fs = require("fs");
const path = require("path");
const vite = require("vite");

const srcPath = path.join(__dirname, "src");
const extraPath = path.join(__dirname, "tauri-extra");
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

function viteBuild() {
  // build tauri-extra/tauri-updater.js
  console.log("Building tauri-extra/tauri-updater.js");
  const updaterPath = path.join(extraPath, "tauri-updater.js");
  // this is just
  return vite
    .build({
      configFile: false,
      build: {
        lib: {
          entry: updaterPath,
          name: "TauriUpdater",
          fileName: "tauri-updater",
          formats: ["es"],
        },
        outDir: tauriAppPath,
        emptyOutDir: false,
        minify: "esbuild",
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
            manualChunks: undefined,
          },
        },
      },
    })
    .then(() => {
      console.log(
        `✅ Built tauri-updater.js -> ${tauriAppPath}/tauri-updater.js`
      );
      return tauriAppPath;
    })
    .catch((error) => {
      console.error("❌ Error building tauri-updater.js:", error);
      throw error;
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

//copy tauri-extra/ to tauri-app/src-tauri/
// console.log("Copying tauri-extra/ to tauri-app/src-tauri/");
// copyDir(extraPath, tauriAppPath);

// in the new index.html, add a module script at the end of the body tag to load the tauri-updater.js
console.log("Adding module script to load tauri-updater.js");
let indexHtml;
try {
  indexHtml = fs.readFileSync(path.join(tauriAppPath, "index.html"), "utf8");
} catch (error) {
  console.error("Error reading index.html", error);
  process.exit(1);
}

const scriptTag = `<script type="module" src="tauri-updater.js"></script>`;
const newHtml = indexHtml.replace("</body>", `${scriptTag}</body>`);
fs.writeFileSync(path.join(tauriAppPath, "index.html"), newHtml);

viteBuild();
