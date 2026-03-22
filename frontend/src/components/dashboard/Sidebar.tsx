import React from 'react';
import TemplatesCarousel from './TemplatesCarousel';

interface SidebarProps {
}

const Sidebar: React.FC<SidebarProps> = () => {
  return (
    <aside
  // Added 'h-full' to take up parent height, or 'h-screen' for full window
  className="w-48 h-full flex flex-col items-center justify-between py-6 rounded-2xl"
  style={{
    background: '#ece7db',
    border: '1.5px solid #A67C5244',
    boxShadow: '0 2px 12px rgba(15,14,13,0.06)',
  }}
>
  {/* TOP CONTENT (Logo/Links) */}
  <div className="flex flex-col gap-4">
    {/* Your social links or nav icons go here */}
  </div>

  <TemplatesCarousel />
</aside>
  );
};

export default Sidebar;
