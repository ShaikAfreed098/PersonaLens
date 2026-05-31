import * as React from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "gradient" | "destructive";
  size?: "sm" | "default" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-[16px] text-sm font-medium transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.03] active:scale-[0.97] cursor-pointer font-body",
          {
            // Default flat styling
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-indigo-500/10": variant === "default",
            "bg-secondary text-secondary-foreground hover:bg-slate-100 border border-border": variant === "secondary",
            "border border-border bg-transparent text-foreground hover:bg-secondary": variant === "outline",
            "hover:bg-secondary hover:text-foreground text-muted-foreground": variant === "ghost",
            "bg-gradient-indigo-purple text-white hover:brightness-105 shadow-md shadow-indigo-500/15 hover:shadow-lg hover:shadow-indigo-500/20": variant === "gradient",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            
            // Sizes
            "h-9 px-3 text-xs": size === "sm",
            "h-11 px-6": size === "default",
            "h-12 px-8 text-base": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
