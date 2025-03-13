const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

// Helper for colors in terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

// Helper functions for console output
function step(message) {
  console.log(`${colors.blue}==>${colors.reset} ${message}`);
}

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message) {
  console.error(`${colors.red}✗ ERROR:${colors.reset} ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(`${colors.cyan}i${colors.reset} ${message}`);
}

function divider() {
  console.log(
    `${colors.yellow}--------------------------------------------${colors.reset}`
  );
}

// Get current version from Cargo.toml
function getCurrentVersion() {
  try {
    const cargoPath = path.resolve("tauri-app/src-tauri/Cargo.toml");
    const cargoContent = fs.readFileSync(cargoPath, "utf8");
    const versionMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);

    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    }

    error("Could not find current version in Cargo.toml");
  } catch (err) {
    error(`Failed to read Cargo.toml: ${err.message}`);
  }
}

// Update version in Cargo.toml
function updateCargoToml(newVersion) {
  try {
    const cargoPath = path.resolve("tauri-app/src-tauri/Cargo.toml");
    let cargoContent = fs.readFileSync(cargoPath, "utf8");

    cargoContent = cargoContent.replace(
      /(version\s*=\s*")([^"]+)(")/,
      `$1${newVersion}$3`
    );

    fs.writeFileSync(cargoPath, cargoContent);
    success(`Updated version in Cargo.toml to ${newVersion}`);
  } catch (err) {
    error(`Failed to update Cargo.toml: ${err.message}`);
  }
}

// Update version in README.md
function updateReadme(newVersion) {
  try {
    const readmePath = path.resolve("README.md");
    let readmeContent = fs.readFileSync(readmePath, "utf8");

    // Update version display
    readmeContent = readmeContent.replace(
      /(### Latest Version: )(\d+\.\d+\.\d+)/,
      `$1${newVersion}`
    );

    // Update download links
    readmeContent = readmeContent.replace(
      /\/vaata-mind-v\d+\.\d+\.\d+\//g,
      `/vaata-mind-v${newVersion}/`
    );

    readmeContent = readmeContent.replace(
      /_\d+\.\d+\.\d+_/g,
      `_${newVersion}_`
    );

    readmeContent = readmeContent.replace(
      /-\d+\.\d+\.\d+-/g,
      `-${newVersion}-`
    );

    fs.writeFileSync(readmePath, readmeContent);
    success(`Updated version in README.md to ${newVersion}`);
  } catch (err) {
    error(`Failed to update README.md: ${err.message}`);
  }
}

// Calculate the new version based on the version type
function calculateNewVersion(currentVersion, type) {
  if (type === "major" || type === "minor" || type === "patch") {
    const versionParts = currentVersion.split(".");
    const versionType = ["major", "minor", "patch"].indexOf(type);

    // Cast to number, increment, then cast back to string
    versionParts[versionType] = (
      parseInt(versionParts[versionType], 10) + 1
    ).toString();

    // Reset all lower parts
    for (let i = versionType + 1; i < versionParts.length; i++) {
      versionParts[i] = "0";
    }

    return versionParts.join(".");
  } else if (/^\d+\.\d+\.\d+$/.test(type)) {
    return type;
  } else if (!type) {
    return currentVersion;
  }

  error(
    "Invalid version type. Please use major, minor, patch, or a version with the format x.x.x"
  );
}

// Main deploy function
function deploy(type) {
  step("Starting deployment process");
  divider();

  // Get current version
  const currentVersion = getCurrentVersion();
  info(`Current version: ${currentVersion}`);

  // Calculate new version
  const newVersion = calculateNewVersion(currentVersion, type);
  step(`Deploying version: ${newVersion}`);

  // Update files
  updateCargoToml(newVersion);
  updateReadme(newVersion);

  // Git operations
  try {
    step("Committing changes");
    execSync("git add -A");

    try {
      execSync(`git commit -m "Version ${newVersion}"`);
      success("Changes committed");
    } catch (e) {
      info("No changes to commit");
      return;
    }

    step("Creating tag");
    execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`);
    success(`Created tag v${newVersion}`);

    step("Pushing changes and tags");
    execSync("git push");
    execSync("git push --tags");
    success("Changes and tags pushed to remote repository");

    divider();
    success(`Version ${newVersion} deployed successfully!`);
  } catch (err) {
    error(`Git operation failed: ${err.message}`);
  }
}

// Check if the script is being run directly
if (require.main === module) {
  // Process command line arguments
  const versionType = process.argv[2];
  deploy(versionType);
} else {
  // Being imported as a module, export the deploy function
  module.exports = deploy;
}
