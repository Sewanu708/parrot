import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-3 py-2 text-sm text-[#37352f] dark:text-[#ffffff] placeholder:text-[#37352f]/40 dark:placeholder:text-[#777777] focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
