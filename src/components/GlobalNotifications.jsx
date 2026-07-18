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

      // --- NOUVEAU : Enregistrement Service Worker et Web Push ---
      if ('serviceWorker' in navigator && 'PushManager' in window && Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          // Vérifier si déjà abonné
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            // S'abonner aux Web Push
            const publicVapidKey = import.meta.env.PUBLIC_VAPID_KEY;
            
            if (publicVapidKey) {
              const urlBase64ToUint8Array = (base64String) => {
                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                  outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
              };

              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
              });
            }
          }
          
          if (subscription) {
            // Sauvegarder dans Supabase
            await supabase
              .from('push_subscriptions')
              .upsert({
                user_id: session.user.id,
                subscription_json: JSON.parse(JSON.stringify(subscription))
              }, { onConflict: 'user_id' });
          }
        } catch (error) {
          console.warn("Erreur lors de l'enregistrement Web Push:", error);
        }
      }
      // -------------------------------------------------------------

      // 3. Setup abonnement global aux messages (Notifications Locales)
      if (channelRef.current) supabase.removeChannel(channelRef.current);

      const { data: userCouplesList } = await supabase
        .from('user_couples')
        .select('couple_id')
        .eq('user_id', session.user.id);
        
      let filterStr = `couple_id=eq.${profile.couple_id}`;
      if (userCouplesList && userCouplesList.length > 1) {
        const ids = userCouplesList.map(c => c.couple_id).join(',');
        filterStr = `couple_id=in.(${ids})`;
      }

      const channel = supabase
        .channel('global_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: filterStr
        }, (payload) => {
          if (payload.new.sender_id === session.user.id) return;

          const isNotOnChat = window.location.pathname !== '/messages';
          const isHidden = document.visibilityState !== 'visible';

          // On notifie en local UNIQUEMENT si la page est ouverte et pas focalisée
          // Le Service Worker s'occupe du push si l'appli est fermée.
          if (isNotOnChat || isHidden) {
            if ('Notification' in window && Notification.permission === 'granted') {
              let bodyText = "Vous avez reçu un nouveau message !";
              if (payload.new.message_type === 'audio') bodyText = "🎙️ Nouvelle note vocale";
              if (payload.new.message_type === 'photo') bodyText = "📷 Nouvelle photo";
              if (payload.new.message_type === 'secret') bodyText = "🔒 Nouveau message secret";

              try {
                // On utilise le Service Worker pour afficher la notification 
                // (c'est plus propre sur mobile) ou la méthode classique.
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification("Votre Univers ❤️", {
                    body: bodyText,
                    icon: "/logo.png",
                    badge: "/favicon.svg",
                    data: { url: '/messages' }
                  });
                }).catch(() => {
                  const notif = new Notification("Votre Univers ❤️", {
                    body: bodyText,
                    icon: "/logo.png"
                  });
                  notif.onclick = () => {
                    window.location.href = '/messages';
                    notif.close();
                  };
                });
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
