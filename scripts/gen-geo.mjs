// Builds the country / state / city lists behind the address dropdowns.
//
// Output (committed to the repo, so the app needs no location library at runtime):
//   src/data/countries.json   every country: [{ code, name }]
//   public/geo/<CODE>.json    one file per country: { states: [{ name, cities: [...] }] }
//
// The data comes from the Countries States Cities Database (Open Database License).
// To refresh it:
//   npm install --no-save @countrystatecity/countries
//   node scripts/gen-geo.mjs
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// GEO_PACKAGE_DIR lets the package live outside this project (e.g. a temp folder).
const require = createRequire(pathToFileURL(join(process.env.GEO_PACKAGE_DIR ?? root, "package.json")));
const geo = require("@countrystatecity/countries");

const byName = (a, b) => a.localeCompare(b, "en");
const clean = (list) => [...new Set(list.map((item) => String(item.name ?? "").trim()).filter(Boolean))].sort(byName);

const outDir = join(root, "public", "geo");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(join(root, "src", "data"), { recursive: true });

const countries = (await geo.getCountries())
  .map((c) => ({ code: c.iso2, name: String(c.name).trim() }))
  .filter((c) => /^[A-Z]{2}$/.test(c.code) && c.name)
  .sort((a, b) => byName(a.name, b.name));

let stateCount = 0;
let cityCount = 0;
let bytes = 0;
for (const country of countries) {
  const states = [];
  for (const state of await geo.getStatesOfCountry(country.code)) {
    const name = String(state.name ?? "").trim();
    if (!name) continue;
    const cities = clean(await geo.getCitiesOfState(country.code, state.iso2));
    states.push({ name, cities });
    cityCount += cities.length;
  }
  states.sort((a, b) => byName(a.name, b.name));
  stateCount += states.length;
  const json = JSON.stringify({ states });
  bytes += json.length;
  writeFileSync(join(outDir, `${country.code}.json`), json);
}

writeFileSync(join(root, "src", "data", "countries.json"), JSON.stringify(countries) + "\n");
writeFileSync(
  join(outDir, "ATTRIBUTION.txt"),
  [
    "The country, state and city lists in this folder are derived from the",
    "Countries States Cities Database by Darshan Gada (dr5hn):",
    "https://github.com/dr5hn/countries-states-cities-database",
    "",
    "They are made available under the Open Database License (ODbL) v1.0:",
    "https://opendatacommons.org/licenses/odbl/1-0/",
    "",
  ].join("\n"),
);

console.log(
  `${countries.length} countries, ${stateCount} states, ${cityCount} cities -> ${(bytes / 1048576).toFixed(1)} MB in public/geo`,
);
