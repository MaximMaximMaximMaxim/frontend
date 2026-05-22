interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Загрузка данных..." }: LoadingStateProps) {
  return (
    <div className="panel flex min-h-48 items-center justify-center">
      <div className="h-3 w-3 animate-pulse rounded-full" style={{ background: "var(--primary)" }} />
      <span className="ml-3 text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}
