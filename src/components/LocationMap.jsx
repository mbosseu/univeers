import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase.js';
import { Loader2, MapPin, Navigation } from 'lucide-react';

// Custom component to auto-center the map
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function LocationMap() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  
  const [myLocation, setMyLocation] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  
  const watchIdRef = useRef(null);

  useEffect(() => {
    checkUser();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
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
      await loadProfiles(session.user.id);
    } catch (err) {
      console.error('Error checking user:', err);
      setLoading(false);
    }
  }

  async function loadProfiles(userId) {
    try {
      const { data: myProf } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      setProfile(myProf);

      if (myProf?.latitude && myProf?.longitude) {
        setMyLocation([myProf.latitude, myProf.longitude]);
      }

      if (myProf?.couple_id) {
        const { data: partners } = await supabase
          .from('profiles')
          .select('*')
          .eq('couple_id', myProf.couple_id)
          .neq('id', userId);
          
        if (partners && partners.length > 0) {
          const partner = partners[0];
          setPartnerProfile(partner);
          if (partner.latitude && partner.longitude) {
            setPartnerLocation([partner.latitude, partner.longitude]);
          }
          
          // Setup realtime listener for partner's location
          setupRealtime(partner.id);
        }
      }
      
      setLoading(false);
      startTracking(userId);
    } catch (err) {
      console.error('Error loading profiles:', err);
      setLoading(false);
    }
  }

  function setupRealtime(partnerId) {
    supabase
      .channel('public:profiles:location')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${partnerId}`
        },
        (payload) => {
          const updatedProfile = payload.new;
          if (updatedProfile.latitude && updatedProfile.longitude) {
            setPartnerLocation([updatedProfile.latitude, updatedProfile.longitude]);
            setPartnerProfile(prev => ({ ...prev, ...updatedProfile }));
          }
        }
      )
      .subscribe();
  }

  function startTracking(userId) {
    if (!('geolocation' in navigator)) {
      setHasPermission(false);
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
      if (result.state === 'granted' || result.state === 'prompt') {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            setHasPermission(true);
            const { latitude, longitude } = position.coords;
            setMyLocation([latitude, longitude]);
            // Supabase update is now handled globally by GlobalLocationTracker
          },
          (error) => {
            console.error('Geolocation error:', error);
            if (error.code === error.PERMISSION_DENIED) {
              setHasPermission(false);
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000
          }
        );
      } else if (result.state === 'denied') {
        setHasPermission(false);
      }
    });
  }

  const createAvatarIcon = (url, fallbackText, color = '#a91b22') => {
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `
        <div style="
          width: 44px; 
          height: 44px; 
          border-radius: 50%; 
          background-color: white; 
          border: 3px solid ${color};
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        ">
          ${url 
            ? `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" />` 
            : `<span style="font-weight: bold; color: ${color}; font-size: 18px;">${fallbackText}</span>`
          }
          <div style="
            position: absolute;
            bottom: -6px;
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid ${color};
          "></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -44]
    });
  };

  const requestPermission = () => {
    if (user) {
      startTracking(user.id);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[var(--color-text-light)]">
        <Loader2 className="animate-spin mb-4 text-[var(--color-primary)]" size={40} />
        <p className="font-medium">Chargement de la carte...</p>
      </div>
    );
  }

  // Calculate default center
  const center = partnerLocation || myLocation || [48.8566, 2.3522]; // Default to Paris if no location

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] bg-[var(--color-background)] relative">
      <div className="flex items-center justify-between p-4 bg-white shadow-sm z-10">
        <div className="flex items-center gap-2">
          <MapPin className="text-[var(--color-primary)]" size={24} />
          <h2 className="text-xl font-bold text-[var(--color-text)] m-0 title-cursive">Notre Position</h2>
        </div>
      </div>

      {hasPermission === false && (
        <div className="absolute top-20 left-4 right-4 bg-white p-4 rounded-xl shadow-lg z-[1000] border border-red-100 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Navigation className="text-red-500 shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-bold text-[var(--color-text)] m-0 mb-1">Localisation requise</h3>
              <p className="text-sm text-[var(--color-text-light)] m-0">
                Pour partager votre position avec votre partenaire, vous devez autoriser l'accès à la localisation dans votre navigateur.
              </p>
            </div>
          </div>
          <button 
            onClick={requestPermission}
            className="w-full bg-[var(--color-primary)] text-white py-2 rounded-full font-semibold text-sm hover:bg-[var(--color-primary-light)] transition-colors shadow-sm"
          >
            Autoriser la localisation
          </button>
        </div>
      )}

      <div className="flex-grow w-full relative z-0">
        {typeof window !== 'undefined' && (
          <MapContainer 
            center={center} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapUpdater center={partnerLocation || myLocation} />

            {myLocation && (
              <Marker 
                position={myLocation}
                icon={createAvatarIcon(profile?.avatar_url, profile?.display_name?.charAt(0)?.toUpperCase() || 'Moi', '#4a148c')}
              >
                <Popup>
                  <div className="text-center">
                    <strong>Vous</strong>
                    <div className="text-xs text-gray-500 mt-1">Dernière mise à jour : à l'instant</div>
                  </div>
                </Popup>
              </Marker>
            )}

            {partnerLocation && (
              <Marker 
                position={partnerLocation}
                icon={createAvatarIcon(partnerProfile?.avatar_url, partnerProfile?.display_name?.charAt(0)?.toUpperCase() || '?', '#a91b22')}
              >
                <Popup>
                  <div className="text-center">
                    <strong>{partnerProfile?.display_name || 'Partenaire'}</strong>
                    {partnerProfile?.location_updated_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Vu(e) le {new Date(partnerProfile.location_updated_at).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}
      </div>
      
      {/* Information Banner */}
      <div className="bg-white p-3 border-t border-[rgba(169,27,34,0.05)] text-center text-xs text-[var(--color-text-light)] relative z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        La position s'actualise uniquement lorsque l'application est ouverte.
      </div>
    </div>
  );
}
