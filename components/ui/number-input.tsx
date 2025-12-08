"use client";

import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/utils/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value?: number | string;
  onValueChange?: (value: number) => void;
  formatOptions?: Intl.NumberFormatOptions;
  minValue?: number;
  maxValue?: number;
  step?: number;
  hideStepper?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      formatOptions,
      minValue,
      maxValue,
      step = 1,
      hideStepper = false,
      startContent,
      endContent,
      disabled,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState<string>(
      value !== undefined && value !== null ? String(value) : ""
    );
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setLocalValue(String(value));
      }
    }, [value]);

    const formatNumber = (num: number): string => {
      if (formatOptions) {
        return new Intl.NumberFormat("en-US", formatOptions).format(num);
      }
      return num.toString();
    };

    const parseValue = (val: string): number => {
      const parsed = parseFloat(val.replace(/[^0-9.-]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      const numValue = parseValue(newValue);
      if (onValueChange) {
        onValueChange(numValue);
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      const numValue = parseValue(localValue);
      let finalValue = numValue;

      if (minValue !== undefined && finalValue < minValue) {
        finalValue = minValue;
      }
      if (maxValue !== undefined && finalValue > maxValue) {
        finalValue = maxValue;
      }

      if (formatOptions) {
        setLocalValue(formatNumber(finalValue));
      } else {
        setLocalValue(finalValue.toString());
      }
      if (onValueChange) {
        onValueChange(finalValue);
      }
    };

    const increment = () => {
      const current = parseValue(localValue) || 0;
      let newValue = current + step;
      if (maxValue !== undefined && newValue > maxValue) {
        newValue = maxValue;
      }
      const formatted = formatOptions ? formatNumber(newValue) : newValue.toString();
      setLocalValue(formatted);
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    const decrement = () => {
      const current = parseValue(localValue) || 0;
      let newValue = current - step;
      if (minValue !== undefined && newValue < minValue) {
        newValue = minValue;
      }
      const formatted = formatOptions ? formatNumber(newValue) : newValue.toString();
      setLocalValue(formatted);
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    return (
      <div
        className={cn(
          "group relative flex items-center",
          "liquid-glass-input rounded-lg",
          "bg-background/40 backdrop-blur-xl border border-border/50",
          "transition-all duration-200",
          isFocused && "border-primary/50 shadow-lg shadow-primary/10",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {startContent && (
          <div className="pl-3 flex items-center text-muted-foreground">
            {startContent}
          </div>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          min={minValue}
          max={maxValue}
          step={step}
          className={cn(
            "flex-1 w-full bg-transparent border-0 outline-none",
            "px-3 py-2 text-sm",
            "placeholder:text-muted-foreground/60",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            startContent && "pl-0",
            endContent && !hideStepper && "pr-0",
            hideStepper && !endContent && "pr-3",
            !hideStepper && !endContent && "pr-0"
          )}
          ref={ref}
          {...props}
        />
        {endContent && !hideStepper && (
          <div className="pr-1 flex items-center text-muted-foreground">
            {endContent}
          </div>
        )}
        {!hideStepper && (
          <div className="flex flex-col border-l border-border/30">
            <button
              type="button"
              onClick={increment}
              disabled={disabled || (maxValue !== undefined && parseValue(localValue) >= maxValue)}
              className={cn(
                "p-0.5 hover:bg-muted/50 transition-colors",
                "flex items-center justify-center",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={decrement}
              disabled={disabled || (minValue !== undefined && parseValue(localValue) <= minValue)}
              className={cn(
                "p-0.5 hover:bg-muted/50 transition-colors",
                "flex items-center justify-center border-t border-border/30",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}
        {!hideStepper && !endContent && <div className="w-1" />}
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };

