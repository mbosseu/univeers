import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { Loader2, Calendar, Award, Image, MessageCircle, Heart, Star, Sparkles } from 'lucide-react';

export default function Journal() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [stats, setStats] = useState({
    daysTogether: 0,
    weeklyChallenges: 0,
    weeklyPhotos: 0,
    weeklyMessages: 0,
    recentSouvenirs: []
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/';
      return;
    }
    await loadWeeklyJournal(session.user.id);
  }

  async function loadWeeklyJournal(userId) {
    try {
      // 1. Fetch current profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(userProfile);

      // 2. Fetch partner profile
      const { data: partners } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_id', userProfile.couple_id)
        .neq('id', userId);

      let currentPartner = null;
      if (partners && partners.length > 0) {
        currentPartner = partners[0];
        setPartnerProfile(currentPartner);
      }

      if (userProfile.couple_id) {
        // 3. Fetch couple
        const { data: couple } = await supabase
          .from('couples')
          .select('*')
          .eq('id', userProfile.couple_id)
          .single();

        const days = Math.ceil(Math.abs(new Date().getTime() - new Date(couple.anniversary_date || couple.created_at).getTime()) / (1000 * 60 * 60 * 24));

        // Date from 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const isoString = sevenDaysAgo.toISOString();

        // 4. Count weekly challenges
        const { data: attempts } = await supabase
          .from('quest_attempts')
          .select('*')
          .eq('couple_id', userProfile.couple_id)
          .gte('completed_at', isoString);

        // 5. Fetch weekly souvenirs / photos
        const { data: weeklySouv } = await supabase
          .from('souvenirs')
          .select('*')
          .eq('couple_id', userProfile.couple_id)
          .gte('souvenir_date', isoString.split('T')[0]);

        // 6. Count weekly messages
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('couple_id', userProfile.couple_id)
          .gte('created_at', isoString);

        setStats({
          daysTogether: days,
          weeklyChallenges: attempts ? attempts.length : 0,
          weeklyPhotos: weeklySouv ? weeklySouv.length : 0,
          weeklyMessages: msgCount || 0,
          recentSouvenirs: weeklySouv || []
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading weekly journal:', err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 className="spinner" size={48} color="var(--color-primary)" />
        <p style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>Préparation de votre Journal Hebdomadaire...</p>
      </div>
    );
  }

  // AI/Companion comment generator based on activity levels
  const getWeeklyCommentary = () => {
    const totalActivity = stats.weeklyChallenges + stats.weeklyPhotos + (stats.weeklyMessages > 10 ? 1 : 0);
    if (totalActivity >= 5) {
      return "Une semaine fantastique de connexion et de partage ! Votre flamme rayonne de mille feux. Continuez à prendre soin l'un de l'autre ! ✨";
    } else if (totalActivity >= 2) {
      return "Une belle semaine complice. Vous trouvez toujours du temps pour vous lier au milieu du quotidien. C'est précieux. ❤️";
    } else {
      return "Une semaine un peu plus calme. C'est le moment idéal pour s'envoyer un mot doux ou planifier un rendez-vous surprise ! 🌸";
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div className="couple-info">
          <div className="avatar">📖</div>
          <div>
            <h2>Journal de Couple</h2>
            <p className="days-together">Votre rétrospective hebdomadaire</p>
          </div>
        </div>
        <a href="/dashboard" className="icon-btn" title="Retour à l'Univers">
          🔥
        </a>
      </header>

      {/* Rétrospective card */}
      <div className="card text-center flex-col" style={{ padding: '2rem 1.5rem', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(169, 27, 34, 0.02) 0%, rgba(169, 27, 34, 0.06) 100%)', border: '1px solid rgba(169, 27, 34, 0.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Sparkles size={36} color="var(--color-primary)" style={{ animation: 'bounce 2s infinite' }} />
          <h3 className="title-cursive" style={{ fontSize: '2.4rem', margin: '8px 0 0 0' }}>Bilan de la Semaine</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Rétrospective Univers
          </p>
        </div>

        {/* Stats Row */}
        <div className="weekly-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%', marginTop: '0.5rem' }}>
          <div className="stat-card" style={{ padding: '12px 6px', background: 'white', borderRadius: '12px', border: '1px solid rgba(169,27,34,0.05)', boxShadow: 'var(--shadow-sm)' }}>
            <Award size={20} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{stats.weeklyChallenges}</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Défis relevés</p>
          </div>

          <div className="stat-card" style={{ padding: '12px 6px', background: 'white', borderRadius: '12px', border: '1px solid rgba(169,27,34,0.05)', boxShadow: 'var(--shadow-sm)' }}>
            <Image size={20} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{stats.weeklyPhotos}</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Nouveaux souvenirs</p>
          </div>

          <div className="stat-card" style={{ padding: '12px 6px', background: 'white', borderRadius: '12px', border: '1px solid rgba(169,27,34,0.05)', boxShadow: 'var(--shadow-sm)' }}>
            <MessageCircle size={20} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{stats.weeklyMessages}</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Messages échangés</p>
          </div>
        </div>

        {/* Companion words */}
        <div className="weekly-commentary" style={{ backgroundColor: 'white', padding: '15px', borderRadius: '16px', border: '1px dashed rgba(169, 27, 34, 0.2)', fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: '1.5' }}>
          <p style={{ margin: 0, fontStyle: 'italic' }}>{getWeeklyCommentary()}</p>
        </div>
      </div>

      {/* Moments forts list */}
      <div className="weekly-souvenirs-section" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text)', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={18} color="var(--color-primary)" />
          Moments forts de la semaine
        </h3>

        {stats.recentSouvenirs.length === 0 ? (
          <div className="card text-center" style={{ padding: '2rem 1rem' }}>
            <p style={{ margin: 0, color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              Aucun souvenir créé cette semaine. Ajoutez vos photos dans l'onglet Souvenirs pour enrichir votre journal !
            </p>
          </div>
        ) : (
          <div className="recent-souvenirs-list flex-col" style={{ gap: '12px' }}>
            {stats.recentSouvenirs.map((souv) => (
              <div
                key={souv.id}
                className="card souvenir-horizontal-card"
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '10px',
                  alignItems: 'center',
                  border: '1px solid rgba(169,27,34,0.05)'
                }}
              >
                <div
                  className="souv-thumb"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    backgroundImage: `url(${souv.media_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0
                  }}
                />
                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{souv.title}</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                    📍 {souv.location_name} • {new Date(souv.souvenir_date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
