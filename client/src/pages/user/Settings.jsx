/**
 * Settings page — Redesigned Premium Version with Auto-save
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, Zap, Bell, Shield, Key, Lock, Palette, Layout,
  Smartphone, Monitor, Trash2, CheckCircle
} from 'lucide-react';

import Sidebar from '../../components/layout/Sidebar.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import useAuthStore from '../../store/authStore.js';
import useUIStore from '../../store/uiStore.js';
import api from '../../services/api.js';

import './settings.css';
import '../shared.css';

export default function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme: setGlobalTheme, addToast } = useUIStore();

  const [prefs, setPrefs] = useState({
    privacy: {
      showLastSeen: user?.preferences?.privacy?.showLastSeen ?? true,
      showReadReceipts: user?.preferences?.privacy?.showReadReceipts ?? true,
      showTyping: user?.preferences?.privacy?.showTyping ?? true,
      isPrivate: user?.preferences?.privacy?.isPrivate ?? false,
    },
    notifications: {
      email: user?.preferences?.notifications?.email ?? true,
      push: user?.preferences?.notifications?.push ?? true,
    },
    sounds: {
      enabled: user?.preferences?.sounds?.enabled ?? true,
    },
    accentColor: user?.preferences?.accentColor || '#7c3aed',
    chatBackground: user?.preferences?.chatBackground || 'Default',
  });
  const [hasInitialized, setHasInitialized] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // 'password', 'delete'
  const [passwordData, setPasswordData] = useState({ current: '', new: '' });

  const colors = [
    { name: 'Classic Purple', value: '#7c3aed' },
    { name: 'Ocean Blue', value: '#2563eb' },
    { name: 'Emerald Green', value: '#059669' },
    { name: 'Sunset Orange', value: '#ea580c' },
    { name: 'Rose Pink', value: '#db2777' },
  ];

  const backgrounds = [
    { name: 'Default', value: 'var(--bg-secondary)' },
    { name: 'Obsidian Blue', value: '#0F172A' },
    { name: 'Deep Emerald', value: '#022C22' },
    { name: 'Royal Crimson', value: '#450A0A' },
  ];

  useEffect(() => {
    if (user?.preferences && !hasInitialized) {
      setPrefs({
        privacy: {
          showLastSeen: user.preferences.privacy?.showLastSeen ?? true,
          showReadReceipts: user.preferences.privacy?.showReadReceipts ?? true,
          showTyping: user.preferences.privacy?.showTyping ?? true,
          isPrivate: user.preferences.privacy?.isPrivate ?? false,
        },
        notifications: {
          email: user.preferences.notifications?.email ?? true,
          push: user.preferences.notifications?.push ?? true,
        },
        sounds: {
          enabled: user.preferences.sounds?.enabled ?? true,
        },
        accentColor: user.preferences.accentColor || '#7c3aed',
        chatBackground: user.preferences.chatBackground || 'Midnight Black',
      });
      setHasInitialized(true);
    }
  }, [user, hasInitialized]);

  useEffect(() => {
    const loadExtraData = async () => {
      try {
        const [sessionsRes, userRes] = await Promise.all([
          api.get('/users/me/sessions'),
          api.get(`/users/${user._id}`)
        ]);
        if (sessionsRes.data.success) setSessions(sessionsRes.data.data.sessions);
      } catch (err) {
        console.error('Failed to load settings data');
      }
    };
    if (user?._id) loadExtraData();
  }, [user?._id]);

  // Auto-save logic
  const savePreferences = async (newPrefs) => {
    try {
      const { data } = await api.patch('/users/me/preferences', newPrefs);
      if (data.success) {
        setUser({ ...user, preferences: data.data.preferences });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to auto-save preferences' });
    }
  };

  const handleToggle = (category, key) => {
    const newValue = !prefs[category][key];
    const newPrefs = {
      ...prefs,
      [category]: {
        ...prefs[category],
        [key]: newValue
      }
    };
    setPrefs(newPrefs);

    // Immediate save
    if (category === 'privacy' && key === 'isPrivate') {
      api.patch('/users/me/privacy').then(() => {
        addToast({ type: 'success', message: `Account is now ${newValue ? 'Private' : 'Public'}` });
      });
    } else {
      savePreferences(newPrefs);
    }
  };

  const handleColorChange = (color) => {
    const newPrefs = { ...prefs, accentColor: color };
    setPrefs(newPrefs);
    savePreferences(newPrefs);
  };

  const handleBackgroundChange = async (name) => {
    setPrefs(prev => ({ ...prev, chatBackground: name }));
    try {
      const { data } = await api.patch('/users/me/preferences', { chatBackground: name });
      if (data.success) {
        setUser({ ...user, preferences: data.data.preferences });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to save chat background' });
    }
  };

  const handleThemeChange = (newTheme) => {
    setGlobalTheme(newTheme);
    // Theme is usually stored in local storage via uiStore, 
    // but if we want it in DB too, we can add it to preferences.
  };

  const handleChangePassword = async () => {
    try {
      const { data } = await api.post('/auth/change-password', {
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      });
      if (data.success) {
        addToast({ type: 'success', message: 'Password changed successfully' });
        setActiveModal(null);
        setPasswordData({ current: '', new: '' });
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to change password' });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data } = await api.delete('/users/me/account');
      if (data.success) {
        addToast({ type: 'success', message: 'Account deleted. Goodbye!' });
        logout();
        navigate('/login');
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to delete account' });
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      const { data } = await api.delete(`/users/me/sessions/${sessionId}`);
      if (data.success) {
        setSessions(prev => prev.filter(s => s._id !== sessionId));
        addToast({ type: 'success', message: 'Session terminated' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to terminate session' });
    }
  };

  const ToggleSwitch = ({ checked, onChange, label, desc }) => (
    <div className="settings__toggle-row" onClick={(e) => { e.stopPropagation(); onChange(); }}>
      <div className="settings__toggle-info">
        <span className="settings__toggle-label">{label}</span>
        {desc && <p className="settings__toggle-desc">{desc}</p>}
      </div>
      <div className={`settings__toggle ${checked ? 'settings__toggle--on' : ''}`}>
        <div className="settings__toggle-thumb" />
      </div>
    </div>
  );

  const accentColor = prefs.accentColor;
  const customStyles = {};
  if (accentColor) {
    customStyles['--accent'] = accentColor;
    if (accentColor.startsWith('#') && accentColor.length === 7) {
      const r = parseInt(accentColor.slice(1, 3), 16);
      const g = parseInt(accentColor.slice(3, 5), 16);
      const b = parseInt(accentColor.slice(5, 7), 16);
      customStyles['--accent-rgb'] = `${r}, ${g}, ${b}`;
    }
  }

  return (
    <div className="app-layout" style={customStyles}>
      <Sidebar />
      <main className="app-main settings-main">
        <div className="page-header settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="page-header__back settings-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="page-header__title">Settings</h1>
          </div>
        </div>

        <div className="settings-scroll-area">
          <div className="settings-container">
            <div className="settings-grid">
              {/* Appearance */}
              <section className="settings__section">
                <h2 className="settings__section-title">
                  <Layout size={18} /> Theme Selection
                </h2>
                <div className="settings__section-body">
                  <div className="settings__theme-grid">
                    <div
                      className={`settings__theme-card ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <div className="theme-preview dark-preview">
                        <div className="preview-bubble" />
                        <div className="preview-bubble alt" />
                      </div>
                      <span>Midnight Black</span>
                    </div>
                    <div
                      className={`settings__theme-card ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <div className="theme-preview light-preview">
                        <div className="preview-bubble" />
                        <div className="preview-bubble alt" />
                      </div>
                      <span>Arctic White</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Accent Color */}
              <section className="settings__section">
                <h2 className="settings__section-title">
                  <Palette size={18} /> Accent Color
                </h2>
                <div className="settings__section-body">
                  <div className="settings__color-grid">
                    {colors.map((c) => (
                      <div
                        key={c.value}
                        className={`settings__color-item ${prefs.accentColor === c.value ? 'active' : ''}`}
                        onClick={() => handleColorChange(c.value)}
                        style={{ '--color': c.value }}
                        title={c.name}
                      >
                        {prefs.accentColor === c.value && <Zap size={14} fill="currentColor" />}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Chat Customization */}
              <section className="settings__section">
                <h2 className="settings__section-title">
                  <Monitor size={18} /> Chat Customization
                </h2>
                <p className="settings__toggle-desc" style={{ padding: '0 0 12px 0' }}>
                  Choose a solid color for your chat background
                </p>
                <div className="settings__section-body">
                  <div className="settings__bg-grid">
                    {backgrounds.map((bg) => (
                      <div
                        key={bg.name}
                        className={`settings__bg-item ${prefs.chatBackground === bg.name ? 'active' : ''}`}
                        onClick={() => handleBackgroundChange(bg.name)}
                        style={{ '--bg-color': bg.value }}
                      >
                        <div className="bg-preview" style={{ backgroundColor: bg.value }} />
                        <span className="bg-name">{bg.name}</span>
                        {prefs.chatBackground === bg.name && <CheckCircle size={14} className="bg-check" />}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Privacy */}
              <section className="settings__section">
                <h2 className="settings__section-title">
                  <Eye size={18} /> Privacy & Visibility
                </h2>
                <div className="settings__section-body">
                  <ToggleSwitch
                    checked={prefs.privacy.isPrivate}
                    onChange={() => handleToggle('privacy', 'isPrivate')}
                    label="Private Account"
                    desc="Only friends can see your profile and message you"
                  />
                  <ToggleSwitch
                    checked={!prefs.privacy.showLastSeen}
                    onChange={() => handleToggle('privacy', 'showLastSeen')}
                    label="Hide online status"
                    desc="Other users won't see when you're online"
                  />
                  <ToggleSwitch
                    checked={!prefs.privacy.showReadReceipts}
                    onChange={() => handleToggle('privacy', 'showReadReceipts')}
                    label="Hide read receipts"
                    desc="Don't send or receive read confirmations"
                  />
                </div>
              </section>

              {/* Account Center */}
              <section className="settings__section">
                <h2 className="settings__section-title">
                  <Shield size={18} /> Account Center
                </h2>
                <div className="settings__section-body">
                  <div className="settings__action-row" onClick={() => setActiveModal('password')}>
                    <div className="settings__action-info">
                      <span className="settings__action-label">Password & Security</span>
                      <p className="settings__action-desc">Change your password and manage 2FA</p>
                    </div>
                    <Key size={18} />
                  </div>

                  <div className="settings__device-list" style={{ marginTop: '16px' }}>
                    <span className="settings__toggle-label">Logged-in Devices</span>
                    {sessions.length > 0 ? (
                      sessions.map(session => (
                        <div key={session._id} className="settings__device-item">
                          <div className="settings__device-icon">
                            {session.os?.toLowerCase().includes('windows') || session.os?.toLowerCase().includes('mac') ? <Monitor size={20} /> : <Smartphone size={20} />}
                          </div>
                          <div className="settings__device-info">
                            <span className="settings__device-name">{session.deviceName} ({session.os})</span>
                            <span className="settings__device-meta">{session.browser} • {session.ip}</span>
                          </div>
                          <button
                            className="settings__action-btn"
                            style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            onClick={() => terminateSession(session._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="settings__toggle-desc">No active sessions found.</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Danger Zone */}
              <section className="settings__section settings__danger-zone">
                <h2 className="settings__section-title settings__danger-title">
                  <Trash2 size={18} /> Danger Zone
                </h2>
                <div className="settings__section-body">
                  <div className="settings__action-row" onClick={() => setActiveModal('delete')}>
                    <div className="settings__action-info">
                      <span className="settings__action-label" style={{ color: 'var(--danger)' }}>Delete Account</span>
                      <p className="settings__action-desc">Permanently remove your account and all data</p>
                    </div>
                    <Trash2 size={18} color="var(--danger)" />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Password Modal */}
        {activeModal === 'password' && (
          <div className="settings__modal-overlay" onClick={() => setActiveModal(null)}>
            <div className="settings__modal" onClick={e => e.stopPropagation()}>
              <h3 className="settings__modal-title">Update Password</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.current}
                  onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.new}
                  onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="primary" fullWidth onClick={handleChangePassword}>Update</Button>
                <Button variant="secondary" fullWidth onClick={() => setActiveModal(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {activeModal === 'delete' && (
          <div className="settings__modal-overlay" onClick={() => setActiveModal(null)}>
            <div className="settings__modal" onClick={e => e.stopPropagation()}>
              <h3 className="settings__modal-title" style={{ color: 'var(--danger)' }}>Delete Account?</h3>
              <p className="settings__modal-desc">
                This action is permanent and cannot be undone. All your messages, friends, and data will be permanently removed.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="primary" style={{ background: 'var(--danger)' }} fullWidth onClick={handleDeleteAccount}>Yes, Delete</Button>
                <Button variant="secondary" fullWidth onClick={() => setActiveModal(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
