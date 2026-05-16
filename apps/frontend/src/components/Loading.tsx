type Props = {
  label?: string;
  testId?: string;
};

export function Loading({ label = "Loading…", testId = "loading" }: Props) {
  return (
    <div data-testid={testId} className="flex items-center gap-2 text-sm text-slate-500">
      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-slate-400" />
      {label}
    </div>
  );
}
