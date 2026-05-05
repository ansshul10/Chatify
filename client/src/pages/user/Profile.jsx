/**
 * Profile page — Redesigned Premium Version
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Camera, MessageSquare, UserPlus, UserMinus, Ban,
  Calendar, Users, Shield, Mail, Share2, Settings as SettingsIcon,
  CheckCircle, XCircle, Info, QrCode, Lock, Clock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import Sidebar from '../../components/layout/Sidebar.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import useAuthStore from '../../store/authStore.js';
import useUIStore from '../../store/uiStore.js';
import api from '../../services/api.js';
import { formatDate } from '../../utils/formatTime.js';

import '../shared.css';
import './profile.css';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const addToast = useUIStore((s) => s.addToast);
  
  const [profile, setProfile] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'edit', 'share'
  const [editData, setEditData] = useState({ 
    displayName: '', 
    bio: '', 
    username: '', 
    gender: 'prefer_not_to_say' 
  });
  const [loading, setLoading] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?._id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isOwnProfile) {
          setProfile(currentUser);
          setFriendshipStatus('self');
          setEditData({ 
            displayName: currentUser?.displayName || '', 
            bio: currentUser?.bio || '',
            username: currentUser?.username || '',
            gender: currentUser?.gender || 'prefer_not_to_say'
          });
        } else {
          const { data } = await api.get(`/users/${userId}`);
          if (data.success) {
            setProfile(data.data.user);
            setFriendshipStatus(data.data.friendshipStatus || 'none');
          }
        }
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to load profile' });
      }
    };
    fetchProfile();
  }, [userId, currentUser, isOwnProfile, addToast]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me', editData);
      if (data.success) {
        setUser(data.data.user);
        setProfile(data.data.user);
        setActiveTab('profile');
        addToast({ type: 'success', message: 'Profile updated' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      addToast({ type: 'error', message: msg });
    }
    setLoading(false);
  };

  const getDaysUntilUsernameChange = () => {
    if (!profile?.lastUsernameChangeAt) return 0;
    const last = new Date(profile.lastUsernameChangeAt);
    const diff = Date.now() - last.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (diff >= sevenDays) return 0;
    return Math.ceil((sevenDays - diff) / (24 * 60 * 60 * 1000));
  };

  const daysLeft = getDaysUntilUsernameChange();

  const isPrivateProfile = profile?.preferences?.privacy?.isPrivate && !isOwnProfile && friendshipStatus !== 'friends';

  const handleSendRequest = async () => {
    try {
      const { data } = await api.post(`/friends/request/${profile._id}`);
      if (data.success) {
        setFriendshipStatus('pending_sent');
        addToast({ type: 'success', message: 'Friend request sent!' });
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to send request' });
    }
  };

  const handleMessageClick = () => {
    navigate('/chat'); // Logic to open chat with this user
  };

  if (!profile) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <div className="page-loading">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="page-header__back" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </button>
            <h1 className="page-header__title">
              {isOwnProfile ? 'My Profile' : profile.displayName || profile.username}
            </h1>
          </div>
          {isOwnProfile && (
            <button className="page-header__action" onClick={() => navigate('/settings')}>
              <SettingsIcon size={16} />
              <span>Settings</span>
            </button>
          )}
        </div>

        <div className="profile">
          <div className="profile__card">
            {/* Premium Header */}
            <div className="profile__header-section" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              <div className="profile__avatar-section">
                <Avatar
                  src={profile.avatar}
                  name={profile.displayName || profile.username}
                  size={120}
                  online={profile.isOnline}
                />
                {isOwnProfile && (
                  <button className="profile__avatar-edit" title="Change avatar">
                    <Camera size={18} />
                  </button>
                )}
              </div>

              <div className="profile__header-info">
                <div className="profile__name-row">
                  <h2 className="profile__name">
                    {profile.displayName || profile.username || 'User'}
                  </h2>
                  {profile.role === 'admin' && (
                    <span className="badge badge--danger">Admin</span>
                  )}
                </div>
                {!isPrivateProfile && <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>@{profile.username}</p>}
                
                {!isPrivateProfile && (
                  <div className="profile__stats">
                    <div className="profile__stat">
                      <span className="profile__stat-value">{profile.friends?.length || 0}</span>
                      <span className="profile__stat-label">Friends</span>
                    </div>
                    <div className="profile__stat">
                      <span className="profile__stat-value">0</span>
                      <span className="profile__stat-label">Posts</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="profile__tabs">
              <button 
                className={`profile__tab ${activeTab === 'profile' ? 'profile__tab--active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              {isOwnProfile && (
                <button 
                  className={`profile__tab ${activeTab === 'edit' ? 'profile__tab--active' : ''}`}
                  onClick={() => setActiveTab('edit')}
                >
                  Edit Profile
                </button>
              )}
              <button 
                className={`profile__tab ${activeTab === 'share' ? 'profile__tab--active' : ''}`}
                onClick={() => setActiveTab('share')}
              >
                Share
              </button>
            </div>

            {/* Tab Content */}
            <div className="profile__tab-content">
              {activeTab === 'profile' && (
                <div className="profile__info">
                  {isPrivateProfile ? (
                    <div className="profile__private-notice">
                      <Lock size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <h3>This Account is Private</h3>
                      <p>Send a friend request to view their full profile and send messages.</p>
                    </div>
                  ) : (
                    <>
                      {profile.bio ? (
                        <p className="profile__bio">{profile.bio}</p>
                      ) : (
                        <p className="profile__bio" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No bio yet.</p>
                      )}
                      
                      <div className="profile__meta">
                        <div className="profile__meta-item mono">
                          <Calendar size={14} /> Joined {formatDate(profile.createdAt)}
                        </div>
                        {profile.gender && profile.gender !== 'prefer_not_to_say' && (
                          <div className="profile__meta-item mono">
                            <Users size={14} /> {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {!isOwnProfile && (
                    <div className="profile__actions">
                      {!isPrivateProfile && (
                        <Button variant="primary" size="lg" onClick={handleMessageClick}>
                          <MessageSquare size={18} /> Message
                        </Button>
                      )}

                      {friendshipStatus === 'none' && (
                        <Button variant={isPrivateProfile ? "primary" : "secondary"} size="lg" onClick={handleSendRequest}>
                          <UserPlus size={18} /> Add Friend
                        </Button>
                      )}

                      {friendshipStatus === 'pending_sent' && (
                        <Button variant="secondary" size="lg" disabled style={{ opacity: 0.7 }}>
                          <Clock size={18} /> Request Sent
                        </Button>
                      )}

                      {friendshipStatus === 'pending_received' && (
                        <Button variant="secondary" size="lg" onClick={() => navigate('/notifications')}>
                          <UserPlus size={18} /> Respond to Request
                        </Button>
                      )}

                      {friendshipStatus === 'friends' && isPrivateProfile === false && (
                         <Button variant="secondary" size="lg" disabled>
                           <CheckCircle size={18} /> Friends
                         </Button>
                      )}

                      <Button variant="ghost" size="lg" style={{ color: 'var(--danger)' }}>
                        <Ban size={18} /> Block
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'edit' && isOwnProfile && (
                <div className="profile__edit-form">
                  <Input
                    id="edit-name"
                    label="Display Name"
                    value={editData.displayName}
                    onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                    placeholder="Your name"
                  />
                  
                  <div className="input-group">
                    <Input
                      id="edit-username"
                      label="Username"
                      value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      placeholder="username"
                      disabled={daysLeft > 0}
                    />
                    {daysLeft > 0 ? (
                      <span className="username-warning">
                        <Info size={12} /> You can change your username in {daysLeft} day(s).
                      </span>
                    ) : (
                      <span className="input-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Usernames can be changed once every 7 days.
                      </span>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Gender</label>
                    <select 
                      className="input" 
                      value={editData.gender}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                    >
                      <option value="prefer_not_to_say">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="edit-bio">Bio</label>
                    <textarea
                      id="edit-bio"
                      className="input"
                      rows={4}
                      placeholder="Tell us about yourself..."
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      maxLength={500}
                      style={{ height: 'auto', resize: 'none' }}
                    />
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                      {editData.bio.length}/500
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: '8px' }}>
                    <Button variant="primary" size="lg" onClick={handleSave} loading={loading} fullWidth>
                      Save Changes
                    </Button>
                    <Button variant="secondary" size="lg" onClick={() => setActiveTab('profile')} fullWidth>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'share' && (
                <div className="profile__share-tab">
                  <div className="profile__qr-container">
                    <QRCodeSVG 
                      value={`${window.location.origin}/profile/${profile.username}`}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                    <div className="profile__qr-info">
                      <p className="profile__qr-name">{profile.displayName || profile.username}</p>
                      <p className="profile__qr-handle">@{profile.username}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.username}`);
                        addToast({ type: 'success', message: 'Profile link copied!' });
                      }}
                    >
                      <Share2 size={16} /> Copy Profile Link
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
