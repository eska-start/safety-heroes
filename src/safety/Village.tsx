"use client";

export type Place = "fire" | "police" | "home" | "street";

export function VillageMap({ stars, onGo }: { stars: Record<Place, number>; onGo: (p: Place) => void }) {
  return (
    <svg viewBox="0 0 800 500" className="village" role="img" aria-label="안전마을 지도">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#bae6fd" />
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#86efac" />
          <stop offset="1" stopColor="#4ade80" />
        </linearGradient>
      </defs>

      <rect width="800" height="330" fill="url(#sky)" />
      <rect y="330" width="800" height="170" fill="url(#grass)" />

      {/* 태양 */}
      <g transform="translate(90,80)">
        <g className="sun-rays">
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x="-4" y="-52" width="8" height="20" rx="4" fill="#fde047"
              transform={`rotate(${i * 30})`} />
          ))}
        </g>
        <circle r="34" fill="#fde047" stroke="#f59e0b" strokeWidth="5" />
        <circle cx="-10" cy="-4" r="4" fill="#92400e" />
        <circle cx="10" cy="-4" r="4" fill="#92400e" />
        <path d="M -12 10 Q 0 20 12 10" stroke="#92400e" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>

      {/* 구름 */}
      <g className="cloud c1" transform="translate(250,70)">
        <ellipse cx="0" cy="0" rx="46" ry="24" fill="#fff" opacity="0.95" />
        <ellipse cx="36" cy="8" rx="34" ry="18" fill="#fff" opacity="0.95" />
        <ellipse cx="-36" cy="8" rx="30" ry="16" fill="#fff" opacity="0.95" />
      </g>
      <g className="cloud c2" transform="translate(560,110)">
        <ellipse cx="0" cy="0" rx="40" ry="20" fill="#fff" opacity="0.9" />
        <ellipse cx="30" cy="6" rx="28" ry="15" fill="#fff" opacity="0.9" />
      </g>

      {/* 도로 */}
      <rect x="0" y="350" width="800" height="90" rx="8" fill="#64748b" />
      <rect x="380" y="330" width="60" height="170" fill="#64748b" />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={20 + i * 78} y={392} width={40} height={8} rx={4} fill="#fde047" />
      ))}
      {/* 횡단보도 */}
      {[-24, -8, 8, 24].map((dx) => (
        <rect key={dx} x={410 + dx - 7} y={352} width={14} height={86} fill="#f8fafc" opacity="0.9" />
      ))}

      {/* 소방서 */}
      <g className="bldg" onClick={() => onGo("fire")}>
        <rect x="40" y="180" width="180" height="150" rx="14" fill="#ef4444" />
        <rect x="40" y="180" width="180" height="40" rx="14" fill="#dc2626" />
        <rect x="60" y="250" width="70" height="80" rx="8" fill="#7f1d1d" />
        <rect x="140" y="250" width="60" height="80" rx="8" fill="#7f1d1d" />
        <rect x="70" y="120" width="34" height="70" rx="6" fill="#fca5a5" />
        <rect x="70" y="120" width="34" height="14" rx="6" fill="#991b1b" />
        <rect x="52" y="228" width="156" height="34" rx="10" fill="#fff" />
        <text x="130" y="253" textAnchor="middle" fontSize="24" fill="#dc2626">소방서</text>
        <StarBadge x={196} y={172} n={stars.fire} />
        <g className="pin"><circle cx="130" cy="150" r="10" fill="#fde047" stroke="#b45309" strokeWidth="3" /></g>
      </g>

      {/* 경찰서 */}
      <g className="bldg" onClick={() => onGo("police")}>
        <rect x="580" y="180" width="180" height="150" rx="14" fill="#3b82f6" />
        <rect x="580" y="180" width="180" height="40" rx="14" fill="#1d4ed8" />
        <rect x="640" y="250" width="60" height="80" rx="8" fill="#1e3a8a" />
        <rect x="600" y="240" width="50" height="40" rx="6" fill="#bfdbfe" />
        <rect x="690" y="240" width="50" height="40" rx="6" fill="#bfdbfe" />
        <circle cx="670" cy="200" r="14" fill="#facc15" stroke="#92400e" strokeWidth="3" />
        <rect x="592" y="228" width="156" height="34" rx="10" fill="#fff" />
        <text x="670" y="253" textAnchor="middle" fontSize="24" fill="#1d4ed8">경찰서</text>
        <StarBadge x={736} y={172} n={stars.police} />
      </g>

      {/* 학교 */}
      <g className="bldg" onClick={() => onGo("street")}>
        <rect x="300" y="200" width="200" height="130" rx="14" fill="#fbbf24" />
        <circle cx="400" cy="200" r="22" fill="#fff" stroke="#92400e" strokeWidth="5" />
        <rect x="397" y="184" width="6" height="18" rx="3" fill="#92400e" />
        <rect x="330" y="250" width="44" height="40" rx="6" fill="#fef3c7" />
        <rect x="386" y="250" width="44" height="40" rx="6" fill="#fef3c7" />
        <rect x="442" y="250" width="44" height="40" rx="6" fill="#fef3c7" />
        <rect x="330" y="150" width="140" height="34" rx="10" fill="#fff" />
        <text x="400" y="175" textAnchor="middle" fontSize="22" fill="#b45309">학교 · 횡단보도</text>
        <StarBadge x={484} y={192} n={stars.street} />
      </g>

      {/* 우리집 */}
      <g className="bldg" onClick={() => onGo("home")}>
        <rect x="300" y="380" width="0" height="0" fill="none" />
        <g transform="translate(120,398)">
          <rect x="-55" y="0" width="110" height="70" rx="8" fill="#fde68a" />
          <path d="M -65 2 L 0 -42 L 65 2 Z" fill="#b45309" />
          <rect x="-14" y="28" width="28" height="42" rx="4" fill="#92400e" />
          <rect x="-44" y="14" width="26" height="22" rx="4" fill="#bfdbfe" />
          <rect x="18" y="14" width="26" height="22" rx="4" fill="#bfdbfe" />
          <rect x="30" y="-50" width="14" height="26" fill="#78716c" />
          <g className="smoke">
            <circle cx="37" cy="-62" r="8" fill="#e7e5e4" opacity="0.8" />
            <circle cx="42" cy="-76" r="10" fill="#e7e5e4" opacity="0.6" />
          </g>
        </g>
        <rect x="52" y="462" width="136" height="28" rx="10" fill="#fff" />
        <text x="120" y="483" textAnchor="middle" fontSize="20" fill="#92400e">우리집</text>
        <StarBadge x={182} y={452} n={stars.home} />
      </g>

      {/* 나무 + 캐릭터 */}
      <Tree x={262} y={420} />
      <Tree x={700} y={420} />
      <Tree x={30} y={420} />
      <Kid x={330} y={452} />
      <Kid x={500} y={380} color="#38bdf8" />
    </svg>
  );
}

