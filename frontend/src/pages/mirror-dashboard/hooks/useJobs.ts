import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { Job } from "../types/mirror.types";

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.get<Job[]>("/tryons").then((response) => response.data),
    refetchInterval: 2000,
  });
}
