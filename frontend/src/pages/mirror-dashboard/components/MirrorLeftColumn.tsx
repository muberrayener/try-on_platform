import { Aperture, Camera, Gem, MoreVertical, Sparkles } from "lucide-react";
import { AccessoryItem, DailyPlan, ImageItem, Lipstick } from "../types/mirror.types";

interface Props {
  personImage?: ImageItem;
  processingImage?: ImageItem;
  accessoryItems: AccessoryItem[];
  dailyPlans: DailyPlan[];
  lipsticks: Lipstick[];
  selectedShade: string;
  appliedShade: string | null;
  selectedLipstick?: Lipstick;
  onSelectShade: (shade: string) => void;
  onApplyShade: () => void;
  onUploadPerson: () => void;
  onOpenAccessories: () => void;
  onOpenPlans: () => void;
  onOpenLipsticks?: () => void; // <-- Prop arayüzüne eklendi
}

export function MirrorLeftColumn({
  personImage,
  processingImage,
  accessoryItems,
  dailyPlans,
  lipsticks,
  selectedShade,
  appliedShade,
  selectedLipstick,
  onSelectShade,
  onApplyShade,
  onUploadPerson,
  onOpenAccessories,
  onOpenPlans,
  onOpenLipsticks, // <-- Destructuring kısmına eklendi
}: Props) {
  const currentShade = lipsticks.find((lipstick) => lipstick.id === selectedShade) || selectedLipstick || lipsticks[0];
  const displayedShade = currentShade;

  return (
    <aside className="mirror-col-left">
      <article className="glass-panel widget-makeup">
        <div className="panel-header">
          <span>Makyaj önerisi</span>
          <Aperture size={15} className="header-icon" />
        </div>
        <div
          className="makeup-portrait-box"
          onClick={onUploadPerson}
          title="Fotoğraf değiştirmek veya yüklemek için tıklayın"
        >
          {personImage ? (
            <img
              className="makeup-portrait-img"
              src={`/api/v1/person-images/${personImage.id}/cutout`}
              alt="Makyaj Görünümü (Yüz)"
            />
          ) : processingImage ? (
            <div className="portrait-state state-loading">
              <Sparkles className="spin-slow" size={24} />
              <small>Yüz taranıyor…</small>
            </div>
          ) : (
            <div className="default-face-portrait">
              <img
                className="makeup-portrait-img default-face-img"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                alt="Model Yüz Portresi"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="portrait-upload-badge">
                <Camera size={13} />
                <span>Değiştir</span>
              </div>
            </div>
          )}
        </div>
        <div className="panel-footer-text">
          <b>Doğal ışıltı</b>
          <p>Günlük ve taze bir görünüm</p>
        </div>
      </article>

      <article className="glass-panel widget-lipstick">
        <div className="panel-header">
          <span>Ruj tonu</span>
          {/* Ruj koleksiyonu modalını açmak için buton bağlandı */}
          <button
            type="button"
            className="diamond-open-btn"
            title="Ruj Koleksiyonunu Yönet"
            onClick={onOpenLipsticks}
          >
            <MoreVertical size={14} className="header-icon" />
          </button>
        </div>
        <div className="lipstick-swatches">
          {lipsticks.map((lipstick) => (
            <button
              key={lipstick.id}
              type="button"
              className={`lipstick-swatch ${selectedShade === lipstick.id ? "active" : ""}`}
              style={{ backgroundColor: lipstick.color }}
              onClick={() => onSelectShade(lipstick.id)}
              title={lipstick.name}
            />
          ))}
        </div>
        <div className="panel-footer-text">
          <b>{displayedShade?.name ?? "Ruj eklenmedi"}</b>
          <p>Yumuşak &amp; Doğal</p>
        </div>
        <button
          type="button"
          className={`glass-action-btn ${displayedShade && appliedShade === displayedShade.color ? "applied" : ""}`}
          onClick={onApplyShade}
          disabled={!displayedShade}
        >
          {displayedShade && appliedShade === displayedShade.color ? "Uygulandı" : "Uygula"}
        </button>
      </article>

      <article className="glass-panel widget-accessories">
        <div className="panel-header">
          <span>Aksesuar önerisi</span>
          <button
            type="button"
            className="diamond-open-btn"
            title="Aksesuar Galerisi"
            onClick={onOpenAccessories}
          >
            <Gem size={14} className="header-icon" />
          </button>
        </div>
        <div className="accessories-row">
          {accessoryItems.slice(0, 3).map((item) => (
            <div key={item.id} className="accessory-chip" title={item.name}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="accessory-thumb" />
              ) : (
                <Gem size={18} />
              )}
            </div>
          ))}
        </div>
      </article>

      <article className="glass-panel widget-timeline">
        <div className="panel-header">
          <span>Günün planı</span>
          <button
            type="button"
            className="diamond-open-btn"
            title="Günün Planını Yönet"
            onClick={onOpenPlans}
          >
            <Sparkles size={14} className="header-icon" />
          </button>
        </div>
        <ul className="mirror-timeline-list">
          {dailyPlans.slice(0, 4).map((plan) => (
            <li key={plan.id}>
              <span className="time">{plan.time}</span>
              <span className="dot">•</span>
              <span className="event">{plan.title}</span>
            </li>
          ))}
          {!dailyPlans.length && (
            <li className="timeline-empty">Plan eklemek için yıldız ikonuna dokun</li>
          )}
        </ul>
      </article>
    </aside>
  );
}