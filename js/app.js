import { getProfiles } from "./profile-service.js";
import { createProfileCard } from "./profile-card.js";

async function initializeSignage() {
  const display = document.querySelector("#signage");

  try {
    const profiles = await getProfiles();
    display.innerHTML = createProfileCard(profiles[0]);
  } catch (error) {
    console.error(error);
    display.innerHTML =
      '<p class="error">Unable to load staff profiles.</p>';
  }
}

initializeSignage();