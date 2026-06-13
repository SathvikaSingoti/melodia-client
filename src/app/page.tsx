"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("melodia_token");
    if (token) {
      router.replace("/explore");
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0d0d",
        color: "#ede8e4",
        fontFamily: "'Inter', 'Outfit', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* ─── Navbar ─── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 48px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #c4a090, #e8c4b0, #a88070)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Melodia
        </span>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/login"
            style={{
              padding: "8px 20px",
              borderRadius: "999px",
              border: "1px solid rgba(196,160,144,0.4)",
              color: "#c4a090",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLAnchorElement).style.borderColor = "#c4a090";
              (e.target as HTMLAnchorElement).style.background = "rgba(196,160,144,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLAnchorElement).style.borderColor = "rgba(196,160,144,0.4)";
              (e.target as HTMLAnchorElement).style.background = "transparent";
            }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            style={{
              padding: "8px 20px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #c4a090, #a88070)",
              color: "#0e0d0d",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section
        style={{
          flex: "1",
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
          padding: "0 24px",
          position: "relative",
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(196,160,144,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Floating ambient orbs */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "10%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(196,160,144,0.05) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(40px)",
            pointerEvents: "none",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "8%",
            width: "250px",
            height: "250px",
            background: "radial-gradient(circle, rgba(168,128,112,0.06) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(40px)",
            pointerEvents: "none",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "720px" }}>


          <h1
            style={{
              fontSize: "clamp(38px, 7vw, 64px)",
              fontWeight: 800,
              color: "#ede8e4",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "24px",
            }}
          >
            Music that{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #c4a090 0%, #e8c4b0 50%, #a88070 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              moves
            </span>{" "}
            with you
          </h1>

          <p
            style={{
              fontSize: "18px",
              color: "#786870",
              maxWidth: "500px",
              margin: "0 auto 48px",
              lineHeight: 1.7,
            }}
          >
            AI-powered playlists. Real music.{" "}
            <br />
            Your vibe, perfectly curated.
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/signup"
              style={{
                padding: "14px 36px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #c4a090, #a88070)",
                color: "#0e0d0d",
                fontWeight: 700,
                fontSize: "15px",
                textDecoration: "none",
                boxShadow: "0 4px 24px rgba(196,160,144,0.25)",
                transition: "transform 0.2s, box-shadow 0.2s",
                display: "inline-block",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(196,160,144,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 24px rgba(196,160,144,0.25)";
              }}
            >
              Get Started
            </Link>

            <Link
              href="/login"
              style={{
                padding: "14px 36px",
                borderRadius: "999px",
                border: "1.5px solid #c4a090",
                color: "#c4a090",
                fontWeight: 600,
                fontSize: "15px",
                textDecoration: "none",
                background: "transparent",
                transition: "background 0.2s",
                display: "inline-block",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(196,160,144,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              }}
            >
              Login
            </Link>
          </div>
        </div>


      </section>

      {/* ─── Features ─── */}
      <section
        style={{
          padding: "80px 48px",
          maxWidth: "1100px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#c4a090",
            marginBottom: "48px",
            textTransform: "uppercase",
          }}
        >
          Everything you need
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            {
              icon: "🎵",
              title: "Real Music",
              desc: "Stream 200+ tracks from real artists, free forever. No ads, no limits.",
              accent: "#c4a090",
            },
            {
              icon: "✨",
              title: "AI Playlists",
              desc: "Describe any vibe, Gemini curates your perfect playlist instantly.",
              accent: "#e8c4b0",
            },
            {
              icon: "🎛️",
              title: "DAW Player",
              desc: "Professional waveform player with loop markers, crossfade, and speed control.",
              accent: "#a88070",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              style={{
                background: "rgba(196,160,144,0.04)",
                border: "1px solid rgba(196,160,144,0.1)",
                borderRadius: "16px",
                padding: "32px",
                transition: "border-color 0.3s, transform 0.3s, background 0.3s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(196,160,144,0.25)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.background = "rgba(196,160,144,0.07)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(196,160,144,0.1)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.background = "rgba(196,160,144,0.04)";
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  marginBottom: "20px",
                  lineHeight: 1,
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#ede8e4",
                  marginBottom: "10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#786870",
                  lineHeight: 1.7,
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section
        style={{
          padding: "80px 48px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            background: "rgba(196,160,144,0.05)",
            border: "1px solid rgba(196,160,144,0.12)",
            borderRadius: "24px",
            padding: "56px 40px",
          }}
        >
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#ede8e4",
              marginBottom: "14px",
              letterSpacing: "-0.02em",
            }}
          >
            Ready to listen?
          </h2>
          <p
            style={{
              color: "#786870",
              fontSize: "15px",
              marginBottom: "32px",
              lineHeight: 1.6,
            }}
          >
            Join thousands of listeners discovering music they love every day.
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-block",
              padding: "14px 40px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #c4a090, #a88070)",
              color: "#0e0d0d",
              fontWeight: 700,
              fontSize: "15px",
              textDecoration: "none",
              boxShadow: "0 4px 24px rgba(196,160,144,0.2)",
            }}
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        style={{
          padding: "32px 48px",
          borderTop: "1px solid rgba(196,160,144,0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: "rgba(120,104,112,0.6)",
          }}
        >
          Melodia © 2026
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "rgba(120,104,112,0.4)",
          }}
        >
          Built with Next.js, MongoDB, Gemini AI
        </p>
      </footer>

      {/* ─── Keyframe styles ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
