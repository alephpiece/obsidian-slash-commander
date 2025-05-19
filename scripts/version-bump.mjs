import { readFileSync, writeFileSync } from "fs";

function bumpVersion(version, type) {
    let [major, minor, patch] = version.split(".").map(Number);
    if (type === "major") {
        major += 1;
        minor = 0;
        patch = 0;
    } else if (type === "minor") {
        minor += 1;
        patch = 0;
    } else {
        patch += 1;
    }
    return [major, minor, patch].join(".");
}

function updateFileVersion(file, newVersion) {
    const json = JSON.parse(readFileSync(file, "utf-8"));
    json.version = newVersion;
    writeFileSync(file, JSON.stringify(json, null, 4) + "\n");
}

const type = (process.argv[2] || "patch").toLowerCase();
if (!["major", "minor", "patch"].includes(type)) {
    console.error("Usage: node version-bump.mjs [major|minor|patch]");
    process.exit(1);
}

// 1. read current version in package.json
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const oldVersion = pkg.version;
if (!/^\d+\.\d+\.\d+$/.test(oldVersion)) {
    console.error("Error: version in package.json must be in x.y.z format");
    process.exit(1);
}
const newVersion = bumpVersion(oldVersion, type);

// 2. update package.json and manifest.json
updateFileVersion("package.json", newVersion);
updateFileVersion("manifest.json", newVersion);

// 3. update versions.json
const manifest = JSON.parse(readFileSync("manifest.json", "utf-8"));
const minAppVersion = manifest.minAppVersion;
let versions = {};
try {
    versions = JSON.parse(readFileSync("versions.json", "utf-8"));
} catch {
    // do nothing
}
versions[newVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, 4) + "\n");

console.log(`Bumped version: ${oldVersion} → ${newVersion} (${type})`);
