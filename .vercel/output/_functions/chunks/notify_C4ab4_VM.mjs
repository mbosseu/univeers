import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
//#region src/pages/api/notify.js
var notify_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
webpush.setVapidDetails("mailto:contact@univers.com", void 0, void 0);
var POST = async ({ request }) => {
	try {
		const { coupleId, senderId, title, messageText, url, messageType } = await request.json();
		if (!coupleId || !senderId) return new Response(JSON.stringify({ error: "Missing coupleId or senderId" }), { status: 400 });
		const supabase = createClient("https://btijpjibghnmqalmbwsv.supabase.co", "sb_publishable_8dOe6ZKFoWb1GKuPKdI1Yw_Er10tJRB");
		const { data: partnerData, error: partnerError } = await supabase.from("profiles").select("id").eq("couple_id", coupleId).neq("id", senderId).single();
		if (partnerError || !partnerData) return new Response(JSON.stringify({ error: "No partner found" }), { status: 404 });
		const partnerId = partnerData.id;
		const { data: subData, error } = await supabase.from("push_subscriptions").select("subscription_json").eq("user_id", partnerId).single();
		if (error || !subData) return new Response(JSON.stringify({ error: "No subscription found for partner" }), { status: 404 });
		const pushSubscription = subData.subscription_json;
		let bodyText = "Vous avez reçu un nouveau message !";
		if (messageType === "audio") bodyText = "🎙️ Nouvelle note vocale";
		if (messageType === "photo") bodyText = "📷 Nouvelle photo";
		if (messageType === "secret") bodyText = "🔒 Nouveau message secret";
		if (messageText && messageType === "text") bodyText = messageText.substring(0, 50) + (messageText.length > 50 ? "..." : "");
		const payload = JSON.stringify({
			title: title || "Univers ❤️",
			body: bodyText,
			url: url || "/messages",
			icon: "/logo.png"
		});
		await webpush.sendNotification(pushSubscription, payload);
		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (err) {
		console.error("Push Notification error:", err);
		return new Response(JSON.stringify({ error: err.message }), { status: 500 });
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/notify@_@js
var page = () => notify_exports;
//#endregion
export { page };
