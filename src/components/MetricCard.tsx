interface MetricCardProps {
  label: string;
  value: string;
  change: string;
}

export function MetricCard({ label, value, change }: MetricCardProps) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>较昨日 {change}</em>
    </article>
  );
}
