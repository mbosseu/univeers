import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { Lock, Unlock, Plus, Loader2, Calendar, MailOpen, AlertCircle, Heart, CalendarHeart, History, MapPin } from 'lucide-react';

const DURATION_OPTIONS = [
  { label: '2 minutes (Test) ⏱️', value: 2 * 60 },
  { label: '1 semaine 📅', value: 7 * 24 * 60 * 60 },
  { label: '1 mois 🗓️', value: 30 * 24 * 60 * 60 },
  { label: '6 mois ❄️', value: 180 * 24 * 60 * 60 },
  { label: '1 an 🎂', value: 365 * 24 * 60 * 60 },
  { label: '5 ans 🌟', value: 5 * 365 * 24 * 60 * 60 }
];

export default function Capsules() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [capsules, setCapsules] = useState([]);
  
  // Modal & Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  
  // Opened Capsule Modal
  const [openedCapsule, setOpenedCapsule] = useState(null);

  // Time state for live countdown refresh
  const [now, setNow] = useState(new Date());

  const channelRef = useRef(null);

  useEffect(() => {
    checkUser();
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/';
        return;
      }
      setUser(session.user);
      await fetchCapsules(session.user.id);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function fetchCapsules(userId) {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(userProfile);

      const { data: partners } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_id', userProfile.couple_id)
        .neq('id', userId);
      
      if (partners && partners.length > 0) {
        setPartnerProfile(partners[0]);
      }

      if (userProfile.couple_id) {
        const { data: list, error } = await supabase
          .from('time_capsules')
          .select('*')
          .eq('couple_id', userProfile.couple_id)
          .order('unlock_date', { ascending: true });

        if (error) throw error;
        setCapsules(list || []);

        // Abonnement temps réel pour synchroniser les capsules
        if (channelRef.current) supabase.removeChannel(channelRef.current);
        const channel = supabase
          .channel('capsules_realtime')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'time_capsules',
            filter: `couple_id=eq.${userProfile.couple_id}`
          }, (payload) => {
            if (payload.eventType === 'INSERT') {
              setCapsules(prev => [...prev, payload.new].sort((a, b) => new Date(a.unlock_date) - new Date(b.unlock_date)));
            } else if (payload.eventType === 'DELETE') {
              setCapsules(prev => prev.filter(c => c.id !== payload.old.id));
            }
          })
          .subscribe();
        channelRef.current = channel;
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching capsules:', err);
      setLoading(false);
    }
  }

  // Create Capsule Handler
  const handleCreateCapsule = async (e) => {
    e.preventDefault();
    if (!title.trim() || !letterContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const unlockDate = new Date();
      unlockDate.setSeconds(unlockDate.getSeconds() + selectedDuration);

      const { data: newCapsule, error } = await supabase
        .from('time_capsules')
        .insert([{
          couple_id: profile.couple_id,
          creator_id: user.id,
          title: title.trim(),
          letter_content: letterContent.trim(),
          unlock_date: unlockDate.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Award XP (+40 XP)
      const { data: couple } = await supabase
        .from('couples')
        .select('flame_xp, flame_energy')
        .eq('id', profile.couple_id)
        .single();

      if (couple) {
        await supabase
          .from('couples')
          .update({
            flame_xp: couple.flame_xp + 40,
            flame_energy: Math.min(100, couple.flame_energy + 20)
          })
          .eq('id', profile.couple_id);
      }

      setCapsules(prev => [...prev, newCapsule]);
      
      // Reset form
      setTitle('');
      setLetterContent('');
      setSelectedDuration(DURATION_OPTIONS[0].value);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format countdown timer
  const formatCountdown = (unlockDateStr) => {
    const diffMs = new Date(unlockDateStr).getTime() - now.getTime();
    if (diffMs <= 0) return null;

    const seconds = Math.floor((diffMs / 1000) % 60);
    const minutes = Math.floor((diffMs / 1000 / 60) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}j`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 className="spinner" size={48} color="var(--color-primary)" />
        <p style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>Chargement de vos capsules...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div className="couple-info">
          <div className="avatar">⏳</div>
          <div>
            <h2>Capsules Temporelles</h2>
            <p className="days-together">Lettres scellées à ouvrir dans le futur</p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(true)} className="icon-btn" title="Créer une capsule">
          <Plus size={24} color="var(--color-primary)" />
        </button>
      </header>

      {/* Capsules List */}
      <div className="capsules-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {capsules.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
            <Lock size={48} color="var(--color-text-light)" style={{ opacity: 0.5, marginBottom: '1rem', margin: '0 auto' }} />
            <h3 className="title-cursive" style={{ fontSize: '2rem' }}>Aucune capsule temporelle</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-light)', margin: '0.5rem 0 1.5rem 0' }}>
              Écrivez une lettre d'amour sincère et scellez-la pour votre anniversaire ou une date future !
            </p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-small" style={{ margin: '0 auto' }}>
              Créer notre première capsule
            </button>
          </div>
        ) : (
          capsules.map((c) => {
            const countdown = formatCountdown(c.unlock_date);
            const isUnlocked = countdown === null;
            const isCreator = c.creator_id === user.id;

            return (
              <div
                key={c.id}
                className={`card capsule-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                style={{
                  padding: '1.5rem',
                  border: isUnlocked ? '1px solid rgba(46, 125, 50, 0.2)' : '1px solid rgba(169, 27, 34, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.2rem',
                  cursor: isUnlocked ? 'pointer' : 'default',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => isUnlocked && setOpenedCapsule(c)}
              >
                {/* Background watermarks */}
                <div style={{ position: 'absolute', right: '-10px', bottom: '-15px', opacity: 0.05, fontSize: '5rem', pointerEvents: 'none' }}>
                  {isUnlocked ? '✉️' : '🔒'}
                </div>

                <div className="capsule-icon-wrapper" style={{
                  padding: '12px',
                  borderRadius: '50%',
                  backgroundColor: isUnlocked ? 'rgba(46, 125, 50, 0.08)' : 'rgba(169, 27, 34, 0.05)',
                  color: isUnlocked ? '#2e7d32' : 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isUnlocked ? <Unlock size={24} /> : <Lock size={24} />}
                </div>

                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ fontSize: '1.15rem', color: 'var(--color-text)', margin: '0 0 4px 0' }}>{c.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', margin: 0 }}>
                    Écrite par {isCreator ? 'vous' : partnerProfile?.display_name || 'Partenaire'}
                  </p>
                  
                  {isUnlocked ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#2e7d32', fontWeight: 600, marginTop: '8px' }}>
                      <MailOpen size={14} /> Cliquez pour ouvrir et lire
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '8px' }}>
                      ⏳ Déverrouillage dans : {countdown}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Capsule Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ padding: '2rem 1.5rem', maxWidth: '450px' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2 className="title-cursive" style={{ fontSize: '2.2rem' }}>Sceller une capsule</h2>
              <button onClick={() => setShowAddForm(false)} className="close-btn">&times;</button>
            </div>

            <form onSubmit={handleCreateCapsule} className="auth-form" style={{ gap: '1.2rem' }}>
              <div className="input-group">
                <label>Titre de la capsule</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: À ouvrir le jour de notre anniversaire..."
                  required
                />
              </div>

              <div className="input-group">
                <label>Contenu de votre lettre</label>
                <textarea
                  className="response-textarea"
                  value={letterContent}
                  onChange={(e) => setLetterContent(e.target.value)}
                  placeholder="Écrivez vos pensées secrètes, vos promesses, ou vos espoirs..."
                  required
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div className="input-group">
                <label>Durée du scellage</label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(169, 27, 34, 0.2)',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-main)',
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-white)'
                  }}
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="info-badge" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                backgroundColor: 'rgba(169, 27, 34, 0.03)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: 'var(--color-text-light)'
              }}>
                <AlertCircle size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Une fois scellée, aucun de vous deux ne pourra lire cette lettre avant la fin du compte à rebours !</span>
              </div>

              <button type="submit" disabled={submitting} className="btn submit-btn">
                <span>Sceller la capsule (+40 XP)</span>
                {submitting && <Loader2 className="spinner" size={18} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Opened Letter Modal */}
      {openedCapsule && (
        <div className="modal-overlay" onClick={() => setOpenedCapsule(null)}>
          <div
            className="modal-card letter-modal"
            style={{
              padding: '2.5rem 2rem',
              maxWidth: '500px',
              background: 'radial-gradient(circle, #fcfaf2 0%, #f7f3e3 100%)',
              border: '1px solid #e2d9b6',
              boxShadow: '0 15px 30px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px dashed rgba(169, 27, 34, 0.2)', paddingBottom: '10px', marginBottom: '1.5rem' }}>
              <h2 className="title-cursive" style={{ fontSize: '2.2rem', color: 'var(--color-primary)' }}>{openedCapsule.title}</h2>
              <button onClick={() => setOpenedCapsule(null)} className="close-btn">&times;</button>
            </div>

            <div className="letter-body" style={{
              fontFamily: 'Georgia, serif',
              fontSize: '1.1rem',
              lineHeight: '1.8',
              color: '#3e2723',
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '6px'
            }}>
              {openedCapsule.letter_content}
            </div>

            <div className="letter-footer" style={{
              marginTop: '2rem',
              borderTop: '1px dashed rgba(169, 27, 34, 0.2)',
              paddingTop: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem',
              color: 'var(--color-text-light)'
            }}>
              <span className="flex-center" style={{ gap: '4px' }}>
                <Heart size={14} color="var(--color-primary)" />
                Écrit par {openedCapsule.creator_id === user.id ? 'vous' : partnerProfile?.display_name || 'Partenaire'}
              </span>
              <span className="flex-center" style={{ gap: '4px' }}>
                <Calendar size={14} />
                Scellé le {new Date(openedCapsule.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bottom */}
      <nav className="bottom-nav">
        <a href="/dashboard" className="nav-item">
          <div className="nav-icon">🔥</div>
          <span>Univers</span>
        </a>
        <a href="/rituals" className="nav-item">
          <div className="nav-icon"><CalendarHeart /></div>
          <span>Rituels</span>
        </a>
        <a href="/messages" className="nav-item">
          <div className="nav-icon">💬</div>
          <span>Discussion</span>
        </a>
        <a href="/capsules" className="nav-item active">
          <div className="nav-icon">⏳</div>
          <span>Capsules</span>
        </a>
        <a href="/souvenirs" className="nav-item">
          <div className="nav-icon"><History /></div>
          <span>Souvenirs</span>
        </a>
      
        <a href="/location" className={"nav-item" + (window.location.pathname === '/location' ? ' active' : '')}>
          <div className="nav-icon"><MapPin /></div>
          <span>Position</span>
        </a>
      </nav>
    </div>
  );
}
