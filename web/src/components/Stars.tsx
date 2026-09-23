export function Stars({ rating, size = "text-base" }: { rating: number; size?: string }) {
  const full = Math.round(rating);
  return (
    <span aria-label={`${rating.toFixed(1)} de 5 estrellas`} className={`${size} leading-none text-amber-400`}>
      {"★".repeat(full)}
      <span className="text-slate-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}
