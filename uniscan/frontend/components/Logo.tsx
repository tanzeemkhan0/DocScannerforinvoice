import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 400 120" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Background with green border */}
    <rect width="400" height="120" rx="8" fill="#154b9e" stroke="#84cc16" strokeWidth="3"/>
    
    {/* Silver Power Button Outer Ring */}
    <circle cx="60" cy="60" r="45" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="4"/>
    {/* Silver Power Button Inner Ring */}
    <circle cx="60" cy="60" r="35" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
    {/* Power Icon */}
    <path d="M60 35 v25 M42 48 a 25 25 0 1 0 36 0" stroke="#0f172a" strokeWidth="6" fill="none" strokeLinecap="round"/>
    
    {/* Text: Universal */}
    <text x="120" y="50" fill="white" fontFamily="sans-serif" fontSize="38" fontWeight="bold">Universal</text>
    
    {/* Text: Power Solutions */}
    <text x="120" y="100" fill="white" fontFamily="sans-serif" fontSize="38" fontWeight="bold">Power Solutions</text>
    
    {/* Green Zigzag Line */}
    <path d="M105 65 h60 l10 -15 l15 30 l10 -15 h180" stroke="#84cc16" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
