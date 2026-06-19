export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary"
        role="status"
        aria-label="Cargando"
      />
      <p className="text-sm text-secondary/60">Cargando...</p>
    </div>
  );
}
