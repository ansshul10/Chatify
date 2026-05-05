import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, Users, Flag, Mail, Send, Settings, 
  Database, Activity, RefreshCw, Trash2, CheckCircle2 
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import './AdminDashboard.css';

const CATEGORIES = {
  'Auth': ['FEATURE_ANONYMOUS_CHAT','FEATURE_EMAIL_VERIFICATION','FEATURE_2FA','FEATURE_MAGIC_LINK','FEATURE_GOOGLE_OAUTH','FEATURE_LOGIN_ALERT','FEATURE_BRUTE_FORCE_LOCK','FEATURE_UPGRADE_ANON'],
  'Messaging': ['FEATURE_ENCRYPTION','FEATURE_MESSAGE_EDIT','FEATURE_MESSAGE_DELETE','FEATURE_REACTIONS','FEATURE_REPLY_TO','FEATURE_MESSAGE_SEARCH','FEATURE_MESSAGE_BOOKMARKS','FEATURE_MESSAGE_PIN','FEATURE_SELF_DESTRUCT','FEATURE_DISAPPEARING_MESSAGES','FEATURE_TYPING_INDICATORS','FEATURE_READ_RECEIPTS','FEATURE_MENTION_NOTIFICATIONS','FEATURE_OFFLINE_MESSAGE_QUEUE'],
  'Privacy': ['FEATURE_READ_RECEIPT_PRIVACY','FEATURE_TYPING_PRIVACY','FEATURE_LAST_SEEN','FEATURE_ONLINE_STATUS','FEATURE_HIDE_ONLINE_STATUS'],
  'Social': ['FEATURE_FRIENDS','FEATURE_BLOCKING','FEATURE_USER_PROFILES','FEATURE_AVATAR_UPLOAD','FEATURE_USER_BIO','FEATURE_USER_SEARCH','FEATURE_MUTUAL_FRIENDS'],
  'Notifications': ['FEATURE_PUSH_NOTIFICATIONS','FEATURE_EMAIL_NOTIFICATIONS','FEATURE_IN_APP_NOTIFICATIONS','FEATURE_NOTIFICATION_SOUNDS','FEATURE_NOTIFICATION_BADGE'],
  'Security & System': ['FEATURE_RATE_LIMITING','FEATURE_IP_BAN','FEATURE_SUSPICIOUS_ACTIVITY','FEATURE_CONTENT_MODERATION','FEATURE_ENCRYPTION_KEY_SCAN','FEATURE_PWA','FEATURE_OFFLINE_SUPPORT','FEATURE_ADMIN_DASHBOARD','FEATURE_CONVERSATION_ARCHIVE','FEATURE_EXPORT_CHAT'],
  'Debug': ['FEATURE_QUERY_LOGGING','FEATURE_REDIS_LOGGING','FEATURE_EMAIL_DEV_LOG','FEATURE_VERBOSE_AUTH_LOG']
};

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const [stats, setStats] = useState(null);
  const [flags, setFlags] = useState({});
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [emailQueue, setEmailQueue] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('features');
  const [manualEmail, setManualEmail] = useState({ to: '', subject: '', body: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    }
    if (activeTab === 'reports' && reports.length === 0) {
      fetchReports();
    }
    if (activeTab === 'newsletter' && subscribers.length === 0) {
      fetchSubscribers();
    }
    if (activeTab === 'emails' && emailQueue.length === 0) {
      fetchEmailQueue();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, flagsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/features')
      ]);
      setStats(statsRes.data.data);
      setFlags(flagsRes.data.data.flags);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to fetch admin data' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get('/api/admin/users?limit=50');
      setUsers(res.data.data.users);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to fetch users' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await axios.get('/api/admin/reports');
      setReports(res.data.data.reports);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to fetch reports' });
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      setLoadingSubscribers(true);
      const res = await axios.get('/api/admin/newsletter/subscribers');
      setSubscribers(res.data.data.subscribers);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to fetch subscribers' });
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const fetchEmailQueue = async () => {
    try {
      setLoadingQueue(true);
      const res = await axios.get('/api/admin/email/queue');
      setEmailQueue(res.data.data.queue);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to fetch email queue' });
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleSendManualEmail = async (e) => {
    e.preventDefault();
    try {
      setSendingEmail(true);
      await axios.post('/api/admin/email/send-manual', manualEmail);
      addToast({ type: 'success', message: 'Manual email sent successfully' });
      setManualEmail({ to: '', subject: '', body: '' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to send email' });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleToggleFlag = async (flag, currentValue) => {
    try {
      const res = await axios.patch('/api/admin/features', {
        flag,
        value: !currentValue
      });
      setFlags(res.data.data.flags);
      addToast({ type: 'success', message: `${flag.replace('FEATURE_', '').toLowerCase()} toggled` });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to update feature flag' });
    }
  };

  const handleBanUser = async (userId, isBanned, reportId = null) => {
    try {
      const res = await axios.patch(`/api/admin/users/${userId}/ban`, {
        reason: isBanned ? 'Unbanned by admin' : 'Violation of terms'
      });
      const updatedUser = res.data.data.user;
      
      // Update users list
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: updatedUser.isBanned } : u));
      
      // Update reports list if banning from a report
      if (reportId) {
        setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
      } else {
        // Just update any reports for this user
        setReports(prev => prev.map(r => (r.reportedId?._id || r.reportedId) === userId ? { ...r, status: 'resolved' } : r));
      }

      addToast({ type: 'success', message: updatedUser.isBanned ? 'User banned and report resolved' : 'User unbanned' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to update user status' });
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      // Typically you'd have a PATCH /api/admin/reports/:id endpoint
      // For now we'll just mock the update or if you have it implemented
      addToast({ type: 'info', message: 'Report dismissed' });
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'dismissed' } : r));
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to dismiss report' });
    }
  };

  const handleResendJob = async (job) => {
    try {
      await axios.post('/api/admin/email/queue/resend', { job });
      addToast({ type: 'success', message: 'Email sent successfully!' });
      fetchEmailQueue(); // Refresh list
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to resend email' });
    }
  };

  if (loading) {
    return <div className="admin-loading">Initializing Admin Console...</div>;
  }

  return (
    <div className="admin-dashboard glass-effect">
      <div className="admin-header">
        <h1>Admin Control Center</h1>
        <p className="mono text-muted">Signed in as {user?.username} (Superuser)</p>
      </div>

      <div className="admin-stats-grid">
        <div className="stat-card glass-card">
          <h3>Total Users</h3>
          <div className="stat-value">{stats?.totalUsers || 0}</div>
        </div>
        <div className="stat-card glass-card">
          <h3>Online Now</h3>
          <div className="stat-value text-success">{stats?.activeUsers || 0}</div>
        </div>
        <div className="stat-card glass-card">
          <h3>Messages (24h)</h3>
          <div className="stat-value">{stats?.messagesLast24h || 0}</div>
        </div>
        <div className="stat-card glass-card">
          <h3>Emails Queued</h3>
          <div className="stat-value text-warning">{stats?.emailsQueued || 0}</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          <Settings size={16} /> Feature Flags
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <Flag size={16} /> Reports {reports.filter(r => r.status === 'pending').length > 0 && <span className="tab-badge">{reports.filter(r => r.status === 'pending').length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'newsletter' ? 'active' : ''}`}
          onClick={() => setActiveTab('newsletter')}
        >
          <Mail size={16} /> Newsletter {subscribers.length > 0 && <span className="tab-badge tab-badge--info">{subscribers.length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`}
          onClick={() => setActiveTab('emails')}
        >
          <Send size={16} /> Emails {emailQueue.length > 0 && <span className="tab-badge tab-badge--warning">{emailQueue.length}</span>}
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'features' && (
          <div className="features-container animate-fade-in">
            {Object.entries(CATEGORIES).map(([catName, flagList]) => (
              <div key={catName} className="feature-category">
                <h2 className="category-title">{catName}</h2>
                <div className="features-grid">
                  {flagList.map(flag => (
                    <div key={flag} className="feature-item glass-card">
                      <div className="feature-info">
                        <span className="feature-name">{flag.replace('FEATURE_', '').replace(/_/g, ' ')}</span>
                        <span className={`feature-status ${flags[flag] ? 'active' : ''}`}>
                          {flags[flag] ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={!!flags[flag]} 
                          onChange={() => handleToggleFlag(flag, !!flags[flag])}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-table-container animate-fade-in">
            {loadingUsers ? (
              <p className="loading-text mono">Loading users list...</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}`} alt="" />
                          <div>
                            <p className="username">{u.username}</p>
                            <p className="email text-muted">{u.email || 'Anonymous'}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                      <td>
                        <span className={`status-dot ${u.isOnline ? 'online' : 'offline'}`}></span>
                        {u.isOnline ? 'Online' : 'Offline'}
                      </td>
                      <td className="mono">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className={`ban-btn ${u.isBanned ? 'unban' : 'ban'}`}
                          onClick={() => handleBanUser(u._id, u.isBanned)}
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-container animate-fade-in">
            {loadingReports ? (
              <p className="loading-text mono">Loading reports list...</p>
            ) : reports.length === 0 ? (
              <div className="empty-state glass-card">
                <p>No reports found.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reported User</th>
                    <th>Reporter</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r._id} className={r.status === 'pending' ? 'row-pending' : ''}>
                      <td>
                        <div className="user-cell">
                          <img src={r.reportedId?.avatar || `https://ui-avatars.com/api/?name=${r.reportedId?.username}`} alt="" />
                          <div>
                            <p className="username">{r.reportedId?.username}</p>
                            <p className="role-badge security">{r.reportedId?.banCount || 0} Prev Bans</p>
                          </div>
                        </div>
                      </td>
                      <td>
                         <div className="user-cell">
                          <img src={r.reporterId?.avatar || `https://ui-avatars.com/api/?name=${r.reporterId?.username}`} alt="" />
                          <p className="username">{r.reporterId?.username}</p>
                        </div>
                      </td>
                      <td>
                        <div className="report-reason" title={r.reason}>
                          {r.reason}
                        </div>
                      </td>
                      <td className="mono">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${r.status}`}>{r.status}</span>
                      </td>
                      <td>
                        {r.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="ban-btn ban"
                              onClick={() => handleBanUser(r.reportedId?._id, false, r._id)}
                            >
                              Ban
                            </button>
                            <button 
                              className="ban-btn ghost"
                              onClick={() => handleDismissReport(r._id)}
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                        {r.status !== 'pending' && <span className="text-muted mono">Handled</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'newsletter' && (
          <div className="newsletter-container animate-fade-in">
            {loadingSubscribers ? (
              <p className="loading-text mono">Loading subscribers list...</p>
            ) : subscribers.length === 0 ? (
              <div className="empty-state glass-card">
                <p>No newsletter subscribers yet.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email Address</th>
                    <th>Subscribed On</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map(s => (
                    <tr key={s._id}>
                      <td className="mono" style={{ color: 'var(--accent)', fontWeight: '600' }}>{s.email}</td>
                      <td className="mono">{new Date(s.subscribedAt).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${s.isActive ? 'active' : 'resolved'}`}>
                          {s.isActive ? 'Active' : 'Unsubscribed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'emails' && (
          <div className="emails-container animate-fade-in">
            <div className="admin-section-grid">
              <div className="manual-email-form glass-card">
                <div className="section-header-row">
                  <Mail className="section-icon text-primary" size={20} />
                  <h3 className="category-title">Manual Dispatch</h3>
                </div>
                <p className="section-subtitle">Compose and send an immediate email via the configured provider.</p>
                
                <form onSubmit={handleSendManualEmail}>
                  <div className="form-group">
                    <label>Recipient Email</label>
                    <input 
                      type="email" 
                      value={manualEmail.to} 
                      onChange={e => setManualEmail({...manualEmail, to: e.target.value})}
                      required 
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input 
                      type="text" 
                      value={manualEmail.subject} 
                      onChange={e => setManualEmail({...manualEmail, subject: e.target.value})}
                      required 
                      placeholder="Important Update"
                    />
                  </div>
                  <div className="form-group">
                    <label>Message Body</label>
                    <textarea 
                      value={manualEmail.body} 
                      onChange={e => setManualEmail({...manualEmail, body: e.target.value})}
                      required 
                      placeholder="Type your message here..."
                      rows={6}
                    />
                  </div>
                  <button type="submit" className="ban-btn unban" disabled={sendingEmail}>
                    <Send size={14} style={{marginRight: '8px'}} />
                    {sendingEmail ? 'Sending...' : 'Send Email Now'}
                  </button>
                </form>
              </div>

              <div className="email-queue-list glass-card">
                <div className="section-header-row">
                  <Activity className="section-icon text-warning" size={20} />
                  <h3 className="category-title">Outgoing Queue</h3>
                </div>
                <p className="section-subtitle">Monitoring {emailQueue.length} pending jobs in the Redis buffer.</p>

                {loadingQueue ? (
                  <p className="loading-text mono">Loading queue...</p>
                ) : emailQueue.length === 0 ? (
                  <div className="empty-queue-state">
                    <CheckCircle2 size={40} className="text-success" style={{opacity: 0.3, marginBottom: '1rem'}} />
                    <p>No pending emails. Queue is clear!</p>
                  </div>
                ) : (
                  <div className="queue-scroll">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Recipient</th>
                          <th>Subject</th>
                          <th className="text-center">Tries</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emailQueue.map((job, idx) => (
                          <tr key={idx}>
                            <td className="mono text-xs">{job.to}</td>
                            <td className="text-xs truncate-subject">{job.subject}</td>
                            <td className="text-center"><span className="tab-badge">{job.attempts || 0}</span></td>
                            <td className="text-right">
                              <button 
                                className="ban-btn unban ghost" 
                                style={{ padding: '6px 12px', fontSize: '10px' }}
                                onClick={() => handleResendJob(job)}
                              >
                                <RefreshCw size={10} style={{marginRight: '4px'}} />
                                Push
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
