import { TEMPLATES, CATEGORY_COLORS } from '@/config/templates';

export interface CarouselProps {
  onSelect?: (templateId: string) => void;
}

export default function TemplatesCarousel({ onSelect }: CarouselProps) {


  return (
    <div
      className="carousel carousel-center carousel-vertical w-full p-4 space-y-4 rounded-xl"
      style={{ background: 'transparent' }}
    >
      {TEMPLATES.map((template) => (
        <div key={template.id} className="carousel-item">
          <button
            onClick={() => onSelect?.(template.id)}
            className="group flex flex-col items-center gap-3"
            aria-label={`Select ${template.name} template`}
          >
            <div
              className="size-32 rounded-xl overflow-hidden transition-all duration-200 group-hover:scale-[1.04] group-hover:shadow-xl"
              style={{
                background: '#F4F1EA',
                border: '1.5px solid #A67C5244',
                boxShadow: '0 2px 8px rgba(15,14,13,0.07)',
              }}
            >
              {template.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                  <div className="w-full flex flex-col gap-1.5 px-3">
                    <div className="h-px w-full" style={{ background: '#A67C5255' }} />
                    <div className="h-px w-4/5" style={{ background: '#A67C5244' }} />
                    <div className="h-px w-full" style={{ background: '#A67C5233' }} />
                    <div className="h-px w-3/5" style={{ background: '#A67C5233' }} />
                    <div className="h-px w-full" style={{ background: '#A67C5222' }} />
                  </div>
                  <span
                    className="uppercase tracking-widest text-[9px] mt-1 font-semibold px-2 py-0.5 rounded"
                    style={{
                      color: CATEGORY_COLORS[template.category] ?? '#4A4E44',
                      background: '#A67C524466',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {template.category}
                  </span>
                </div>
              )}
            </div>

            <span
              className="text-xs font-medium text-center max-w-[7rem] leading-snug transition-colors duration-150 group-hover:text-[#2D3A27]"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#2D3A27',
              }}
            >
              {template.name}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
