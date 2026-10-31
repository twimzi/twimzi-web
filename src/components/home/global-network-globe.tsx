import { Globe2 } from "lucide-react";

export function GlobalNetworkGlobe() {
  return (
    <div
      className="twimzi-global-globe pointer-events-none absolute -right-20 top-1/2 hidden h-[520px] w-[520px] -translate-y-1/2 lg:block"
      aria-hidden="true"
    >
      <div className="twimzi-globe-halo absolute inset-0 rounded-full" />
      <svg
        viewBox="0 0 520 520"
        className="relative h-full w-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="twimzi-globe-fill" cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#DBEAFE" />
            <stop offset="48%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </radialGradient>
          <linearGradient id="twimzi-globe-edge" x1="100" y1="100" x2="420" y2="420">
            <stop stopColor="#93C5FD" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
          <clipPath id="twimzi-globe-clip">
            <circle cx="260" cy="260" r="174" />
          </clipPath>
          <filter id="twimzi-globe-shadow" x="20" y="20" width="480" height="480" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        <circle cx="260" cy="260" r="198" fill="#60A5FA" opacity=".10" filter="url(#twimzi-globe-shadow)" />
        <circle cx="260" cy="260" r="181" fill="url(#twimzi-globe-fill)" opacity=".96" />
        <circle cx="260" cy="260" r="181" stroke="url(#twimzi-globe-edge)" strokeWidth="2" />

        <g clipPath="url(#twimzi-globe-clip)" className="twimzi-globe-rotate">
          <ellipse cx="260" cy="260" rx="174" ry="65" stroke="#DBEAFE" strokeOpacity=".58" strokeWidth="1.5" />
          <ellipse cx="260" cy="260" rx="174" ry="122" stroke="#DBEAFE" strokeOpacity=".42" strokeWidth="1.5" />
          <ellipse cx="260" cy="260" rx="65" ry="174" stroke="#DBEAFE" strokeOpacity=".55" strokeWidth="1.5" />
          <ellipse cx="260" cy="260" rx="122" ry="174" stroke="#DBEAFE" strokeOpacity=".38" strokeWidth="1.5" />
          <path d="M86 260H434M104 190H416M104 330H416" stroke="#DBEAFE" strokeOpacity=".25" strokeWidth="1.2" />
          <path d="M260 86V434" stroke="#DBEAFE" strokeOpacity=".28" strokeWidth="1.2" />

          <path d="M145 166L169 143L198 137L214 151L207 171L224 184L216 204L193 210L181 232L159 224L145 203L129 192Z" fill="#EFF6FF" fillOpacity=".92" />
          <path d="M204 226L226 231L245 252L239 278L224 300L218 329L199 350L188 324L192 298L178 277L184 251Z" fill="#DBEAFE" fillOpacity=".88" />
          <path d="M257 145L283 132L312 141L326 159L351 164L371 184L359 202L333 205L321 224L295 218L278 199L256 195L244 174Z" fill="#EFF6FF" fillOpacity=".9" />
          <path d="M279 226L302 219L324 235L331 260L316 278L308 309L286 328L267 310L264 282L248 260L256 239Z" fill="#DBEAFE" fillOpacity=".9" />
          <path d="M350 292L374 284L393 300L386 319L365 326L347 314Z" fill="#EFF6FF" fillOpacity=".86" />

          <path d="M142 252Q210 115 330 178T400 284" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 8" strokeOpacity=".82" />
          <path d="M160 330Q260 205 375 240" stroke="#BAE6FD" strokeWidth="2" strokeDasharray="4 8" strokeOpacity=".9" />
          <path d="M190 160Q270 285 365 350" stroke="#FFFFFF" strokeWidth="1.6" strokeDasharray="4 9" strokeOpacity=".72" />
          <circle cx="183" cy="211" r="5" fill="#FFFFFF" />
          <circle cx="330" cy="178" r="5" fill="#FFFFFF" />
          <circle cx="375" cy="240" r="5" fill="#FFFFFF" />
          <circle cx="260" cy="285" r="5" fill="#FFFFFF" />
        </g>

        <circle cx="260" cy="260" r="188" stroke="#60A5FA" strokeOpacity=".22" strokeWidth="1" strokeDasharray="3 8" />
        <g className="twimzi-globe-orbit">
          <circle cx="83" cy="232" r="7" fill="#FFFFFF" stroke="#2563EB" strokeWidth="3" />
          <circle cx="83" cy="232" r="14" stroke="#BFDBFE" strokeWidth="2" />
        </g>
        <g className="twimzi-globe-pulse">
          <circle cx="405" cy="300" r="7" fill="#FFFFFF" stroke="#06B6D4" strokeWidth="3" />
          <circle cx="405" cy="300" r="15" stroke="#A5F3FC" strokeWidth="2" />
        </g>
        <circle cx="255" cy="72" r="4" fill="#06B6D4" />
        <circle cx="445" cy="190" r="4" fill="#2563EB" />
        <circle cx="103" cy="368" r="4" fill="#2563EB" />
      </svg>
      <div className="absolute bottom-12 left-2 flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
        <Globe2 size={15} className="text-blue-600" />
        Connected worldwide
      </div>
    </div>
  );
}
