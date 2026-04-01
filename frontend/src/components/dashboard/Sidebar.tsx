import React from 'react';
import TemplatesCarousel from './TemplatesCarousel';

interface SidebarProps {
}

const Sidebar: React.FC<SidebarProps> = () => {
  return (
    <aside className="
    h-full
    flex flex-col items-center justify-between
    py-6 rounded-3xl
    bg-base-200 border border-neutral shadow-xl">
      <TemplatesCarousel />
    </aside>
  );
};

export default Sidebar;
