const PROFILE_DATA_URL = new URL(
  "../data/profiles.json",
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