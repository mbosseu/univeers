import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { Loader2, User, Heart, Settings as Gear, ShieldAlert, Award, Calendar, Volume2, Moon } from 'lucide-react';

const THEMES = [
  { name: 'Rose Romantique', id: 'theme-romantic', primary: '#a91b22', bg: '#fdf5f5' },
  { name: 'Bleu Nuit', id: 'theme-night', primary: '#0f4c81', bg: '#f0f4f8' },
  { name: 'Crémeux Chaleureux', id: 'theme-warm', primary: '#8d5b4c', bg: '#FAF8F5' }
];

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [couple, setCouple] = useState(null);
  
  // Form states
  const [displayName, setDisplayName] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('theme-romantic');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [availableCouples, setAvailableCouples] = useState([]);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/';
      return;
    }
    setUser(session.user);
    // Load local storage theme
    const activeTheme = localStorage.getItem('univers-theme') || 'theme-romantic';
    setSelectedTheme(activeTheme);
    await loadSettingsData(session.user.id);
  }

  async function loadSettingsData(userId) {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(userProfile);
      setDisplayName(userProfile.display_name || '');

      if (userProfile.couple_id) {
        const { data: coupleDetails } = await supabase
          .from('couples')
          .select('*')
          .eq('id', userProfile.couple_id)
          .single();
        setCouple(coupleDetails);
        if (coupleDetails.anniversary_date) {
          setAnniversaryDate(coupleDetails.anniversary_date);
        }
      }
      
      // Load all couples the user belongs to (multi-partner support)
      const { data: userCouplesList } = await supabase
        .from('user_couples')
        .select('couple_id')
        .eq('user_id', userId);

      let couplesData = [];
      if (userCouplesList && userCouplesList.length > 0) {
        for (const uc of userCouplesList) {
          const { data: partners } = await supabase
            .from('profiles')
            .select('display_name, id')
            .eq('couple_id', uc.couple_id)
            .neq('id', userId);
            
          const partnerName = partners && partners.length > 0 && partners[0].display_name ? partners[0].display_name : 'Partenaire mystère';
          couplesData.push({
            couple_id: uc.couple_id,
            partner_name: partnerName
          });
        }
      }
      setAvailableCouples(couplesData);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (updating) return;
    setUpdating(true);

    try {
      // 1. Update display name
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      // 2. Update anniversary date
      if (couple && anniversaryDate) {
        const { error: coupleErr } = await supabase
          .from('couples')
          .update({ anniversary_date: anniversaryDate })
          .eq('id', couple.id);

        if (coupleErr) throw coupleErr;
      }

      // Apply and save Theme
      localStorage.setItem('univers-theme', selectedTheme);
      applyThemeStyles(selectedTheme);

      alert('Réglages sauvegardés avec succès !');
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setUpdating(false);
    }
  };

  const applyThemeStyles = (themeId) => {
    const root = document.documentElement;
    if (themeId === 'theme-night') {
      root.style.setProperty('--color-primary', '#0f4c81');
      root.style.setProperty('--color-primary-light', '#1a6fa0');
      root.style.setProperty('--color-background', '#f0f4f8');
    } else if (themeId === 'theme-warm') {
      root.style.setProperty('--color-primary', '#8d5b4c');
      root.style.setProperty('--color-primary-light', '#a56f5e');
      root.style.setProperty('--color-background', '#FAF8F5');
    } else {
      root.style.setProperty('--color-primary', '#a91b22');
      root.style.setProperty('--color-primary-light', '#c8232b');
      root.style.setProperty('--color-background', '#fdf5f5');
    }
  };

  const handleSelectTheme = (themeId) => {
    setSelectedTheme(themeId);
    applyThemeStyles(themeId);
  };

  const handleSwitchUniverse = async (e) => {
    const newCoupleId = e.target.value;
    if (newCoupleId === profile?.couple_id) return;
    
    setUpdating(true);
    try {
      await supabase
        .from('profiles')
        .update({ couple_id: newCoupleId })
        .eq('id', user.id);
        
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Erreur lors du changement d'Univers");
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("⚠️ ATTENTION : Êtes-vous sûr(e) de vouloir supprimer votre compte Univers ? Cette action effacera définitivement votre profil, votre couple et tous vos souvenirs partagés.");
    if (!confirm) return;

    setDeleting(true);
    try {
      // Supabase CASCADE rules will clean up profiles/souvenirs if configured,
      // or we can clean up custom rows manually.
      if (couple) {
        // Delete couple (cascades or drops reference)
        await supabase.from('couples').delete().eq('id', couple.id);
      }
      
      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 className="spinner" size={48} color="var(--color-primary)" />
        <p style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>Chargement de vos réglages...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <header className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div className="couple-info">
          <div className="avatar">⚙️</div>
          <div>
            <h2>Réglages & Options</h2>
            <p className="days-together">Gérez votre expérience Univers</p>
          </div>
        </div>
        <a href="/dashboard" className="icon-btn" title="Retour à l'Univers">
          🔥
        </a>
      </header>

      {/* Main settings form */}
      <form onSubmit={handleSaveSettings} className="card flex-col" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 className="title-cursive" style={{ fontSize: '2rem', borderBottom: '1px solid rgba(169,27,34,0.1)', paddingBottom: '8px' }}>Profil & Couple</h3>
        
        {availableCouples.length > 1 && (
          <div className="input-group">
            <label>Univers Actif (Basculez entre vos partenaires)</label>
            <div className="input-with-icon">
              <Heart className="input-icon" size={20} />
              <select 
                className="input-field" 
                value={profile?.couple_id || ''}
                onChange={handleSwitchUniverse}
                disabled={updating}
              >
                {availableCouples.map(c => (
                  <option key={c.couple_id} value={c.couple_id}>
                    Univers avec {c.partner_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: availableCouples.length > 1 ? '-10px' : '0', marginBottom: '10px' }}>
          <a href="/onboarding?action=add_partner" className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
            <Heart size={16} style={{ marginRight: '6px' }} /> Ajouter un partenaire
          </a>
        </div>

        <div className="input-group flex-col" style={{ gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>Votre Nom d'affichage</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(169,27,34,0.15)',
              fontSize: '0.95rem'
            }}
            required
          />
        </div>

        <div className="input-group flex-col" style={{ gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>Date d'anniversaire du couple</label>
          <input
            type="date"
            value={anniversaryDate}
            onChange={(e) => setAnniversaryDate(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(169,27,34,0.15)',
              fontSize: '0.95rem'
            }}
          />
        </div>

        {/* Theme selection */}
        <div className="theme-selection-area flex-col" style={{ gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>Personnalisation (Thème visuel)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectTheme(theme.id)}
                style={{
                  padding: '12px 6px',
                  borderRadius: '12px',
                  border: selectedTheme === theme.id ? '2px solid var(--color-primary)' : '1px solid rgba(0,0,0,0.1)',
                  backgroundColor: theme.bg,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'none'
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: theme.primary }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#333' }}>{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={updating} className="btn flex-center" style={{ width: '100%' }}>
          <span>Sauvegarder les Réglages</span>
          {updating && <Loader2 className="spinner" size={18} />}
        </button>
      </form>

      {/* Quick Links Section */}
      <div className="card flex-col" style={{ gap: '12px', marginBottom: '1.5rem' }}>
        <h3 className="title-cursive" style={{ fontSize: '2rem', borderBottom: '1px solid rgba(169,27,34,0.1)', paddingBottom: '8px' }}>Navigation Rapide</h3>
        
        <a href="/love-languages" className="settings-link-row" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          backgroundColor: 'rgba(169,27,34,0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(169,27,34,0.05)',
          textDecoration: 'none',
          color: 'var(--color-text)'
        }}>
          <Heart size={20} color="var(--color-primary)" />
          <div style={{ flexGrow: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Langages de l'amour</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Remplir le questionnaire</p>
          </div>
          <span>→</span>
        </a>

        <a href="/badges" className="settings-link-row" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          backgroundColor: 'rgba(169,27,34,0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(169,27,34,0.05)',
          textDecoration: 'none',
          color: 'var(--color-text)'
        }}>
          <Award size={20} color="var(--color-primary)" />
          <div style={{ flexGrow: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Badges & Succès</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Voir vos récompenses</p>
          </div>
          <span>→</span>
        </a>

        <a href="/journal" className="settings-link-row" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          backgroundColor: 'rgba(169,27,34,0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(169,27,34,0.05)',
          textDecoration: 'none',
          color: 'var(--color-text)'
        }}>
          <Calendar size={20} color="var(--color-primary)" />
          <div style={{ flexGrow: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Journal Hebdomadaire</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Bilan automatique de la semaine</p>
          </div>
          <span>→</span>
        </a>
      </div>

      {/* Danger Zone */}
      <div className="card flex-col" style={{ gap: '12px', border: '1px solid #c62828', backgroundColor: 'rgba(198, 40, 40, 0.02)' }}>
        <h3 className="title-cursive" style={{ fontSize: '2rem', color: '#c62828', borderBottom: '1px solid rgba(198,40,40,0.1)', paddingBottom: '8px' }}>Zone de Danger</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
          La suppression de compte effacera toutes les données partagées par votre couple. Cette action est irréversible.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="btn btn-secondary flex-center"
          style={{ width: '100%', borderColor: '#c62828', color: '#c62828', backgroundColor: 'transparent' }}
        >
          <ShieldAlert size={18} />
          <span>Supprimer mon Compte & Données</span>
          {deleting && <Loader2 className="spinner" size={18} />}
        </button>
      </div>
    </div>
  );
}
