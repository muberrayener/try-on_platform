import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { ImageItem } from "../types/mirror.types";

export function useTryOn(basePersonImage?: ImageItem) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (garmentId: string) => {
      if (!basePersonImage) throw new Error("Temel fotoğraf bulunamadı.");
      return api.post("/tryons", {
        person_image_id: basePersonImage.id,
        garment_id: garmentId,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });
}
