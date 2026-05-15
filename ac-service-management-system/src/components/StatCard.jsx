function StatCard({ title, value, note, color }) {
  return (
    <div className={`stat-card${color ? ` ${color}` : ""}`}>
      <p>{title}</p>
      <h2>{value}</h2>
      <span>{note}</span>
    </div>
  );
}

export default StatCard;