import { isHexColor } from "@/lib/color";

/** The bespoke bottle illustration: liquid colour and label text come from the customer's choices. */
export function Bottle({
  color,
  label,
  className,
}: {
  color?: string | null;
  label?: string | null;
  className?: string;
}) {
  const liquid = isHexColor(color) ? color : "#e8c98a";
  const text = (label ?? "").trim();
  // Unique-enough ids so several bottles can render on one page.
  const id = liquid.slice(1);
  return (
    <svg viewBox="0 0 400 660" className={className} role="img" aria-label="Your perfume bottle">
      <defs>
        <linearGradient id={`liq-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={liquid} />
          <stop offset="1" stopColor={liquid} stopOpacity="0.72" />
        </linearGradient>
        <linearGradient id="bottle-cap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b8924a" />
          <stop offset=".45" stopColor="#f3deaa" />
          <stop offset="1" stopColor="#b8924a" />
        </linearGradient>
        <clipPath id="bottle-body">
          <rect x="50" y="170" width="300" height="470" rx="26" />
        </clipPath>
      </defs>
      <ellipse cx="200" cy="646" rx="170" ry="10" fill="#000" opacity=".12" />
      <rect x="142" y="20" width="116" height="124" rx="8" fill="url(#bottle-cap)" />
      <rect x="160" y="142" width="80" height="30" fill="#b8924a" opacity=".85" />
      <rect
        x="50"
        y="170"
        width="300"
        height="470"
        rx="26"
        fill="#fff"
        fillOpacity=".3"
        stroke="#fff"
        strokeOpacity=".8"
        strokeWidth="3"
      />
      <g clipPath="url(#bottle-body)">
        <rect
          x="50"
          y="222"
          width="300"
          height="430"
          fill={`url(#liq-${id})`}
          style={{ transition: "fill 400ms" }}
        />
        <rect x="50" y="222" width="300" height="5" fill="#fff" opacity=".4" />
        <rect x="50" y="606" width="300" height="40" fill="#000" opacity=".08" />
        <rect x="72" y="214" width="14" height="380" rx="7" fill="#fff" opacity=".4" />
        <rect x="96" y="244" width="5" height="260" rx="2.5" fill="#fff" opacity=".25" />
      </g>
      <rect x="112" y="352" width="176" height="136" fill="#f7f1e3" />
      <rect x="120" y="360" width="160" height="120" fill="none" stroke="#2a2118" strokeOpacity=".3" />
      <text
        x="200"
        y="416"
        textAnchor="middle"
        fontFamily="var(--f-heading), Georgia, serif"
        fontSize={text.length > 12 ? 15 : text.length > 8 ? 19 : 24}
        fill="#2a2118"
      >
        {text || "Your name"}
      </text>
      <line x1="178" x2="222" y1="434" y2="434" stroke="#2a2118" strokeOpacity=".45" />
      <text
        x="200"
        y="456"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="8.5"
        letterSpacing="3"
        fill="#2a2118"
        fillOpacity=".65"
      >
        BESPOKE PARFUM
      </text>
    </svg>
  );
}