function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-7" y="-34" width="14" height="34" rx="6" fill="#92400e" />
      <circle cx="0" cy="-48" r="24" fill="#22c55e" />
      <circle cx="-16" cy="-38" r="16" fill="#16a34a" />
      <circle cx="16" cy="-38" r="16" fill="#4ade80" />
    </g>
  );
}

function Kid({ x, y, color = "#f472b6" }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x},${y})`} className="walker">
      <circle cx="0" cy="-52" r="13" fill="#ffd9b3" />
      <circle cx="-5" cy="-54" r="2" fill="#111" />
      <circle cx="5" cy="-54" r="2" fill="#111" />
      <path d="M -5 -46 Q 0 -42 5 -46" stroke="#92400e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="-11" y="-40" width="22" height="24" rx="9" fill={color} />
      <rect x="-16" y="-38" width="7" height="18" rx="3.5" fill={color} />
      <rect x="9" y="-38" width="7" height="18" rx="3.5" fill={color} />
      <rect x="-9" y="-16" width="7" height="16" rx="3.5" fill="#334155" />
      <rect x="2" y="-16" width="7" height="16" rx="3.5" fill="#334155" />
    </g>
  );
}

function StarBadge({ x, y, n }: { x: number; y: number; n: number }) {
  if (!n) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r="20" fill="#fff" stroke="#f59e0b" strokeWidth="4" />
      <text y="8" textAnchor="middle" fontSize="20" fill="#f59e0b">★{n}</text>
    </g>
  );
}
