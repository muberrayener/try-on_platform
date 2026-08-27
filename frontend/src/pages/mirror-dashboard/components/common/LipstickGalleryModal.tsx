import { Check, X } from "lucide-react";

type Shade = {
  id: string;
  name: string;
  color: string;
};

type Props = {
  open: boolean;
  shades: Shade[];
  selectedShade: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export default function LipstickGalleryModal({
  open,
  shades,
  selectedShade,
  onSelect,
  onClose
}: Props) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <span className="modal-eyebrow">
          MAKYAJ
        </span>

        <h2>Ruj Tonları</h2>

        <div className="lipstick-gallery-grid">
          {shades.map((shade) => (
            <div
              key={shade.id}
              className={`lipstick-gallery-card ${
                selectedShade === shade.id
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                onSelect(shade.id);
                onClose();
              }}
            >
              <div
                className="lipstick-gallery-color"
                style={{
                  backgroundColor: shade.color
                }}
              />

              <span>{shade.name}</span>

              {selectedShade === shade.id && (
                <Check size={16} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}