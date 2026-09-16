export function createProfileCard(profile) {
  const contactSection = createContactSection(profile.contact);
  const publicationsSection = createPublicationsSection(
    profile.publicationsOverview
  );
  const biographySection = createBiographySection(profile.bio);
  const researchSection = createResearchSection(
    profile.medicalResearchInterests
  );

  const hasCardDetails = contactSection || publicationsSection;
  const nameLengthClass = profile.name.length > 30
    ? " profile-page--long-name"
    : "";

  return `
    <article class="profile-page${nameLengthClass}">
      <div class="page-spotlight">
        <div>
          <p class="spotlight-label">Staff Spotlight</p>
          ${
            profile.team
              ? `<p class="spotlight-team">${escapeHtml(profile.team)}</p>`
              : ""
          }
        </div>
      </div>

      <section class="identity-card">
        <div class="identity-content">
          <div class="name-row">
            <h1>${escapeHtml(profile.name)}</h1>
          </div>

          ${
            profile.pronouns
              ? `<p class="pronouns">${escapeHtml(profile.pronouns)}</p>`
              : ""
          }

          <p class="title">${escapeHtml(profile.title)}</p>

          ${
            hasCardDetails
              ? `
                <div class="profile-details">
                  ${contactSection}
                  ${publicationsSection}
                </div>
              `
              : ""
          }
        </div>

        <div class="portrait-container">
          <img
            class="portrait"
            src="${safeHttpsUrl(profile.photoUrl)}"
            alt="Portrait of ${escapeHtml(profile.name)}"
          />
        </div>
      </section>

      <div class="profile-body">
        ${biographySection}
        ${researchSection}
      </div>
    </article>
  `;
}

function createContactSection(contact) {
  if (!contact) {
    return "";
  }

  const contactItems = [
    contact.email
      ? `
        <li>
          <svg class="contact-icon" aria-hidden="true" viewBox="0 0 24 24">
            <rect x="2.5" y="4.5" width="19" height="15" rx="1.5"></rect>
            <path d="m3.5 6 8.5 6.5L20.5 6"></path>
          </svg>
          <a href="mailto:${encodeURIComponent(contact.email)}">${escapeHtml(contact.email)}</a>
        </li>
      `
      : ""
  ]
    .filter(Boolean)
    .join("");

  if (!contactItems) {
    return "";
  }

  return `
    <section class="detail-section contact-section">
      <h2>Contact Info</h2>
      <ul class="contact-list">
        ${contactItems}
      </ul>
    </section>
  `;
}

function createPublicationsSection(publications) {
  if (!publications) {
    return "";
  }

  const statistics = [
    publications.publications != null
      ? {
          value: publications.publications.toLocaleString(),
          label: "Publications"
        }
      : null,
    publications.citations != null
      ? {
          value: publications.citations.toLocaleString(),
          label: "Citations"
        }
      : null,
    publications.yaleCoAuthors != null
      ? {
          value: publications.yaleCoAuthors.toLocaleString(),
          label: "Yale Co-Authors"
        }
      : null
  ].filter(Boolean);

  if (statistics.length === 0) {
    return "";
  }

  return `
    <section class="detail-section publications-section">
      <h2>Publications Overview</h2>

      <div class="publication-stats">
        ${statistics
          .map(
            (statistic) => `
              <div class="publication-stat">
                ${publicationIcon(statistic.label)}
                <span><strong>${statistic.value}</strong> ${statistic.label}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function publicationIcon(label) {
  const icons = {
    Publications: `
      <svg class="publication-icon" aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 4h4v15H4zM10 2h4v17h-4zM16 5h4v14h-4z"></path>
        <path d="M5 7h2M11 5h2M17 8h2"></path>
      </svg>
    `,
    Citations: `
      <svg class="publication-icon" aria-hidden="true" viewBox="0 0 24 24">
        <path d="M3 5.5c3-1.5 5-1.5 9 1v12c-4-2.5-6-2.5-9-1z"></path>
        <path d="M21 5.5c-3-1.5-5-1.5-9 1v12c4-2.5 6-2.5 9-1z"></path>
      </svg>
    `,
    "Yale Co-Authors": `
      <svg class="publication-icon" aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="6" r="2.5"></circle>
        <path d="M7.5 18c.5-3.5 2-5 4.5-5s4 1.5 4.5 5M5.5 10a2 2 0 1 0 0-4M18.5 10a2 2 0 1 1 0-4M3 18c.5-3 1.5-4.5 3.5-4.5M21 18c-.5-3-1.5-4.5-3.5-4.5"></path>
      </svg>
    `
  };

  return icons[label] ?? "";
}

function createBiographySection(bio) {
  if (!bio) {
    return "";
  }

  const paragraphs = Array.isArray(bio) ? bio : [bio];

  return `
    <section class="content-section biography">
      <h2>Biography</h2>

      <div class="section-copy">
        ${paragraphs
          .filter(Boolean)
          .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
          .join("")}
      </div>
    </section>
  `;
}

function createResearchSection(interests) {
  if (!Array.isArray(interests) || interests.length === 0) {
    return "";
  }

  return `
    <section class="content-section research-interests">
      <h2>Medical Research Interests</h2>

      <ul class="interest-list">
        ${interests
          .map((interest) => `<li>${escapeHtml(interest)}</li>`)
          .join("")}
      </ul>
    </section>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? escapeHtml(url.href) : "#";
  } catch {
    return "#";
  }
}
