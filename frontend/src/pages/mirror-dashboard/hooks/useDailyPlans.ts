import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { DailyPlan } from "../types/mirror.types";

export function useDailyPlans() {
  const queryClient = useQueryClient();

  const dailyPlans = useQuery({
    queryKey: ["daily-plans"],
    queryFn: () => api.get<DailyPlan[]>("/daily-plans").then((response) => response.data),
  });

  const addDailyPlan = useMutation({
    mutationFn: (data: { time: string; title: string }) => {
      const form = new FormData();
      form.append("time", data.time);
      form.append("title", data.title);
      return api.post("/daily-plans", form);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily-plans"] }),
  });

  const removeDailyPlan = useMutation({
    mutationFn: (id: string) => api.delete(`/daily-plans/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily-plans"] }),
  });

  return { dailyPlans, addDailyPlan, removeDailyPlan };
}
