import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  type?: 'default' | 'thin' | 'hover' | 'invisible'
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, type = 'default', ...props }, ref) => {
    const scrollbarClass = {
      default: '',
      thin: 'scrollbar-thin',
      hover: 'scrollbar-hover',
      invisible: 'scrollbar-invisible'
    }[type]

    return (
      <div
        ref={ref}
        className={cn("overflow-auto", scrollbarClass, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ScrollArea.displayName = "ScrollArea"

export { ScrollArea }