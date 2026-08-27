import React, { useState, useEffect } from "react";
import { Lipstick } from "../types/mirror.types";

export interface LipstickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  csrfToken: string; // CSRF koruması için gerekli
} 
export const LipstickModal: React.FC<LipstickModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  csrfToken,
}) => {
  const [lipsticks, setLipsticks] = useState<Lipstick[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ff0055");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ruj listesini çekme
  const fetchLipsticks = async () => {
    try {
      const res = await fetch("/lipsticks", {
        headers: { "Accept": "application/json" },
      });
      if (!res.ok) throw new Error("Listelenirken hata oluştu");
      const data: Lipstick[] = await res.json();
      setLipsticks(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLipsticks();
    }
  }, [isOpen]);

  // Yeni ruj ekleme (Form Data kullanarak)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("color", color);

    try {
      const res = await fetch("/lipsticks", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken, // CSRF header'ı
        },
        body: formData, // Backend Form(...) beklediği için FormData gönderiyoruz
      });

      if (!res.ok) throw new Error("Ruj eklenemedi");

      setName("");
      setColor("#ff0055");
      await fetchLipsticks();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ruj seçme
  const handleSelect = async (id: string) => {
    try {
      const res = await fetch(`/lipsticks/${id}/select`, {
        method: "PATCH",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      });

      if (!res.ok) throw new Error("Seçim yapılamadı");

      setLipsticks((prev) =>
        prev.map((item) => ({
          ...item,
          is_selected: item.id === id,
        }))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Ruj silme (Soft-delete)
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/lipsticks/${id}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      });

      if (!res.ok) throw new Error("Ruj silinemedi");

      setLipsticks((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-semibold">Ruj Koleksiyonum</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded bg-red-100 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Ekleme Formu */}
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ruj Adı
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Velvet Red"
              className="mt-1 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Renk
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300 p-1"
              />
              <span className="text-xs text-gray-500">{color}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-pink-600 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {loading ? "Ekleniyor..." : "Yeni Ruj Ekle"}
          </button>
        </form>

        {/* Listeleme */}
        <div className="mt-6 max-h-60 overflow-y-auto">
          <h3 className="mb-2 text-sm font-medium text-gray-600">Rujlarınız</h3>
          {lipsticks.length === 0 ? (
            <p className="text-center text-sm text-gray-400">
              Henüz eklenmiş bir ruj yok.
            </p>
          ) : (
            <ul className="space-y-2">
              {lipsticks.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center justify-between rounded-md border p-3 ${
                    item.is_selected
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-5 w-5 rounded-full border shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-gray-800">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelect(item.id)}
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        item.is_selected
                          ? "bg-pink-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {item.is_selected ? "Seçili" : "Seç"}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded p-1 text-xs text-red-500 hover:bg-red-50"
                    >
                      Sil
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};