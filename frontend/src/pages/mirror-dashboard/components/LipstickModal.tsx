import React, { useEffect, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";

import { api } from "../../../api/client";
import { Lipstick } from "../types/mirror.types";

export interface LipstickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LipstickModal: React.FC<LipstickModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [lipsticks, setLipsticks] = useState<Lipstick[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ff0055");
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLipsticks = async () => {
    try {
      setError(null);

      const response = await api.get<Lipstick[]>("/lipsticks");

      setLipsticks(response.data);
    } catch {
      setError("Rujlar listelenemedi.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchLipsticks();
    }
  }, [isOpen]);

  const handleCreate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Ruj adı boş bırakılamaz.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();

    formData.append("name", trimmedName);
    formData.append("color", color);

    try {
      await api.post("/lipsticks", formData);

      setName("");
      setColor("#ff0055");

      await fetchLipsticks();
      onSuccess?.();
    } catch {
      setError("Ruj eklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (id: string) => {
    setSelectingId(id);
    setError(null);

    try {
      await api.patch(`/lipsticks/${id}/select`);

      setLipsticks((previous) =>
        previous.map((item) => ({
          ...item,
          is_selected: item.id === id,
        }))
      );

      onSuccess?.();
    } catch {
      setError("Ruj seçimi kaydedilemedi.");
    } finally {
      setSelectingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);

    try {
      await api.delete(`/lipsticks/${id}`);

      setLipsticks((previous) =>
        previous.filter((item) => item.id !== id)
      );

      onSuccess?.();
    } catch {
      setError("Ruj silinemedi.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="admin-modal-card lipstick-mgmt-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Ruj koleksiyonunu kapat"
        >
          <X size={18} />
        </button>

        <span className="modal-eyebrow">
          MAKYAJ MASAM
        </span>

        <h2>Ruj Koleksiyonum</h2>

        {error && (
          <div className="floating-toast error-toast">
            {error}
          </div>
        )}

        <form
          className="lipstick-add-form"
          onSubmit={handleCreate}
        >
          <label>
            Ruj adı

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Örn: Velvet Red"
              required
            />
          </label>

          <label>
            Renk

            <div className="lipstick-color-input-row">
              <input
                type="color"
                value={color}
                onChange={(event) =>
                  setColor(event.target.value)
                }
              />

              <span>{color}</span>

              <span
                className="lipstick-color-preview"
                style={{ backgroundColor: color }}
              />
            </div>
          </label>

          <button
            type="submit"
            className="modal-submit-btn"
            disabled={loading || !name.trim()}
          >
            <Plus size={16} />

            {loading ? "Ekleniyor..." : "Yeni Ruj Ekle"}
          </button>
        </form>

        <div className="lipstick-manager-list">
          <h3>Rujlarınız</h3>

          {lipsticks.length === 0 ? (
            <div className="wardrobe-mgmt-empty">
              <p>Henüz eklenmiş bir ruj yok.</p>
            </div>
          ) : (
            lipsticks.map((item) => (
  <div
    key={item.id}
    className={`lipstick-manager-item ${item.is_selected ? "selected" : ""}`}
  >
    {/* Sol Taraf: Büyük Renk Dairesi, İsim ve Renk Kodu Tek Satırda */}
    <div className="lipstick-manager-info-group">
      <span
        className="lipstick-manager-color"
        style={{ backgroundColor: item.color }}
        title={item.color}
      />

      <div className="lipstick-manager-info">
        <b>{item.name}</b>
        
        {/* Renk Kodu ve İçindeki Nokta Göstergesi */}
        <small className="lipstick-color-badge">
          <span
            className="lipstick-badge-dot"
            style={{ backgroundColor: item.color }}
          />
          {item.color}
        </small>
      </div>
    </div>

    {/* Sağ Taraf: Seçili ve Sil Butonları */}
    <div className="lipstick-actions-group">
      <button
        type="button"
        className={`lipstick-select-btn ${item.is_selected ? "selected" : ""}`}
        disabled={item.is_selected || selectingId === item.id}
        onClick={() => {
          void handleSelect(item.id);
        }}
      >
        {selectingId === item.id ? (
          "Seçiliyor..."
        ) : item.is_selected ? (
          <>
            <Check size={14} />
            Seçili
          </>
        ) : (
          "Seç"
        )}
      </button>

      <button
        type="button"
        className="lipstick-delete-btn"
        title="Ruju sil"
        aria-label={`${item.name} rujunu sil`}
        disabled={deletingId === item.id}
        onClick={() => {
          void handleDelete(item.id);
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  </div>
))
            
          )}
        </div>
      </div>
    </div>
  );
};