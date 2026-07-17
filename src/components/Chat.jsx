import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { Send, Image, Eye, EyeOff, Lock, Unlock, Loader2, Sparkles, Mic, Square, X, Camera } from 'lucide-react';

export default function Chat() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Input form states
  const [inputText, setInputText] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [sending, setSending] = useState(false);

  // Photo upload states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Set of revealed secret message IDs for the current session
  const [revealedSecrets, setRevealedSecrets] = useState(new Set());

  // Voice note recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const fileInputRef = useRef(null);

  // Recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Initial load + cleanup
  useEffect(() => {
    checkUser();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/';
        return;
      }
      setUser(session.user);
      await loadChatData(session.user.id);
    } catch (err) {
      console.error('Error in checkUser:', err);
      setLoading(false);
    }
  }

  async function loadChatData(userId) {
    try {
      // 1. Fetch current profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(userProfile);

      if (!userProfile?.couple_id) {
        setLoading(false);
        return;
      }

      // 2. Fetch partner profile
      const { data: partners } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_id', userProfile.couple_id)
        .neq('id', userId);
      
      if (partners && partners.length > 0) {
        setPartnerProfile(partners[0]);
      }

      // 3. Fetch past messages
      const { data: pastMsgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', userProfile.couple_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(pastMsgs || []);

      // 4. Setup Realtime subscription (properly cleaned up via channelRef)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel('room_messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${userProfile.couple_id}`
        }, (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        })
        .subscribe();

      channelRef.current = channel;
      setLoading(false);
    } catch (err) {
      console.error('Error loading chat:', err);
      setLoading(false);
    }
  }

  // Photo file selection handler
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  // Upload photo to Supabase Storage, fallback to base64 if storage fails
  const uploadPhoto = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.couple_id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat-photos/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('souvenir-media')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('souvenir-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.warn('Storage upload failed, using compressed base64 fallback:', err.message);
      // Fallback: compress and return as base64 data URL
      return await compressImage(file);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !photoFile) || sending) return;

    setSending(true);
    try {
      let msgText = inputText.trim();
      let type = 'text';

      if (photoFile) {
        type = 'photo';
        msgText = await uploadPhoto(photoFile);
      } else if (isSecret) {
        type = 'secret';
      }

      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert([{
          couple_id: profile.couple_id,
          sender_id: user.id,
          message_text: msgText,
          message_type: type
        }])
        .select()
        .single();

      if (error) throw error;

      // Award XP (+1 XP per message)
      const { data: couple } = await supabase
        .from('couples')
        .select('flame_xp, flame_energy')
        .eq('id', profile.couple_id)
        .single();

      if (couple) {
        await supabase
          .from('couples')
          .update({
            flame_xp: couple.flame_xp + 1,
            flame_energy: Math.min(100, couple.flame_energy + 1)
          })
          .eq('id', profile.couple_id);
      }

      // Add to local list if realtime didn't catch it yet
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      setInputText('');
      clearPhoto();
      setIsSecret(false);
    } catch (err) {
      console.error(err);
      alert(`Erreur lors de l'envoi du message: ${err.message || JSON.stringify(err)}`);
    } finally {
      setSending(false);
    }
  };

  // Toggle reveal secret message
  const toggleSecretReveal = (msgId) => {
    setRevealedSecrets(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Impossible d'accéder au micro. Veuillez vérifier vos autorisations.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = null;
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
      }
    }
    setIsRecording(false);
  };

  const uploadAudio = async (audioBlob) => {
    setSending(true);
    try {
      const fileName = `${profile.couple_id}/${Date.now()}.webm`;
      const filePath = `chat-audio/${fileName}`;
      let audioUrl;

      const { error: uploadErr } = await supabase.storage
        .from('souvenir-media')
        .upload(filePath, audioBlob);

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('souvenir-media')
          .getPublicUrl(filePath);
        audioUrl = publicUrl;
      } else {
        console.warn('Storage upload failed, using base64 fallback for audio:', uploadErr);
        audioUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(audioBlob);
        });
      }

      const { data: newMsg, error: insertErr } = await supabase
        .from('messages')
        .insert([{
          couple_id: profile.couple_id,
          sender_id: user.id,
          message_text: audioUrl,
          message_type: 'audio'
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Award XP
      const { data: couple } = await supabase
        .from('couples')
        .select('flame_xp, flame_energy')
        .eq('id', profile.couple_id)
        .single();

      if (couple) {
        await supabase
          .from('couples')
          .update({
            flame_xp: couple.flame_xp + 1,
            flame_energy: Math.min(100, couple.flame_energy + 1)
          })
          .eq('id', profile.couple_id);
      }

      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      console.error('Error sending voice note:', err);
      alert("Erreur lors de l'envoi de la note vocale.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 className="spinner" size={48} color="var(--color-primary)" />
        <p style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>Chargement de la messagerie...</p>
      </div>
    );
  }

  if (!profile?.couple_id) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <Sparkles size={48} color="var(--color-primary)" />
        <h3 style={{ color: 'var(--color-text)' }}>Pas encore de partenaire</h3>
        <p style={{ color: 'var(--color-text-light)' }}>Liez-vous avec votre partenaire pour commencer à discuter !</p>
        <a href="/dashboard" className="btn btn-small">Retour à l'univers</a>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <a href="/dashboard" className="back-arrow-btn">←</a>
        <div className="partner-status">
          <div className="partner-avatar">💖</div>
          <div>
            <h3>{partnerProfile?.display_name || 'Votre partenaire'}</h3>
            <p className="status-indicator"><span className="status-dot"></span>En ligne dans votre Univers</p>
          </div>
        </div>
      </header>

      {/* Messages Feed */}
      <div className="messages-feed">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <Sparkles size={32} color="var(--color-primary)" style={{ marginBottom: '8px' }} />
            <p>Envoyez un message pour démarrer la discussion.</p>
            <p className="subtext">Chaque message nourrit discrètement votre flamme !</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user.id;
            const isSecretType = m.message_type === 'secret';
            const isPhotoType = m.message_type === 'photo';
            const isAudioType = m.message_type === 'audio';
            const isRevealed = revealedSecrets.has(m.id);

            return (
              <div
                key={m.id}
                className={`msg-wrapper ${isMe ? 'msg-me' : 'msg-partner'}`}
              >
                <div
                  className={`msg-bubble ${isSecretType ? 'msg-secret' : ''} ${isPhotoType ? 'msg-photo' : ''} ${isAudioType ? 'audio-message-bubble' : ''}`}
                  onClick={() => isSecretType && toggleSecretReveal(m.id)}
                  style={{ cursor: isSecretType ? 'pointer' : 'default' }}
                >
                  {isSecretType ? (
                    <div className="secret-content">
                      {isRevealed ? (
                        <div className="revealed-text">
                          <span className="secret-badge"><Unlock size={12} /> Message Secret</span>
                          <p>{m.message_text}</p>
                        </div>
                      ) : (
                        <div className="hidden-text">
                          <Lock size={18} />
                          <span>Message secret (cliquez pour révéler)</span>
                        </div>
                      )}
                    </div>
                  ) : isPhotoType ? (
                    <img src={m.message_text} alt="Photo partagée" className="chat-img-media" />
                  ) : isAudioType ? (
                    <audio src={m.message_text} controls className="chat-audio-player" />
                  ) : (
                    <p>{m.message_text}</p>
                  )}
                  
                  <span className="msg-time">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Photo preview */}
      {photoPreview && (
        <div className="photo-preview-bar">
          <img src={photoPreview} alt="Aperçu" className="photo-preview-thumb" />
          <span className="photo-preview-label">Photo prête à envoyer</span>
          <button type="button" onClick={clearPhoto} className="photo-preview-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        style={{ display: 'none' }}
      />

      {/* Chat input form */}
      <form onSubmit={handleSendMessage} className={`chat-input-area ${isSecret ? 'secret-active' : ''}`}>
        {isRecording ? (
          <div className="input-row recording-active-row">
            <div className="recording-status">
              <span className="recording-dot"></span>
              <span>Enregistrement : {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="recording-actions">
              <button 
                type="button" 
                onClick={cancelRecording} 
                className="cancel-record-btn"
              >
                Annuler
              </button>
              <button type="button" onClick={stopRecording} className="stop-record-btn">
                <Square size={14} /> Envoyer
              </button>
            </div>
          </div>
        ) : (
          <div className="input-row">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`tool-btn ${photoFile ? 'active' : ''}`}
              title="Joindre une photo"
            >
              <Camera size={20} />
            </button>

            <button
              type="button"
              onClick={() => setIsSecret(!isSecret)}
              className={`tool-btn secret-toggle-btn ${isSecret ? 'active' : ''}`}
              title="Message Secret"
            >
              {isSecret ? <Lock size={20} color="var(--color-primary)" /> : <Unlock size={20} />}
            </button>

            <button
              type="button"
              onClick={startRecording}
              className="tool-btn mic-btn"
              title="Enregistrer un message vocal"
            >
              <Mic size={20} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isSecret ? "Écrire un message secret..." : "Écrire un message..."}
              disabled={!!photoFile}
            />

            <button type="submit" disabled={sending || (inputText.trim() === '' && !photoFile)} className="send-btn">
              {sending ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
