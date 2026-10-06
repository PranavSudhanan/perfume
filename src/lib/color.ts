const HEX = /^#([0-9a-f]{6})$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

/** Averages hex colours — used to tint the bottle from the chosen notes. */
export function blendColors(colors: (string | null | undefined)[], fallback = "#e8c98a") {
  const valid = colors.filter(isHexColor);
  if (!valid.length) return fallback;
  const sum = [0, 0, 0];
  for (const hex of valid) {
    const n = parseInt(hex.slice(1), 16);
    sum[0] += (n >> 16) & 255;
    sum[1] += (n >> 8) & 255;
    sum[2] += n & 255;
  }
  return (
    "#" +
    sum
      .map((c) =>
        Math.round(c / valid.length)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
