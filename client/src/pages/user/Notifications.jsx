import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, AlertTriangle, 
  ShieldAlert, Info, MoreVertical, Trash2, CheckCircle2 
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import api from '../../services/api.js';
import useUIStore from '../../store/uiStore.js';
import useNotificationStore from '../../store/notificationStore.js';
import { formatDate } from '../../utils/formatTime.js';
import { getSocket } from '../../services/socket.js';

import '../shared.css';

export default function Notifications() {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { markNotificationsSeen } = useNotificationStore();

  useEffect(() => {
    fetchAll();
    markNotificationsSeen();

    const socket = getSocket();
    if (socket) {
      socket.on('notification:new', (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        addToast({ type: 'info', message: notif.title });
      });
    }

    return () => {
      if (socket) socket.off('notification:new');
    };
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      if (data.success) setNotifications(data.data);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to load notifications' });
    } finally {
      setLoading(false);
    }
  };
  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      // Silent error
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      addToast({ type: 'success', message: 'All marked as read' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to mark all as read' });
    }
  };

  // Group notifications
  const systemNotifs = notifications.filter(n => n.type === 'system' || n.type === 'security');
  const otherNotifs = notifications.filter(n => n.type !== 'system' && n.type !== 'security' && n.type !== 'friend_request');

  const getNotifIcon = (notif) => {
    if (notif.type === 'security') return <ShieldAlert size={18} className="text-danger" />;
    if (notif.type === 'system' && notif.priority === 'high') return <AlertTriangle size={18} className="text-warning" />;
    return <Info size={18} className="text-accent" />;
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" style={{ background: 'var(--bg-secondary)' }}>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="page-header__back" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </button>
            <h1 className="page-header__title">Notifications</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCircle2 size={16} /> Mark all read
            </Button>
          </div>
        </div>

        <div className="notifications-container" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>

          {/* Section: System & Reports */}
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <ShieldAlert size={18} style={{ color: 'var(--danger)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Account & Security
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {systemNotifs.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px', textAlign: 'center', background: 'var(--bg)', border: '1px dashed var(--border)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No security alerts.</p>
                </div>
              ) : (
                systemNotifs.map((notif) => (
                  <div key={notif._id} className={`notif-card ${!notif.isRead ? 'notif-card--unread' : ''}`} 
                    style={{ 
                      padding: '16px 20px',
                      background: notif.priority === 'critical' ? 'rgba(var(--danger-rgb), 0.03)' : 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderLeft: notif.priority === 'critical' ? '4px solid var(--danger)' : notif.priority === 'high' ? '4px solid var(--warning)' : '1px solid var(--border)',
                      position: 'relative'
                    }}
                    onClick={() => markAsRead(notif._id)}
                  >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ marginTop: '2px' }}>
                        {getNotifIcon(notif)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: notif.priority === 'critical' ? 'var(--danger)' : 'var(--text)' }}>
                            {notif.title}
                          </span>
                          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(notif.createdAt)}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                          {notif.body}
                        </p>
                        {notif.priority === 'critical' && (
                          <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(var(--danger-rgb), 0.05)', border: '1px solid rgba(var(--danger-rgb), 0.1)', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>
                            Important: Please review the community guidelines to prevent account suspension.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section: Activity */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Bell size={18} style={{ color: 'var(--text-muted)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Activity
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
              {otherNotifs.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px', textAlign: 'center', background: 'var(--bg)', border: '1px dashed var(--border)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent activity.</p>
                </div>
              ) : (
                otherNotifs.map((notif) => (
                  <div key={notif._id} className={`notif-row ${!notif.isRead ? 'notif-row--unread' : ''}`}
                    style={{ 
                      padding: '16px 20px',
                      background: 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer'
                    }}
                    onClick={() => markAsRead(notif._id)}
                  >
                    <Avatar src={notif.actor?.avatar} name={notif.actor?.username} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 700 }}>{notif.actor?.username}</span> {notif.body || notif.title}
                      </div>
                      <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {formatDate(notif.createdAt)}
                      </div>
                    </div>
                    {!notif.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />}
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .notif-card { transition: all 0.2s ease; cursor: pointer; }
        .notif-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--accent); }
        .notif-card--unread { background: rgba(var(--accent-rgb), 0.02) !important; }
        
        .notif-row { transition: background 0.2s ease; }
        .notif-row:hover { background: var(--bg-hover) !important; }
        .notif-row--unread { border-left: 3px solid var(--accent); padding-left: 17px !important; }
        
        .text-danger { color: var(--danger); }
        .text-warning { color: var(--warning); }
        .text-accent { color: var(--accent); }
      `}} />
    </div>
  );
}
