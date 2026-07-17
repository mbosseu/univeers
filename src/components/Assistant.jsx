import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { Sparkles, Send, Copy, ArrowLeft, Loader2, MessageSquare, Heart, RefreshCw, CalendarHeart, History, MapPin } from 'lucide-react';

const CATEGORIES = [
  { id: 'letter', label: 'Lettre d\'amour 📝', prompt: 'Rédige une lettre d\'amour chaleureuse et sincère' },
  { id: 'declaration', label: 'Déclaration 💖', prompt: 'Rédige une déclaration d\'amour passionnée et touchante' },
  { id: 'apology', label: 'S\'excuser 🥺', prompt: 'Rédige un message d\'excuses sincère, doux et constructif' },
  { id: 'birthday', label: 'Anniversaire 🎂', prompt: 'Rédige un vœu d\'anniversaire romantique et attentionné' },
  { id: 'poem', label: 'Poème ✍️', prompt: 'Rédige un court poème romantique en rimes' },
  { id: 'date', label: 'Idées de Date 🗺️', prompt: 'Génère 3 idées originales de rendez-vous amoureux' },
  { id: 'surprise', label: 'Créer une surprise 🎁', prompt: 'Génère 3 idées créatives de petites attentions et surprises' }
];

// Rich fallback templates for instant generation without API key
const TEMPLATES = {
  letter: [
    "Mon amour,\n\nJe voulais prendre un instant pour t'écrire ces quelques mots. Depuis que tu es dans ma vie, chaque jour a une couleur différente, plus lumineuse. Ta présence à mes côtés me donne une force incroyable. Merci d'être la personne extraordinaire que tu es, pour ton rire, ta douceur et ta bienveillance. Je t'aime plus que les mots ne peuvent l'exprimer.\n\nPour toujours à toi.",
    "Mon cœur,\n\nIl y a des moments où je m'arrête et je me rends compte de la chance que j'ai de t'avoir. Tu es mon havre de paix, ma source de joie. Chaque souvenir partagé avec toi est un trésor que je garde précieusement. J'ai hâte de construire tous nos lendemains.\n\nJe t'embrasse fort."
  ],
  declaration: [
    "Je t'aime. Pas seulement pour qui tu es, mais pour qui je suis quand je suis avec toi. Tu es ma plus belle rencontre, ma plus belle évidence. Mon cœur bat pour toi et chaque jour qui passe ne fait que confirmer que ma place est à tes côtés.",
    "Il n'y a pas un jour où je ne remercie pas le destin de nous avoir réunis. Tu es ma boussole, ma plus belle histoire d'amour. Je veux partager mes rires, mes rêves et mes silences avec toi pour toujours."
  ],
  apology: [
    "Je suis sincèrement désolé(e) pour mon comportement. Je m'en veux d'avoir créé cette distance entre nous. Ta sérénité et notre complicité comptent plus que tout pour moi. J'aimerais qu'on en discute calmement pour effacer ce moment. Je t'aime.",
    "Pardon d'avoir été maladroit(e). Je n'ai jamais voulu te blesser. Tu es la personne la plus importante pour moi, et je veux faire les efforts nécessaires pour que tu te sentes respecté(e) et aimé(e). Laisse-moi une chance de me rattraper."
  ],
  birthday: [
    "Joyeux anniversaire mon amour ! En ce jour si spécial, je te souhaite tout le bonheur du monde. Merci d'apporter tant de lumière et de joie dans ma vie. Que cette nouvelle année t'apporte la réussite de tes rêves, et je promets d'être là pour la célébrer avec toi. Je t'aime !",
    "Bon anniversaire à ma personne préférée sur Terre. Chaque année passée à tes côtés est un cadeau précieux. Passe une journée magnifique, je pense fort à toi et j'ai hâte de fêter ça dans tes bras."
  ],
  poem: [
    "Dans le ciel de ma vie, tu es la plus belle étoile,\nQui dissipe l'obscurité et gonfle ma voile.\nTon sourire est ma lumière, ton cœur est mon chemin,\nJe ne rêve que d'une chose : tenir ta main.",
    "Un doux regard, un mot léger,\nDeux cœurs unis pour voyager.\nPrès de toi le temps s'efface,\nPlus rien au monde ne te remplace."
  ],
  date: [
    "1. **Pique-nique sous les étoiles** : Préparez un panier avec des fruits, du fromage et des bougies LED. Installez-vous dans un parc calme ou sur un balcon et observez le ciel en écoutant une playlist douce.\n\n2. **Soirée Musée Virtuel ou Cinéma Rétro** : Choisissez un grand musée proposant une visite 3D en ligne, puis faites une projection d'un vieux film romantique avec du pop-corn fait maison.\n\n3. **Atelier Cuisine à Quatre Mains** : Choisissez une recette d'un pays que vous rêvez de visiter ensemble et cuisinez-la en écoutant la musique locale.",
    "1. **Rendez-vous 'Première Rencontre'** : Recréez l'ambiance de votre tout premier rendez-vous, avec les mêmes vêtements ou le même style de repas, pour revivre le frisson du début.\n\n2. **Spa à la Maison** : Tamisez les lumières, allumez des huiles essentielles et offrez-vous mutuellement des massages avec une musique relaxante.\n\n3. **Balade Mystère** : Lancez une pièce de monnaie à chaque intersection (pile = à droite, face = à gauche) et laissez le hasard décider de votre destination finale."
  ],
  surprise: [
    "1. **Le mot caché** : Cachez un petit mot doux écrit à la main dans son portefeuille, son sac ou son livre du moment pour qu'il/elle le découvre pendant la journée.\n\n2. **Livraison Surprise** : Faites-lui livrer son café préféré ou un petit goûter sur son lieu de travail ou chez lui via une application de livraison.\n\n3. **Playlist Complice** : Créez une playlist secrète de chansons qui vous rappellent des moments passés ensemble et envoyez-lui le lien avec un message doux.",
    "1. **La lettre du futur** : Écrivez une lettre à ouvrir uniquement dans un an, décrivant ce que vous aimez chez lui/elle aujourd'hui.\n\n2. **Bocal à mercis** : Remplissez un petit bocal de papiers pliés contenant chacun une raison pour laquelle vous l'aimez ou un souvenir drôle.\n\n3. **Une soirée sans écrans** : Préparez sa boisson préférée, éteignez tous les téléphones et passez la soirée à discuter de vos rêves communs."
  ]
};

