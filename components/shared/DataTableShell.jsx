import { Card, CardContent } from '@/components/ui/card'

export default function DataTableShell({ columns, children }) {
  return (
    <Card className="border-[#f0e8ee] shadow-none">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {columns && (
              <thead>
                <tr className="border-b border-[#f0e8ee] bg-[#fdf2f6]/60">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>{children}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
