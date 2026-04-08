interface DeleteAccountProps {
  onConfirm: () => void;
  onClose: () => void;
  sectionLabel: string;
  outlineButton: string;
}

export default function DeleteAccount({
  onConfirm,
  onClose,
  sectionLabel,
  outlineButton,
}: DeleteAccountProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded border border-primary/20 border-t-[3px] border-t-error
          px-8 py-7 shadow-xl flex flex-col gap-5 w-[340px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className={sectionLabel}>Delete account</p>
        <p className="font-sans text-[0.88rem] text-base-content">
          This will permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button className={outlineButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className="w-full flex items-center justify-center
              font-sans text-[0.76rem] font-semibold tracking-[0.1em] uppercase
              bg-error text-white
              px-6 py-[0.75rem] rounded-[3px] border-none
              transition-colors duration-200 hover:brightness-90
              cursor-pointer"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}