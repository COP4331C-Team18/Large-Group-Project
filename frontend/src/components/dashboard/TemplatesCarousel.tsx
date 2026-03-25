import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { CATEGORY_COLORS, TEMPLATES } from '@/config/templates';

export interface CarouselProps {
  onSelect?: (templateId: string) => void;
}

export default function TemplatesCarousel({ onSelect }: CarouselProps) {
  // Initialize with static TEMPLATES as a fallback/starter
  const [dbTemplates, setDbTemplates] = useState(TEMPLATES); 
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        setDbTemplates(data);
      } catch (error) {
        console.error("Using local fallback templates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const filteredTemplates = dbTemplates.filter((template) => {
    const search = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(search) ||
      template.category.toLowerCase().includes(search)
    );
  });

  return (
    <div className="flex flex-col w-full h-full gap-5">
      {/* Search Input with Lucide Icon */}
      <div className="relative px-4">
        <Search 
          size={14} 
          className="absolute left-7 top-1/2 -translate-y-1/2 text-[#A67C5288]" 
        />
        <input
          type="text"
          placeholder="Find a template..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input input-xs w-full pl-9 bg-white/40 border-[#A67C5244] focus:border-[#A67C52] text-[11px] font-serif italic rounded-lg placeholder-[#A67C5266]"
        />
      </div>

      {/* Scrollable Carousel Area */}
      <div className="carousel carousel-center carousel-vertical flex flex-col w-full px-4 space-y-6 flex-1">
        {loading && filteredTemplates.length === 0 ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-sm text-[#A67C52]"></span>
          </div>
        ) : filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div key={template.id} className="carousel-item w-full flex justify-center">
              <button
                onClick={() => onSelect?.(template.id)}
                className="group flex flex-col items-center gap-3 w-full"
              >
                <div
                  className="size-32 rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl border-[1.5px] border-[#A67C5233]"
                  style={{ background: '#F4F1EA' }}
                >
                  {template.thumbnail ? (
                    <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                       <div className="flex flex-col gap-2 w-full opacity-30">
                          <div className="h-px w-full bg-[#A67C52]" />
                          <div className="h-px w-3/4 bg-[#A67C52]" />
                          <div className="h-px w-full bg-[#A67C52]" />
                       </div>
                       <span 
                        className="mt-3 text-[8px] tracking-[0.2em] font-bold uppercase"
                        style={{ color: CATEGORY_COLORS[template.category] || '#A67C52' }}
                       >
                        {template.category}
                       </span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-serif font-medium text-[#2D3A27] opacity-80 group-hover:opacity-100 transition-opacity">
                  {template.name}
                </span>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-[10px] font-serif italic text-[#A67C5288]">
            No templates match your search
          </div>
        )}
      </div>
    </div>
  );
}