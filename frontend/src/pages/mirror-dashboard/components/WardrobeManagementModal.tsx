import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { Garment } from "../types/mirror.types";
import { categoryName } from "../constants/mirror.constants";

interface Props {
  open: boolean;
  garments: Garment[];
  selectedGarment: string;
  isUploading: boolean;
  onSelectGarment: (id: string) => void;
  onDeleteGarment: (id: string) => Promise<void>;
  onAddGarment: (data: { name: string; category: string; file: File }) => Promise<boolean>;
  onClose: () => void;
}

export function WardrobeManagementModal({ open, garments, selectedGarment, isUploading, onSelectGarment, onDeleteGarment, onAddGarment, onClose }: Props) {
  const [tab, setTab] = useState<"list" | "add">("list");
  const [name, setName] = useState("Yeni parça");
  const [category, setCategory] = useState("upper_body");
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTab("list");
  }, [open]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (!open) return null;

  const resetAddForm = () => {
    setName("Yeni parça");
    setCategory("upper_body");
    setFile(undefined);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = (nextFile?: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    const ok = await onAddGarment({ name: name.trim() || "Yeni parça", category, file });
    if (ok) {
      resetAddForm();
      setTab("list");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card wardrobe-mgmt-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        <span className="modal-eyebrow">KİŞİSEL GARDIROP</span>
        <h2>Gardırop Yönetimi</h2>

        <div className="auth-tabs" style={{ marginBottom: 16 }}>
          <button type="button" className={`auth-tab ${tab === "list" ? "active" : ""}`} onClick={() => setTab("list")}>Kıyafetlerim ({garments.length})</button>
          <button type="button" className={`auth-tab ${tab === "add" ? "active" : ""}`} onClick={() => setTab("add")}><Plus size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Yeni Ekle</button>
        </div>

        {tab === "list" ? (
          garments.length ? (
            <div className="wardrobe-mgmt-list">
              {garments.map((garment) => {
                const selected = selectedGarment === garment.id;
                return (
                  <div key={garment.id} className={`wardrobe-mgmt-item ${selected ? "selected" : ""}`} onClick={() => onSelectGarment(garment.id)}>
                    <div className="mgmt-item-visual">
                      {garment.image_url ? <img src={garment.image_url} alt={garment.name} className="mgmt-item-thumb" /> : <div className="mgmt-item-fallback">{garment.name.slice(0, 1)}</div>}
                    </div>
                    <div className="mgmt-item-info"><b>{garment.name}</b><small>{categoryName[garment.category as keyof typeof categoryName] || garment.category}</small></div>
                    <button type="button" className="mgmt-delete-btn" title="Gardıroptan Çıkar" onClick={(event) => { event.stopPropagation(); void onDeleteGarment(garment.id); }}><Trash2 size={15} /></button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="wardrobe-mgmt-empty"><p>Gardırobunuzda henüz kıyafet yok.</p><button type="button" className="glass-action-btn" style={{ marginTop: 10 }} onClick={() => setTab("add")}>İlk Kıyafetini Ekle</button></div>
          )
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <label>Ürün Adı<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn: Bej Keten Pantolon" required /></label>
            <label>Kategori<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="upper_body">Üst Giyim</option><option value="lower_body">Alt Giyim</option><option value="dress">Elbise</option><option value="kombin">Kombin</option></select></label>
            <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleFileChange(event.target.files?.[0])} />
            <button type="button" className="file-picker-btn" disabled={isUploading} onClick={() => inputRef.current?.click()}>{isUploading ? <Loader2 size={16} className="upload-spinner" /> : <Upload size={16} />}<span>{file ? file.name : "Kıyafet Görseli Seç"}</span></button>
            {previewUrl && <div className="garment-preview-box"><img src={previewUrl} alt="Seçilen kıyafet önizlemesi" className="garment-preview-image" /></div>}
            {!file && <small className="form-helper-text">Ürün görseli zorunludur.</small>}
            <button type="submit" className="modal-submit-btn" disabled={!file || isUploading}>{isUploading ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Loader2 size={16} className="upload-spinner" />Yüklüyor...</span> : "Gardıroba Ekle"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
