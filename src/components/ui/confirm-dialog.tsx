"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  isConfirming = false,
  errorMessage,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isConfirming) {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isConfirming, onOpenChange, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar confirmacao"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        disabled={isConfirming}
        onClick={() => onOpenChange(false)}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative z-10 w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_35px_100px_-35px_rgba(15,23,42,0.55)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <AlertTriangle className="size-5" />
            </div>

            <div>
              <h2 id="confirm-dialog-title" className="text-xl font-semibold text-slate-950">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Fechar"
            disabled={isConfirming}
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isConfirming}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" disabled={isConfirming} onClick={onConfirm}>
            {isConfirming ? "Excluindo ingrediente..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
