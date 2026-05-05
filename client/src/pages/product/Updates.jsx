/**
 * Updates Page — Release notes and platform improvements
 */
import { CheckCircle2, Star, Zap, Bug } from 'lucide-react';
import './updates.css';

export default function Updates() {
  const releases = [
    {
      version: "v1.2.0",
      date: "April 30, 2026",
      title: "The Performance Update",
      desc: "This release focuses on core architectural improvements and lightning-fast message synchronization.",
      changes: [
        { type: "Feature", text: "New Edge Hubs deployed in Singapore and London for lower latency." },
        { type: "Improvement", text: "Optimized WebSocket heartbeat intervals for better battery life." },
        { type: "Fix", text: "Resolved an issue with offline message queuing in guest mode." }
      ]
    },
    {
      version: "v1.1.5",
      date: "April 15, 2026",
      title: "Security Hardening",
      desc: "Enhanced our end-to-end encryption protocols and added additional protection against session hijacking.",
      changes: [
        { type: "Security", text: "Implemented Double Ratchet algorithm for all direct messages." },
        { type: "Feature", text: "Added biometric lock support for supported mobile browsers." },
        { type: "Fix", text: "Minor UI bug fixes in the settings panel." }
      ]
    }
  ];

  return (
    <div className="updates-page">
      <header className="updates-hero">
        <h1 className="updates-hero__title">What's New.</h1>
        <p className="updates-hero__subtitle">
          The latest updates, improvements, and fixes for the Chatify platform.
        </p>
      </header>

      <main className="updates-container">
        <div className="timeline">
          {releases.map((release, i) => (
            <div className="timeline-item" key={i}>
              <div className="update-card">
                <div className="update-card__header">
                  <span className="update-card__version">{release.version}</span>
                  <span className="update-card__date">{release.date}</span>
                </div>
                <h3 className="update-card__title">{release.title}</h3>
                <p className="update-card__desc">{release.desc}</p>
                <ul className="update-list">
                  {release.changes.map((change, j) => (
                    <li className="update-list__item" key={j}>
                      {change.type === 'Feature' && <Star size={16} color="var(--accent)" />}
                      {change.type === 'Improvement' && <Zap size={16} color="var(--warning)" />}
                      {change.type === 'Fix' && <Bug size={16} color="var(--danger)" />}
                      {change.type === 'Security' && <CheckCircle2 size={16} color="var(--success)" />}
                      <span><strong>[{change.type}]</strong> {change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
