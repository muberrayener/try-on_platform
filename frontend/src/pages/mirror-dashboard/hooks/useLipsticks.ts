import { useState, useCallback, useEffect } from "react";
import { api } from "../../../api/client";
import { Lipstick } from "../types/mirror.types";

interface CreateLipstickPayload {
  name: string;
  color: string;
}
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
      const response = await api.get<Lipstick[]>("/lipsticks");
      setLipsticks(response.data);
    } catch (err: any) {
      setError(err.message || "Bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLipsticks();
  }, [fetchLipsticks]);

  // 2. Yeni Ruj Ekle (POST - Form Data)
  const createLipstick = async (payload: CreateLipstickPayload) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("color", payload.color);

    try {
      const response = await api.post<Lipstick>("/lipsticks", formData);
      const newLipstick = response.data;

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
      await api.patch(`/lipsticks/${id}/select`);

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
      await api.delete(`/lipsticks/${id}`);

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