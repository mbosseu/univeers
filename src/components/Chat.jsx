import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { Send, Image, Eye, EyeOff, Lock, Unlock, Loader2, Sparkles, Mic, Square } from 'lucide-react';

export default function Chat() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Input form states
  const [inputText, setInputText] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [sending, setSending] = useState(false);

  // Set of revealed secret message IDs for the current session
  const [revealedSecrets, setRevealedSecrets] = useState(new Set());

  // Voice note recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef(null);

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

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/';
      return;
    }
    setUser(session.user);
    await loadChatData(session.user.id);
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

      // 3. Fetch past messages
      if (userProfile.couple_id) {
        const { data: pastMsgs, error } = await supabase
          .from('messages')
          .select('*')
          .eq('couple_id', userProfile.couple_id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(pastMsgs || []);

        // 4. Setup Realtime subscription
        const channel = supabase
          .channel('room_messages')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `couple_id=eq.${userProfile.couple_id}`
          }, (payload) => {
            // Append message if not already present
            setMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          })
          .subscribe();

        setLoading(false);
        return () => {
          supabase.removeChannel(channel);
        };
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading chat:', err);
      setLoading(false);
    }
  }

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !photoUrl.trim()) || sending) return;

    setSending(true);
    try {
      let msgText = inputText.trim();
      let type = 'text';

      if (isSecret) {
        type = 'secret';
      } else if (photoUrl.trim()) {
        type = 'photo';
        msgText = photoUrl.trim();
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

      // Award XP (+1 XP per message to grow the flame slightly!)
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
      setPhotoUrl('');
      setIsSecret(false);
      setShowPhotoInput(false);
    } catch (err) {
      console.error(err);
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

  // Select Unsplash random photo helper
  const handleAttachRandomPhoto = () => {
    const urls = [
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=400',
      'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=400',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=400'
    ];
    setPhotoUrl(urls[Math.floor(Math.random() * urls.length)]);
    setShowPhotoInput(true);
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

  const uploadAudio = async (audioBlob) => {
    setSending(true);
    try {
      const fileExt = 'webm';
      const fileName = `${profile.couple_id}/${Date.now()}.${fileExt}`;
      const filePath = `chat-audio/${fileName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('souvenir-media')
        .upload(filePath, audioBlob);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('souvenir-media')
        .getPublicUrl(filePath);

      const { data: newMsg, error: insertErr } = await supabase
        .from('messages')
        .insert([{
          couple_id: profile.couple_id,
          sender_id: user.id,
          message_text: publicUrl,
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
            const isRevealed = revealedSecrets.has(m.id);

            return (
              <div
                key={m.id}
                className={`msg-wrapper ${isMe ? 'msg-me' : 'msg-partner'}`}
              >
                <div
                  className={`msg-bubble ${isSecretType ? 'msg-secret' : ''} ${isPhotoType ? 'msg-photo' : ''} ${m.message_type === 'audio' ? 'audio-message-bubble' : ''}`}
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
                  ) : m.message_type === 'audio' ? (
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

      {/* Chat input form */}
      <form onSubmit={handleSendMessage} className={`chat-input-area ${isSecret ? 'secret-active' : ''}`}>
        
        {showPhotoInput && (
          <div className="photo-input-bar">
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="URL de la photo à partager..."
            />
            <button type="button" onClick={() => setShowPhotoInput(false)}>&times;</button>
          </div>
        )}

        {isRecording ? (
          <div className="input-row recording-active-row">
            <div className="recording-status">
              <span className="recording-dot"></span>
              <span>Enregistrement : {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="recording-actions">
              <button 
                type="button" 
                onClick={() => {
                  if (mediaRecorder) {
                    mediaRecorder.onstop = null; // Prevent file upload on cancel
                    mediaRecorder.stop();
                    mediaRecorder.stream.getTracks().forEach(t => t.stop());
                  }
                  setIsRecording(false);
                }} 
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
              onClick={handleAttachRandomPhoto}
              className={`tool-btn ${showPhotoInput ? 'active' : ''}`}
              title="Joindre une photo"
            >
              <Image size={20} />
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
              disabled={photoUrl.trim() !== ''}
            />

            <button type="submit" disabled={sending || (inputText.trim() === '' && photoUrl.trim() === '')} className="send-btn">
              {sending ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
