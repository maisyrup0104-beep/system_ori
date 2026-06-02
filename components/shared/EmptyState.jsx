import { Card, CardContent } from '@/components/ui/card'

export default function EmptyState({ title, description }) {
  return (
    <Card className="border-[#f0e8ee] border-dashed shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 rounded-full bg-[#fce4ed] flex items-center justify-center mb-3">
          <span className="text-[#e879a0] text-lg">○</span>
        </div>
        <p className="text-sm font-medium text-[#1a1a2e] mb-1">{title}</p>
        {description && (
          <p className="text-xs text-[#9ca3af] max-w-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
