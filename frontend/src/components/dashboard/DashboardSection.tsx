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
          className="text-2xl tracking-tight font-['Playfair_Display',Georgia,serif] font-bold text-[#2D3A27]"
        >
          {title}
        </h2>
        <div 
          className="flex-1 h-px mt-1 bg-gradient-to-r from-[#A67C5255] to-transparent" 
        />
      </div>
      {children}
    </section>
  );
};

export default DashboardSection;
