import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
}

const Dropdown = ({ value, onChange, options, placeholder = 'Select an option', required }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const menuHeight = Math.min(options.length * 45 + 16, 250); // Approximate max height

        const isRightAligned = rect.left > window.innerWidth / 2;
        
        const style: React.CSSProperties = {
          position: 'fixed',
          minWidth: Math.max(rect.width, 150), // Prevent too narrow
          zIndex: 10000,
        };

        if (isRightAligned) {
          style.right = window.innerWidth - rect.right;
        } else {
          style.left = rect.left;
        }

        if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
          // Render above the input if there's no space below
          style.bottom = window.innerHeight - rect.top + 8;
          style.transformOrigin = `bottom ${isRightAligned ? 'right' : 'left'}`;
        } else {
          // Render below
          style.top = rect.bottom + 8;
          style.transformOrigin = `top ${isRightAligned ? 'right' : 'left'}`;
        }
        
        setMenuStyle(style);
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true); // capture phase for all scrolling containers
      window.addEventListener('resize', updatePosition);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        menuRef.current && !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, options.length]);

  return (
    <div className="custom-dropdown" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className={`form-input flex justify-between items-center ${isOpen ? 'dropdown-open' : ''}`}
        style={{ 
          cursor: 'pointer', 
          userSelect: 'none',
          borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border-color)',
          boxShadow: isOpen ? '0 0 0 3px rgba(139, 92, 246, 0.15), 0 0 20px rgba(139, 92, 246, 0.08)' : 'none',
          transform: isOpen ? 'translateY(-1px)' : 'none'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'inherit' : 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} style={{ color: 'var(--text-secondary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="dropdown-menu glass-panel"
          style={{ 
            ...menuStyle,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            maxHeight: '250px',
            overflowY: 'auto',
            padding: '0.5rem',
            animation: 'fadeInScale 0.2s var(--ease-spring)',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.1)'
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              No options available
            </div>
          ) : (
            options.map(option => (
                <div
                  key={option.value}
                  className="dropdown-item"
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    backgroundColor: value === option.value ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    color: value === option.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                    transition: 'all 0.2s',
                    marginBottom: '0.25rem',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  onMouseOver={(e) => {
                    if (value !== option.value) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (value !== option.value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                {option.label}
              </div>
            ))
          )}
        </div>,
        document.body
      )}
      
      {/* Hidden input for HTML required validation */}
      {required && (
        <input 
          type="text" 
          value={value} 
          onChange={() => {}} 
          required 
          style={{ opacity: 0, position: 'absolute', height: 0, width: 0, bottom: 0, pointerEvents: 'none' }} 
        />
      )}
    </div>
  );
};

export default Dropdown;
