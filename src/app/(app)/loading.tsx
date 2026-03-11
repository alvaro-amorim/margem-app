export default function AppLoading() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-[2rem] bg-[color:var(--card-muted)]" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-[2rem] bg-[color:var(--card-muted)]" />
        <div className="h-32 animate-pulse rounded-[2rem] bg-[color:var(--card-muted)]" />
        <div className="h-32 animate-pulse rounded-[2rem] bg-[color:var(--card-muted)]" />
      </div>
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-[2rem] bg-[color:var(--card-muted)]" />
        <div className="h-40 animate-pulse rounded-[2rem] bg-[color:var(--card-muted)]" />
      </div>
    </div>
  );
}
