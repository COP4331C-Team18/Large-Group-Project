import React from "react";

export interface InkBoardCardProps {
  title: string;
  editedAt: string;
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
      className="group relative cursor-pointer rounded-[14px] aspect-video
        border border-base-300 bg-base-100 p-5
        shadow-[0_2px_8px_rgba(44,44,36,0.08)]
        transition-all duration-200 ease-out
        hover:-translate-y-0.5
        hover:shadow-[0_6px_20px_rgba(44,44,36,0.13)]
        hover:border-primary/80
        before:absolute before:inset-0 before:rounded-[14px]
        before:bg-gradient-to-br before:from-white/35 before:to-transparent
        before:pointer-events-none
        font-serif
      "
    >
      <div
        className="
          relative mb-[0.85rem] overflow-hidden  aspect-video
          rounded-lg bg-base-300
          px-3 py-3">
        PREVIEW HERE
      </div>

      <p
        className="mb-1 truncate font-['Playfair_Display',Georgia,serif] text-[0.9rem] font-medium text-base-content"
      >
        {title}
      </p>

      <p
        className="
          font-['Crimson_Pro',Georgia,serif] text-[0.78rem] text-base-content/35
          italic text-black
        "
      >
        {editedAt}
      </p>
    </div>
  );
};

export default InkBoardCard;
