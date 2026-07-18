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
          background: "#000000",
          color: "#ffffff",
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
          Advancing Financial Stability Through Structured Research
        </div>

        <div
          style={{
            marginTop: 60,
            fontSize: 24,
            color: "#8f8f8f",
          }}
        >
          Human Financial Operating System (HFOS)
        </div>
      </div>
    ),
    size
  );
}