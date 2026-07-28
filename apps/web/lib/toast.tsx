import React from "react";
import { toast as sonnerToast } from "sonner";
import { ErrorHandler, getParrotPublicCode } from "./utils";

export interface ToastOptions {
  description?: string;
  code?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ParrotToastCardProps {
  id: string | number;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
  code?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ParrotToastCard({
  id,
  type,
  title,
  description,
  code,
  action,
}: ParrotToastCardProps) {
  const isError = type === "error";
  const isSuccess = type === "success";

  // Enforce the terminal-style aesthetic based on log level
  const containerBorder = isError ? "border-red-500/50" : "border-[#333333]";
  const levelText = isError ? "[ ERR ]" : isSuccess ? "[ OK ]" : "[ MSG ]";
  const levelColor = isError
    ? "text-red-500"
    : isSuccess
    ? "text-emerald-500"
    : "text-blue-500";

  return (
    <div
      className={`bg-black border ${containerBorder} rounded-md p-4 w-80 shadow-2xl flex flex-col gap-1 group font-sans antialiased`}
    >
      {/* Header: Log Level & Code */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-[10px] uppercase tracking-widest ${levelColor}`}
          >
            {levelText}
          </span>
          {code && (
            <span className="font-mono text-[10px] text-neutral-500">
              {code}
            </span>
          )}
        </div>

        {/* Dismiss button (Visible on hover to keep UI clean) */}
        <button
          onClick={() => sonnerToast.dismiss(id)}
          className="text-neutral-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>

      {/* Main Content */}
      <p className="text-sm font-medium text-white">{title}</p>

      {description && (
        <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={() => {
            action.onClick();
            sonnerToast.dismiss(id);
          }}
          className="mt-3 self-start font-mono text-[10px] uppercase tracking-widest bg-transparent hover:bg-[#111111] text-white border border-[#333333] px-3 py-1.5 rounded-md transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export const notify = {
  /**
   * Success notification (Auto-dismisses in 4 seconds)
   */
  success: (title: string, options?: ToastOptions) => {
    return sonnerToast.custom(
      (id) => (
        <ParrotToastCard
          id={id}
          type="success"
          title={title}
          description={options?.description}
          action={options?.action}
        />
      ),
      { duration: 4000 }
    );
  },

  /**
   * Info / Realtime event notification (Auto-dismisses in 4 seconds)
   */
  info: (title: string, options?: ToastOptions) => {
    return sonnerToast.custom(
      (id) => (
        <ParrotToastCard
          id={id}
          type="info"
          title={title}
          description={options?.description}
          action={options?.action}
        />
      ),
      { duration: 4000 }
    );
  },

  /**
   * Error notification (Persists until user dismisses)
   */
  error: (err: unknown, fallbackTitle?: string, options?: ToastOptions) => {
    const title = fallbackTitle || ErrorHandler(err);
    const code = options?.code || getParrotPublicCode(err);

    return sonnerToast.custom(
      (id) => (
        <ParrotToastCard
          id={id}
          type="error"
          title={title}
          description={options?.description}
          code={code}
          action={options?.action}
        />
      ),
      { duration: Infinity }
    );
  },

  /** Manual dismissal */
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};

export default notify;