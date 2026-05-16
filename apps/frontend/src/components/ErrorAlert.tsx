type Props = {
  message: string;
  testId?: string;
};

export function ErrorAlert({ message, testId = "error-alert" }: Props) {
  return (
    <div
      role="alert"
      data-testid={testId}
      className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {message}
    </div>
  );
}
