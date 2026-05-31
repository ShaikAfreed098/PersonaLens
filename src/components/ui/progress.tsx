import * as React from "react";
import { cn } from "../../utils/cn";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => {
    // Clamp values between 0 and 100
    const percent = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100/80 border border-slate-200/40",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 bg-gradient-indigo-purple transition-all duration-500 ease-out rounded-full",
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - percent}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
