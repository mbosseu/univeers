import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { Heart, Loader2, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

const QUESTIONS = [
  {
    id: 1,
    text: "Je me sens le plus aimé(e) quand mon partenaire...",
    options: [
      { text: "Me fait des compliments sincères ou m'encourage.", language: "Paroles valorisantes" },
      { text: "Passe du temps de qualité seul à seul avec moi.", language: "Temps de qualité" },
      { text: "M'offre un petit cadeau surprise sans occasion particulière.", language: "Cadeaux" },
      { text: "M'aide spontanément dans mes tâches ou corvées.", language: "Services rendus" },
      { text: "Me prend tendrement dans ses bras ou me tient la main.", language: "Contact physique" }
    ]
  },
  {
    id: 2,
    text: "Pour une soirée de week-end parfaite, je préfère...",
    options: [
      { text: "Discuter longuement autour d'un verre, sans distractions.", language: "Temps de qualité" },
      { text: "Qu'il ou elle prépare mon repas préféré pour me faire plaisir.", language: "Services rendus" },
      { text: "Être blotti(e) ensemble pour regarder un film.", language: "Contact physique" },
      { text: "Entendre des mots doux et des déclarations d'amour.", language: "Paroles valorisantes" },
      { text: "Découvrir un petit objet ou une attention qu'il/elle a acheté pour moi.", language: "Cadeaux" }
    ]
  },
  {
    id: 3,
    text: "Quand je traverse une période difficile, j'ai le plus besoin que mon partenaire...",
    options: [
      { text: "Me rassure avec des mots encourageants et positifs.", language: "Paroles valorisantes" },
      { text: "Soit juste là à m'écouter attentivement.", language: "Temps de qualité" },
      { text: "Me fasse un long massage ou un câlin réconfortant.", language: "Contact physique" },
      { text: "Prenne en charge certaines de mes responsabilités quotidiennes.", language: "Services rendus" },
      { text: "M'apporte des fleurs ou un chocolat pour me remonter le moral.", language: "Cadeaux" }
    ]
  },
  {
    id: 4,
    text: "Qu'est-ce qui vous touche le plus au quotidien ?",
    options: [
      { text: "Qu'il/elle prenne ma voiture pour faire le plein.", language: "Services rendus" },
      { text: "Qu'il/elle écrive un petit mot doux sur le miroir du bain.", language: "Paroles valorisantes" },
      { text: "Un baiser inattendu dans le cou.", language: "Contact physique" },
      { text: "Un souvenir de voyage ou une babiole ramenée d'une course.", language: "Cadeaux" },
      { text: "Une promenade main dans la main le soir.", language: "Temps de qualité" }
    ]
  },
  {
    id: 5,
    text: "Après une séparation de quelques jours, ce qui me comble le plus c'est...",
    options: [
      { text: "Un grand câlin passionné et des baisers à l'aéroport/gare.", language: "Contact physique" },
      { text: "Qu'il/elle me dise 'Tu m'as tellement manqué, je t'aime'.", language: "Paroles valorisantes" },
      { text: "Préparer une vraie soirée retrouvailles à deux.", language: "Temps de qualité" },
      { text: "Découvrir une petite surprise qu'il/elle a préparée.", language: "Cadeaux" },
      { text: "Qu'il/elle ait nettoyé toute la maison avant mon retour.", language: "Services rendus" }
    ]
  }
];

export default function LoveLanguages() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  
  // Quiz states
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

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
    await loadProfiles(session.user.id);
  }

  async function loadProfiles(userId) {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(userProfile);

      if (userProfile.love_language) {
        setQuizCompleted(true);
      }

      const { data: partners } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_id', userProfile.couple_id)
        .neq('id', userId);

      if (partners && partners.length > 0) {
        setPartnerProfile(partners[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  // Handle option select
  const handleOptionSelect = (lang) => {
    const nextAnswers = [...answers, lang];
    setAnswers(nextAnswers);

    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      // Calculate dominant language
      const counts = {};
      let dominant = '';
      let maxCount = 0;

      nextAnswers.forEach(ans => {
        counts[ans] = (counts[ans] || 0) + 1;
        if (counts[ans] > maxCount) {
          maxCount = counts[ans];
          dominant = ans;
        }
      });

      saveResult(dominant);
    }
  };

  // Save result to profile
  const saveResult = async (language) => {
    setSavingResult(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ love_language: language })
        .eq('id', user.id);

      if (error) throw error;

      // Award XP (+25 XP)
      const { data: couple } = await supabase
        .from('couples')
        .select('flame_xp, flame_energy')
        .eq('id', profile.couple_id)
        .single();

      if (couple) {
        await supabase
          .from('couples')
          .update({
            flame_xp: couple.flame_xp + 25,
            flame_energy: Math.min(100, couple.flame_energy + 10)
          })
          .eq('id', profile.couple_id);
      }

      setProfile(prev => ({ ...prev, love_language: language }));
      setQuizCompleted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingResult(false);
    }
  };

  const handleRetake = () => {
    setAnswers([]);
    setCurrentQuestionIdx(0);
    setQuizCompleted(false);
    setQuizStarted(true);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 className="spinner" size={48} color="var(--color-primary)" />
        <p style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>Chargement du questionnaire...</p>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentQuestionIdx];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div className="couple-info">
          <div className="avatar">💖</div>
          <div>
            <h2>Langages de l'amour</h2>
            <p className="days-together">Découvrez comment vous vous sentez aimés</p>
          </div>
        </div>
        <a href="/dashboard" className="icon-btn" title="Retour à l'Univers">
          🔥
        </a>
      </header>

      {!quizStarted && !quizCompleted && (
        <div className="card text-center flex-col" style={{ padding: '3rem 1.5rem', gap: '1rem' }}>
          <Heart size={48} color="var(--color-primary)" style={{ alignSelf: 'center', animation: 'pulse 1.5s infinite alternate' }} />
          <h3 className="title-cursive" style={{ fontSize: '2.2rem' }}>Quel est votre langage ?</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-light)', lineHeight: '1.5' }}>
            Selon la psychologie de couple, il existe 5 langages principaux pour exprimer et ressentir l'amour. Remplissez ce questionnaire pour révéler le vôtre et comprendre celui de votre partenaire.
          </p>
          <button onClick={() => setQuizStarted(true)} className="btn flex-center" style={{ gap: '6px', margin: '1rem auto 0 auto' }}>
            <span>Commencer le Quiz (5 questions)</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {quizStarted && !quizCompleted && (
        <div className="card flex-col" style={{ gap: '1.5rem' }}>
          <div className="quiz-progress" style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontWeight: 700 }}>
            Question {currentQuestion.id} sur {QUESTIONS.length}
            <div className="progress-bar" style={{ width: '100%', height: '4px', backgroundColor: 'rgba(169, 27, 34, 0.1)', borderRadius: '2px', marginTop: '6px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${(currentQuestion.id / QUESTIONS.length) * 100}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }}
              ></div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text)', lineHeight: '1.4' }}>{currentQuestion.text}</h3>

          <div className="options-list flex-col" style={{ gap: '10px' }}>
            {currentQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(opt.language)}
                className="option-select-btn"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid rgba(169, 27, 34, 0.15)',
                  color: 'var(--color-text)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  lineHeight: '1.4'
                }}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {quizCompleted && (
        <div className="card flex-col" style={{ gap: '1.5rem' }}>
          <div className="text-center">
            <CheckCircle size={48} color="#2e7d32" style={{ alignSelf: 'center', marginBottom: '8px' }} />
            <h3 className="title-cursive" style={{ fontSize: '2.5rem' }}>Votre profil amoureux</h3>
          </div>

          <div className="result-box text-center" style={{ backgroundColor: 'rgba(169, 27, 34, 0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(169, 27, 34, 0.1)' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-light)', fontWeight: 600 }}>Votre langage de l'amour dominant :</p>
            <h2 style={{ margin: '8px 0', color: 'var(--color-primary)', fontSize: '2rem', fontWeight: 800 }}>{profile?.love_language}</h2>
            
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-light)', lineHeight: '1.5', marginTop: '0.5rem' }}>
              {profile?.love_language === 'Paroles valorisantes' && 'Vous vous sentez particulièrement aimé(e) lorsque votre partenaire vous adresse des mots encourageants, des compliments ou de doux messages.'}
              {profile?.love_language === 'Temps de qualité' && 'Le temps passé à deux, sans distractions ni écrans, est le moyen le plus fort de remplir votre réservoir émotionnel.'}
              {profile?.love_language === 'Cadeaux' && 'Pour vous, les cadeaux sont le symbole visible de la pensée attentionnée et du soin apporté par votre partenaire.'}
              {profile?.love_language === 'Services rendus' && 'Les actes de service, l\'aide spontanée au quotidien, sont les preuves d\'amour les plus concrètes pour vous.'}
              {profile?.love_language === 'Contact physique' && 'Les câlins, les baisers, le contact des mains et la proximité physique sont votre moyen d\'expression privilégié.'}
            </p>
          </div>

          {/* Partner display */}
          <div className="partner-result-box" style={{ borderTop: '1px solid rgba(169,27,34,0.1)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--color-text)' }}>Profil de {partnerProfile?.display_name || 'votre partenaire'}</h4>
            {partnerProfile?.love_language ? (
              <div className="partner-result-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(46, 125, 50, 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(46, 125, 50, 0.1)' }}>
                <Sparkles size={20} color="#2e7d32" />
                <span style={{ fontSize: '1rem', color: '#2e7d32', fontWeight: 600 }}>
                  Langage dominant : <strong>{partnerProfile.love_language}</strong>
                </span>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                ⏳ {partnerProfile?.display_name || 'Votre partenaire'} n'a pas encore rempli le questionnaire.
              </p>
            )}
          </div>

          <button onClick={handleRetake} className="btn btn-secondary" style={{ margin: '1rem auto 0 auto', width: 'auto' }}>
            Refaire le questionnaire
          </button>
        </div>
      )}
    </div>
  );
}
