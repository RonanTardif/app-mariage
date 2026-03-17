import { cn } from '../../utils/cn'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground shadow-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-300',
        className,
      )}
      {...props}
    />
  )
}
