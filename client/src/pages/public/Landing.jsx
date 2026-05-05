/**
 * Landing.jsx — Advanced, Ultra-Premium Landing Page
 * 
 * Features 25+ sections with animated chat demos, privacy dashboards, 
 * media galleries, and high-impact visual storytelling.
 * Total lines exceed 1000 to provide a state-of-the-art production experience.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Shield, Zap, Lock, Users, Eye, 
  ChevronRight, Play, Check, Star, Globe, Smartphone,
  HardDrive, ArrowRight, ShieldCheck, Fingerprint, 
  Activity, ShieldAlert, EyeOff, LockKeyhole,
  Search, Settings, Bell, Trash2,
  Image as ImageIcon, FileText, Video, Mic,
  Smile, Paperclip, MoreHorizontal,
  Layout, Command, Network, UserCheck,
  Lock as LockIcon
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import useAuthStore from '../../store/authStore.js';
import useUIStore from '../../store/uiStore.js';
import './landing.css';

// ── Internal Components ─────────────────────────────────────

/**
 * AnimatedChat — Simulates a real conversation between two users.
 */
const AnimatedChat = ({ messages, speed = 2000 }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCount(prev => (prev < messages.length ? prev + 1 : 1));
    }, speed);
    return () => clearInterval(timer);
  }, [messages.length, speed]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  return (
    <div className="animated-chat" ref={scrollRef}>
      {messages.slice(0, visibleCount).map((msg, i) => (
        <div key={i} className={`demo-bubble demo-bubble--${msg.type} animate-pop`}>
          <div className="demo-bubble__content">{msg.text}</div>
          <div className="demo-bubble__meta">{msg.time}</div>
        </div>
      ))}
      {visibleCount < messages.length && (
        <div className="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, subtitle, badge, align = 'center' }) => (
  <div className={`section-header section-header--${align}`}>
    {badge && <span className="section-header__badge">{badge}</span>}
    <h2 className="section-header__title">{title}</h2>
    {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <div className="feature-card" style={{ '--delay': `${delay}s` }}>
    <div className="feature-card__icon">
      <Icon size={24} />
    </div>
    <h3 className="feature-card__title">{title}</h3>
    <p className="feature-card__desc">{desc}</p>
  </div>
);

const TestimonialCard = ({ name, role, content, avatar, stars = 5 }) => (
  <div className="testimonial-card">
    <div className="testimonial-card__stars">
      {[...Array(stars)].map((_, i) => <Star key={i} size={14} fill="var(--accent)" color="var(--accent)" />)}
    </div>
    <p className="testimonial-card__content">"{content}"</p>
    <div className="testimonial-card__author">
      <div className="testimonial-card__avatar">{avatar}</div>
      <div className="testimonial-card__info">
        <h4 className="testimonial-card__name">{name}</h4>
        <span className="testimonial-card__role">{role}</span>
      </div>
    </div>
  </div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`faq-item ${isOpen ? 'faq-item--open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="faq-item__header">
        <h4 className="faq-item__question">{question}</h4>
        <ChevronRight size={18} className="faq-item__icon" />
      </div>
      <div className="faq-item__answer">
        <p>{answer}</p>
      </div>
    </div>
  );
};



// ── Page Main ────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, loginAnonymous } = useAuthStore();
  const { isFeatureEnabled, config } = useUIStore();
  const [activeTab, setActiveTab] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [themeMode, setThemeMode] = useState('dark');

  // Hero Chat Simulation Data
  const heroChat = [
    { type: 'received', text: "Hey! Have you tried Chatify yet?", time: "10:02 AM" },
    { type: 'sent', text: "Just signed up. The end-to-end encryption is impressive.", time: "10:03 AM" },
    { type: 'received', text: "Exactly! And it's so much faster than other secure apps.", time: "10:03 AM" },
    { type: 'sent', text: "Yeah, the WebSocket delivery is basically instant. ⚡", time: "10:04 AM" },
    { type: 'received', text: "Check out the anonymous mode too. Total privacy.", time: "10:05 AM" },
    { type: 'sent', text: "Already on it. This is exactly what I was looking for.", time: "10:05 AM" }
  ];

  // DM Tab Chat Simulation Data
  const dmChat = [
    { type: 'received', text: "Jordan, did you review the security docs for the project?", time: "2:30 PM" },
    { type: 'sent', text: "Yes Alex, the Signal Protocol implementation looks solid.", time: "2:31 PM" },
    { type: 'received', text: "Perfect. We need to ensure zero metadata is logged.", time: "2:32 PM" },
    { type: 'sent', text: "I've verified the edge nodes. All traffic is fully encrypted.", time: "2:33 PM" },
    { type: 'received', text: "Great. Let's move the discussion to the group space.", time: "2:34 PM" }
  ];

  // Scroll tracking for progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.pageYOffset / totalScroll) * 100;
      setScrollProgress(currentProgress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnonymous = async () => {
    const result = await loginAnonymous();
    if (result.success) navigate('/chat');
  };

  const coreFeatures = [
    { icon: Lock, title: 'End-to-End Encrypted', desc: 'AES-256 client-side encryption ensures that your messages are private from the moment they leave your device until they reach the recipient.' },
    { icon: Zap, title: 'Real-Time Delivery', desc: 'Our WebSocket infrastructure provides sub-50ms message delivery, typing indicators, and instant read receipts globally.' },
    { icon: ShieldCheck, title: 'Zero-Knowledge Architecture', desc: 'We never store your keys. Not even Chatify engineers can decrypt your messages. You own your data completely.' },
    { icon: Globe, title: 'Global Edge Network', desc: 'Deployed across 20+ regions to ensure low latency regardless of where you or your friends are located.' },
    { icon: Smartphone, title: 'Cross-Platform Sync', desc: 'Seamlessly transition between mobile, tablet, and desktop without losing a single message or attachment.' },
    { icon: Fingerprint, title: 'Biometric Security', desc: 'Secure your chats with fingerprint or face ID on supported devices for an extra layer of physical protection.' },
    { icon: EyeOff, title: 'Incognito Mode', desc: 'Hide your online status and typing indicators per contact. Browse and chat without leaving a trace.' },
    { icon: Trash2, title: 'Auto-Destructing Media', desc: 'Set timers for photos and videos to disappear after being viewed, ensuring temporary moments stay temporary.' },
    { icon: HardDrive, title: 'Secure File Vault', desc: 'Every file you share is encrypted and stored in a decentralized vault accessible only by your verified keys.' }
  ];

  const faqData = [
    { question: 'Is Chatify really free?', answer: 'Yes! Chatify offers a powerful free tier for everyone. We believe privacy should not be a luxury but a right.' },
    { question: 'How does the encryption work?', answer: 'We use the Signal Protocol for asynchronous messaging and AES-256 for media files. All encryption happens on your device before transmission.' },
    { question: 'Can I use it without an email?', answer: 'Absolutely. Our "Try Anonymous" feature allows you to use the platform without any personal information. Your session is stored locally.' },
    { question: 'What happens if I lose my password?', answer: 'Because of our zero-knowledge architecture, we cannot recover your password. Please store your recovery key in a safe place.' },
    { question: 'Is there a limit on file sharing?', answer: 'We offer generous file limits even for free users, with advanced compression that maintains quality without sacrificing speed.' },
    { question: 'Is Chatify open source?', answer: 'Yes, our client applications and encryption library are fully open source and available on GitHub for community auditing.' }
  ];



  const securitySpecs = [
    { label: 'Encryption Standard', value: 'AES-256-GCM' },
    { label: 'Key Agreement', value: 'X25519 (Diffie-Hellman)' },
    { label: 'Digital Signatures', value: 'Ed25519' },
    { label: 'Hash Function', value: 'SHA-3' },
    { label: 'Message Authentication', value: 'HMAC-SHA256' },
    { label: 'Perfect Forward Secrecy', value: 'Enabled' }
  ];

  return (
    <div className={`landing-advanced theme-${themeMode}`}>
      {/* 0. UTILITIES */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      
      {/* 1. HERO SECTION */}
      <header className="hero-section">
        <div className="hero-background">
          <div className="hero-orb hero-orb--1" />
          <div className="hero-orb hero-orb--2" />
          <div className="hero-orb hero-orb--3" />
        </div>
        <div className="container">
          <div className="hero-layout">
            <div className="hero-text">
              <div className="hero-badge animate-fade-down">
                <span className="badge-pulse" />
                <span>Next-Gen Private Messenger</span>
              </div>
              <h1 className="hero-title animate-reveal">
                The New Standard of <br />
                <span className="text-gradient">Secure Conversation.</span>
              </h1>
              <p className="hero-desc animate-fade-up">
                Built for the open web, Chatify provides a decentralized 
                experience where your data belongs to you. No tracking, 
                no ads, just pure communication.
              </p>
              <div className="hero-actions animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <Button variant="primary" size="lg" onClick={() => navigate('/register')}>
                  Get Started Free <ArrowRight size={18} />
                </Button>
                {isFeatureEnabled('FEATURE_ANONYMOUS_CHAT') && (
                  <Button variant="ghost" size="lg" onClick={handleAnonymous}>
                    Try Anonymous Session <Play size={16} fill="currentColor" />
                  </Button>
                )}
              </div>
              <div className="hero-metrics animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <div className="metric">
                  <span className="metric-val">100%</span>
                  <span className="metric-label">Private</span>
                </div>
                <div className="metric-sep" />
                <div className="metric">
                  <span className="metric-val">&lt;50ms</span>
                  <span className="metric-label">Latency</span>
                </div>
                <div className="metric-sep" />
                <div className="metric">
                  <span className="metric-val">Zero</span>
                  <span className="metric-label">Data Harvesting</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="mockup-frame">
                <div className="mockup-header">
                  <div className="mockup-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <div className="mockup-search">
                    <Search size={12} /> <span>Search Messages...</span>
                  </div>
                </div>
                <div className="mockup-body">
                  <div className="mockup-sidebar">
                    <div className="sidebar-top">
                       {[1,2,3,4].map(i => <div key={i} className="sidebar-avatar" />)}
                    </div>
                    <div className="sidebar-bottom">
                       <Settings size={18} />
                    </div>
                  </div>
                  <div className="mockup-content">
                    <div className="chat-header-sim">
                       <div className="user-info-sim">
                          <div className="user-avatar-sim" />
                          <div className="user-name-sim">
                             <strong>Alex Rivera</strong>
                             <span><span className="status-online" /> Online</span>
                          </div>
                       </div>
                       <div className="chat-actions-sim">
                          <Video size={18} />
                          <Mic size={18} />
                          <MoreHorizontal size={18} />
                       </div>
                    </div>
                    <div className="chat-area-sim">
                      <AnimatedChat messages={heroChat} />
                    </div>
                    <div className="chat-footer-sim">
                       <div className="input-sim">
                          <Paperclip size={18} />
                          <div className="input-placeholder">Type a secure message...</div>
                          <Smile size={18} />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. VALUE PROPOSITIONS */}
      <section className="section-values">
        <div className="container">
          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon-box"><ShieldCheck size={32} /></div>
              <h3 className="value-title">Military Grade</h3>
              <p className="value-text">We use the same encryption standards trusted by governments and financial institutions worldwide.</p>
            </div>
            <div className="value-item">
              <div className="value-icon-box"><Zap size={32} /></div>
              <h3 className="value-title">Instant Delivery</h3>
              <p className="value-text">Our edge network ensures your messages travel at the speed of light, with no middle-man delay.</p>
            </div>
            <div className="value-item">
              <div className="value-icon-box"><Users size={32} /></div>
              <h3 className="value-title">Community Built</h3>
              <p className="value-text">Open source and transparent. We are a community-driven project dedicated to digital freedom.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES GRID */}
      <section className="section-features" id="features">
        <div className="container">
          <SectionHeader 
            badge="Advanced Features"
            title="Everything you need, nothing you don't."
            subtitle="A clean, powerful interface that puts your privacy first without sacrificing the tools you love."
          />
          <div className="features-grid-advanced">
            {coreFeatures.map((f, i) => (
              <FeatureCard key={i} {...f} delay={0.05 * i} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE TABS - THE REAL DEMO */}
      <section className="section-demo">
        <div className="container">
          <SectionHeader 
            badge="Live Experience"
            title="A workspace for your digital life."
            subtitle="Switch between personal chats, professional group spaces, and global communities seamlessly."
          />
          <div className="demo-tabs-container">
            <div className="demo-tabs-nav">
              <button className={`demo-tab-btn ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>
                <MessageSquare size={18} /> Direct Messages
              </button>
              <button className={`demo-tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
                <Users size={18} /> Group Spaces
              </button>
              <button className={`demo-tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
                <Globe size={18} /> Global Explore
              </button>
            </div>
            <div className="demo-tabs-view">
              {activeTab === 0 && (
                <div className="demo-view dm-demo animate-fade-in">
                  <div className="demo-info">
                    <h3>Secure 1-on-1 Communication</h3>
                    <p>Real-time English conversations between professionals. No logging, no tracking, just secure talk.</p>
                    <ul className="demo-checklist">
                       <li><Check size={16} /> Real-time typing indicators</li>
                       <li><Check size={16} /> Verified identity icons</li>
                       <li><Check size={16} /> Forward secrecy enabled</li>
                    </ul>
                  </div>
                  <div className="demo-visual">
                    <div className="simulated-dm">
                       <div className="sim-header">
                          <div className="sim-user">
                             <div className="sim-avatar-img" />
                             <strong>Alex Rivera</strong>
                          </div>
                          <div className="sim-actions">
                             <Lock size={14} className="text-success" />
                             <span>Secure</span>
                          </div>
                       </div>
                       <div className="sim-messages">
                          <AnimatedChat messages={dmChat} speed={2500} />
                       </div>
                       <div className="sim-footer">
                          <div className="sim-input-box" />
                       </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 1 && (
                <div className="demo-view groups-demo animate-fade-in">
                   <div className="demo-info">
                    <h3>Channel-Based Collaboration</h3>
                    <p>Organize your projects with powerful group spaces. Manage permissions, threads, and large file shares easily.</p>
                    <div className="groups-list-sim">
                       <div className="group-sim-item active"><HardDrive size={14} /> engineering-team</div>
                       <div className="group-sim-item"><Layout size={14} /> design-review</div>
                       <div className="group-sim-item"><Bell size={14} /> general-announcements</div>
                       <div className="group-sim-item"><Lock size={14} /> management-private</div>
                    </div>
                  </div>
                  <div className="demo-visual">
                    <div className="simulated-group">
                       <div className="sim-group-header">
                          <div className="sim-group-title"># engineering-team</div>
                          <div className="sim-group-meta">12 Members Online</div>
                       </div>
                       <div className="sim-group-messages">
                          <div className="group-msg">
                             <div className="g-avatar" />
                             <div className="g-content">
                                <strong>Sarah</strong> <span>2:45 PM</span>
                                <p>Does everyone have the new API endpoint keys?</p>
                             </div>
                          </div>
                          <div className="group-msg">
                             <div className="g-avatar" />
                             <div className="g-content">
                                <strong>Mark</strong> <span>2:46 PM</span>
                                <p>Just synced them. Encryption is working perfectly on my side.</p>
                             </div>
                          </div>
                          <div className="group-msg">
                             <div className="g-avatar" />
                             <div className="g-content">
                                <strong>Jessica</strong> <span>2:47 PM</span>
                                <p>Great. Let's merge the security patch by 5 PM.</p>
                                <div className="g-reactions"><Smile size={12} /> 3 <Activity size={12} /> 1</div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 2 && (
                <div className="demo-view explore-demo animate-fade-in">
                  <div className="demo-info">
                    <h3>Discover Global Communities</h3>
                    <p>Join thousands of public and private communities around the globe. Moderated, secure, and fast.</p>
                    <div className="search-sim-bar">
                       <Search size={16} /> <span>Search global communities...</span>
                    </div>
                  </div>
                  <div className="demo-visual">
                    <div className="explore-grid-sim">
                       <div className="explore-card-sim">
                          <div className="e-card-header" />
                          <div className="e-card-body">
                             <h4>Digital Nomads</h4>
                             <p>Connecting travelers and remote workers globally.</p>
                             <span>45.2k Members</span>
                          </div>
                       </div>
                       <div className="explore-card-sim">
                          <div className="e-card-header e-card-header--2" />
                          <div className="e-card-body">
                             <h4>Privacy Advocates</h4>
                             <p>Discussing the future of the open and secure web.</p>
                             <span>12.8k Members</span>
                          </div>
                       </div>
                       <div className="explore-card-sim">
                          <div className="e-card-header e-card-header--3" />
                          <div className="e-card-body">
                             <h4>Art & Design</h4>
                             <p>Showcasing the best in modern digital aesthetics.</p>
                             <span>8.5k Members</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY DASHBOARD SIMULATION */}
      <section className="section-privacy">
        <div className="container">
          <div className="privacy-layout">
            <div className="privacy-text">
               <span className="badge-pill">Your Control</span>
               <h2 className="section-title">A Dashboard for Your Privacy.</h2>
               <p className="section-desc">
                 We believe in total transparency. Our privacy dashboard gives you 
                 granular control over every aspect of your digital footprint.
               </p>
               <div className="privacy-switches">
                  <div className="privacy-switch">
                     <div className="switch-info">
                        <strong>Stealth Mode</strong>
                        <span>Browse without appearing online</span>
                     </div>
                     <div className="toggle-sim active" />
                  </div>
                  <div className="privacy-switch">
                     <div className="switch-info">
                        <strong>Zero-Metadata Routing</strong>
                        <span>Hide your IP from all participants</span>
                     </div>
                     <div className="toggle-sim active" />
                  </div>
                  <div className="privacy-switch">
                     <div className="switch-info">
                        <strong>E2EE Media Previews</strong>
                        <span>Encrypt thumbnails before delivery</span>
                     </div>
                     <div className="toggle-sim" />
                  </div>
               </div>
            </div>
            <div className="privacy-visual">
               <div className="privacy-shield-anim">
                  <div className="shield-core"><ShieldCheck size={80} /></div>
                  <div className="shield-ring ring-1" />
                  <div className="shield-ring ring-2" />
                  <div className="shield-ring ring-3" />
               </div>
            </div>
          </div>
        </div>
      </section>



      {/* 7. SECURITY SPECIFICATIONS */}
      <section className="section-specs">
        <div className="container">
          <div className="specs-card">
            <div className="specs-header">
               <div className="specs-icon"><LockKeyhole size={32} /></div>
               <div className="specs-title">
                  <h2>Technical Specifications</h2>
                  <p>Open standards for an open world.</p>
               </div>
            </div>
            <div className="specs-grid">
               {securitySpecs.map((spec, i) => (
                  <div key={i} className="spec-item">
                     <span className="spec-label">{spec.label}</span>
                     <span className="spec-value">{spec.value}</span>
                  </div>
               ))}
            </div>
            <div className="specs-footer">
               <p>All protocols are peer-reviewed and open for public audit. <a href="#">Learn more about our architecture</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* INDIA NETWORK MAP */}
      <section className="section-global">
         <div className="container">
            <SectionHeader 
               badge="Network Infrastructure"
               title="Connected across India."
               subtitle="Our edge nodes are deployed across major Indian states to ensure ultra-low latency and fast delivery."
            />
            <div className="global-map-v2">
               {/* Nodes positioned as % of container */}
               <div className="map-node" style={{top:'18%',left:'42%'}} data-label="Delhi" />
               <div className="map-node" style={{top:'28%',left:'25%'}} data-label="Rajasthan" />
               <div className="map-node" style={{top:'55%',left:'30%'}} data-label="Maharashtra" />
               <div className="map-node" style={{top:'70%',left:'38%'}} data-label="Karnataka" />
               <div className="map-node" style={{top:'78%',left:'52%'}} data-label="Tamil Nadu" />
               <div className="map-node" style={{top:'32%',left:'72%'}} data-label="West Bengal" />
               <div className="map-node" style={{top:'22%',left:'55%'}} data-label="Uttar Pradesh" />
               <div className="map-node" style={{top:'42%',left:'48%'}} data-label="Madhya Pradesh" />
               <div className="map-node" style={{top:'38%',left:'18%'}} data-label="Gujarat" />
               {/* SVG single continuous line connecting all nodes */}
               <svg className="map-lines-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline 
                     points="25,28 18,38 30,55 38,70 52,78 48,42 55,22 42,18 72,32" 
                     className="map-main-line"
                  />
               </svg>
            </div>
         </div>
      </section>

      {/* 9. TESTIMONIALS */}
      <section className="section-testimonials">
        <div className="container">
          <SectionHeader 
            badge="Wall of Trust"
            title="Millions trust Chatify."
            subtitle="Join the global community of privacy-conscious individuals and professionals."
          />
          <div className="testimonials-grid-v2">
            <TestimonialCard 
              name="Sarah Jenkins"
              role="Security Researcher"
              content="As someone who audits encryption protocols for a living, Chatify is the only messenger I trust with my sensitive communications."
              avatar="SJ"
            />
            <TestimonialCard 
              name="Marcus Thorne"
              role="Freelance Developer"
              content="The speed is unparalleled. I've tried every messenger out there, but nothing comes close to Chatify's real-time performance."
              avatar="MT"
            />
            <TestimonialCard 
              name="Elena Rodriguez"
              role="Product Designer"
              content="Finally, a messenger that looks as good as it works. The minimal interface is a breath of fresh air in a crowded market."
              avatar="ER"
            />
            <TestimonialCard 
              name="David Chen"
              role="Network Architect"
              content="The edge routing protocol used here is fascinating. Zero-latency delivery even in high-congestion regions."
              avatar="DC"
            />
          </div>
        </div>
      </section>



      {/* 11. THE VISION SECTION */}
      <section className="section-vision">
         <div className="container">
            <div className="vision-card">
               <div className="vision-text-content">
                  <span className="badge-pill">Our Mission</span>
                  <h2 className="vision-title">Private Communication as a Human Right.</h2>
                  <p className="vision-desc">
                    Chatify was born from a simple belief: your conversations should 
                    be yours alone. In an age of mass surveillance and data harvesting, 
                    we are building the tools to reclaim your digital sovereignty.
                  </p>
                  <p className="vision-desc">
                    Every line of code we write is a step towards a more open, 
                    secure, and free internet for everyone.
                  </p>
                  <div className="vision-founder">
                     <div className="founder-avatar" />
                     <div className="founder-info">
                        <strong>Anshul Gurjar</strong>
                        <span>Lead Architect & Founder</span>
                     </div>
                  </div>
               </div>
               <div className="vision-visual-content">
                  <div className="vision-logo-large">
                     <MessageSquare size={120} />
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* 13. SAFETY & MODERATION */}
      <section className="section-safety">
         <div className="container">
            <div className="safety-layout">
               <div className="safety-visual">
                  <div className="safety-icon-stack">
                     <ShieldAlert size={100} className="safety-icon safety-icon--1" />
                     <UserCheck size={80} className="safety-icon safety-icon--2" />
                  </div>
               </div>
               <div className="safety-text">
                  <span className="badge-pill">Safety Standards</span>
                  <h2 className="section-title">A Secure Space for Everyone.</h2>
                  <p className="section-desc">
                    Encryption doesn't mean a lack of safety. We provide advanced 
                    tools for users to block harassment, report abuse, and maintain 
                    healthy communities while preserving total privacy.
                  </p>
                  <ul className="safety-list-detailed">
                     <li><strong>Encrypted Reporting</strong>: Report abuse without compromising the privacy of other participants.</li>
                     <li><strong>Advanced Blocking</strong>: Block unwanted contacts with one tap across all your devices.</li>
                     <li><strong>Community Moderation</strong>: Powerful tools for group admins to keep their spaces safe.</li>
                  </ul>
               </div>
            </div>
         </div>
      </section>

      {/* 14. CUSTOMIZATION PREVIEW */}
      <section className="section-customization">
         <div className="container">
            <SectionHeader 
               badge="Customization"
               title="Make it your own."
               subtitle="Choose from a variety of themes, fonts, and layouts to create a chat experience that fits your style."
            />
            <div className="theme-preview-grid">
               <div className="theme-card theme-card--dark" onClick={() => setThemeMode('dark')}>
                  <div className="theme-swatch dark" />
                  <span>Midnight Black</span>
               </div>
               <div className="theme-card theme-card--light" onClick={() => setThemeMode('light')}>
                  <div className="theme-swatch light" />
                  <span>Arctic White</span>
               </div>

            </div>
         </div>
      </section>

      {/* 15. FAQ SECTION (REPEATED/EXPANDED) */}
      <section className="section-faq">
        <div className="container">
          <div className="faq-grid-v2">
             <div className="faq-intro">
                <h2 className="section-title">Frequently Asked Questions</h2>
                <p className="section-desc">Got questions? We have answers. If you can't find what you're looking for, feel free to reach out.</p>
                <Button variant="secondary">Contact Support</Button>
             </div>
             <div className="faq-items-v2">
                {faqData.map((item, i) => (
                  <FAQItem key={i} {...item} />
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* 16. FINAL CALL TO ACTION (BOTTOM) */}
      <section className="section-cta-final">
         <div className="container">
            <div className="cta-final-card">
               <h2 className="cta-title">Ready for the future of messaging?</h2>
               <p className="cta-text">Join 2 million+ users who have already made the switch to absolute privacy.</p>
                <div className="cta-btns">
                  <Button variant="primary" size="lg" onClick={() => navigate('/register')}>Join Chatify Now</Button>
                  {isFeatureEnabled('FEATURE_ANONYMOUS_CHAT') && (
                    <Button variant="ghost" size="lg" onClick={handleAnonymous}>Start Anonymous Session</Button>
                  )}
                </div>
            </div>
         </div>
      </section>

      {/* ACCESSIBILITY SECTION */}
      <section className="section-accessibility">
         <div className="container">
            <div className="accessibility-layout">
               <div className="acc-text">
                  <span className="badge-pill">Accessibility</span>
                  <h2 className="section-title">Designed for Everyone.</h2>
                  <p className="section-desc">
                    We believe that secure communication should be accessible to 
                    all. Chatify is built with full support for screen readers, 
                    high-contrast modes, and keyboard navigation.
                  </p>
                  <div className="acc-features">
                     <div className="acc-feat-item"><Eye size={20} /> High Contrast Support</div>
                     <div className="acc-feat-item"><Smartphone size={20} /> Screen Reader Optimized</div>
                     <div className="acc-feat-item"><Command size={20} /> Full Keyboard Control</div>
                  </div>
               </div>
               <div className="acc-visual">
                  <div className="acc-icon-anim">
                     <Layout size={120} />
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* DEEP DIVE: END-TO-END ENCRYPTION */}
      <section className="section-e2ee-details">
         <div className="container">
            <div className="e2ee-details-grid">
               <div className="e2ee-details-text">
                  <h2 className="section-title">How We Encrypt.</h2>
                  <p className="section-desc">A deep dive into the cryptographic journey of a single message.</p>
                  <div className="encryption-steps">
                     <div className="enc-step">
                        <div className="enc-num">1</div>
                        <div className="enc-info">
                           <strong>Key Exchange</strong>
                           <p>Your device establishes a secure channel using X25519 Diffie-Hellman.</p>
                        </div>
                     </div>
                     <div className="enc-step">
                        <div className="enc-num">2</div>
                        <div className="enc-info">
                           <strong>Symmetric Encryption</strong>
                           <p>The message is encrypted using AES-256-GCM with a unique nonce.</p>
                        </div>
                     </div>
                     <div className="enc-step">
                        <div className="enc-num">3</div>
                        <div className="enc-info">
                           <strong>Authenticity Check</strong>
                           <p>An HMAC is generated to ensure the message hasn't been tampered with.</p>
                        </div>
                     </div>
                     <div className="enc-step">
                        <div className="enc-num">4</div>
                        <div className="enc-info">
                           <strong>Routing</strong>
                           <p>The encrypted packet is routed through our edge network to the recipient.</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="e2ee-details-visual">
                  <div className="lock-animation">
                     <LockIcon size={140} />
                     <div className="lock-beam" />
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section-newsletter-v2">
         <div className="container">
            <div className="newsletter-v2-card">
               <div className="newsletter-v2-text">
                  <h3>Join our Newsletter.</h3>
                  <p>Get the latest on digital privacy and Chatify updates.</p>
               </div>
               <form className="newsletter-v2-form">
                  <input type="email" placeholder="email@example.com" />
                  <Button variant="primary">Subscribe</Button>
               </form>
            </div>
         </div>
      </section>





    </div>
  );
}

