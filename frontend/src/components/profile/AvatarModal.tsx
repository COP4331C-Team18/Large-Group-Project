import { type AvatarId } from './Avatar';
import Avatar, { AvatarPicker } from './Avatar';
import { useState } from 'react';

interface AvatarPickerProps {
  current: AvatarId;
  onConfirm: (id: AvatarId) => void;
  onClose: () => void;
  sectionLabel: string;
  primaryButton: string;
  outlineButton: string;
}

export default function AvatarModal({
  current,
  onConfirm,
  onClose,
  sectionLabel,
  primaryButton,
  outlineButton,
}: AvatarPickerProps) {
  const [pending, setPending] = useState<AvatarId>(current);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded border border-[rgba(74,90,58,0.28)] border-t-[3px] border-t-cap
          px-8 py-7 shadow-xl flex flex-col gap-5 w-[340px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className={sectionLabel}>Choose your avatar</p>

        <div className="flex justify-center">
          <Avatar avatarId={pending} size="lg" />
        </div>

        <AvatarPicker selected={pending} onChange={setPending} />

        <div className="flex gap-3">
          <button className={outlineButton} onClick={onClose}>
            Cancel
          </button>
          <button className={primaryButton} onClick={() => onConfirm(pending)}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}