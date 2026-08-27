import { useState, useCallback } from "react";
import { Lipstick, CreateLipstickPayload } from "../types/lipstick";

interface UseLipsticksOptions {
  csrfToken?: string;
}

export const useLipsticks = (options?: UseLipsticksOptions) => {
  const [lipsticks, setLipsticks] = useState<Lipstick[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const csrfToken = options?.csrfToken;

  // 1. Ruj Listesini Getir (GET)
  const fetchLipsticks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/lipsticks", {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error("Ruj listesi alınamadı.");
      }

      const data: Lipstick[] = await res.json();
      setLipsticks(data);
    } catch (err: any) {
      setError(err.message || "Bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Yeni Ruj Ekle (POST - Form Data)
  const createLipstick = async (payload: CreateLipstickPayload) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("color", payload.color);

    try {
      const res = await fetch("/lipsticks", {
        method: "POST",
        headers: {
          ...(csrfToken && { "X-CSRF-Token": csrfToken }),
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Yeni ruj eklenemedi.");
      }

      const newLipstick: Lipstick = await res.json();

      // State'e ekle
      setLipsticks((prev) => [newLipstick, ...prev]);
      return newLipstick;
    } catch (err: any) {
      setError(err.message || "Ekleme sırasında bir hata oluştu.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. Ruj Seç (PATCH)
  const selectLipstick = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/lipsticks/${id}/select`, {
        method: "PATCH",
        headers: {
          ...(csrfToken && { "X-CSRF-Token": csrfToken }),
        },
      });

      if (!res.ok) {
        throw new Error("Ruj seçimi güncellenemedi.");
      }

      // Backend tek bir ruju seçili yapıp diğerlerini false yaptığı için state'i güncelliyoruz
      setLipsticks((prev) =>
        prev.map((item) => ({
          ...item,
          is_selected: item.id === id,
        }))
      );
    } catch (err: any) {
      setError(err.message || "Seçim sırasında bir hata oluştu.");
      throw err;
    }
  };

  // 4. Ruj Sil (DELETE)
  const deleteLipstick = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/lipsticks/${id}`, {
        method: "DELETE",
        headers: {
          ...(csrfToken && { "X-CSRF-Token": csrfToken }),
        },
      });

      if (!res.ok) {
        throw new Error("Ruj silinemedi.");
      }

      // Listeden çıkar (Soft-delete backend'de yapıldığı için frontend listeden kaldırır)
      setLipsticks((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message || "Silme sırasında bir hata oluştu.");
      throw err;
    }
  };

  return {
    lipsticks,
    loading,
    error,
    fetchLipsticks,
    createLipstick,
    selectLipstick,
    deleteLipstick,
  };
};