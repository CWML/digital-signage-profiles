import { selectCampaign, selectPreviewProfile } from "./campaign.js";
import { getProfiles, getSignageConfig } from "./profile-service.js";
import { createProfileCard } from "./profile-card.js";

async function initializeSignage() {
  const display = document.querySelector("#signage");

  try {
    const [profiles, config] = await Promise.all([
      getProfiles(),
      getSignageConfig()
    ]);
    const requestedProfileId = new URLSearchParams(window.location.search).get(
      "profile"
    );
    const campaign = requestedProfileId
      ? [selectPreviewProfile(profiles, requestedProfileId)]
      : selectCampaign(profiles, config.activeTeam);
    let profileIndex = 0;

    const renderProfile = () => {
      display.innerHTML = createProfileCard(campaign[profileIndex]);
      sizePortraitFrame(display);
    };

    renderProfile();

    if (!requestedProfileId && campaign.length > 1) {
      window.setInterval(() => {
        profileIndex = (profileIndex + 1) % campaign.length;
        renderProfile();
      }, config.displayDurationSeconds * 1000);
    }
  } catch (error) {
    console.error(error);
    display.innerHTML =
      '<p class="error">Unable to load staff profiles.</p>';
  }
}

function sizePortraitFrame(display) {
  const image = display.querySelector(".portrait");
  const frame = display.querySelector(".portrait-container");

  if (!image || !frame) return;

  const applyImageDimensions = () => {
    if (!image.naturalWidth || !image.naturalHeight) return;

    const maximumWidth = 540;
    const maximumHeight = 405;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const frameRatio = maximumWidth / maximumHeight;

    if (imageRatio >= frameRatio) {
      frame.style.width = `${maximumWidth}px`;
      frame.style.height = `${Math.round(maximumWidth / imageRatio)}px`;
    } else {
      frame.style.width = `${Math.round(maximumHeight * imageRatio)}px`;
      frame.style.height = `${maximumHeight}px`;
    }
  };

  if (image.complete) {
    applyImageDimensions();
  } else {
    image.addEventListener("load", applyImageDimensions, { once: true });
  }
}

initializeSignage();
