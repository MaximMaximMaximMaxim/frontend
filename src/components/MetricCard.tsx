interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
}

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <article className="panel metric-card p-5 pl-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 break-words text-2xl font-bold text-slate-950 sm:text-3xl">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </article>
  );
}
