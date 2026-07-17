import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const POST = async ({ request }) => {
  try {
    const publicKey = import.meta.env.PUBLIC_VAPID_KEY || process.env.PUBLIC_VAPID_KEY;
    const privateKey = import.meta.env.PRIVATE_VAPID_KEY || process.env.PRIVATE_VAPID_KEY;

    if (!publicKey || !privateKey) {
      console.error('VAPID keys are missing');
      return new Response(JSON.stringify({ error: 'Server misconfiguration: VAPID keys missing' }), { status: 500 });
    }

    // Configuration web-push
    webpush.setVapidDetails(
      'mailto:contact@univers.com',
      publicKey,
      privateKey
    );

    const body = await request.json();
    const { coupleId, senderId, title, messageText, url, messageType } = body;

    if (!coupleId || !senderId) {
      return new Response(JSON.stringify({ error: 'Missing coupleId or senderId' }), { status: 400 });
    }

    // Init Supabase client
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the partner's ID
    const { data: partnerData, error: partnerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('couple_id', coupleId)
      .neq('id', senderId)
      .single();

    if (partnerError || !partnerData) {
      return new Response(JSON.stringify({ error: 'No partner found' }), { status: 404 });
    }

    const partnerId = partnerData.id;

    // Get the partner's subscription
    const { data: subData, error } = await supabase
      .from('push_subscriptions')
      .select('subscription_json')
      .eq('user_id', partnerId)
      .single();

    if (error || !subData) {
      return new Response(JSON.stringify({ error: 'No subscription found for partner' }), { status: 404 });
    }

    const pushSubscription = subData.subscription_json;

    let bodyText = "Vous avez reçu un nouveau message !";
    if (messageType === 'audio') bodyText = "🎙️ Nouvelle note vocale";
    if (messageType === 'photo') bodyText = "📷 Nouvelle photo";
    if (messageType === 'secret') bodyText = "🔒 Nouveau message secret";
    if (messageText && messageType === 'text') bodyText = messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '');

    // Send the push
    const payload = JSON.stringify({
      title: title || 'Univers ❤️',
      body: bodyText,
      url: url || '/messages',
      icon: '/logo.png'
    });

    await webpush.sendNotification(pushSubscription, payload);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error('Push Notification error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
