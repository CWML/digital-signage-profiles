export function createProfileCard(profile) {
  const services = profile.services
    .map(
      (service) => `
        <li>
          <span class="checkmark" aria-hidden="true">✓</span>
          <span>${service}</span>
        </li>
      `
    )
    .join("");

  const audiences = profile.audiences
    .map((audience) => `<span>${audience}</span>`)
    .join('<span class="separator" aria-hidden="true">·</span>');

  return `
    <article class="profile">
      <div class="portrait-container">
        <img
          class="portrait"
          src="${profile.photoUrl}"
          alt="Portrait of ${profile.name}"
        />
      </div>

      <div class="profile-content">
        <header class="profile-header">
          <p class="team-label">Meet ${profile.team}</p>

          <div class="name-row">
            <h1>${profile.name}</h1>
            <p class="pronouns">${profile.pronouns}</p>
          </div>

          <p class="title">${profile.title}</p>
        </header>

        <section class="services">
          <h2>How I can help</h2>
          <ul>${services}</ul>
        </section>

        <section class="audiences">
          <h2>I work with</h2>
          <div class="audience-list">${audiences}</div>
        </section>

        <a
          class="profile-link"
          href="${profile.profileUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >
          View full profile
        </a>
      </div>

      <footer class="footer">
        Cushing/Whitney Medical Library
      </footer>
    </article>
  `;
}