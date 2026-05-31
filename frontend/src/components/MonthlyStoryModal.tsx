import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { generateMonthlyStory } from '../utils/storyGenerator';
import type { MonthlyStory } from '../utils/storyGenerator';
import { formatCurrency } from '../utils/format';
import { X, Download, Flame, Trophy, PieChart, Star } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Props {
  expenses: any[];
  budgets: any[];
  onClose: () => void;
}

const MonthlyStoryModal: React.FC<Props> = ({ expenses, budgets, onClose }) => {
  const [story, setStory] = useState<MonthlyStory | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generated = generateMonthlyStory(expenses, budgets);
    setStory(generated);
  }, [expenses, budgets]);

  const handleExport = async () => {
    if (!captureRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#09090b', // Match our dark mode bg
        logging: false,
        useCORS: true
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `financial-story-${story?.monthName.replace(' ', '-').toLowerCase()}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Failed to export infographic:', err);
      alert('Failed to generate infographic. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!story) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      overflowY: 'auto'
    }}>
      
      <button 
        onClick={onClose}
        style={{
          position: 'absolute', top: '2rem', right: '2rem',
          background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
          color: 'var(--text-primary)', borderRadius: '50%', width: '40px', height: '40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10
        }}
      >
        <X size={20} />
      </button>

      {/* Capture Container */}
      <div 
        ref={captureRef}
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'linear-gradient(180deg, var(--bg-dark) 0%, var(--bg-surface) 100%)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          padding: '3rem 2rem',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}
      >
        {/* Glow effect */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '50%',
          background: story.performanceType === 'success' ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(0,0,0,0) 70%)' :
                      story.performanceType === 'danger' ? 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(0,0,0,0) 70%)' :
                      'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div className="text-center" style={{ zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '0.75rem', borderRadius: '50%' }}>
              <Star size={32} color="white" />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 800, background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your Financial Story
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            {story.monthName}
          </p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)', zIndex: 1 }}>
          <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>Total Monthly Spend</p>
          <div className="currency-text text-center" style={{ fontSize: '2.5rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            {formatCurrency(story.totalSpent)}
          </div>
          <div style={{ 
            marginTop: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.95rem', fontWeight: 500,
            background: story.performanceType === 'success' ? 'rgba(16, 185, 129, 0.1)' : story.performanceType === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: story.performanceType === 'success' ? 'var(--accent-success)' : story.performanceType === 'danger' ? 'var(--accent-danger)' : 'var(--accent-warning)'
          }}>
            {story.performanceText}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', zIndex: 1 }}>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Flame size={20} color="var(--accent-danger)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Top Spending Day</h4>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{story.topSpendingDay.dateStr}</div>
            <div className="currency-text" style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>{formatCurrency(story.topSpendingDay.amount)}</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Trophy size={20} color="var(--accent-success)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Best Savings Day</h4>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{story.biggestSavingsDay.dateStr}</div>
            <div className="currency-text" style={{ fontSize: '0.85rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>Saved {formatCurrency(story.biggestSavingsDay.amountSaved)}</div>
          </div>

          <div style={{ gridColumn: 'span 2', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <PieChart size={32} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Highest Category</h4>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {story.topCategory.name}
                <span style={{ background: 'var(--bg-surface-hover)', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem' }}>{story.topCategory.percentage.toFixed(0)}% of total</span>
              </div>
            </div>
          </div>

        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '1rem', zIndex: 1 }}>
          Generated by ExpensePro
        </div>
      </div>

      <button 
        onClick={handleExport}
        className="btn btn-primary"
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateX(-50%) translateY(0)'}
      >
        <Download size={18} /> {isExporting ? 'Generating...' : 'Export Infographic'}
      </button>

    </div>,
    document.body
  );
};

export default MonthlyStoryModal;
