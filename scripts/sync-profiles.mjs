import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { applyProfileOverrides } from "./lib/apply-profile-overrides.mjs";
import { parseProfileHtml, validateSources } from "./lib/parse-profile.mjs";

const sourcesPath = new URL("../data/profile-sources.json", import.meta.url);
const overridesPath = new URL("../data/profile-overrides.json", import.meta.url);
const outputPath = new URL("../data/profiles.json", import.meta.url);
const USER_AGENT = "CWML Digital Signage Profile Sync/1.0 (+https://cwml.github.io/digital-signage-profiles/)";
const TIMEOUT_MS = 20_000;

async function main() {
  const sources = validateSources(JSON.parse(await readFile(sourcesPath, "utf8")));
  const overrides = JSON.parse(await readFile(overridesPath, "utf8"));
  const profiles = [];

  for (const source of sources) {
    try {
      const html = await fetchProfile(source.profileUrl);
      profiles.push(parseProfileHtml(html, source));
    } catch (error) {
      throw new Error(`Unable to synchronize ${source.id}: ${error.message}`);
    }
  }

  const output = `${JSON.stringify(applyProfileOverrides(profiles, overrides), null, 2)}\n`;
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== output) {
    await writeFile(outputPath, output);
    console.log(`Updated ${fileURLToPath(outputPath)}.`);
  } else {
    console.log("Profile data is already current.");
  }
}

async function fetchProfile(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers: { "user-agent": USER_AGENT }, signal: controller.signal });
    if (!response.ok) throw new Error(`request returned HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
