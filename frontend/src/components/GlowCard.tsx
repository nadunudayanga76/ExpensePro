import { useRef, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';

interface GlowCardProps {
  children: ReactNode;
  glowColor?: string;
  style?: CSSProperties;
  className?: string;
}

const GlowCard = ({ children, glowColor = 'rgba(139, 92, 246, 0.4)', style = {}, className = '' }: GlowCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setGlowPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      className={`glass-panel ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Cursor glow blob */}
      <div
        style={{
          position: 'absolute',
          top: glowPos.y,
          left: glowPos.x,
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          opacity: isHovering ? 0.35 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top edge glow line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: glowPos.x - 100,
          width: '200px',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
          opacity: isHovering ? 0.8 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content layer (above the glow) */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default GlowCard;
