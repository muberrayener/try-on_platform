import { Check, Heart } from "lucide-react";
import { Garment } from "../types/mirror.types";
import { categoryName } from "../constants/mirror.constants";

interface Props {
  garment: Garment;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

export function OutfitCard({ garment, index, selected, onSelect }: Props) {
  return (
    <div className={`outfit-card ${selected ? "selected" : ""}`} onClick={onSelect}>
      <div className="outfit-badge">
        {selected ? (
          <div className="check-badge"><Check size={14} strokeWidth={3} /></div>
        ) : (
          <button type="button" className="heart-badge" onClick={(event) => event.stopPropagation()}><Heart size={14} /></button>
        )}
      </div>
      <div className={`outfit-art-box theme-${index % 3}`}>
        {garment.image_url ? <img src={garment.image_url} alt={garment.name} className="outfit-wardrobe-image" /> : <div className="outfit-mannequin"><span className="outfit-initial">{garment.name.slice(0, 1)}</span></div>}
      </div>
      <div className="outfit-info-overlay"><b>{garment.name}</b><small>{categoryName[garment.category as keyof typeof categoryName] || garment.category}</small></div>
    </div>
  );
}
