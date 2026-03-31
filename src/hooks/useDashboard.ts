import { useQuery } from "@tanstack/react-query";
import { apiGetDashboardData } from "@/lib/api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: apiGetDashboardData,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // poll every 5 min for stale task detection
  });
}
