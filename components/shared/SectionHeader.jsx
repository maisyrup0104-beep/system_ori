export default function SectionHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-[#1a1a2e]">{title}</h2>
        {description && (
          <p className="text-sm text-[#6b7280] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
