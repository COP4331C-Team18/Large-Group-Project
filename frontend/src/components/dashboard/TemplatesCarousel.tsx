import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { TEMPLATES } from '@/config/templates';
import { templateService } from '@/api/services/templateService';

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
        const data = await templateService.getTemplates();
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
          className="absolute left-7 top-1/2 -translate-y-1/2 text-base-content" 
        />
        <input
          type="text"
          placeholder="Find a template..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input input-xs w-full pl-9 bg-base-100 text-[11px] font-serif italic rounded-lg placeholder-base-content/70 focus:ring-2 focus:ring-primary focus:border-primary transition"
        />
      </div>

      {/* Scrollable Carousel Area */}
      <div className="carousel carousel-center carousel-vertical flex flex-col w-full py-3 space-y-6 flex-1">
        {loading && filteredTemplates.length === 0 ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-sm text-base-content"></span>
          </div>
        ) : filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div key={template.id} className="carousel-item w-full flex justify-center">
              <button
                onClick={() => onSelect?.(template.id)}
                className="group flex flex-col items-center gap-3 w-full"
              >
                <div
                  className="size-32 rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl bg-base-100 border border-base-300 hover:border-primary"
                >
                  {template.thumbnail ? (
                    <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                       <div className="flex flex-col gap-2 w-full opacity-30">
                          <div className="h-px w-full bg-secondary" />
                          <div className="h-px w-3/4 bg-secondary" />
                          <div className="h-px w-full bg-secondary" />
                       </div>
                       <span 
                        className="mt-3 text-[8px] tracking-[0.2em] font-bold uppercase text-base-content/80 font-serif"
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