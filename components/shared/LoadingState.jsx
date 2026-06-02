export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-[#fce4ed] border-t-[#e879a0] animate-spin" />
        <p className="text-xs text-[#9ca3af]">{message}</p>
      </div>
    </div>
  )
}
