import { Card, CardContent } from '@/components/ui/card'

export default function MetricCard({ label, value, sub, accent }) {
  return (
    <Card className="border-[#f0e8ee] shadow-none">
      <CardContent className="p-5">
        <p className="text-xs text-[#9ca3af] mb-1">{label}</p>
        <p className={`text-2xl font-semibold tracking-tight ${accent ? 'text-[#e879a0]' : 'text-[#1a1a2e]'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-[#9ca3af] mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
