import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { Sun, Sunset, Moon, Send, Heart, Loader2, Award, CalendarDays } from 'lucide-react';

const ROMANTIC_QUOTES = [
  "Le plus grand bonheur après celui d'aimer, c'est de confesser son amour. - Gide",
  "Aimer, ce n'est pas se regarder l'un l'autre, c'est regarder ensemble dans la même direction. - Saint-Exupéry",
  "Il n'y a qu'un bonheur dans la vie, c'est d'aimer et d'être aimé. - George Sand",
  "Quand on aime quelqu'un, on l'aime tel qu'il est, et non tel qu'on voudrait qu'il soit. - Tolstoï",
  "Si je sais ce qu'est l'amour, c'est grâce à toi. - Hermann Hesse"
];

export default function Rituals() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('morning'); // 'morning', 'noon', 'evening'
  
  // Morning states
  const [quote, setQuote] = useState('');
  const [goalText, setGoalText] = useState('');
  const [goalSaved, setGoalSaved] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  
  // Noon states
  const [sweetNote, setSweetNote] = useState('');
  const [notesList, setNotesList] = useState([]);
  const [sendingNote, setSendingNote] = useState(false);
  
  // Evening states
  const [reflection1, setReflection1] = useState('');
  const [reflection2, setReflection2] = useState('');
  const [reflection3, setReflection3] = useState('');
  const [myReflection, setMyReflection] = useState(null);
  const [partnerReflection, setPartnerReflection] = useState(null);
  const [submittingReflection, setSubmittingReflection] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/';
        return;
      }
      setUser(session.user);
      
      // Auto-set tab based on local time
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setActiveTab('morning');
      } else if (hour >= 12 && hour < 18) {
        setActiveTab('noon');
      } else {
        setActiveTab('evening');
      }

      await loadData(session.user.id);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function loadData(userId) {
    try {
      // 1. Profile & Partner
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
      
      let currentPartner = null;
      if (partners && partners.length > 0) {
        currentPartner = partners[0];
        setPartnerProfile(currentPartner);
      }

      // Random daily quote (stable for the day)
      const day = new Date().getDate();
      setQuote(ROMANTIC_QUOTES[day % ROMANTIC_QUOTES.length]);

      // 2. Fetch Morning Goal for today
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: dailyGoal } = await supabase
        .from('couple_goals')
        .select('*')
        .eq('couple_id', userProfile.couple_id)
        .eq('created_at', todayStr)
        .maybeSingle();

      if (dailyGoal) {
        setGoalText(dailyGoal.goal_text);
        setGoalSaved(true);
      }

      // 3. Fetch Noon Sweet Notes for today
      const { data: notes } = await supabase
        .from('sweet_notes')
        .select('*')
        .eq('couple_id', userProfile.couple_id)
        .order('created_at', { ascending: false });

      if (notes) setNotesList(notes);

      // 4. Fetch Evening Reflections for today
      const { data: myRef } = await supabase
        .from('evening_reflections')
        .select('*')
        .eq('user_id', userId)
        .eq('created_at', todayStr)
        .maybeSingle();

      if (myRef) setMyReflection(myRef);

      if (currentPartner) {
        const { data: partRef } = await supabase
          .from('evening_reflections')
          .select('*')
          .eq('user_id', currentPartner.id)
          .eq('created_at', todayStr)
          .maybeSingle();

        if (partRef) setPartnerReflection(partRef);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading rituals data:', err);
      setLoading(false);
    }
  }

  // Save Morning Goal
  const handleSaveGoal = async () => {
    if (!goalText.trim() || savingGoal) return;
    setSavingGoal(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('couple_goals')
        .insert([{
          couple_id: profile.couple_id,
          creator_id: user.id,
          goal_text: goalText.trim(),
          created_at: todayStr
        }]);

      if (error) throw error;
      
      // Award XP (+10 XP)
      await awardCoupleRewards(10, 5);

      setGoalSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGoal(false);
    }
  };

  // Send Noon Sweet Note
  const handleSendNote = async (e) => {
    e.preventDefault();
    if (!sweetNote.trim() || sendingNote) return;
    setSendingNote(true);
    try {
      const { data: newNote, error } = await supabase
        .from('sweet_notes')
        .insert([{
          couple_id: profile.couple_id,
          sender_id: user.id,
          note_text: sweetNote.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      // Award XP (+5 XP)
      await awardCoupleRewards(5, 5);

      setNotesList(prev => [newNote, ...prev]);
      setSweetNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingNote(false);
    }
  };

  // Submit Evening Reflection
  const handleSendReflection = async (e) => {
    e.preventDefault();
    if (!reflection1.trim() || !reflection2.trim() || !reflection3.trim() || submittingReflection) return;
    setSubmittingReflection(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: myRef, error } = await supabase
        .from('evening_reflections')
        .insert([{
          couple_id: profile.couple_id,
          user_id: user.id,
          answer_1: reflection1.trim(),
          answer_2: reflection2.trim(),
          answer_3: reflection3.trim(),
          created_at: todayStr
        }])
        .select()
        .single();

      if (error) throw error;

      // Award XP (+20 XP)
      await awardCoupleRewards(20, 10);

      setMyReflection(myRef);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReflection(false);
    }
  };

  // Helper to award XP and energy
  async function awardCoupleRewards(xpGained, energyGained) {
    try {
      const { data: currentCouple } = await supabase
        .from('couples')
        .select('flame_xp, flame_energy')
        .eq('id', profile.couple_id)
        .single();

      if (currentCouple) {
        await supabase
          .from('couples')
          .update({
            flame_xp: currentCouple.flame_xp + xpGained,
            flame_energy: Math.min(100, currentCouple.flame_energy + energyGained)
          })
          .eq('id', profile.couple_id);
      }
    } catch (err) {
      console.error('Error awarding rewards:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 className="spinner" size={48} color="var(--color-primary)" />
        <p style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>Chargement de vos rituels...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="couple-info">
          <div className="avatar">🌸</div>
          <div>
            <h2>Rituels du Jour</h2>
            <p className="days-together">Nourrissez votre amour étape par étape</p>
          </div>
        </div>
        <a href="/dashboard" className="icon-btn" title="Retour à l'Univers">
          🔥
        </a>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          onClick={() => setActiveTab('morning')}
          className={`tab-btn ${activeTab === 'morning' ? 'active' : ''}`}
        >
          <Sun size={18} />
          <span>Matin</span>
        </button>
        <button
          onClick={() => setActiveTab('noon')}
          className={`tab-btn ${activeTab === 'noon' ? 'active' : ''}`}
        >
          <Sunset size={18} />
          <span>Midi</span>
        </button>
        <button
          onClick={() => setActiveTab('evening')}
          className={`tab-btn ${activeTab === 'evening' ? 'active' : ''}`}
        >
          <Moon size={18} />
          <span>Soir</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="tab-content" style={{ marginTop: '1.5rem' }}>
        
        {/* MORNING TAB */}
        {activeTab === 'morning' && (
          <div class="card flex-col" style={{ gap: '1.5rem' }}>
            <div className="tab-intro">
              <h3 className="title-cursive" style={{ fontSize: '2.2rem' }}>Bonjour ❤️</h3>
              <p>Commencez la journée avec des pensées positives et un but commun.</p>
            </div>

            <div className="quote-box">
              <span className="quote-icon">“</span>
              <p className="quote-text">{quote}</p>
            </div>

            <div className="goal-box flex-col" style={{ gap: '0.8rem' }}>
              <h4>Objectif complice du jour</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                Définissez un défi amical ou une petite attention à réaliser ensemble aujourd'hui.
              </p>

              {!goalSaved ? (
                <div class="flex-col" style={{ gap: '0.8rem' }}>
                  <input
                    type="text"
                    className="goal-input"
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder="Ex: S'appeler au moins 10 minutes ce soir..."
                  />
                  <button onClick={handleSaveGoal} disabled={savingGoal} className="btn">
                    <span>Valider l'objectif (+10 XP)</span>
                    {savingGoal && <Loader2 className="spinner" size={14} />}
                  </button>
                </div>
              ) : (
                <div className="completed-badge">
                  <Heart size={18} color="#a91b22" />
                  <span>Objectif validé : <strong>{goalText}</strong></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NOON TAB */}
        {activeTab === 'noon' && (
          <div class="card flex-col" style={{ gap: '1.5rem' }}>
            <div className="tab-intro">
              <h3 className="title-cursive" style={{ fontSize: '2.2rem' }}>Midi 🌸</h3>
              <p>« Dis-lui quelque chose de gentil. » Envoyez un mot doux instantané.</p>
            </div>

            <form onSubmit={handleSendNote} className="flex-col" style={{ gap: '0.8rem' }}>
              <textarea
                className="response-textarea"
                value={sweetNote}
                onChange={(e) => setSweetNote(e.target.value)}
                placeholder="Écrivez un mot d'amour spontané..."
                required
                style={{ minHeight: '60px' }}
              />
              <button type="submit" disabled={sendingNote} className="btn">
                <span>Envoyer le mot doux (+5 XP)</span>
                {sendingNote ? <Loader2 className="spinner" size={14} /> : <Send size={14} />}
              </button>
            </form>

            <div className="notes-feed flex-col" style={{ gap: '0.8rem', marginTop: '0.5rem' }}>
              <h4>Mots doux récents</h4>
              {notesList.length === 0 ? (
                <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                  Pas encore de mots doux aujourd'hui. Soyez le premier !
                </p>
              ) : (
                <div className="notes-list">
                  {notesList.map((note) => {
                    const isMe = note.sender_id === user.id;
                    return (
                      <div
                        key={note.id}
                        className={`note-bubble ${isMe ? 'note-me' : 'note-partner'}`}
                      >
                        <strong>{isMe ? 'Vous' : partnerProfile?.display_name || 'Partenaire'} :</strong>
                        <p>{note.note_text}</p>
                        <span className="note-time">
                          {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EVENING TAB */}
        {activeTab === 'evening' && (
          <div class="card flex-col" style={{ gap: '1.5rem' }}>
            <div className="tab-intro">
              <h3 className="title-cursive" style={{ fontSize: '2.2rem' }}>Soir 🌙</h3>
              <p>Prenez un instant pour faire le bilan complice de votre journée.</p>
            </div>

            {!myReflection ? (
              <form onSubmit={handleSendReflection} className="flex-col" style={{ gap: '1.2rem' }}>
                <div className="input-group">
                  <label>1. Quel moment t'a rendu heureux aujourd'hui ?</label>
                  <textarea
                    className="response-textarea"
                    value={reflection1}
                    onChange={(e) => setReflection1(e.target.value)}
                    placeholder="Ma réponse..."
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>2. Qu'apprécies-tu aujourd'hui chez ton partenaire ?</label>
                  <textarea
                    className="response-textarea"
                    value={reflection2}
                    onChange={(e) => setReflection2(e.target.value)}
                    placeholder="Ma réponse..."
                    required
                  />
                </div>

                <div className="input-group">
                  <label>3. Que voudrais-tu vivre ensemble demain ?</label>
                  <textarea
                    className="response-textarea"
                    value={reflection3}
                    onChange={(e) => setReflection3(e.target.value)}
                    placeholder="Ma réponse..."
                    required
                  />
                </div>

                <button type="submit" disabled={submittingReflection} className="btn">
                  <span>Enregistrer mon bilan (+20 XP)</span>
                  {submittingReflection && <Loader2 className="spinner" size={14} />}
                </button>
              </form>
            ) : (
              <div className="reflections-display flex-col" style={{ gap: '1.5rem' }}>
                <div className="completed-badge">
                  <Award size={18} color="#2e7d32" />
                  <span>Votre bilan du jour est enregistré !</span>
                </div>

                {partnerReflection ? (
                  <div className="reflections-comparison">
                    <div className="comparison-row">
                      <h5>1. Moment heureux</h5>
                      <div className="comparison-boxes">
                        <div className="comparison-box me">
                          <strong>Vous :</strong>
                          <p>{myReflection.answer_1}</p>
                        </div>
                        <div className="comparison-box partner">
                          <strong>{partnerProfile?.display_name || 'Partenaire'} :</strong>
                          <p>{partnerReflection.answer_1}</p>
                        </div>
                      </div>
                    </div>

                    <div className="comparison-row">
                      <h5>2. Appréciation mutuelle</h5>
                      <div className="comparison-boxes">
                        <div className="comparison-box me">
                          <strong>Vous :</strong>
                          <p>{myReflection.answer_2}</p>
                        </div>
                        <div className="comparison-box partner">
                          <strong>{partnerProfile?.display_name || 'Partenaire'} :</strong>
                          <p>{partnerReflection.answer_2}</p>
                        </div>
                      </div>
                    </div>

                    <div className="comparison-row">
                      <h5>3. Demain ensemble</h5>
                      <div className="comparison-boxes">
                        <div className="comparison-box me">
                          <strong>Vous :</strong>
                          <p>{myReflection.answer_3}</p>
                        </div>
                        <div className="comparison-box partner">
                          <strong>{partnerProfile?.display_name || 'Partenaire'} :</strong>
                          <p>{partnerReflection.answer_3}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="waiting-box">
                    <p>⏳ Vos réponses sont verrouillées. Elles s'afficheront dès que {partnerProfile?.display_name || 'votre partenaire'} aura aussi soumis son bilan !</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Navigation Bottom */}
      <nav className="bottom-nav">
        <a href="/dashboard" className="nav-item">
          <div className="nav-icon">🔥</div>
          <span>Univers</span>
        </a>
        <a href="/rituals" className="nav-item active">
          <div className="nav-icon"><CalendarHeart /></div>
          <span>Rituels</span>
        </a>
        <a href="/messages" className="nav-item">
          <div className="nav-icon">💬</div>
          <span>Discussion</span>
        </a>
        <a href="/capsules" className="nav-item">
          <div className="nav-icon">⏳</div>
          <span>Capsules</span>
        </a>
        <a href="/souvenirs" className="nav-item">
          <div className="nav-icon"><History /></div>
          <span>Souvenirs</span>
        </a>
      </nav>
    </div>
  );
}
