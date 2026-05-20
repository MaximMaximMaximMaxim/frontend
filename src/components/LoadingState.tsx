interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Загрузка данных из API..." }: LoadingStateProps) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
      <div className="h-3 w-3 animate-pulse rounded-full bg-teal-700" />
      <span className="ml-3 text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}
