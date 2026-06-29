// src/pages/Contact.jsx
import React from "react";

export default function Contact() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #ecfdf5 100%)",
        paddingTop: "6rem",
        paddingBottom: "4rem",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Page Header */}
      <div style={{ textAlign: "center", marginBottom: "3rem", padding: "0 1.5rem" }}>
        <span
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #bbf7d0, #86efac)",
            color: "#15803d",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "0.35rem 1rem",
            borderRadius: "999px",
            marginBottom: "1rem",
          }}
        >
          Get In Touch
        </span>
       
        <p
          style={{
            color: "#6b7280",
            fontSize: "1.05rem",
            maxWidth: "420px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          We'd love to hear from you. Reach out any time.
        </p>
      </div>

      {/* Main Card Grid */}
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* LEFT — Contact Information */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "2.25rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid rgba(187, 247, 208, 0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "0",
          }}
        >
          {/* Card Header */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div
  style={{
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1rem",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)"
  }}
>
  <img
    src="/logo.png"
    alt="Seasons Kitchen Logo"
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }}
  />
</div>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "#14532d",
                margin: "0 0 0.25rem",
              }}
            >
              Seasons Kitchen
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: 0 }}>
              Contact Information
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "#f0fdf4", marginBottom: "1.5rem" }} />

          {/* Info Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <ContactItem icon="📍" label="Address" value="Abuja, Nigeria" />
            <ContactItem icon="📞" label="Phone" value="08180149672" />
            <ContactItem icon="📧" label="Email" value="seasonskitchen@gmail.com" />
            <ContactItem
              icon="🕒"
              label="Opening Hours"
              value="Monday – Sunday: 8AM – 10PM"
            />
          </div>
        </div>

        {/* RIGHT — Social Media */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "2.25rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid rgba(187, 247, 208, 0.5)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Card Header */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                marginBottom: "1rem",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
              }}
            >
              
            </div>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "#14532d",
                margin: "0 0 0.25rem",
              }}
            >
              Follow Us
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: 0 }}>
              Stay connected on social media
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "#f0fdf4", marginBottom: "1.5rem" }} />

          {/* Social Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <SocialLink
              href="https://wa.me/2348180149672"
              src="/whatsapp.jpeg"
              label="WhatsApp"
              handle="Chat with us"
              accent="#16a34a"
              bg="#f0fdf4"
            />
            <SocialLink
              href="https://www.instagram.com/seasonskitchen_?igsh=MWptZGhzdHl6cWFzYQ=="
              src="/instagram.jpeg"
              label="Instagram"
              handle="@seasonskitchen_"
              accent="#e11d48"
              bg="#fff1f2"
            />
            <SocialLink
              href="https://www.facebook.com/share/p/16yMwxTfz8/"
              src="/facebook.jpeg"
              label="Facebook"
              handle="Seasons Kitchen"
              accent="#1d4ed8"
              bg="#eff6ff"
            />
            <SocialLink
              href="https://www.instagram.com/seasonskitchen_?igsh=azN4M3ZyeDcxM2c=35.6"
              src="/tiktok.jpeg"
              label="TikTok"
              handle="@seasonskitchen"
              accent="#111827"
              bg="#f9fafb"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          textAlign: "center",
          color: "#9ca3af",
          fontSize: "0.82rem",
          marginTop: "3rem",
          letterSpacing: "0.02em",
        }}
      >
        © {new Date().getFullYear()} Seasons Kitchen — We appreciate your patronage.
      </p>

      {/* Hover styles via style tag */}
      <style>{`
        .social-link-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .social-link-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        .social-icon-img {
          transition: transform 0.2s ease;
        }
        .social-link-card:hover .social-icon-img {
          transform: scale(1.08);
        }
        .contact-item-icon {
          transition: transform 0.2s ease;
        }
        .contact-item:hover .contact-item-icon {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function ContactItem({ icon, label, value }) {
  return (
    <div
      className="contact-item"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.875rem",
        cursor: "default",
      }}
    >
      {/* Icon bubble */}
      <div
        className="contact-item-icon"
        style={{
          flexShrink: 0,
          width: "38px",
          height: "38px",
          background: "#f0fdf4",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1rem",
          border: "1px solid #bbf7d0",
        }}
      >
        {icon}
      </div>
      {/* Text */}
      <div style={{ paddingTop: "2px" }}>
        <p
          style={{
            margin: "0 0 0.15rem",
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.95rem",
            fontWeight: 500,
            color: "#1f2937",
            lineHeight: 1.5,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function SocialLink({ href, src, label, handle, accent, bg }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="social-link-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.85rem 1rem",
        borderRadius: "12px",
        background: bg,
        border: "1px solid transparent",
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      {/* Icon */}
      <img
        src={src}
        alt={label}
        className="social-icon-img"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          objectFit: "cover",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      />
      {/* Labels */}
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: "0 0 0.1rem",
            fontSize: "0.9rem",
            fontWeight: 700,
            color: accent,
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.78rem",
            color: "#9ca3af",
            fontWeight: 400,
          }}
        >
          {handle}
        </p>
      </div>
      {/* Arrow */}
      <span
        style={{
          color: "#d1d5db",
          fontSize: "0.85rem",
          fontWeight: 400,
        }}
      >
        →
      </span>
    </a>
  );
}