export default function Assistant() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('letter');
  const [customDetails, setCustomDetails] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

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
    
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    setProfile(userProfile);
  }

  // Handle generation using Gemini API (if key is set) or beautiful fallback templates
  const handleGenerate = async () => {
    setGenerating(true);
    setCopied(false);
    setSent(false);

    const apiKey = import.meta.env.PUBLIC_GEMINI_API_KEY;
    const categoryObj = CATEGORIES.find(c => c.id === selectedCategory);
    
    // Craft system prompt
    const basePrompt = `${categoryObj.prompt}.`;
    const detailsPrompt = customDetails.trim() 
      ? ` Intègre les détails suivants fournis par l'utilisateur : "${customDetails.trim()}".`
      : '';
    const fullPrompt = `${basePrompt}${detailsPrompt} Le ton doit être chaleureux, intime et bien écrit. Rédige uniquement le texte demandé sans métadonnées ou bla-bla d'introduction.`;

    if (apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          setGeneratedText(text.trim());
          setGenerating(false);
          return;
        }
      } catch (err) {
        console.warn('Gemini API error, falling back to templates:', err);
      }
    }

    // Fallback: Pick a template based on category
    setTimeout(() => {
      const list = TEMPLATES[selectedCategory];
      const randomText = list[Math.floor(Math.random() * list.length)];
      
      // Inject custom details if possible (simple substitution or appending)
      let finalVal = randomText;
      if (customDetails.trim()) {
        finalVal = `${randomText}\n\n*(Note personnalisée basée sur vos détails : ${customDetails.trim()})*`;
      }
      
      setGeneratedText(finalVal);
      setGenerating(false);
    }, 1000);
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Send to partner as a Sweet Note
  const handleSendToPartner = async () => {
    if (!generatedText.trim() || sending) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from('sweet_notes')
        .insert([{
          couple_id: profile.couple_id,
          sender_id: user.id,
          note_text: `💌 Message généré avec l'aide de l'IA :\n\n${generatedText.trim()}`
        }]);

      if (error) throw error;
      
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div className="couple-info">
          <div className="avatar">🔮</div>
          <div>
            <h2>Assistant d'Amour</h2>
            <p className="days-together">L'IA au service de votre complicité</p>
          </div>
        </div>
        <a href="/dashboard" className="icon-btn" title="Retour à l'Univers">
          🔥
        </a>
      </header>

      <div className="card flex-col" style={{ gap: '1.2rem' }}>
        <div className="tab-intro">
          <h3 className="title-cursive" style={{ fontSize: '2.2rem' }}>Que voulez-vous écrire ?</h3>
          <p>L'assistant vous aide à formuler vos sentiments de manière unique.</p>
        </div>

        {/* Category Picker */}
        <div className="input-group">
          <label>Type d'écrit</label>
          <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setGeneratedText('');
                  setSent(false);
                }}
                className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                style={{
                  padding: '10px 8px',
                  fontSize: '0.85rem',
                  background: selectedCategory === cat.id ? 'rgba(169, 27, 34, 0.1)' : 'var(--color-white)',
                  border: selectedCategory === cat.id ? '1px solid var(--color-primary)' : '1px solid rgba(169, 27, 34, 0.15)',
                  borderRadius: '12px',
                  color: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-text)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  boxShadow: 'none',
                  textAlign: 'center'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Details Input */}
        <div className="input-group">
          <label>Détails / Mots clés (optionnel)</label>
          <textarea
            className="response-textarea"
            value={customDetails}
            onChange={(e) => setCustomDetails(e.target.value)}
            placeholder="Ex: Elle aime les couchers de soleil, on s'est rencontrés à Nice, elle adore le chocolat noir..."
            style={{ minHeight: '60px' }}
          />
        </div>

        {/* Generate Button */}
        <button onClick={handleGenerate} disabled={generating} className="btn submit-btn" style={{ gap: '10px' }}>
          <span>Générer ma suggestion</span>
          {generating ? <Loader2 className="spinner" size={18} /> : <Sparkles size={18} />}
        </button>

        {/* Output Section */}
        {generatedText && (
          <div className="output-section flex-col" style={{ gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(169,27,34,0.1)', paddingTop: '1.5rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={18} color="var(--color-primary)" />
              <span>Suggestion de l'IA (modifiable)</span>
            </h4>

            <textarea
              className="response-textarea"
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              style={{ minHeight: '180px', lineHeight: '1.6', fontSize: '1rem' }}
            />

            <div className="actions-row" style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleCopy} className="btn btn-secondary flex-center" style={{ flex: 1, gap: '6px', fontSize: '0.95rem', padding: '10px' }}>
                <Copy size={16} />
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
              
              <button onClick={handleSendToPartner} disabled={sending || sent} className="btn flex-center" style={{ flex: 1, gap: '6px', fontSize: '0.95rem', padding: '10px' }}>
                <Heart size={16} />
                <span>{sent ? 'Envoyé !' : sending ? 'Envoi...' : 'Envoyer'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

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
        <a href="/capsules" className="nav-item">
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
