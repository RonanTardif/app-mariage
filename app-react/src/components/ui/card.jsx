import { cn } from '../../utils/cn'

export function Card({ className, ...props }) {
  return <section className={cn('rounded-3xl border border-border bg-card shadow-premium', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 md:p-6', className)} {...props} />
}
