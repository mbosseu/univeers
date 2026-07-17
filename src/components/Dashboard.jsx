import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import Flame from './Flame.jsx';
import { Settings, CalendarHeart, MessageCircleHeart, Gamepad2, History, Send, Smile, Heart, Award, Loader2, Calendar, Sparkles, MapPin, Plus } from 'lucide-react';

const MOODS = [
  { label: 'Super 💖', value: '💖' },
  { label: 'Bien 😊', value: '😊' },
  { label: 'Fatigué(e) 😴', value: '😴' },
  { label: 'Triste 🥺', value: '🥺' },
  { label: 'Stressé(e) 🤯', value: '🤯' }
];

const CITATIONS = [
  "Le plus beau voyage, c'est celui qu'on n'a pas encore fait ensemble.",
  "Aimer, c'est savoir dire je t'aime sans parler.",
  "À deux, la vie est une aventure merveilleuse.",
  "Chaque seconde près de toi est une éternité de douceur.",
  "Ton amour est le soleil qui illumine mon Univers."
];

const TOUR_STEPS = [
  {
    title: "Bienvenue sur Univers ! ❤️🔥",
    desc: "Votre sanctuaire d'amour à deux. Faisons un petit tour pour découvrir les boutons clés de votre espace complice.",
    target: "body"
  },
  {
    title: "La Flamme Centrale ❤️🔥",
    desc: "C'est le cœur d'Univers. Complétez des défis, répondez à la question du soir ou envoyez des souvenirs pour faire grimper son XP et déverrouiller des effets magiques (jusqu'au niveau 6 !).",
    target: ".flame-section"
  },
  {
    title: "L'Assistant d'Amour 🔮",
    desc: "En manque d'inspiration ? Cliquez sur la boule de cristal pour générer des poèmes, lettres d'amour, excuses sincères ou des idées de rendez-vous en un clic avec l'IA Gemini.",
    target: ".icon-btn[href='/assistant']"
  },
  {
    title: "Le Menu Complice 📱",
    desc: "Naviguez facilement entre votre Univers (🔥), vos Rituels quotidiens (🌸), la Discussion de couple avec messages secrets (💬), vos Capsules temporelles (⏳) et votre Album photo géolocalisé (📸).",
    target: ".bottom-nav"
  },
  {
    title: "Réglages & Thèmes ⚙️",
    desc: "Cliquez sur l'engrenage pour changer de thème visuel (Rose, Bleu ou Crème), passer le quiz des Langages de l'amour, et consulter vos Badges de succès déverrouillés !",
    target: ".icon-btn[href='/settings']"
  }
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [couple, setCouple] = useState(null);
  
  // Daily content states
  const [question, setQuestion] = useState(null);
  const [myResponse, setMyResponse] = useState('');
  const [hasAnsweredQuestion, setHasAnsweredQuestion] = useState(false);
  const [partnerResponseText, setPartnerResponseText] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  
  const [challenge, setChallenge] = useState(null);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [submittingChallenge, setSubmittingChallenge] = useState(false);

  // V1.1 Additional States
  const [citation, setCitation] = useState('');
  const [lastSouvenir, setLastSouvenir] = useState(null);
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [myMood, setMyMood] = useState('');

  // V1.2 Tour & Install States
  const [tourStep, setTourStep] = useState(-1);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosInstallTip, setShowIosInstallTip] = useState(false);

  const channelRef = useRef([]);

  useEffect(() => {
    checkUser();

    // Check if tour should run
    const tourDone = localStorage.getItem('univers-tour-done');
    if (!tourDone) {
      setTourStep(0);
    }

    // PWA Install listeners
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Detect iOS Outside Standalone
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window).MSStream;
    const isStandalone = (window.navigator).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isIos && !isStandalone) {
      setShowIosInstallTip(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      channelRef.current.forEach(c => supabase.removeChannel(c));
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
      await fetchDashboardData(session.user.id);
    } catch (err) {
      console.error('Error in auth check:', err);
      setLoading(false);
    }
  }

  async function fetchDashboardData(userId) {
    try {
      // 1. Fetch current profile
      const { data: userProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!userProfile || !userProfile.couple_id) {
        window.location.href = '/onboarding';
        return;
      }
      setProfile(userProfile);

      // 2. Fetch couple details
      const { data: coupleDetails, error: coupleErr } = await supabase
        .from('couples')
        .select('*')
        .eq('id', userProfile.couple_id)
        .single();

      if (coupleErr) throw coupleErr;
      setCouple(coupleDetails);

      // 3. Fetch partner profile
      const { data: partners, error: partnerErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_id', userProfile.couple_id)
        .neq('id', userId);

      if (partnerErr) throw partnerErr;
      let currentPartner = null;
      if (partners && partners.length > 0) {
        currentPartner = partners[0];
        setPartnerProfile(currentPartner);
      }

      // Determine client's mood based on alphabetical ID order
      if (currentPartner) {
        const isP1 = userId < currentPartner.id;
        setMyMood(isP1 ? coupleDetails.mood_p1 : coupleDetails.mood_p2);
      }

      // 4. Fetch daily content (Question)
      const { data: questions } = await supabase
        .from('daily_questions')
        .select('*')
        .limit(1);

      if (questions && questions.length > 0) {
        const dailyQ = questions[0];
        setQuestion(dailyQ);

        // Fetch my response
        const { data: myResp } = await supabase
          .from('daily_responses')
          .select('*')
          .eq('question_id', dailyQ.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (myResp) {
          setHasAnsweredQuestion(true);
          setMyResponse(myResp.response_text);
        }

        // Fetch partner response
        if (currentPartner) {
          const { data: partnerResp } = await supabase
            .from('daily_responses')
            .select('*')
            .eq('question_id', dailyQ.id)
            .eq('user_id', currentPartner.id)
            .maybeSingle();

          if (partnerResp) {
            setPartnerResponseText(partnerResp.response_text);
          }
        }
      }

      // 5. Fetch daily content (Challenge)
      const { data: quests } = await supabase
        .from('quests')
        .select('*')
        .limit(1);

      if (quests && quests.length > 0) {
        const dailyCh = quests[0];
        setChallenge(dailyCh);

        // Check if completed today by couple
        const { data: attempt } = await supabase
          .from('quest_attempts')
          .select('*')
          .eq('quest_id', dailyCh.id)
          .eq('couple_id', userProfile.couple_id)
          .maybeSingle();

        if (attempt) {
          setChallengeCompleted(true);
        }
      }

      // 6. Fetch Last Souvenir
      const { data: lastSouv } = await supabase
        .from('souvenirs')
        .select('*')
        .eq('couple_id', userProfile.couple_id)
        .order('souvenir_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastSouv) setLastSouvenir(lastSouv);

      // 7. Fetch Couple Events
      const { data: coupleEvts } = await supabase
        .from('couple_events')
        .select('*')
        .eq('couple_id', userProfile.couple_id)
        .order('event_date', { ascending: true });
      if (coupleEvts) setEvents(coupleEvts);

      // 8. Set Citation du Jour
      const day = new Date().getDate();
      setCitation(CITATIONS[day % CITATIONS.length]);

      // Realtime subscriptions for auto-refreshing dashboard
      if (userProfile.couple_id) {
        // Clean existing channels
        channelRef.current.forEach(c => supabase.removeChannel(c));
        channelRef.current = [];

        // 1. Couple updates (mood, xp, energy)
        const coupleChannel = supabase
          .channel('dashboard_couple_realtime')
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'couples',
            filter: `id=eq.${userProfile.couple_id}`
          }, (payload) => {
            setCouple(payload.new);
            if (currentPartner) {
              const isP1 = userId < currentPartner.id;
              setMyMood(isP1 ? payload.new.mood_p1 : payload.new.mood_p2);
            }
          })
          .subscribe();

        // 2. Daily responses updates (partner answers daily question)
        const responseChannel = supabase
          .channel('dashboard_responses_realtime')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'daily_responses',
            filter: `couple_id=eq.${userProfile.couple_id}`
          }, (payload) => {
            if (payload.new.user_id !== userId) {
              setPartnerResponseText(payload.new.response_text);
            }
          })
          .subscribe();

        // 3. Quest attempts updates (partner completes a challenge)
        const questChannel = supabase
          .channel('dashboard_quests_realtime')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'quest_attempts',
            filter: `couple_id=eq.${userProfile.couple_id}`
          }, (payload) => {
            setChallengeCompleted(true);
          })
          .subscribe();

        channelRef.current = [coupleChannel, responseChannel, questChannel];
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  }

  // Handle Mood change
  const handleMoodSelect = async (mood) => {
    if (!partnerProfile || !couple) return;
    setMyMood(mood);
    try {
      const isP1 = user.id < partnerProfile.id;
      const updateData = isP1 ? { mood_p1: mood } : { mood_p2: mood };
      
      const { error } = await supabase
        .from('couples')
        .update(updateData)
        .eq('id', profile.couple_id);

      if (error) throw error;
      setCouple(prev => ({ ...prev, ...updateData }));
    } catch (err) {
      console.error('Error updating mood:', err);
    }
  };

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleNextTourStep = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(prev => prev + 1);
    } else {
      handleCompleteTour();
    }
  };

  const handleCompleteTour = () => {
    setTourStep(-1);
    localStorage.setItem('univers-tour-done', 'true');
  };

  // Add Event Handler
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate || submittingEvent) return;

    setSubmittingEvent(true);
    try {
      const { data: newEvt, error } = await supabase
        .from('couple_events')
        .insert([{
          couple_id: profile.couple_id,
          title: eventTitle.trim(),
          event_date: eventDate
        }])
        .select()
        .single();

      if (error) throw error;
      setEvents(prev => [...prev, newEvt].sort((a,b) => new Date(a.event_date) - new Date(b.event_date)));
      setEventTitle('');
      setEventDate('');
      setShowEventModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingEvent(false);
    }
  };

  // Calculate Level based on XP
  const getFlameLevel = (xp) => {
    if (xp >= 1500) return 6;
    if (xp >= 1000) return 5;
    if (xp >= 600) return 4;
    if (xp >= 300) return 3;
    if (xp >= 100) return 2;
    return 1;
  };

  const getLevelName = (level) => {
    switch (level) {
      case 1: return 'Étincelle 🕯️';
      case 2: return 'Flamme 🔥';
      case 3: return 'Brasier ❤️';
      case 4: return 'Diamant 💎';
      case 5: return 'Âmes sœurs 👑';
      case 6: return 'Légende ✨';
      default: return 'Flamme';
    }
  };

  // Submit Answer to Daily Question
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!myResponse.trim() || submittingAnswer || !question) return;

    setSubmittingAnswer(true);
    try {
      const { error: insertErr } = await supabase
        .from('daily_responses')
        .insert([{
          question_id: question.id,
          user_id: user.id,
          couple_id: profile.couple_id,
          response_text: myResponse.trim()
        }]);

      if (insertErr) throw insertErr;

      const newXp = couple.flame_xp + 15;
      const newEnergy = Math.min(100, couple.flame_energy + 10);

      const { error: updateErr } = await supabase
        .from('couples')
        .update({ flame_xp: newXp, flame_energy: newEnergy })
        .eq('id', profile.couple_id);

      if (updateErr) throw updateErr;

      setCouple(prev => ({ ...prev, flame_xp: newXp, flame_energy: newEnergy }));
      setHasAnsweredQuestion(true);
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Complete Daily Challenge
  const handleCompleteChallenge = async () => {
    if (challengeCompleted || submittingChallenge || !challenge) return;

    setSubmittingChallenge(true);
    try {
      const { error: insertErr } = await supabase
        .from('quest_attempts')
        .insert([{
          quest_id: challenge.id,
          couple_id: profile.couple_id,
          completed_by_user_id: user.id
        }]);

      if (insertErr) throw insertErr;

      const newXp = couple.flame_xp + challenge.xp_reward;
      const newEnergy = Math.min(100, couple.flame_energy + challenge.energy_reward);

      const { error: updateErr } = await supabase
        .from('couples')
        .update({ flame_xp: newXp, flame_energy: newEnergy })
        .eq('id', profile.couple_id);

      if (updateErr) throw updateErr;

      setCouple(prev => ({ ...prev, flame_xp: newXp, flame_energy: newEnergy }));
      setChallengeCompleted(true);
    } catch (err) {
      console.error('Error completing challenge:', err);
    } finally {
      setSubmittingChallenge(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 className="spinner" size={48} color="var(--color-primary)" />
        <p style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>Connexion à votre Univers...</p>
      </div>
    );
  }

  const daysTogether = couple
    ? Math.ceil(Math.abs(new Date().getTime() - new Date(couple.anniversary_date || couple.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const currentLevel = couple ? getFlameLevel(couple.flame_xp) : 1;
  const isP1 = partnerProfile ? user.id < partnerProfile.id : true;
  const partnerMood = partnerProfile && couple 
    ? (isP1 ? couple.mood_p2 : couple.mood_p1)
    : null;

  const nextEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="couple-info">
          <div className="avatar">💑</div>
          <div>
            <h2>{profile?.display_name} & {partnerProfile?.display_name || 'Partenaire'}</h2>
            <p className="days-together">{daysTogether} jours ensemble</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/assistant" className="icon-btn" title="Assistant d'Amour" style={{ fontSize: '1.2rem', textDecoration: 'none' }}>
            🔮
          </a>
          <a href="/settings" className="icon-btn" title="Réglages" style={{ display: 'flex', alignItems: 'center' }}>
            <Settings size={24} color="var(--color-primary)" />
          </a>
        </div>
      </header>

      {/* PWA Banners */}
      {showInstallPrompt && (
        <div className="pwa-install-banner flex-center" style={{ gap: '10px', padding: '10px 14px', background: 'var(--color-primary)', color: 'white', borderRadius: '12px', marginBottom: '1.5rem', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Installer Univers sur votre écran d'accueil !</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={triggerInstall} className="btn-small" style={{ background: 'white', color: 'var(--color-primary)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: 'none' }}>Installer</button>
            <button onClick={() => setShowInstallPrompt(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', padding: 0, boxShadow: 'none' }}>&times;</button>
          </div>
        </div>
      )}

      {showIosInstallTip && (
        <div className="pwa-install-banner flex-col" style={{ gap: '6px', padding: '12px 14px', background: 'rgba(169, 27, 34, 0.05)', border: '1px solid rgba(169, 27, 34, 0.1)', color: 'var(--color-text)', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--color-primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Installer sur votre iPhone</span>
            </div>
            <button onClick={() => setShowIosInstallTip(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-light)', fontSize: '1.2rem', cursor: 'pointer', padding: 0, boxShadow: 'none' }}>&times;</button>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
            Appuyez sur le bouton de partage <strong style={{fontSize:'1.1rem'}}>📤</strong> en bas de Safari, puis faites défiler et sélectionnez <strong style={{color:'var(--color-primary)'}}>➕ Sur l'écran d'accueil</strong>.
          </p>
        </div>
      )}

      {/* Mood Section */}
      <div className="card mood-card" style={{ marginBottom: '1.5rem', padding: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text)' }}>Mon humeur</h4>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleMoodSelect(m.value)}
                  className={`mood-select-btn ${myMood === m.value ? 'active' : ''}`}
                  style={{
                    padding: '6px 8px',
                    fontSize: '1.2rem',
                    background: myMood === m.value ? 'rgba(169, 27, 34, 0.08)' : 'transparent',
                    border: myMood === m.value ? '1px solid var(--color-primary)' : '1px solid transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                >
                  {m.value}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(169,27,34,0.1)', paddingLeft: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text)' }}>Humeur de {partnerProfile?.display_name || 'mon amour'}</h4>
            <div style={{ fontSize: '2rem', marginTop: '4px', textAlign: 'center' }}>
              {partnerMood || '❔'}
            </div>
          </div>
        </div>
      </div>

      {/* Flame Section */}
      <div className="flame-section">
        <Flame level={currentLevel} energy={couple?.flame_energy || 50} />
        <h3 className="flame-title title-cursive">{getLevelName(currentLevel)}</h3>
        <p className="flame-subtitle">XP de votre Univers : {couple?.flame_xp} XP</p>
      </div>

      {/* Citation du Jour */}
      <div className="card citation-card-widget" style={{ marginBottom: '1.5rem', textAlign: 'center', fontStyle: 'italic', color: 'var(--color-text-light)', borderLeft: '4px solid var(--color-primary)', padding: '12px 20px' }}>
        <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>« {citation} »</p>
      </div>

      {/* Cards Grid */}
      <div className="cards-grid">
        {/* Question of the Day Card */}
        {question && (
          <div className="card action-card">
            <div className="card-header-icon">
              <MessageCircleHeart color="var(--color-primary)" size={24} />
              <h4>Question du jour</h4>
            </div>
            <p className="question-text">« {question.question_text} »</p>
            
            {!hasAnsweredQuestion ? (
              <form onSubmit={handleAnswerSubmit} style={{ width: '100%', marginTop: '0.5rem' }}>
                <textarea
                  className="response-textarea"
                  value={myResponse}
                  onChange={(e) => setMyResponse(e.target.value)}
                  placeholder="Écrivez votre réponse secrète ici..."
                  required
                />
                <button type="submit" disabled={submittingAnswer} className="btn btn-small btn-submit-response">
                  <span>Envoyer</span>
                  {submittingAnswer ? <Loader2 className="spinner" size={14} /> : <Send size={14} />}
                </button>
              </form>
            ) : (
              <div className="responses-display" style={{ width: '100%' }}>
                <div className="my-response-box">
                  <strong>Votre réponse :</strong>
                  <p>{myResponse}</p>
                </div>
                
                <div className="partner-response-box">
                  <strong>Réponse de {partnerProfile?.display_name || 'votre partenaire'} :</strong>
                  {partnerResponseText ? (
                    <p>{partnerResponseText}</p>
                  ) : (
                    <p className="waiting-text">⏳ En attente de sa réponse pour la révéler...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Challenge of the Day Card */}
        {challenge && (
          <div className="card action-card">
            <div className="card-header-icon">
              <Gamepad2 color="var(--color-primary)" size={24} />
              <h4>Défi du jour</h4>
            </div>
            <p className="challenge-title"><strong>{challenge.title}</strong></p>
            <p className="challenge-desc">{challenge.description}</p>
            
            {!challengeCompleted ? (
              <button onClick={handleCompleteChallenge} disabled={submittingChallenge} className="btn btn-small">
                <span>Relever le défi (+{challenge.xp_reward} XP)</span>
                {submittingChallenge && <Loader2 className="spinner" size={14} />}
              </button>
            ) : (
              <div className="completed-badge">
                <Award size={18} color="#2e7d32" />
                <span>Défi complété aujourd'hui !</span>
              </div>
            )}
          </div>
        )}

        {/* Upcoming Event Card */}
        <div className="card action-card">
          <div className="card-header-icon" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar color="var(--color-primary)" size={24} />
              <h4>Événement à venir</h4>
            </div>
            <button onClick={() => setShowEventModal(true)} className="icon-btn" style={{ padding: '2px' }} title="Ajouter une date">
              <Plus size={16} color="var(--color-primary)" />
            </button>
          </div>
          {nextEvent ? (
            <div style={{ width: '100%' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)' }}>{nextEvent.title}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                {new Date(nextEvent.event_date).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Aucune date importante enregistrée.</p>
          )}
        </div>

        {/* Last Souvenir Card */}
        {lastSouvenir && (
          <div className="card souvenir-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              className="souvenir-image"
              style={{ backgroundImage: `url(${lastSouvenir.media_url})`, height: '120px' }}
            />
            <div style={{ padding: '12px' }}>
              <h5 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>Dernier Souvenir</h5>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--color-text)' }}>{lastSouvenir.title}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{lastSouvenir.location_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ padding: '2rem 1.5rem', maxWidth: '400px' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2 className="title-cursive" style={{ fontSize: '2.2rem' }}>Ajouter une date</h2>
              <button onClick={() => setShowEventModal(false)} className="close-btn">&times;</button>
            </div>

            <form onSubmit={handleAddEvent} className="auth-form" style={{ gap: '1.2rem' }}>
              <div className="input-group">
                <label>Nom de l'événement</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ex: Notre anniversaire, Prochain voyage..."
                  required
                />
              </div>

              <div className="input-group">
                <label>Date de l'événement</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={submittingEvent} className="btn submit-btn">
                <span>Enregistrer</span>
                {submittingEvent && <Loader2 className="spinner" size={18} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Bottom */}
      <nav className="bottom-nav">
        <a href="/dashboard" className="nav-item active">
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
        <a href="/capsules" className="nav-item">
          <div className="nav-icon">⏳</div>
          <span>Capsules</span>
        </a>
        <a href="/souvenirs" className="nav-item">
          <div className="nav-icon"><History /></div>
          <span>Souvenirs</span>
        </a>
      
        <a href="/location" className={"nav-item" + ((typeof window !== 'undefined' ? window.location.pathname : '') === '/location' ? ' active' : '')}>
          <div className="nav-icon"><MapPin /></div>
          <span>Position</span>
        </a>
      </nav>

      {/* Guided Tour Overlay */}
      {tourStep >= 0 && tourStep < TOUR_STEPS.length && (
        <div className="tour-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div className="tour-card card animate-pop" style={{
            maxWidth: '360px',
            width: '100%',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(169, 27, 34, 0.1)',
            background: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Guide Univers ({tourStep + 1} / {TOUR_STEPS.length})
              </span>
              <button onClick={handleCompleteTour} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, boxShadow: 'none' }}>
                Ignorer
              </button>
            </div>

            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text)', fontWeight: 700 }}>
              {TOUR_STEPS[tourStep].title}
            </h3>
            
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.5' }}>
              {TOUR_STEPS[tourStep].desc}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {TOUR_STEPS.map((_, idx) => (
                  <div key={idx} style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: idx === tourStep ? 'var(--color-primary)' : 'rgba(0,0,0,0.1)',
                    transition: 'background-color 0.2s'
                  }} />
                ))}
              </div>
              
              <button onClick={handleNextTourStep} className="btn btn-small" style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem' }}>
                <span>{tourStep === TOUR_STEPS.length - 1 ? 'Terminer' : 'Suivant'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
