const PROFILE_DATA_URL = new URL(
  "../data/profiles.json",
  import.meta.url
);
const SIGNAGE_CONFIG_URL = new URL(
  "../data/signage-config.json",
  import.meta.url
);

export async function getProfiles() {
  const response = await fetch(PROFILE_DATA_URL);

  if (!response.ok) {
    throw new Error(
      `Profile request failed with status ${response.status}`
    );
  }

  const profiles = await response.json();

  if (!Array.isArray(profiles) || profiles.length === 0) {
    throw new Error("No profiles are configured.");
  }

  return profiles;
}

export async function getSignageConfig() {
  const response = await fetch(SIGNAGE_CONFIG_URL);

  if (!response.ok) {
    throw new Error(
      `Signage configuration request failed with status ${response.status}`
    );
  }

  const config = await response.json();
  if (
    !config ||
    typeof config.activeTeam !== "string" ||
    !config.activeTeam.trim() ||
    !Number.isInteger(config.displayDurationSeconds) ||
    config.displayDurationSeconds <= 0
  ) {
    throw new Error("Signage configuration is invalid.");
  }

  return {
    activeTeam: config.activeTeam.trim(),
    displayDurationSeconds: config.displayDurationSeconds
  };
}
