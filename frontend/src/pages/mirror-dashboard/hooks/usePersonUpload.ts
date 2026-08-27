import { FormEvent, RefObject, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";

interface Options {
  inputRef: RefObject<HTMLInputElement | null>;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export function usePersonUpload({ inputRef, showSuccess, showError }: Options) {
  const queryClient = useQueryClient();

  const uploadPerson = useCallback(async (event: FormEvent<HTMLFormElement>, file?: File) => {
    event.preventDefault();
    if (!file) return;

    const form = new FormData();
    form.append("image", file);

    try {
      await api.post("/person-images", form);
      if (inputRef.current) inputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      showSuccess("Fotoğraf başarıyla yüklendi, arka plan hazırlanıyor.");
      return true;
    } catch {
      showError("Fotoğraf yüklenemedi.");
      return false;
    }
  }, [inputRef, queryClient, showError, showSuccess]);

  return { uploadPerson };
}
