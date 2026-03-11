import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function BrandMark() {
  return (
    <svg width="132" height="132" viewBox="0 0 96 96" fill="none">
      <rect width="96" height="96" rx="28" fill="#172033" />
      <path
        d="M28 63.5V51.5C28 49.567 29.567 48 31.5 48H37V63.5C37 65.433 35.433 67 33.5 67H31.5C29.567 67 28 65.433 28 63.5Z"
        fill="#D7A130"
      />
      <path
        d="M44.5 67C42.567 67 41 65.433 41 63.5V39.5C41 37.567 42.567 36 44.5 36H50C51.933 36 53.5 37.567 53.5 39.5V63.5C53.5 65.433 51.933 67 50 67H44.5Z"
        fill="#F3C255"
      />
      <path
        d="M57.5 63.5V31.5C57.5 29.567 59.067 28 61 28H66.5C68.433 28 70 29.567 70 31.5V63.5C70 65.433 68.433 67 66.5 67H61C59.067 67 57.5 65.433 57.5 63.5Z"
        fill="#F7E3A3"
      />
      <path
        d="M24 70.5C24 69.119 25.119 68 26.5 68H69.5C70.881 68 72 69.119 72 70.5V71C72 72.381 70.881 73.5 69.5 73.5H26.5C25.119 73.5 24 72.381 24 71V70.5Z"
        fill="#FCFAF3"
      />
    </svg>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at top left, rgba(243,194,85,0.24), transparent 24%), linear-gradient(180deg, #fffdf8 0%, #f7f3e7 100%)",
          color: "#172033",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            borderRadius: "36px",
            border: "1px solid rgba(148, 163, 184, 0.22)",
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 30px 80px -40px rgba(51, 65, 85, 0.35)",
            padding: "48px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: "680px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "28px",
              }}
            >
              <BrandMark />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span
                  style={{
                    fontSize: 24,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "#64748b",
                  }}
                >
                  MARGEM APP
                </span>
                <span style={{ fontSize: 28, fontWeight: 600 }}>Calculadora de precificacao</span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <span style={{ fontSize: 72, lineHeight: 1.04, fontWeight: 700 }}>
                Custos, receitas e margem no mesmo painel.
              </span>
              <span style={{ fontSize: 28, lineHeight: 1.4, color: "#475569" }}>
                Organize ingredientes, monte fichas tecnicas e defina precos com mais seguranca.
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              alignSelf: "stretch",
              justifyContent: "space-between",
              width: "280px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                borderRadius: "28px",
                background: "#172033",
                color: "#fff",
                padding: "18px 22px",
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              MARGEM APP
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                borderRadius: "28px",
                background: "#fcfaf3",
                padding: "22px",
                color: "#172033",
              }}
            >
              <span style={{ fontSize: 20, color: "#64748b" }}>Ideal para</span>
              <span style={{ fontSize: 28, fontWeight: 600 }}>catalogo, fichas tecnicas e simulacoes</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
