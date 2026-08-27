import { useCallback, useEffect, useRef, useState } from "react";

export function useToast(duration = 3500) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback((setter: typeof setError, message: string) => {
    clearTimer();
    setter(message);
    timerRef.current = window.setTimeout(() => {
      setError("");
      setSuccess("");
      timerRef.current = null;
    }, duration);
  }, [clearTimer, duration]);

  const showError = useCallback((message: string) => show(setError, message), [show]);
  const showSuccess = useCallback((message: string) => show(setSuccess, message), [show]);

  useEffect(() => clearTimer, [clearTimer]);

  return { error, success, showError, showSuccess };
}
