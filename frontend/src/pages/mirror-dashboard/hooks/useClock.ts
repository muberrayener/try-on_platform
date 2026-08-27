import { useEffect, useState } from "react";

export function useClock() {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return {
    formattedTime: currentTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    formattedDate: currentTime.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }),
  };
}
