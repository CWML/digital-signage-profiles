export function selectCampaign(profiles, activeTeam) {
  const campaign = profiles.filter((profile) => profile.team === activeTeam);
  if (campaign.length === 0) {
    throw new Error(`No profiles are configured for the active team: ${activeTeam}.`);
  }
  return campaign;
}

export function selectPreviewProfile(profiles, profileId) {
  const profile = profiles.find(({ id }) => id === profileId);
  if (!profile) {
    throw new Error(`No profile is configured with the id: ${profileId}.`);
  }
  return profile;
}
