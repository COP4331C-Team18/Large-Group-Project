import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useBoardPreview } from "@/hooks/useBoardPreview";

export interface InkBoardCardProps {
  id?: number | string;
  title: string;
  editedAt: string;
  snapshot?: string;
  onClick?: () => void;
}

const InkBoardCard: React.FC<InkBoardCardProps> = ({
  id,
  title,
  editedAt,
  snapshot,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  useBoardPreview(snapshot ? undefined : id, canvasRef);

  return (
    <motion.div
      layoutId={id ? String(id) : undefined}
      onClick={onClick}
      className="group relative cursor-pointer rounded-[14px] aspect-video
        border border-base-300 bg-base-100 p-5
        shadow-[0_2px_8px_rgba(44,44,36,0.08)]
        transition-all duration-200 ease-out
        hover:-translate-y-0.5
        hover:shadow-[0_6px_20px_rgba(44,44,36,0.13)]
        hover:border-primary/80
        font-serif
      "
    >
      <div
        className="
          relative mb-[0.85rem] overflow-hidden aspect-video
          rounded-lg bg-[#F8F6F0]
          px-3 py-3">
        {snapshot ? (
          <img src={snapshot} alt={`Snapshot of ${title} (ID: ${id})`} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            width={320}
            height={180}
            style={{ background: '#F8F6F0' }}
          />
        )}
      </div>

      <p
        className="mb-1 truncate font-['Playfair_Display',Georgia,serif] text-[0.9rem] font-medium text-base-content"
      >
        {title}
      </p>

      <p
        className="
          font-['Crimson_Pro',Georgia,serif] text-[0.78rem] text-base-content/35
          italic
        "
      >
        {editedAt}
      </p>
    </motion.div>
  );
};

export default InkBoardCard;
