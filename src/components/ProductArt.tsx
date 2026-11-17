type Kind = "pouch" | "tin" | "box";

interface Look {
  kind: Kind;
  body: string;
  shade: string;
  ink: string;
}

const KRAFT: Look = {
  kind: "pouch",
  body: "#b4875a",
  shade: "#93693f",
  ink: "#3b2414",
};
const JADE: Look = {
  kind: "tin",
  body: "#2e6b4f",
  shade: "#204d39",
  ink: "#16241c",
};
const LOTUS: Look = {
  kind: "tin",
  body: "#c9667e",
  shade: "#a44c63",
  ink: "#4a1a27",
};
const TURMERIC: Look = {
  kind: "tin",
  body: "#c99a2e",
  shade: "#a37a1c",
  ink: "#3d2c05",
};
const HIGHLAND: Look = {
  kind: "tin",
  body: "#22503b",
  shade: "#163728",
  ink: "#16241c",
};
const GLAZE: Look = {
  kind: "box",
  body: "#2b4c7e",
  shade: "#1d365c",
  ink: "#14223a",
};

function lookFor(name: string, categorySlug: string): Look {
  const lower = name.toLowerCase();
  if (categorySlug === "ca-phe") return KRAFT;
  if (categorySlug === "dung-cu-pha-che") return GLAZE;
  if (lower.includes("sen")) return LOTUS;
  if (lower.includes("gừng")) return TURMERIC;
  if (lower.includes("shan")) return HIGHLAND;
  return JADE;
}

const WEIGHT = /\s*(\d+\s?(?:gói|túi|kg|ml|g))(?=\s|$)/i;
const CATEGORY_WORD = /^(cà phê|trà)\s+/i;

export function labelFor(name: string): { title: string; weight: string } {
  const weight = name.match(WEIGHT)?.[1] ?? "";
  let title = name.replace(WEIGHT, "").replace(CATEGORY_WORD, "").trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);
  return { title, weight };
}

function wrap(text: string, width: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]}…`;
    return kept;
  }
  return lines;
}

const KIND_WORD: Record<string, string> = {
  "ca-phe": "Cà phê",
  tra: "Trà",
  "dung-cu-pha-che": "Dụng cụ",
};

export function ProductArt({
  name,
  categorySlug,
  className = "",
}: {
  name: string;
  categorySlug: string;
  className?: string;
}) {
  const look = lookFor(name, categorySlug);
  const { title, weight } = labelFor(name);
  const lines = wrap(title, 11, 3);
  const labelTop = look.kind === "pouch" ? 104 : look.kind === "tin" ? 98 : 112;
  const textStart = labelTop + 30;

  return (
    <svg
      viewBox="0 0 200 240"
      className={`art ${className}`}
      role="img"
      aria-label={name}
    >
      <ellipse cx="100" cy="226" rx="70" ry="7" className="art-shadow" />

      {look.kind === "pouch" && (
        <g>
          <path
            d="M52 38 L148 38 L160 212 Q160 220 152 220 L48 220 Q40 220 40 212 Z"
            fill={look.body}
          />
          <path
            d="M148 38 L160 212 Q160 220 152 220 L132 220 L140 38 Z"
            fill={look.shade}
            opacity=".55"
          />
          <path d="M52 26 h96 v14 h-96 z" fill={look.shade} />
          <path
            d="M52 26 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6"
            fill="none"
            stroke={look.shade}
            strokeWidth="2"
          />
          <circle cx="100" cy="72" r="9" fill={look.shade} />
          <circle cx="100" cy="72" r="4" fill={look.body} />
        </g>
      )}

      {look.kind === "tin" && (
        <g>
          <rect
            x="56"
            y="52"
            width="88"
            height="168"
            rx="10"
            fill={look.body}
          />
          <rect
            x="120"
            y="52"
            width="24"
            height="168"
            rx="10"
            fill={look.shade}
            opacity=".5"
          />
          <rect
            x="50"
            y="34"
            width="100"
            height="26"
            rx="6"
            fill={look.shade}
          />
          <rect
            x="50"
            y="56"
            width="100"
            height="5"
            fill="#000"
            opacity=".12"
          />
        </g>
      )}

      {look.kind === "box" && (
        <g>
          <path d="M46 72 L100 52 L154 72 L100 92 Z" fill={look.shade} />
          <path d="M46 72 L100 92 L100 220 L46 200 Z" fill={look.body} />
          <path d="M154 72 L100 92 L100 220 L154 200 Z" fill={look.shade} />
          <path
            d="M60 140 q12 -14 24 0 t24 0"
            fill="none"
            stroke="#fff"
            strokeOpacity=".35"
            strokeWidth="2"
          />
        </g>
      )}

      <g className="art-label">
        <rect
          x="58"
          y={labelTop}
          width="84"
          height="88"
          rx="4"
          fill="#fbfaf4"
        />
        <text
          x="100"
          y={labelTop + 16}
          textAnchor="middle"
          className="art-kind"
          fill={look.shade}
        >
          {KIND_WORD[categorySlug] ?? "Lá & Hạt"}
        </text>
        {lines.map((line, i) => (
          <text
            key={line}
            x="100"
            y={textStart + i * 14}
            textAnchor="middle"
            className="art-title"
            fill={look.ink}
          >
            {line}
          </text>
        ))}
        {weight && (
          <text
            x="100"
            y={labelTop + 80}
            textAnchor="middle"
            className="art-weight"
            fill={look.shade}
          >
            {weight}
          </text>
        )}
      </g>
    </svg>
  );
}

export function categoryFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.startsWith("cà phê")) return "ca-phe";
  if (lower.startsWith("trà")) return "tra";
  return "dung-cu-pha-che";
}
