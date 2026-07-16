import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
};

export function Button({
  children,
  href,
  variant = "primary",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition";

  const styles = {
    primary: "bg-white text-black hover:bg-zinc-200",
    secondary:
      "border border-zinc-700 text-white hover:border-zinc-400",
  };

  return (
    <Link href={href} className={`${base} ${styles[variant]}`}>
      {children}
    </Link>
  );
}