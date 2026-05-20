interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
}

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <article className="panel p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </article>
  );
}
