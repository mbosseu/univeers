import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function GlobalNotifications() {
  const channelRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function setupNotifications() {
      // 1. Check user and profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile?.couple_id) return;

      // 2. Demander la permission pour les notifications (Option 1)
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (err) {
          console.warn("Erreur permission notifications:", err);
        }
      }

      // 3. Setup abonnement global aux messages
      if (channelRef.current) supabase.removeChannel(channelRef.current);

      const channel = supabase
        .channel('global_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${profile.couple_id}`
        }, (payload) => {
          // On s'assure qu'on ne se notifie pas soi-même
          if (payload.new.sender_id === session.user.id) return;

          // Si on est pas sur la messagerie OU si l'onglet est caché
          const isNotOnChat = window.location.pathname !== '/messages';
          const isHidden = document.visibilityState !== 'visible';

          if (isNotOnChat || isHidden) {
            // Afficher la notification HTML5 locale si permise
            if ('Notification' in window && Notification.permission === 'granted') {
              let bodyText = "Vous avez reçu un nouveau message !";
              if (payload.new.message_type === 'audio') bodyText = "🎙️ Nouvelle note vocale";
              if (payload.new.message_type === 'photo') bodyText = "📷 Nouvelle photo";
              if (payload.new.message_type === 'secret') bodyText = "🔒 Nouveau message secret";

              try {
                const notif = new Notification("Votre Univers ❤️", {
                  body: bodyText,
                  icon: "/logo.png" // Assure d'avoir un logo.png à la racine
                });

                // Clic sur la notification -> ouvre la messagerie
                notif.onclick = () => {
                  window.location.href = '/messages';
                  notif.close();
                };
              } catch (e) {
                console.warn("Impossible d'afficher la notification", e);
              }
            }
          }
        })
        .subscribe();

      channelRef.current = channel;
    }

    setupNotifications();

    return () => {
      mounted = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return null; // Ce composant est invisible, il tourne en fond
}
