/** One statistic tile on the User Reports page. */
export function SummaryCard({ label, value, icon, tone = 'brand', loading = false }) {
  return (
    <article className="summary-card">
      <span className={`summary-card__icon tone-${tone}`}>{icon}</span>
      <div>
        <div className="summary-card__value">
          {loading ? <span className="spinner" style={{ marginTop: 4 }} /> : value.toLocaleString()}
        </div>
        <div className="summary-card__label">{label}</div>
      </div>
    </article>
  );
}
