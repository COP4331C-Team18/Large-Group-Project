import React from 'react';

interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ title, children, className = '' }) => {
  return (
    <section className={`flex flex-col overflow-hidden ${className}`}>
      <div className="mb-6 flex items-baseline gap-3 flex-shrink-0">
        <h2
          className="text-2xl tracking-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            color: '#2D3A27',
          }}
        >
          {title}
        </h2>
        <div 
          className="flex-1 h-px mt-1" 
          style={{ background: 'linear-gradient(to right, #A67C5255, transparent)' }} 
        />
      </div>
      {children}
    </section>
  );
};

export default DashboardSection;
