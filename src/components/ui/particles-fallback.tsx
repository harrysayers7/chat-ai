"use client";

import React from "react";

interface ParticlesFallbackProps {
  className?: string;
}

const ParticlesFallback: React.FC<ParticlesFallbackProps> = ({ className }) => {
  return (
    <div className={`relative w-full h-full bg-transparent ${className}`}>
      {/* Simple fallback - just an empty transparent div */}
    </div>
  );
};

export default ParticlesFallback;
