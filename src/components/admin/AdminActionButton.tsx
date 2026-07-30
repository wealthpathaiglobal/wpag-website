"use client";

interface AdminActionButtonProps {
  label: string;
  variant?:
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "secondary";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export default function AdminActionButton({
  label,
  variant = "primary",
  loading = false,
  disabled = false,
  onClick,
}: AdminActionButtonProps) {
  const colors = {
    primary:
      "bg-sky-600 hover:bg-sky-500 text-white",

    success:
      "bg-emerald-600 hover:bg-emerald-500 text-white",

    warning:
      "bg-amber-600 hover:bg-amber-500 text-white",

    danger:
      "bg-rose-600 hover:bg-rose-500 text-white",

    secondary:
      "bg-white/10 hover:bg-white/20 text-white",
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        rounded-xl
        px-5
        py-2.5
        text-sm
        font-medium
        transition-all
        duration-200
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${colors[variant]}
      `}
    >
      {loading ? "Processing..." : label}
    </button>
  );
}