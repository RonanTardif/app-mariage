import { motion } from 'framer-motion'

export function PageIntro({ eyebrow, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="page-hero-gradient mb-4 rounded-3xl border border-border p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-stone-600">{description}</p>
    </motion.div>
  )
}
