interface MirrorToastProps {
  error?: string;
  success?: string;
}

export function MirrorToast({ error, success }: MirrorToastProps) {
  return (
    <>
      {error && <div className="floating-toast error-toast">{error}</div>}
      {success && <div className="floating-toast success-toast">{success}</div>}
    </>
  );
}
