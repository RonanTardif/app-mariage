export function LoadingState({ message = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-400">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-rose-400" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function ErrorState({ message = 'Une erreur est survenue.' }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
      {message}
    </div>
  )
}
