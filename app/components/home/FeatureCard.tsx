"use client";

import FeatureIcon from "./FeatureIcon";

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  color: string;
  index: number;
}

export default function FeatureCard({
  icon,
  title,
  desc,
  color,
  index,
}: FeatureCardProps) {
  return (
    <div
      className={`feature-card ${color}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <FeatureIcon kind={icon} />
      <div className="ft-title pixel">{title}</div>
      <div className="ft-desc">{desc}</div>
    </div>
  );
}
