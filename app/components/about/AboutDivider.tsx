"use client";

export default function AboutDivider() {
  return (
    <div className="about-divider reveal" aria-hidden="true">
      <div className="div-bar"></div>
      <div className="div-pixels">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${i * 80}ms` }}></span>
        ))}
      </div>
      <div className="div-bar"></div>
    </div>
  );
}
