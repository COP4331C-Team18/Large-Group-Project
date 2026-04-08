import { User, Leaf, Feather, Flame, Droplets, Mountain, Sun, Moon, Star, Wind } from "lucide-react";

// Placeholder for preset avatar icons
export const AVATAR_PRESETS = [
  { id: "default",   icon: User,      label: "Default"   },
  { id: "leaf",      icon: Leaf,      label: "Leaf"      },
  { id: "feather",   icon: Feather,   label: "Feather"   },
  { id: "flame",     icon: Flame,     label: "Flame"     },
  { id: "droplets",  icon: Droplets,  label: "Droplets"  },
  { id: "mountain",  icon: Mountain,  label: "Mountain"  },
  { id: "sun",       icon: Sun,       label: "Sun"       },
  { id: "moon",      icon: Moon,      label: "Moon"      },
  { id: "star",      icon: Star,      label: "Star"      },
  { id: "wind",      icon: Wind,      label: "Wind"      },
] as const;

export type AvatarId = "default" | "leaf" | "feather" | "flame" | "droplets" | "mountain" | "sun" | "moon" | "star" | "wind";

// Exportable Avatar icons
interface AvatarProps {
  avatarId?: AvatarId | string | null;
  size?: "sm" | "md" | "lg";
}
 
const sizeMap = {
  sm: { outer: "w-10 h-10", icon: "h-5 w-5" },
  md: { outer: "w-20 h-20", icon: "h-10 w-10" },
  lg: { outer: "w-28 h-28", icon: "h-14 w-14" },
};

export default function Avatar({ avatarId, size = "md" }: AvatarProps) {
  const preset = AVATAR_PRESETS.find((p) => p.id === avatarId) ?? AVATAR_PRESETS[0];
  const Icon = preset.icon;
  const { outer, icon } = sizeMap[size];
 
  return (
    <div
      className={`
        ${outer} rounded-full flex items-center justify-center flex-shrink-0
        bg-primary/20 text-primary
        border-2 border-primary/50
      `}
      title={preset.label}
    >
      <Icon className={icon} />
    </div>
  );
}
 
interface AvatarPickerProps {
  selected: AvatarId | string;
  onChange: (id: AvatarId) => void;
}
 
export function AvatarPicker({ selected, onChange }: AvatarPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {AVATAR_PRESETS.map(({ id, icon: Icon, label }) => {
        const isSelected = selected === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => onChange(id)}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center
              border-2 transition-all duration-150 cursor-pointer
              ${
                isSelected
                  ? "bg-primary text-primary-content border-primary"
                  : "bg-primary-content text-primary border-neutral-content hover:border-primary hover:bg-primary/30"
              }
            `}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}