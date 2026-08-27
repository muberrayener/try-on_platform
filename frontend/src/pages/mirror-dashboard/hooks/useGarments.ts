import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { Garment } from "../types/mirror.types";

export function useGarments() {
  const queryClient = useQueryClient();

  const garments = useQuery({
    queryKey: ["garments"],
    queryFn: () => api.get<Garment[]>("/garments").then((response) => response.data),
    refetchInterval: (query) =>
      query.state.data?.some(
        (garment) => garment.status === "uploaded" || garment.status === "background_removal"
      ) ? 1500 : false,
  });

  const addGarment = useMutation({
    mutationFn: (formData: FormData) => api.post("/garments", formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["garments"] }),
  });

  const deleteGarment = useMutation({
    mutationFn: (id: string) => api.delete(`/garments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["garments"] }),
  });

  return { garments, addGarment, deleteGarment };
}
