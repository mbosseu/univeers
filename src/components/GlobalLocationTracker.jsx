import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

export default function GlobalLocationTracker() {
  const watchIdRef = useRef(null);

  useEffect(() => {
    checkAndStartTracking();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  async function checkAndStartTracking() {
    if (!('geolocation' in navigator)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const userId = session.user.id;

      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        
        if (result.state === 'granted') {
          startWatch(userId);
        }
        
        result.onchange = () => {
          if (result.state === 'granted') {
            startWatch(userId);
          } else if (result.state === 'denied' && watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        };
      } else {
        // Fallback for browsers without permissions API
        startWatch(userId);
      }
    } catch (err) {
      console.error('Error starting global tracker:', err);
    }
  }

  function startWatch(userId) {
    if (watchIdRef.current) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await supabase
            .from('profiles')
            .update({
              latitude,
              longitude,
              location_updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        } catch (e) {
          console.error("Failed to update location globally", e);
        }
      },
      (error) => {
        console.error('Global geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );
  }

  return null;
}
