import countries from "@/data/countries.json";

/**
 * Every country, by ISO code and English name. The much larger state and city
 * lists live in public/geo/<CODE>.json and are fetched by the browser only for
 * the country a customer picks. Regenerate both with scripts/gen-geo.mjs.
 */
export type Country = { code: string; name: string };

export const COUNTRIES: Country[] = countries;

const byName = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c]));

export function findCountry(name: string | null | undefined): Country | undefined {
  return name ? byName.get(name.trim().toLowerCase()) : undefined;
}

/** Turns the country names saved in Settings into full entries, dropping any that are unknown. */
export function toCountries(names: string[]): Country[] {
  const found = names.map(findCountry).filter((c): c is Country => !!c);
  return found.length ? found : [{ code: "IN", name: "India" }];
}
