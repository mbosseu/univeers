import { _ as createRenderInstruction, g as addAttribute, h as renderHead, i as renderComponent, s as renderSlot, u as renderTemplate, w as createAstro } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
//#region node_modules/astro/dist/runtime/server/render/script.js
async function renderScript(result, id) {
	const inlined = result.inlinedScripts.get(id);
	let content = "";
	if (inlined != null) {
		if (inlined) content = `<script type="module">${inlined}<\/script>`;
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"><\/script>`;
	}
	return createRenderInstruction({
		type: "script",
		id,
		content
	});
}
var supabase = createClient("https://btijpjibghnmqalmbwsv.supabase.co", "sb_publishable_8dOe6ZKFoWb1GKuPKdI1Yw_Er10tJRB");
//#endregion
//#region src/components/GlobalNotifications.jsx
function GlobalNotifications() {
	const channelRef = useRef(null);
	useEffect(() => {
		async function setupNotifications() {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) return;
			const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
			if (!profile?.couple_id) return;
			if ("Notification" in window && Notification.permission === "default") try {
				await Notification.requestPermission();
			} catch (err) {
				console.warn("Erreur permission notifications:", err);
			}
			if ("serviceWorker" in navigator && "PushManager" in window && Notification.permission === "granted") try {
				let subscription = await (await navigator.serviceWorker.register("/sw.js")).pushManager.getSubscription();
				if (!subscription) {}
				if (subscription) await supabase.from("push_subscriptions").upsert({
					user_id: session.user.id,
					subscription_json: JSON.parse(JSON.stringify(subscription))
				}, { onConflict: "user_id" });
			} catch (error) {
				console.warn("Erreur lors de l'enregistrement Web Push:", error);
			}
			if (channelRef.current) supabase.removeChannel(channelRef.current);
			const channel = supabase.channel("global_notifications").on("postgres_changes", {
				event: "INSERT",
				schema: "public",
				table: "messages",
				filter: `couple_id=eq.${profile.couple_id}`
			}, (payload) => {
				if (payload.new.sender_id === session.user.id) return;
				const isNotOnChat = window.location.pathname !== "/messages";
				const isHidden = document.visibilityState !== "visible";
				if (isNotOnChat || isHidden) {
					if ("Notification" in window && Notification.permission === "granted") {
						let bodyText = "Vous avez reçu un nouveau message !";
						if (payload.new.message_type === "audio") bodyText = "🎙️ Nouvelle note vocale";
						if (payload.new.message_type === "photo") bodyText = "📷 Nouvelle photo";
						if (payload.new.message_type === "secret") bodyText = "🔒 Nouveau message secret";
						try {
							navigator.serviceWorker.ready.then((registration) => {
								registration.showNotification("Votre Univers ❤️", {
									body: bodyText,
									icon: "/logo.png",
									badge: "/favicon.svg",
									data: { url: "/messages" }
								});
							}).catch(() => {
								const notif = new Notification("Votre Univers ❤️", {
									body: bodyText,
									icon: "/logo.png"
								});
								notif.onclick = () => {
									window.location.href = "/messages";
									notif.close();
								};
							});
						} catch (e) {
							console.warn("Impossible d'afficher la notification", e);
						}
					}
				}
			}).subscribe();
			channelRef.current = channel;
		}
		setupNotifications();
		return () => {
			if (channelRef.current) supabase.removeChannel(channelRef.current);
		};
	}, []);
	return null;
}
//#endregion
//#region src/layouts/AppLayout.astro
createAstro("https://astro.build");
var $$AppLayout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$AppLayout;
	const { title } = Astro.props;
	return renderTemplate`<html lang="fr" data-astro-cid-7xoob3d3><head><meta charset="UTF-8"><meta name="description" content="Univers - Chaque geste d'amour nourrit votre flamme"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro.generator, "content")}><title>${title} | Univers</title><!-- PWA Meta Tags --><meta name="theme-color" content="#a91b22"><link rel="apple-touch-icon" href="/pwa-192x192.png"><link rel="manifest" href="/manifest.webmanifest"><script>
			(function() {
				const theme = localStorage.getItem('univers-theme') || 'theme-romantic';
				const root = document.documentElement;
				if (theme === 'theme-night') {
					root.style.setProperty('--color-primary', '#0f4c81');
					root.style.setProperty('--color-primary-light', '#1a6fa0');
					root.style.setProperty('--color-background', '#f0f4f8');
				} else if (theme === 'theme-warm') {
					root.style.setProperty('--color-primary', '#8d5b4c');
					root.style.setProperty('--color-primary-light', '#a56f5e');
					root.style.setProperty('--color-background', '#FAF8F5');
				}
			})();
		<\/script>${renderHead($$result)}</head><body data-astro-cid-7xoob3d3><!-- Global Starry Background --><div id="stars-container" class="global-stars-container" data-astro-cid-7xoob3d3></div><!-- Splash Screen --><div id="splash-screen" class="splash-overlay" data-astro-cid-7xoob3d3><canvas id="splash-canvas" class="splash-canvas" data-astro-cid-7xoob3d3></canvas><div class="splash-content" data-astro-cid-7xoob3d3><img src="/logo.webp" alt="Univers Logo" class="splash-logo-exact" data-astro-cid-7xoob3d3><p class="splash-slogan" data-astro-cid-7xoob3d3>Chaque geste d'amour nourrit votre flamme</p><button id="splash-dismiss-btn" class="splash-btn" data-astro-cid-7xoob3d3>Continuer</button></div></div><main data-astro-cid-7xoob3d3>${renderComponent($$result, "GlobalNotifications", GlobalNotifications, {
		"client:load": true,
		"data-astro-cid-7xoob3d3": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/PC/Desktop/univers/src/components/GlobalNotifications.jsx",
		"client:component-export": "default"
	})}${renderSlot($$result, $$slots["default"])}</main>${renderScript($$result, "C:/Users/PC/Desktop/univers/src/layouts/AppLayout.astro?astro&type=script&index=0&lang.ts")}</body></html>`;
}, "C:/Users/PC/Desktop/univers/src/layouts/AppLayout.astro", void 0);
//#endregion
export { supabase as n, renderScript as r, $$AppLayout as t };
