import assert from "node:assert/strict";
import test from "node:test";
import { selectCampaign, selectPreviewProfile } from "../js/campaign.js";
import { createProfileCard } from "../js/profile-card.js";
import { applyProfileOverrides } from "../scripts/lib/apply-profile-overrides.mjs";
import { parseProfileHtml, validateSources } from "../scripts/lib/parse-profile.mjs";

const source = { id: "alex-example", team: "Academic Research & Education", profileUrl: "https://medicine.yale.edu/profile/alex-example/" };

function page({ person = basePerson(), body = "" } = {}) {
  return `<!doctype html><html><body><script data-schema="ProfilePage" type="application/ld+json">${JSON.stringify({ "@type": "ProfilePage", mainEntity: person })}</script>${body}</body></html>`;
}

function basePerson() {
  return {
    "@type": "Person", name: "Alex Example", honorificSuffix: ["MLIS", "MPH"],
    jobTitle: ["Research Librarian", "Secondary title"], description: "An evidence synthesis librarian.",
    email: "alex@example.edu", telephone: "+12035550123", image: { url: "https://images.example.edu/alex.jpg" },
    url: "https://medicine.yale.edu/profile/alex-example/", affiliation: [{ name: "Example Medical Library" }],
    updatedDate: "2026-09-01T00:00:00.0000000Z"
  };
}

test("extracts JSON-LD fields and appends credentials once", () => {
  const profile = parseProfileHtml(page(), source);
  assert.equal(profile.name, "Alex Example, MLIS, MPH");
  assert.equal(profile.title, "Research Librarian");
  assert.equal(profile.contact.email, "alex@example.edu");
  assert.equal(profile.contact.location, "Example Medical Library");
  assert.equal(profile.sourceUpdatedDate, "2026-09-01T00:00:00.0000000Z");
  const alreadySuffixed = parseProfileHtml(page({ person: { ...basePerson(), name: "Alex Example, MLIS", honorificSuffix: ["MLIS"] } }), source);
  assert.equal(alreadySuffixed.name, "Alex Example, MLIS");
});

test("extracts optional pronouns, publication statistics, and research interests", () => {
  const profile = parseProfileHtml(page({ body: `<script id="profile-state">{&quot;pronouns&quot;:[{&quot;subjective&quot;:&quot;they&quot;,&quot;objective&quot;:&quot;them&quot;,&quot;possessive&quot;:&quot;theirs&quot;}]}</script><article><h3>Publications Overview</h3><ul><li>103 Publications</li><li>3,611 Citations</li><li>139 Yale Co-Authors</li></ul></article><section><h4>Medical Research Interests</h4><div>Systematic Reviews as Topic; Health Informatics</div></section>` }), source);
  assert.equal(profile.pronouns, "they/them/theirs");
  assert.deepEqual(profile.publicationsOverview, { publications: 103, citations: 3611, yaleCoAuthors: 139 });
  assert.deepEqual(profile.medicalResearchInterests, ["Systematic Reviews as Topic", "Health Informatics"]);
});

test("falls back to Research at a Glance publication and citation totals", () => {
  const profile = parseProfileHtml(page({ body: `<section class="profile-details-publications-timeline-glance"><div class="profile-details-publications-timeline-glance__stats"><div>39<span>Publications</span></div><div>715<span>Citations</span></div></div></section>` }), source);
  assert.deepEqual(profile.publicationsOverview, { publications: 39, citations: 715 });
});

test("applies durable profile overrides after synchronization", () => {
  const profiles = [{
    id: "alex-example",
    bio: "Synced biography.",
    contact: { email: "alex@example.edu", location: "Library" },
    publicationsOverview: { publications: 39, citations: 715 }
  }];
  const result = applyProfileOverrides(profiles, {
    "alex-example": {
      bio: "Corrected local biography.",
      contact: { email: "corrected@example.edu" },
      publicationsOverview: { yaleCoAuthors: 12 }
    }
  });

  assert.deepEqual(result[0], {
    id: "alex-example",
    bio: "Corrected local biography.",
    contact: { email: "corrected@example.edu", location: "Library" },
    publicationsOverview: { publications: 39, citations: 715, yaleCoAuthors: 12 }
  });
});

test("rejects unknown profiles and unsupported override fields", () => {
  assert.throws(
    () => applyProfileOverrides([{ id: "alex-example" }], { "unknown-person": { bio: "No." } }),
    /unknown id/
  );
  assert.throws(
    () => applyProfileOverrides([{ id: "alex-example" }], { "alex-example": { id: "changed" } }),
    /unsupported field/
  );
});

test("selects an active-team campaign and supports one-profile previews", () => {
  const profiles = [
    { id: "alex-example", team: "Research" },
    { id: "bea-example", team: "Clinical" },
    { id: "cam-example", team: "Research" }
  ];
  assert.deepEqual(
    selectCampaign(profiles, "Research").map(({ id }) => id),
    ["alex-example", "cam-example"]
  );
  assert.equal(selectPreviewProfile(profiles, "bea-example").team, "Clinical");
  assert.throws(() => selectCampaign(profiles, "Unknown"), /No profiles/);
  assert.throws(() => selectPreviewProfile(profiles, "unknown"), /No profile/);
});

test("omits absent optional fields", () => {
  const minimal = { "@type": "Person", name: "Alex Example", jobTitle: ["Research Librarian"], image: { url: "https://images.example.edu/alex.jpg" }, url: source.profileUrl };
  const profile = parseProfileHtml(page({ person: minimal }), source);
  assert.equal("contact" in profile, false);
  assert.equal("pronouns" in profile, false);
  assert.equal("publicationsOverview" in profile, false);
  assert.equal("medicalResearchInterests" in profile, false);
});

test("rejects missing or invalid ProfilePage JSON-LD", () => {
  assert.throws(() => parseProfileHtml("<html></html>", source), /No valid ProfilePage JSON-LD Person/);
  assert.throws(() => parseProfileHtml('<script data-schema="ProfilePage">{"mainEntity":{"@type":"Organization"}}</script>', source), /No valid ProfilePage JSON-LD Person/);
});

test("rejects a non-Yale source URL", () => {
  assert.throws(() => validateSources([{ ...source, profileUrl: "https://example.com/profile/alex-example/" }]), /medicine\.yale\.edu/);
});

test("escapes remote profile text and blocks unsafe URLs in the template renderer", () => {
  const card = createProfileCard({ name: '<img src=x onerror="alert(1)">', title: "<script>alert(1)</script>", team: "A & B", photoUrl: "javascript:alert(1)", profileUrl: "javascript:alert(1)", bio: "<b>Not markup</b>", medicalResearchInterests: ["<em>Safe text</em>"] });
  assert.match(card, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(card, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(card, /src="#"/);
  assert.doesNotMatch(card, /<script>alert\(1\)<\/script>/);
});
