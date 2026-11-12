export function GlobalNetworkGlobe() {
  const nodes = [
    { x: 210, y: 28, r: 4 },
    { x: 286, y: 54, r: 3 },
    { x: 337, y: 111, r: 4 },
    { x: 321, y: 207, r: 3 },
    { x: 247, y: 269, r: 4 },
    { x: 139, y: 262, r: 3 },
    { x: 66, y: 195, r: 4 },
    { x: 80, y: 105, r: 3 },
    { x: 145, y: 53, r: 4 },
    { x: 210, y: 160, r: 5 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div className="absolute inset-[12%] rounded-full bg-cyan-300/20 blur-3xl" />
      <svg
        viewBox="0 0 420 320"
        role="img"
        aria-label="Illustration of a connected global business network"
        className="relative h-auto w-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="twimzi-globe-fill" cx="0" cy="0" r="1" gradientTransform="translate(210 158) rotate(90) scale(132 132)">
            <stop offset="0" stopColor="#38BDF8" stopOpacity=".22" />
            <stop offset="1" stopColor="#2563EB" stopOpacity=".035" />
          </radialGradient>
          <linearGradient id="twimzi-globe-line" x1="76" y1="54" x2="344" y2="266" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0EA5E9" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>

        <circle cx="210" cy="158" r="132" fill="url(#twimzi-globe-fill)" />
        <circle cx="210" cy="158" r="132" stroke="url(#twimzi-globe-line)" strokeOpacity=".35" strokeWidth="1.5" />
        <ellipse cx="210" cy="158" rx="62" ry="132" stroke="#0EA5E9" strokeOpacity=".35" strokeWidth="1.4" />
        <ellipse cx="210" cy="158" rx="112" ry="132" stroke="#0EA5E9" strokeOpacity=".2" strokeWidth="1.2" />
        <ellipse cx="210" cy="158" rx="132" ry="48" stroke="#0EA5E9" strokeOpacity=".28" strokeWidth="1.2" />
        <ellipse cx="210" cy="158" rx="132" ry="91" stroke="#0EA5E9" strokeOpacity=".2" strokeWidth="1.2" />
        <path d="M83 117C132 145 286 145 337 117M83 199C132 171 286 171 337 199" stroke="#0EA5E9" strokeOpacity=".18" strokeWidth="1.2" />

        <g stroke="url(#twimzi-globe-line)" strokeOpacity=".58" strokeWidth="1.5">
          <path d="M210 160 145 53 80 105 66 195 139 262 247 269 321 207 337 111 286 54 210 28" />
          <path d="M210 160 286 54M210 160 337 111M210 160 321 207M210 160 247 269M210 160 139 262M210 160 66 195M210 160 80 105M210 160 145 53" />
        </g>

        <g fill="#fff" stroke="#0EA5E9" strokeWidth="2">
          {nodes.map((node, index) => (
            <circle key={index} cx={node.x} cy={node.y} r={node.r + 3} fill="#E0F2FE" fillOpacity=".85" strokeOpacity=".3" />
          ))}
        </g>
        <g fill="#0284C7">
          {nodes.map((node, index) => (
            <circle key={index} cx={node.x} cy={node.y} r={node.r} />
          ))}
        </g>
        <circle cx="210" cy="160" r="13" fill="#2563EB" fillOpacity=".12" />
        <circle cx="210" cy="160" r="7" fill="#2563EB" stroke="white" strokeWidth="3" />

        <g fill="#0F766E">
          <circle cx="48" cy="72" r="3" />
          <circle cx="370" cy="72" r="3" />
          <circle cx="370" cy="252" r="3" />
          <circle cx="48" cy="250" r="3" />
        </g>
        <g stroke="#14B8A6" strokeOpacity=".4" strokeDasharray="3 6">
          <path d="M48 72 80 105M370 72 337 111M370 252 321 207M48 250 66 195" />
        </g>
      </svg>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-sky-200/80 bg-white/90 px-4 py-2 text-xs font-semibold tracking-wide text-sky-800 shadow-sm backdrop-blur">
        Local businesses · Global connections
      </div>
    </div>
  );
}
