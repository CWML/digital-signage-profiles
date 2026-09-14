# CWML Digital Signage Profiles

A staff-profile display for the Cushing/Whitney Medical Library digital signage staff feature campaign. The site is designed to run as a full-screen 16:9 web view in Appspace and rotate automatically through profiles defined in `data/profiles.json`.

This display pulls source information from <beatrix.yale.edu> and reorganizes and displays content in a concise, campaign-friendly manner.

Hosted publicly at <https://cwml.github.io/digital-signage-profiles/>

## Project structure

```text
digital-signage-profiles/
├── css/
│   └── signage.css
├── data/
│   └── profiles.json
├── js/
│   └── signage.js
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

- Includes only information that is already public and approved for signage
- Uses stable, approved portrait URLs
- The `profileUrl` value will be used to generate the QR destination