import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { AccessoryItem } from "../types/mirror.types";

export function normalizeAccessory(item: AccessoryItem): AccessoryItem {
  return {
    ...item,
    category: item.category ?? "other",
    imageUrl: item.imageUrl ?? item.image_url ?? "",
  };
}

export function useAccessories() {
  const queryClient = useQueryClient();

  const accessories = useQuery({
    queryKey: ["accessories"],
    queryFn: () => api.get<AccessoryItem[]>("/accessories").then((response) => response.data.map(normalizeAccessory)),
  });

  const addAccessory = useMutation({
    mutationFn: (formData: FormData) => api.post<AccessoryItem>("/accessories", formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accessories"] }),
  });

  const removeAccessory = useMutation({
    mutationFn: (id: string) => api.delete(`/accessories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accessories"] }),
  });

  return { accessories, addAccessory, removeAccessory };
}
