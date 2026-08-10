import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0A",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-2px",
          }}
        >
          Wealth Path AI Global
        </div>

        <div
          style={{
            marginTop: 30,
            maxWidth: 900,
            fontSize: 32,
            lineHeight: 1.4,
            color: "#d1d1d1",
          }}
        >
          Stability. Clarity. Legacy.
        </div>

        <div
          style={{
            marginTop: 60,
            fontSize: 24,
            color: "#C8A24A",
          }}
        >
          Human Financial Operating System (HFOS)
        </div>
      </div>
    ),
    size
  );
}
