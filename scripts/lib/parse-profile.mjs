import * as cheerio from "cheerio";

const PROFILE_HOST = "medicine.yale.edu";

export function validateSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error("Profile sources must be a non-empty array.");
  }

  const ids = new Set();
  return sources.map((source) => {
    if (!source || typeof source !== "object") {
      throw new Error("Each profile source must be an object.");
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.id ?? "")) {
      throw new Error(`Profile source has an invalid id: ${source.id ?? "(missing)"}.`);
    }
    if (ids.has(source.id)) {
      throw new Error(`Profile source id is duplicated: ${source.id}.`);
    }
    ids.add(source.id);
    if (typeof source.team !== "string" || !source.team.trim()) {
      throw new Error(`Profile source ${source.id} needs a non-empty team.`);
    }
    validateSourceUrl(source.profileUrl, source.id);
    return { id: source.id, team: source.team.trim(), profileUrl: source.profileUrl };
  });
}

export function parseProfileHtml(html, source) {
  const $ = cheerio.load(html);
  const person = extractPersonJsonLd($);
  const name = withCredentials(person.name, person.honorificSuffix);
  const title = firstString(person.jobTitle);
  const photoUrl = httpsUrl(person.image?.url, "image URL");
  const profileUrl = httpsUrl(person.url ?? source.profileUrl, "profile URL");

  if (!name || !title || !photoUrl) {
    throw new Error("ProfilePage JSON-LD is missing a required name, job title, or image URL.");
  }

  const contact = omitEmpty({
    email: cleanText(person.email),
    phone: cleanText(person.telephone) ?? extractLabeledValue($, "Phone"),
    location: structuredLocation(person) ?? extractLabeledValue($, "Location")
  });

  return omitEmpty({
    id: source.id,
    name,
    title,
    team: source.team,
    pronouns: extractPronouns(html),
    photoUrl,
    profileUrl,
    contact: Object.keys(contact).length ? contact : undefined,
    bio: cleanText(person.description),
    publicationsOverview: extractPublicationsOverview($),
    medicalResearchInterests: extractResearchInterests($),
    sourceUpdatedDate: cleanText(person.updatedDate)
  });
}

export function extractPersonJsonLd($) {
  const scripts = $("script[data-schema='ProfilePage']");
  for (const script of scripts.toArray()) {
    try {
      const value = JSON.parse($(script).text().trim());
      if (value?.mainEntity && hasPersonType(value.mainEntity["@type"])) {
        return value.mainEntity;
      }
    } catch {
      // A page may contain unrelated malformed data; only a valid ProfilePage counts.
    }
  }
  throw new Error("No valid ProfilePage JSON-LD Person was found.");
}

export function validateSourceUrl(value, id = "source") {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Profile source ${id} has an invalid profileUrl.`);
  }
  if (url.protocol !== "https:" || url.hostname !== PROFILE_HOST || !url.pathname.startsWith("/profile/")) {
    throw new Error(`Profile source ${id} must use https://medicine.yale.edu/profile/.`);
  }
}

function extractPublicationsOverview($) {
  const heading = $("h1, h2, h3, h4, [aria-label='Publications Overview']")
    .filter((_, element) => cleanText($(element).text()) === "Publications Overview")
    .first();
  const container = heading.closest("article, section");
  const text = heading.length
    ? cleanText((container.length ? container : heading.parent()).text()) ?? ""
    : "";
  const values = {
    publications: statistic(text, "Publications"),
    citations: statistic(text, "Citations"),
    yaleCoAuthors: statistic(text, "Yale Co-Authors")
  };
  if (Object.values(values).some((value) => value !== undefined)) {
    return omitEmpty(values);
  }

  return extractResearchAtAGlance($);
}

function extractResearchAtAGlance($) {
  const timeline = $(".profile-details-publications-timeline-glance").first();
  if (!timeline.length) return undefined;

  const text = cleanText(timeline.text()) ?? "";
  const values = {
    publications: statistic(text, "Publications"),
    citations: statistic(text, "Citations")
  };
  return Object.values(values).some((value) => value !== undefined) ? omitEmpty(values) : undefined;
}

function extractResearchInterests($) {
  const heading = $("h1, h2, h3, h4")
    .filter((_, element) => cleanText($(element).text()) === "Medical Research Interests")
    .first();
  if (!heading.length) return undefined;

  const content = heading.next().text() || heading.parent().text().replace(heading.text(), "");
  const interests = cleanText(content)
    ?.split(/\s*;\s*/)
    .map((item) => cleanText(item))
    .filter(Boolean);
  return interests?.length ? [...new Set(interests)] : undefined;
}

function extractPronouns(html) {
  const decoded = html.replaceAll("&quot;", '"').replaceAll("&#x27;", "'");
  const match = decoded.match(/"pronouns"\s*:\s*\[\s*\{([^}]*)}/);
  if (!match) return undefined;
  const forms = ["subjective", "objective", "possessive"]
    .map((key) => match[1].match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`))?.[1])
    .map(cleanText)
    .filter(Boolean);
  return forms.length ? forms.join("/") : undefined;
}

function extractLabeledValue($, label) {
  const element = $("dt, h2, h3, h4, span, strong")
    .filter((_, node) => cleanText($(node).text()) === label)
    .first();
  return element.length ? cleanText(element.next().text()) : undefined;
}

function structuredLocation(person) {
  const location = firstValue(person.workLocation) ?? firstValue(person.affiliation);
  if (typeof location === "string") return cleanText(location);
  return cleanText(location?.name) ?? cleanText(location?.address?.name);
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function statistic(text, label) {
  const match = text.match(new RegExp(`([\\d,.]+)\\s*${label.replace("-", "[- ]")}`, "i"));
  if (!match) return undefined;
  const number = Number(match[1].replaceAll(",", ""));
  return Number.isFinite(number) ? number : undefined;
}

function withCredentials(name, suffixes) {
  const cleanName = cleanText(name);
  if (!cleanName) return undefined;
  const suffix = (Array.isArray(suffixes) ? suffixes : [suffixes])
    .map(cleanText)
    .filter(Boolean)
    .filter((item) => !new RegExp(`(?:,|\\s)${escapeRegExp(item)}$`, "i").test(cleanName));
  return suffix.length ? `${cleanName}, ${suffix.join(", ")}` : cleanName;
}

function httpsUrl(value, field) {
  const clean = cleanText(value);
  try {
    const url = new URL(clean);
    if (url.protocol === "https:") return url.href;
  } catch {
    // Fall through to the concise validation error below.
  }
  throw new Error(`ProfilePage JSON-LD has an invalid ${field}.`);
}

function firstString(value) {
  return cleanText(Array.isArray(value) ? value[0] : value);
}

function hasPersonType(type) {
  return Array.isArray(type) ? type.includes("Person") : type === "Person";
}

function cleanText(value) {
  return typeof value === "string" && value.replace(/\s+/g, " ").trim()
    ? value.replace(/\s+/g, " ").trim()
    : undefined;
}

function omitEmpty(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== ""));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
