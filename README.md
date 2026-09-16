# CWML Digital Signage Profiles

A staff-profile display for the Cushing/Whitney Medical Library digital signage staff feature campaign. The site is designed to run as a full-screen 16:9 web view in Appspace and loads the generated public-profile data in `data/profiles.json`.

The browser never requests Beatrix directly. A GitHub Action retrieves the public `medicine.yale.edu/profile/...` pages each night and regenerates the local JSON data, avoiding CORS and live-service dependencies in the display.

Hosted publicly at <https://cwml.github.io/digital-signage-profiles/>

## Project structure

```text
digital-signage-profiles/
├── css/
│   └── signage.css
├── data/
│   ├── profile-sources.json
│   └── profiles.json
├── js/
│   ├── app.js
│   ├── profile-card.js
│   └── profile-service.js
├── scripts/
│   ├── sync-profiles.mjs
│   └── lib/parse-profile.mjs
├── test/
│   └── parse-profile.test.mjs
├── .github/workflows/
│   └── sync-profiles.yml
├── package.json
├── .gitignore
├── index.html
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
- Run `npm ci`, then `npm test` to run parser and frontend-safety tests. Run `npm run sync-profiles` to refresh `data/profiles.json` locally.
- JSON-LD provides names, credentials, biographies, email, phone, portraits, titles, affiliations/locations, canonical URLs, and source update dates. Scoped public HTML parsing supplies optional pronouns, publication totals, and Medical Research Interests.
- Empty optional fields are omitted from the generated data, so the corresponding card sections do not appear.
- The scheduled workflow runs at 06:15 UTC nightly (1:15 AM EST / 2:15 AM EDT), and can also be started with **Run workflow** in GitHub Actions. It runs tests first and commits only a changed `data/profiles.json` as `github-actions[bot]`.
- To deploy, enable GitHub Pages for the repository’s `main` branch and root directory. In Appspace, point the Web View card to <https://cwml.github.io/digital-signage-profiles/>.
