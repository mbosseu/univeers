import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { Image, MapPin, Calendar, Heart, Plus, Loader2, Smile, Compass, CalendarHeart, History } from 'lucide-react';

const EMOTIONS = [
  { label: 'Heureux 😊', emoji: '😊' },
  { label: 'Amoureux ❤️', emoji: '❤️' },
  { label: 'Amusé 😂', emoji: '😂' },
  { label: 'Paisible ☕', emoji: '☕' },
  { label: 'Festif 🎉', emoji: '🎉' }
];

// Fallback Unsplash image URLs based on emotion
const PLACEHOLDER_IMAGES = {
  '😊': 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
  '❤️': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop',
  '😂': 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=600&auto=format&fit=crop',
  '☕': 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=600&auto=format&fit=crop',
  '🎉': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600&auto=format&fit=crop'
};

export default function Souvenirs() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [souvenirs, setSouvenirs] = useState([]);
  
  // Modal & Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [souvenirDate, setSouvenirDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmotion, setSelectedEmotion] = useState('❤️');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingSouvenir, setViewingSouvenir] = useState(null);
  const [editingSouvenir, setEditingSouvenir] = useState(null);

  const channelRef = useRef(null);

  useEffect(() => {
    checkUser();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Map initialization inside React
  useEffect(() => {
    // Make sure Leaflet script is loaded and we have souvenirs
    if (typeof window !== 'undefined' && window.L && souvenirs.length > 0) {
      const mapContainer = document.getElementById('souvenirs-map');
      if (mapContainer) {
        // Clean old map if exists
        if (window.souvenirsMap) {
          window.souvenirsMap.remove();
        }

        // Find center of souvenirs
        const validCoords = souvenirs.filter(s => s.latitude && s.longitude);
        const center = validCoords.length > 0 
          ? [validCoords[0].latitude, validCoords[0].longitude]
          : [46.2276, 2.2137]; // Center of France

        const map = window.L.map('souvenirs-map').setView(center, 5);
        window.souvenirsMap = map;

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        validCoords.forEach(s => {
          const markerIcon = window.L.divIcon({
            html: `<div style="font-size: 24px; text-align: center;">📍</div>`,
            className: 'custom-pin',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          });

          window.L.marker([s.latitude, s.longitude], { icon: markerIcon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family: sans-serif; text-align: center;">
                <b>${s.title}</b><br/>
                <span style="font-size: 11px; color: #795548;">${s.location_name || ''}</span><br/>
                <span style="font-size: 16px;">${s.description?.substring(0, 50) || ''}</span>
              </div>
            `);
        });
      }
    }
  }, [souvenirs]);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/';
        return;
      }
      setUser(session.user);
      await fetchSouvenirs(session.user.id);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function fetchSouvenirs(userId) {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      setProfile(userProfile);

      if (userProfile.couple_id) {
        const { data: list, error } = await supabase
          .from('souvenirs')
          .select('*')
          .eq('couple_id', userProfile.couple_id)
          .order('souvenir_date', { ascending: false });

        if (error) throw error;
        setSouvenirs(list || []);

        // Abonnement temps réel pour synchroniser les souvenirs
        if (channelRef.current) supabase.removeChannel(channelRef.current);
        const channel = supabase
          .channel('souvenirs_realtime')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'souvenirs',
            filter: `couple_id=eq.${userProfile.couple_id}`
          }, (payload) => {
            if (payload.eventType === 'INSERT') {
              setSouvenirs(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'DELETE') {
              setSouvenirs(prev => prev.filter(s => s.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
              setSouvenirs(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
            }
          })
          .subscribe();
        channelRef.current = channel;
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching souvenirs:', err);
      setLoading(false);
    }
  }

  // Handle Photo selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleEditClick = (souvenir) => {
    setEditingSouvenir(souvenir);
    setTitle(souvenir.title);
    setDescription(souvenir.description || '');
    setLocationName(souvenir.location_name || '');
    setSouvenirDate(souvenir.souvenir_date ? souvenir.souvenir_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setSelectedEmotion('❤️'); 
    setShowAddForm(true);
    setViewingSouvenir(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce souvenir ?')) return;
    try {
      const { error } = await supabase.from('souvenirs').delete().eq('id', id);
      if (error) throw error;
      setSouvenirs(prev => prev.filter(s => s.id !== id));
      setViewingSouvenir(null);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression.');
    }
  };

  // Compress image to a smaller base64 data URL
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = (h * maxWidth) / w;
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Add Souvenir Handler
  const handleAddSouvenir = async (e) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      let imageUrl = PLACEHOLDER_IMAGES[selectedEmotion];

      // If user uploaded a photo, try to upload to Supabase Storage
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${profile.couple_id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('souvenir-media')
          .upload(filePath, imageFile);

        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage
            .from('souvenir-media')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        } else {
          console.warn('Storage upload error (using base64 fallback):', uploadErr);
          imageUrl = await compressImage(imageFile);
        }
      }

      // Geocoding simple mock coords based on location name or random near France
      let lat = 46.2276 + (Math.random() - 0.5) * 2;
      let lng = 2.2137 + (Math.random() - 0.5) * 2;
      if (locationName.toLowerCase().includes('paris')) {
        lat = 48.8566;
        lng = 2.3522;
      } else if (locationName.toLowerCase().includes('lyon')) {
        lat = 45.7640;
        lng = 4.8357;
      } else if (locationName.toLowerCase().includes('marseille')) {
        lat = 43.2965;
        lng = 5.3698;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        media_url: imageUrl,
        location_name: locationName.trim(),
        latitude: lat,
        longitude: lng,
        souvenir_date: souvenirDate
      };

      if (editingSouvenir) {
        const { data, error } = await supabase
          .from('souvenirs')
          .update(payload)
          .eq('id', editingSouvenir.id)
          .select()
          .single();
        if (error) throw error;
      } else {
        payload.couple_id = profile.couple_id;
        const { data: newSouvenir, error } = await supabase
          .from('souvenirs')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        // Award XP (+30 XP)
        const { data: couple } = await supabase
          .from('couples')
          .select('flame_xp, flame_energy')
          .eq('id', profile.couple_id)
          .single();

        if (couple) {
          await supabase
            .from('couples')
            .update({
              flame_xp: couple.flame_xp + 30,
              flame_energy: Math.min(100, couple.flame_energy + 10)
            })
            .eq('id', profile.couple_id);
        }
      }

      // Reset form
      setTitle('');
      setDescription('');
      setLocationName('');
      setImageFile(null);
      setSelectedEmotion('❤️');
      setShowAddForm(false);
      setEditingSouvenir(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 className="spinner" size={48} color="var(--color-primary)" />
        <p style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>Chargement de vos souvenirs...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div className="couple-info">
          <div className="avatar">📸</div>
          <div>
            <h2>Album Souvenirs</h2>
            <p className="days-together">Tous nos plus beaux moments gravés</p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(true)} className="icon-btn" title="Créer un souvenir">
          <Plus size={24} color="var(--color-primary)" />
        </button>
      </header>

      {/* Map View */}
      {souvenirs.length > 0 && (
        <div className="card" style={{ padding: '12px', marginBottom: '1.5rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.95rem' }}>
            <Compass size={16} color="var(--color-primary)" />
            <span>Notre carte des souvenirs</span>
          </h4>
          <div id="souvenirs-map" style={{ height: '220px', borderRadius: '12px', zIndex: 1 }}></div>
        </div>
      )}

      {/* Album List */}
      <div className="souvenirs-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {souvenirs.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
            <Image size={48} color="var(--color-text-light)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 className="title-cursive" style={{ fontSize: '2rem' }}>Aucun souvenir encore...</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-light)', margin: '0.5rem 0 1.5rem 0' }}>
              Enregistrez vos voyages, vos rendez-vous romantiques, et vos fous rires !
            </p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-small" style={{ margin: '0 auto' }}>
              Ajouter notre premier souvenir
            </button>
          </div>
        ) : (
          souvenirs.map((s) => (
            <div 
              key={s.id} 
              className="card souvenir-card" 
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => setViewingSouvenir(s)}
            >
              <div
                className="souvenir-image"
                style={{ backgroundImage: `url(${s.media_url})` }}
              >
                <div className="souvenir-emotion-badge">
                  {s.selected_emotion || '❤️'}
                </div>
              </div>
              <div className="souvenir-body" style={{ padding: '1.2rem' }}>
                <div className="souvenir-meta" style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '6px' }}>
                  <span className="flex-center" style={{ gap: '4px' }}>
                    <Calendar size={14} />
                    {new Date(s.souvenir_date).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {s.location_name && (
                    <span className="flex-center" style={{ gap: '4px' }}>
                      <MapPin size={14} />
                      {s.location_name}
                    </span>
                  )}
                </div>
                <h4 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--color-text)' }}>{s.title}</h4>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-light)', lineHeight: '1.5', margin: 0 }}>{s.description}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Viewing Souvenir Modal */}
      {viewingSouvenir && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ padding: '2rem 1.5rem', maxWidth: '500px' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2 className="title-cursive" style={{ fontSize: '2.2rem' }}>{viewingSouvenir.title}</h2>
              <button onClick={() => setViewingSouvenir(null)} className="close-btn">&times;</button>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <img src={viewingSouvenir.media_url} alt={viewingSouvenir.title} style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              <span><Calendar size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />{new Date(viewingSouvenir.souvenir_date).toLocaleDateString()}</span>
              {viewingSouvenir.location_name && (
                <span><MapPin size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />{viewingSouvenir.location_name}</span>
              )}
            </div>
            <p style={{ lineHeight: '1.6', marginBottom: '2rem' }}>{viewingSouvenir.description}</p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => handleEditClick(viewingSouvenir)} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Modifier</button>
              <button type="button" onClick={() => handleDelete(viewingSouvenir.id)} className="btn" style={{ background: '#d32f2f', padding: '8px 16px', fontSize: '0.9rem' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Souvenir Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ padding: '2rem 1.5rem', maxWidth: '450px' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2 className="title-cursive" style={{ fontSize: '2.2rem' }}>{editingSouvenir ? 'Modifier le souvenir' : 'Nouveau souvenir'}</h2>
              <button onClick={() => { setShowAddForm(false); setEditingSouvenir(null); }} className="close-btn">&times;</button>
            </div>

            <form onSubmit={handleAddSouvenir} className="auth-form" style={{ gap: '1.2rem' }}>
              <div className="input-group">
                <label>Titre du moment</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Notre pique-nique au parc..."
                  required
                />
              </div>

              <div className="input-group">
                <label>Description / Anecdote</label>
                <textarea
                  className="response-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Racontez ce moment spécial..."
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="input-group">
                <label>Lieu (Nom de la ville/endroit)</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ex: Tour Eiffel, Paris"
                />
              </div>

              <div className="input-group">
                <label>Date du souvenir</label>
                <input
                  type="date"
                  value={souvenirDate}
                  onChange={(e) => setSouvenirDate(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Émotion générale</label>
                <div className="emotions-picker" style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  {EMOTIONS.map((em) => (
                    <button
                      key={em.emoji}
                      type="button"
                      onClick={() => setSelectedEmotion(em.emoji)}
                      className={`emotion-btn ${selectedEmotion === em.emoji ? 'active' : ''}`}
                      style={{
                        padding: '8px',
                        fontSize: '1.3rem',
                        background: selectedEmotion === em.emoji ? 'rgba(169, 27, 34, 0.1)' : 'transparent',
                        border: selectedEmotion === em.emoji ? '1px solid var(--color-primary)' : '1px solid #ccc',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        boxShadow: 'none'
                      }}
                    >
                      {em.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Ajouter une photo (optionnel)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ border: 'none', background: 'none', padding: 0 }}
                />
              </div>

              <button type="submit" disabled={submitting} className="btn submit-btn">
                <span>Créer le souvenir (+30 XP)</span>
                {submitting && <Loader2 className="spinner" size={18} />}
              </button>
            </form>
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
        <a href="/capsules" className="nav-item">
          <div className="nav-icon">⏳</div>
          <span>Capsules</span>
        </a>
        <a href="/souvenirs" className="nav-item active">
          <div className="nav-icon"><History /></div>
          <span>Souvenirs</span>
        </a>
      
        <a href="/location" className={"nav-item" + ((typeof window !== 'undefined' ? window.location.pathname : '') === '/location' ? ' active' : '')}>
          <div className="nav-icon"><MapPin /></div>
          <span>Position</span>
        </a>
      </nav>
    </div>
  );
}
