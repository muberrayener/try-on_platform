import { ChevronRight } from "lucide-react";
import { Garment, ImageItem } from "../types/mirror.types";
import { OutfitCard } from "./OutfitCard";

interface Props {
  garments: Garment[];
  selectedGarment: string;
  basePersonImage?: ImageItem;
  isTryingOn: boolean;
  onSelectGarment: (id: string) => void;
  onTryOn: () => void;
  onOpenWardrobe: () => void;
}

export function WardrobePanel({ garments, selectedGarment, basePersonImage, isTryingOn, onSelectGarment, onTryOn, onOpenWardrobe }: Props) {
  return (
    <aside className="mirror-col-right">
      <article className="glass-panel wardrobe-panel">
        <div className="wardrobe-header"><div><h2>Bugün ne giysem?</h2><p>Sana özel kombin önerileri</p></div></div>
        <div className="outfit-cards-list">
          {garments.length ? garments.map((garment, index) => (
            <OutfitCard key={garment.id} garment={garment} index={index} selected={selectedGarment === garment.id} onSelect={() => onSelectGarment(garment.id)} />
          )) : <div className="outfit-empty"><p>Henüz kayıtlı kombin bulunamadı.</p></div>}
        </div>
        <div className="wardrobe-actions">
          <button type="button" className="try-outfit-btn" disabled={!basePersonImage || !selectedGarment || isTryingOn} onClick={onTryOn}>
            <span>{isTryingOn ? "Kombinleniyor…" : "Üzerimde dene"}</span><ChevronRight size={16} />
          </button>
          <button type="button" className="more-link-btn" onClick={onOpenWardrobe} title="Gardırobu Aç & Yönet"><span>Daha fazla</span><ChevronRight size={14} /></button>
        </div>
      </article>
    </aside>
  );
}
