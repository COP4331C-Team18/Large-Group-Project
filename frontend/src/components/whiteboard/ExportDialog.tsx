import React from 'react';

export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, onExport }) => {
  if (!isOpen) return null;

  const formats: { id: ExportFormat; label: string; description: string }[] = [
    { id: 'png', label: 'PNG', description: 'High quality, supports transparency' },
    { id: 'jpg', label: 'JPG', description: 'Compressed, smaller file size' },
    { id: 'svg', label: 'SVG', description: 'Vector format, scalable' },
    { id: 'pdf', label: 'PDF', description: 'Document format, printable' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-base-content">Export InkBoard</h3>
        <p className="text-sm text-base-content/70 mb-6">
          Choose a format to export your InkBoard:
        </p>

        <div className="space-y-3 mb-6">
          {formats.map((format) => (
            <button
              key={format.id}
              onClick={() => onExport(format.id)}
              className="w-full text-left p-3 rounded-lg border border-base-300 hover:bg-base-200 transition-colors"
            >
              <div className="font-medium text-base-content">{format.label}</div>
              <div className="text-sm text-base-content/60">{format.description}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-base-content/70 hover:bg-base-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;