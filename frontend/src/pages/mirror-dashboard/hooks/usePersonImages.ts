import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { ImageItem } from "../types/mirror.types";

export function usePersonImages() {
  return useQuery({
    queryKey: ["images"],
    queryFn: () => api.get<ImageItem[]>("/person-images").then((response) => response.data),
    refetchInterval: (query) =>
      query.state.data?.some(
        (image) => image.status === "uploaded" || image.status === "background_removal"
      ) ? 1500 : false,
  });
}
