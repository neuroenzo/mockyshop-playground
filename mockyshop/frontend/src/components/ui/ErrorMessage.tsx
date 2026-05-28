export function ErrorMessage({
  message,
  onRetry,
  "data-testid": testId,
}: {
  message: string;
  onRetry?: () => void;
  "data-testid"?: string;
}) {
  return (
    <div data-testid={testId ?? "error-message"} className="rounded-md bg-red-50 p-4 my-4">
      <div className="flex">
        <svg className="h-5 w-5 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <p className="ml-3 text-sm text-red-700">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="ml-auto text-sm font-medium text-red-700 hover:text-red-600 underline">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
