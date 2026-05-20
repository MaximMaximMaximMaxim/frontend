interface ErrorNoticeProps {
  message: string;
  onClose?: () => void;
}

export function ErrorNotice({ message, onClose }: ErrorNoticeProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p>{message}</p>
      {onClose ? (
        <button className="font-semibold text-red-900 hover:text-red-700" type="button" onClick={onClose}>
          Закрыть
        </button>
      ) : null}
    </div>
  );
}
