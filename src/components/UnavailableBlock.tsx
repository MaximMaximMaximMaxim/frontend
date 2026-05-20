interface UnavailableBlockProps {
  title: string;
}

export function UnavailableBlock({ title }: UnavailableBlockProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Блок недоступен: в текущей OpenAPI-спецификации отсутствуют необходимые данные.
      </p>
    </article>
  );
}
