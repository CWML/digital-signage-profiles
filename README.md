# CWML Digital Signage Profiles

A staff-profile display for the Cushing/Whitney Medical Library digital signage staff feature campaign. The site is designed to run as a full-screen 16:9 web view in Appspace and loads the generated public-profile data in `data/profiles.json`.

The browser never requests Beatrix directly. A GitHub Action retrieves the public `medicine.yale.edu/profile/...` pages each night and regenerates the local JSON data, avoiding CORS and live-service dependencies in the display.

Hosted publicly at <https://cwml.github.io/digital-signage-profiles/>

## Project structure

```text
digital-signage-profiles/
├── .github/
│   └── workflows/
│       └── sync-profiles.yml
├── assets/
│   └── fonts/                       # Local licensed fonts; gitignored
├── css/
│   └── signage.css
├── data/
│   ├── profile-overrides.json
│   ├── profile-sources.json
│   ├── profiles.json                # Generated profile data
│   └── signage-config.json
├── js/
│   ├── app.js
│   ├── campaign.js
│   ├── profile-card.js
│   └── profile-service.js
├── scripts/
│   ├── lib/
│   │   ├── apply-profile-overrides.mjs
│   │   └── parse-profile.mjs
│   └── sync-profiles.mjs
├── test/
│   └── parse-profile.test.mjs
├── .gitignore
├── index.html
├── package-lock.json
├── package.json
└── README.md
```

## Preview locally

Because the profile data is loaded with `fetch`, preview the site through a local web server rather than opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Data notes

- `data/profile-sources.json` is the maintainer-edited list of people. Add or remove an object there, using a unique lowercase-hyphenated `id`, a non-empty signage `team`, and an HTTPS `https://medicine.yale.edu/profile/...` URL.
- `data/profile-overrides.json` is the maintainer-edited exception layer. Its values replace or supplement synchronized fields after every refresh, so corrections persist. For example:

  ```json
  {
    "alyssa-grimshaw": {
      "bio": "Corrected biography text."
    }
  }
  ```

  You can override `name`, `title`, `team`, `pronouns`, `photoUrl`, `profileUrl`, `bio`, `medicalResearchInterests`, or individual fields within `contact` and `publicationsOverview`. Override IDs must already exist in `profile-sources.json`.
- `data/signage-config.json` controls the active campaign. Set `activeTeam` to the exact team name used in `profile-sources.json`; the display loops through those profiles in source-list order. `displayDurationSeconds` is the dwell time for each profile (currently 120 seconds). For example, changing the active team to `"Clinical"` switches the next page load to the Clinical campaign.
- Add `?profile=person-id` to a local preview URL to show only one profile without cycling, for example `http://localhost:8000/?profile=kate-nyhan`.
- Run `npm ci`, then `npm test` to run parser and frontend-safety tests. Run `npm run sync-profiles` to refresh `data/profiles.json` locally.
- JSON-LD provides names, credentials, biographies, email, phone, portraits, titles, affiliations/locations, canonical URLs, and source update dates. Scoped public HTML parsing supplies optional pronouns, Medical Research Interests, standard Publications Overview totals, and Research at a Glance publication/citation totals when the standard overview is absent.
- Empty optional fields are omitted from the generated data, so the corresponding card sections do not appear.
- The scheduled workflow runs at 06:15 UTC nightly (1:15 AM EST / 2:15 AM EDT), and can also be started with **Run workflow** in GitHub Actions. It runs tests first and commits only a changed `data/profiles.json` as `github-actions[bot]`.
- Yale New and Mallory font files are local, licensed assets and are intentionally excluded from Git. The CSS uses its standard system-font fallbacks when those files are unavailable.
- To deploy, enable GitHub Pages for the repository’s `main` branch and root directory. In Appspace, point the Web View card to <https://cwml.github.io/digital-signage-profiles/>.
