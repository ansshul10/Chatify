/**
 * Square Avatar — no circle, ever
 */
import './ui.css';

const COLORS = [
  '#0066FF', '#DC2626', '#16A34A', '#D97706',
  '#7C3AED', '#DB2777', '#059669', '#2563EB',
];

function getColor(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Avatar({ src, name, size = 32, online, className = '' }) {
  const style = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    fontSize: `${Math.max(size * 0.4, 10)}px`,
  };

  return (
    <div className={`avatar ${className}`} style={style}>
      {src ? (
        <img src={src} alt={name || 'avatar'} className="avatar__img" />
      ) : (
        <div
          className="avatar__fallback"
          style={{ backgroundColor: getColor(name) }}
        >
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && (
        <span className={`avatar__status ${
          online === 'away' ? 'avatar__status--away' : 
          online === 'online' || online === true ? 'avatar__status--online' : 
          ''
        }`} />
      )}
    </div>
  );
}
