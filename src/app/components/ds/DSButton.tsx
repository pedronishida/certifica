import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface DSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-certifica-accent text-white hover:bg-certifica-accent-dark active:bg-certifica-900 border border-certifica-accent",
  secondary: "bg-certifica-100 text-certifica-dark hover:bg-certifica-200 border border-certifica-200",
  ghost: "bg-transparent text-certifica-dark hover:bg-certifica-100 border border-transparent",
  destructive: "bg-nao-conformidade text-white hover:bg-nao-conformidade/90 border border-nao-conformidade",
  outline: "bg-white text-certifica-dark hover:bg-certifica-50 border border-certifica-200",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[12px] gap-1.5",
  md: "h-9 px-4 text-[13px] gap-2",
  lg: "h-10 px-5 text-[14px] gap-2",
};

export function DSButton({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}: DSButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[4px] transition-colors duration-150 cursor-pointer whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      style={{ fontWeight: 500 }}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}