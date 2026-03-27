import React from 'react';
import TemplatesCarousel from './TemplatesCarousel';

interface SidebarProps {
}

const Sidebar: React.FC<SidebarProps> = () => {
  return (
    <aside className="
    w-48 h-full
    flex flex-col items-center justify-between
    py-6 rounded-3xl border-2
    bg-base-dashboard border-dashboard-accent shadow-xl">
      <TemplatesCarousel />
    </aside>
  );
};

export default Sidebar;
