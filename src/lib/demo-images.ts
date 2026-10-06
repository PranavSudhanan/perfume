/**
 * Photography for the demo content, served straight from Unsplash's image CDN
 * (free to use under the Unsplash License). The bottles were chosen to show no
 * brand names or logos.
 * These are placeholders: replace them with the brand's own product photos from
 * the admin panel — nothing in the app depends on these particular images.
 */
const photo = (id: string, width: number, height: number, extra = "") =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${height}&q=75${extra}`;

/** 4:5 crops for product galleries and collection tiles. */
const portrait = (id: string, extra = "") => photo(id, 1000, 1250, extra);
/** 16:9 crops for hero slides and banners. */
const wide = (id: string) => photo(id, 2000, 1125);
/** 5:6 crops for image-with-text sections. */
const tall = (id: string) => photo(id, 1200, 1440);

export const DEMO_IMAGES = {
  /** Keyed by product slug: [bottle, key ingredient]. */
  products: {
    noor: [portrait("1638295916768-459f6cf440bc"), portrait("1615885108069-7d5bef9a7e22")],
    "rosa-nocturne": [portrait("1707539159801-87009aded4cb"), portrait("1541724673942-6b2993cf1c81")],
    "vetiver-rain": [portrait("1716857591457-7d7fa45199c6"), portrait("1555037015-1498966bcd7c")],
    "oud-royale": [
      // The original is landscape; keep the two bottles in frame.
      portrait("1695049999693-bf4f95cfae6e", "&crop=focalpoint&fp-x=0.38&fp-y=0.5"),
      portrait("1627769916425-74c2344a3439"),
    ],
    "jasmine-veil": [portrait("1705899853374-d91c048b81d2"), portrait("1612380635121-411eda9ecbb9")],
    "citrus-atlas": [portrait("1733660227168-444e3c751a1e"), portrait("1608322368735-b6b6ec262af7")],
    "santal-dusk": [portrait("1743309043742-9b4976a16478"), portrait("1583418007992-a8e33a92e7ad")],
    "blue-monsoon": [portrait("1615160460366-2c9a41771b51"), portrait("1769528508466-60dcc4a4a531")],
  } as Record<string, [string, string]>,
  categories: {
    floral: portrait("1588878237213-a2d39308dfdb"),
    woody: portrait("1736506159893-22cca29b8018"),
    fresh: portrait("1590502593747-42a996133562"),
    oriental: portrait("1554345795-1243a276630e"),
  } as Record<string, string>,
  /** Home page hero slides, in order. */
  hero: [
    wide("1761948244770-c617aef59d90"),
    wide("1585328000852-779be6a6582b"),
    wide("1612611450392-826af708c34a"),
  ],
  /** Wide promotional banner. */
  banner: wide("1709660274785-eff6978c2e77"),
  /** A perfume being filled by hand — for "our atelier" sections. */
  atelier: tall("1709662217659-c7966220219f"),
  /** A blank-label bottle held in hand — for the build-your-own promo. */
  builder: tall("1682251008222-412b140cbf4f"),
};
