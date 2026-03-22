import React from "react";
import type { BoardCategory } from "@/types/dashboard";

type PreviewLineSize = "full" | "medium" | "short" | "xshort";

export interface InkBoardCardProps {
  title: string;
  category: BoardCategory;
  editedAt: string;
  previewLines?: PreviewLineSize[];
  onMenuClick?: () => void;
  onClick?: () => void;
}

const InkBoardCard: React.FC<InkBoardCardProps> = ({
  title,
  editedAt,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="
        group relative cursor-pointer rounded-[14px]
        border border-[#c4a96a] bg-[#ffffff]
        p-5 w-[185px]
        shadow-[0_2px_8px_rgba(44,44,36,0.08)]
        transition-all duration-200 ease-out
        hover:-translate-y-0.5
        hover:shadow-[0_6px_20px_rgba(44,44,36,0.13)]
        hover:border-[#cd6700]
        before:absolute before:inset-0 before:rounded-[14px]
        before:bg-gradient-to-br before:from-white/35 before:to-transparent
        before:pointer-events-none
      "
    >
      <div
        className="
          relative mb-[0.85rem] h-[110px] overflow-hidden
          rounded-lg border border-[#d8d2c4] bg-[#f5f2ec]
          px-3 py-3
        "
      >PREVIEW HERE
      </div>

      <p
        className="mb-1 truncate font-['Playfair_Display',Georgia,serif] text-[0.9rem] font-medium text-[#000000]"
      >
        {title}
      </p>

      <p
        className="
          font-['Crimson_Pro',Georgia,serif] text-[0.78rem]
          italic text-black
        "
      >
        {editedAt}
      </p>
    </div>
  );
};

export default InkBoardCard;
