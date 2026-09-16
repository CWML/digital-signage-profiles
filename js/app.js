import { getProfiles } from "./profile-service.js";
import { createProfileCard } from "./profile-card.js";

async function initializeSignage() {
  const display = document.querySelector("#signage");

  try {
    const profiles = await getProfiles();
    const requestedProfileId = new URLSearchParams(window.location.search).get(
      "profile"
    );
    const profile = profiles.find(
      ({ id }) => id === requestedProfileId
    ) ?? profiles[0];

    display.innerHTML = createProfileCard(profile);
    sizePortraitFrame(display);
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
