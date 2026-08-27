import { FormEvent, RefObject } from "react";
import { Camera, Eye, Mic, RotateCcw, Sparkles } from "lucide-react";
import { ImageItem, Job, MirrorView } from "../types/mirror.types";

interface Props {
  personInput: RefObject<HTMLInputElement | null>;
  person?: File;
  basePersonImage?: ImageItem;
  activeJob?: Job;
  mirrorView: MirrorView;
  onMirrorViewChange: (view: MirrorView) => void;
  onPersonChange: (file?: File) => void;
  onUpload: (event: FormEvent<HTMLFormElement>) => void;
  onCancelUpload: () => void;
  onNextShade: () => void;
}

export function MirrorStage({ personInput, person, basePersonImage, activeJob, mirrorView, onMirrorViewChange, onPersonChange, onUpload, onCancelUpload, onNextShade }: Props) {
  const openFilePicker = () => personInput.current?.click();

  return (
    <section className="mirror-stage-center">
      <input ref={personInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onPersonChange(e.target.files?.[0])} />
      {person && (
        <form className="pending-upload-bar" onSubmit={onUpload}>
          <span>Seçilen: {person.name}</span>
          <button type="submit" className="confirm-btn">Yükle</button>
          <button type="button" className="cancel-btn" onClick={onCancelUpload}>İptal</button>
        </form>
      )}

      <div className="person-reflection-layer">
        {mirrorView === "result" && activeJob?.has_result ? (
          <img className="reflection-figure result-anim" src={`/api/v1/tryons/${activeJob.id}/result`} alt="Try-on Sonucu" />
        ) : basePersonImage ? (
          <img className="reflection-figure" src={`/api/v1/person-images/${basePersonImage.id}/cutout`} alt="Kişi Yansıması" />
        ) : (
          <div className="empty-reflection-prompt" onClick={openFilePicker}>
            <div className="reflection-silhouette" />
            <div className="upload-cta"><Camera size={28} /><span>Aynaya geçmek için tam boy fotoğrafını yükle</span></div>
          </div>
        )}
      </div>

      {activeJob && !activeJob.has_result && activeJob.status !== "failed" && (
        <div className="mirror-progress-badge">
          <Sparkles size={16} className="spin-slow" />
          <span>Kombin hazırlanıyor…</span>
          <b>%{activeJob.progress}</b>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${activeJob.progress}%` }} /></div>
        </div>
      )}

      {activeJob?.status === "failed" && <div className="mirror-progress-badge error-toast">Kombin hazırlanırken bir hata oluştu.</div>}

      <div className="mirror-bottom-bar">
        {activeJob?.has_result && (
          <button type="button" className="glass-pill-toggle" onClick={() => onMirrorViewChange(mirrorView === "result" ? "base" : "result")}>
            {mirrorView === "result" ? <><RotateCcw size={14} /> Orijinale dön</> : <><Eye size={14} /> Sonucu göster</>}
          </button>
        )}
        <div className="mic-controls-cluster">
          <button type="button" className="sub-ctrl-btn" title="Fotoğraf Yükle" onClick={openFilePicker}><Camera size={18} /></button>
          <button type="button" className="master-mic-btn" title="Sesli Asistan"><div className="mic-outer-ring" /><div className="mic-inner-core"><Mic size={24} /></div></button>
          <button type="button" className="sub-ctrl-btn" title="Stil Önerisi" onClick={onNextShade}><Sparkles size={18} /></button>
        </div>
      </div>
    </section>
  );
}
