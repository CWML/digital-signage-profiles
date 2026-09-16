const OVERRIDABLE_FIELDS = new Set([
  "name",
  "title",
  "team",
  "pronouns",
  "photoUrl",
  "profileUrl",
  "contact",
  "bio",
  "publicationsOverview",
  "medicalResearchInterests"
]);

const CONTACT_FIELDS = new Set(["email", "phone", "location"]);
const PUBLICATION_FIELDS = new Set(["publications", "citations", "yaleCoAuthors"]);

export function applyProfileOverrides(profiles, overrides) {
  if (!isPlainObject(overrides)) {
    throw new Error("Profile overrides must be an object keyed by profile id.");
  }

  const profileIds = new Set(profiles.map(({ id }) => id));
  for (const id of Object.keys(overrides)) {
    if (!profileIds.has(id)) {
      throw new Error(`Profile override references an unknown id: ${id}.`);
    }
  }

  return profiles.map((profile) => {
    const override = overrides[profile.id];
    if (override === undefined) return profile;
    validateOverride(profile.id, override);

    return {
      ...profile,
      ...override,
      contact: override.contact
        ? { ...profile.contact, ...override.contact }
        : profile.contact,
      publicationsOverview: override.publicationsOverview
        ? { ...profile.publicationsOverview, ...override.publicationsOverview }
        : profile.publicationsOverview
    };
  });
}

function validateOverride(id, override) {
  if (!isPlainObject(override)) {
    throw new Error(`Profile override for ${id} must be an object.`);
  }

  for (const field of Object.keys(override)) {
    if (!OVERRIDABLE_FIELDS.has(field)) {
      throw new Error(`Profile override for ${id} has an unsupported field: ${field}.`);
    }
  }

  validateNestedFields(id, "contact", override.contact, CONTACT_FIELDS);
  validateNestedFields(id, "publicationsOverview", override.publicationsOverview, PUBLICATION_FIELDS);
}

function validateNestedFields(id, field, value, allowedFields) {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    throw new Error(`Profile override for ${id} must make ${field} an object.`);
  }
  for (const nestedField of Object.keys(value)) {
    if (!allowedFields.has(nestedField)) {
      throw new Error(`Profile override for ${id} has an unsupported ${field} field: ${nestedField}.`);
    }
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
