import { ImageResponse } from "next/og";

export const alt = "Twimzi — discover local businesses, products and services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: "#0F172A",
          background: "linear-gradient(115deg, #E8F7F4 0%, #F0FAF8 55%, #FFF7F0 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: "#0D9488" }} />
          <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>Twimzi</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1000 }}>
          <div style={{ fontSize: 68, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2 }}>
            Discover local. <span style={{ color: "#0D9488" }}>Grow together.</span>
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.35, color: "#475569" }}>
            Find businesses, products, services and opportunities across India.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#0F766E", fontWeight: 700 }}>
          <span>Digital Operating System for Every Local Business</span>
          <span>www.twimzi.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
