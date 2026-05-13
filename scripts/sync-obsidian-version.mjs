import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { stdout } from "node:process";

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function readJson(file) {
    return JSON.parse(readFileSync(file, "utf-8"));
}

function writeJson(file, data) {
    writeFileSync(file, JSON.stringify(data, null, 4) + "\n");
}

function parseVersion(version) {
    const match = version.match(VERSION_PATTERN);
    if (!match) {
        throw new Error(`Invalid semver version: ${version}`);
    }

    return match.slice(1, 4).map(Number);
}

function compareVersions(a, b) {
    const aParts = parseVersion(a);
    const bParts = parseVersion(b);

    for (let i = 0; i < aParts.length; i++) {
        if (aParts[i] !== bParts[i]) {
            return aParts[i] - bParts[i];
        }
    }

    return a.localeCompare(b);
}

function getLatestVersion(versions, currentVersion) {
    return Object.keys(versions)
        .filter((version) => version !== currentVersion && VERSION_PATTERN.test(version))
        .sort(compareVersions)
        .at(-1);
}

function sortVersions(versions) {
    return Object.fromEntries(
        Object.entries(versions).sort(([versionA], [versionB]) =>
            compareVersions(versionA, versionB)
        )
    );
}

const pkg = readJson("package.json");
const version = pkg.version;

if (!VERSION_PATTERN.test(version)) {
    throw new Error(`package.json version must be valid semver: ${version}`);
}

const manifest = readJson("manifest.json");
manifest.version = version;
writeJson("manifest.json", manifest);

const versions = existsSync("versions.json") ? readJson("versions.json") : {};
const latestVersion = getLatestVersion(versions, version);
const latestMinAppVersion = latestVersion ? versions[latestVersion] : undefined;
const currentMinAppVersion = manifest.minAppVersion;

if (
    versions[version] !== undefined ||
    latestMinAppVersion === undefined ||
    latestMinAppVersion !== currentMinAppVersion
) {
    versions[version] = currentMinAppVersion;
    writeJson("versions.json", sortVersions(versions));
}

stdout.write(`Synced Obsidian plugin metadata for ${version}\n`);
