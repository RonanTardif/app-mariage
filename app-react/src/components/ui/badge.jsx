import { cn } from '../../utils/cn'

export function Badge({ className, ...props }) {
  return <span className={cn('inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700', className)} {...props} />
}
