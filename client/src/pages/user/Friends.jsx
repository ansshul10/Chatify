/**
 * Friends page
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, UserPlus, UserCheck, UserX, Search,
  MessageSquare, Clock,
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import useUIStore from '../../store/uiStore.js';
import useNotificationStore from '../../store/notificationStore.js';
import api from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import '../shared.css';
import './friends.css';

export default function Friends() {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { markRequestsSeen } = useNotificationStore();

  useEffect(() => {
    fetchData();
    markRequestsSeen();

    const socket = getSocket();
    if (socket) {
      socket.on('friend:request', fetchData);
      socket.on('friend:request_cancelled', fetchData);
      socket.on('friend:request_accepted', fetchData);
    }

    return () => {
      if (socket) {
        socket.off('friend:request', fetchData);
        socket.off('friend:request_cancelled', fetchData);
        socket.off('friend:request_accepted', fetchData);
      }
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, sentRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests'),
        api.get('/friends/requests/sent'),
      ]);
      if (friendsRes.data.success) setFriends(friendsRes.data.data || []);
      if (requestsRes.data.success) setRequests(requestsRes.data.data.requests || []);
      if (sentRes.data.success) setSentRequests(sentRes.data.data.requests || []);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      addToast({ type: 'warning', message: 'Please enter a username to search' });
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (data.success) {
        setSearchResults(data.data.users || []);
        setHasSearched(true);
      }
    } catch {
      addToast({ type: 'error', message: 'Search failed' });
    } finally {
      setSearching(false);
    }
  };

  const handleAccept = async (reqId) => {
    try {
      await api.patch(`/friends/request/${reqId}/accept`);
      addToast({ type: 'success', message: 'Friend request accepted' });
      fetchData();
    } catch {
      addToast({ type: 'error', message: 'Failed to accept request' });
    }
  };

  const handleReject = async (reqId) => {
    try {
      await api.patch(`/friends/request/${reqId}/reject`);
      fetchData();
    } catch {
      addToast({ type: 'error', message: 'Failed to reject request' });
    }
  };

  const handleSendRequest = async (userId) => {
    const isSent = sentRequests.some(r => r.to?._id === userId);
    if (isSent) {
      return handleCancelRequest(userId);
    }

    try {
      await api.post(`/friends/request/${userId}`, {});
      addToast({ type: 'success', message: 'Friend request sent' });
      fetchData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error?.message || 'Failed' });
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      await api.delete(`/friends/request/${userId}`);
      addToast({ type: 'success', message: 'Friend request cancelled' });
      fetchData();
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to cancel request' });
    }
  };

  const tabs = [
    { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
    { id: 'requests', label: 'Requests', icon: UserPlus, count: requests.length },
    { id: 'sent', label: 'Sent', icon: Clock, count: sentRequests.length },
    { id: 'search', label: 'Find', icon: Search },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page-header">
          <button className="page-header__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="page-header__title">Friends</h1>
        </div>

        <div className="friends">
          {/* Tabs */}
          <div className="friends__tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`friends__tab ${tab === t.id ? 'friends__tab--active' : ''}`}
                onClick={() => {
                  setTab(t.id);
                  setHasSearched(false);
                  setSearchResults([]);
                }}
              >
                <t.icon size={16} />
                <span>{t.label}</span>
                {t.count > 0 && <span className="badge badge--secondary">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* Search */}
          {tab === 'search' && (
            <div className="friends__search">
              <div className="friends__search-bar">
                <input
                  type="text"
                  className="input"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleSearch}
                  isLoading={searching}
                  className="friends__search-btn"
                >
                  <Search size={16} /> Search
                </Button>
              </div>
              <div className="friends__list">
                {!hasSearched && (
                  <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                    <Search size={32} className="empty-state__icon" />
                    <div className="empty-state__title">Find Friends</div>
                    <div className="empty-state__description">
                      Search for people by their username to send them a friend request.
                    </div>
                  </div>
                )}
                {hasSearched && searchResults.length === 0 && (
                  <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                    <UserX size={32} className="empty-state__icon" />
                    <div className="empty-state__title">User not found</div>
                    <div className="empty-state__description">
                      We couldn't find anyone with the username "{searchQuery}"
                    </div>
                  </div>
                )}
                {searchResults.map((u) => (
                  <div key={u._id} className="friends__item">
                    <Avatar src={u.avatar} name={u.username} size={44} online={u.isOnline} />
                    <div className="friends__item-info">
                      <span className="friends__item-name">{u.username}</span>
                      {u.bio && <span className="friends__item-bio truncate">{u.bio}</span>}
                    </div>
                    {sentRequests.some(r => r.to?._id === u._id) ? (
                      <Button variant="secondary" size="sm" className="btn-reject" onClick={() => handleSendRequest(u._id)}>
                        <Clock size={14} /> Sent
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" className="btn-accept" onClick={() => handleSendRequest(u._id)}>
                        <UserPlus size={14} /> Add
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends list */}
          {tab === 'friends' && (
            <div className="friends__list">
              {friends.length === 0 ? (
                <div className="empty-state">
                  <Users size={32} className="empty-state__icon" />
                  <div className="empty-state__title">No friends yet</div>
                  <div className="empty-state__description">
                    Search for users and send friend requests
                  </div>
                </div>
              ) : (
                friends.map((f) => (
                  <div key={f._id} className="friends__item">
                    <Avatar src={f.avatar} name={f.username} size={44} online={f.isOnline} />
                    <div className="friends__item-info">
                      <span className="friends__item-name">{f.username}</span>
                      <span className="friends__item-bio">{f.isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/chat`)}>
                      <MessageSquare size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Requests */}
          {tab === 'requests' && (
            <div className="friends__list">
              {requests.length === 0 ? (
                <div className="empty-state">
                  <UserPlus size={32} className="empty-state__icon" />
                  <div className="empty-state__title">No pending requests</div>
                </div>
              ) : (
                requests.map((r) => (
                  <div key={r._id} className="friends__item friends__item--request">
                    <Avatar src={r.from?.avatar} name={r.from?.username} size={44} />
                    <div className="friends__item-info">
                      <span className="friends__item-name">{r.from?.username}</span>
                      <span className="friends__item-bio">Wants to be your friend</span>
                    </div>
                    <div className="friends__actions">
                      <Button variant="primary" size="sm" className="btn-accept" onClick={() => handleAccept(r._id)}>
                        <UserCheck size={14} /> Accept
                      </Button>
                      <Button variant="ghost" size="sm" className="btn-reject" onClick={() => handleReject(r._id)}>
                        <UserX size={14} /> Decline
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sent */}
          {tab === 'sent' && (
            <div className="friends__list">
              {sentRequests.length === 0 ? (
                <div className="empty-state">
                  <Clock size={32} className="empty-state__icon" />
                  <div className="empty-state__title">No sent requests</div>
                </div>
              ) : (
                sentRequests.map((r) => (
                  <div key={r._id} className="friends__item">
                    <Avatar src={r.to?.avatar} name={r.to?.username} size={44} />
                    <div className="friends__item-info">
                      <span className="friends__item-name">{r.to?.username}</span>
                      <span className="friends__item-bio">Request Pending</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
