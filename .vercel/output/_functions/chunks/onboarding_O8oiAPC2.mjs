import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, m as maybeRenderHead, u as renderTemplate } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { r as renderScript, t as $$AppLayout } from "./AppLayout_BkfgsvN2.mjs";
import { ArrowLeft, Copy, HeartHandshake, Loader2 } from "lucide-react";
//#region src/pages/onboarding.astro
var onboarding_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Onboarding,
	file: () => $$file,
	url: () => $$url
});
var $$Onboarding = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, {
		"title": "Créer votre Univers",
		"data-astro-cid-kzxu644f": true
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div id="onboarding-loading" class="loading-screen" data-astro-cid-kzxu644f><div class="spinner-container" data-astro-cid-kzxu644f>${renderComponent($$result, "Loader2", Loader2, {
		"class": "spinner",
		"size": 48,
		"color": "var(--color-primary)",
		"data-astro-cid-kzxu644f": true
	})}<p data-astro-cid-kzxu644f>Vérification de votre Univers...</p></div></div><div class="onboarding-container" data-astro-cid-kzxu644f><header class="top-nav" data-astro-cid-kzxu644f><a href="/" id="btn-back" class="back-btn" data-astro-cid-kzxu644f>${renderComponent($$result, "ArrowLeft", ArrowLeft, {
		"size": 24,
		"data-astro-cid-kzxu644f": true
	})}</a><h2 class="title-cursive" data-astro-cid-kzxu644f>Connexion</h2></header><div class="content" data-astro-cid-kzxu644f><div class="icon-wrapper" data-astro-cid-kzxu644f>${renderComponent($$result, "HeartHandshake", HeartHandshake, {
		"size": 64,
		"color": "var(--color-primary)",
		"data-astro-cid-kzxu644f": true
	})}</div><h1 class="main-title" data-astro-cid-kzxu644f>Liez vos cœurs</h1><p class="description" data-astro-cid-kzxu644f>Pour commencer l'expérience Univers, vous devez vous connecter à votre partenaire.</p><div class="code-section" data-astro-cid-kzxu644f><h3 data-astro-cid-kzxu644f>Votre code d'invitation</h3><div class="code-display" data-astro-cid-kzxu644f><span id="invitation-code" class="code" data-astro-cid-kzxu644f>CHARGEMENT...</span><button id="copy-btn" class="btn-copy" data-astro-cid-kzxu644f>${renderComponent($$result, "Copy", Copy, {
		"size": 16,
		"data-astro-cid-kzxu644f": true
	})}<span data-astro-cid-kzxu644f>Copier</span></button></div><button id="share-btn" class="btn btn-secondary share-btn hidden" style="margin-top: 10px; width: 100%;" data-astro-cid-kzxu644f>Partager l'invitation</button><div class="qr-section" style="display: flex; flex-direction: column; align-items: center; margin-top: 1.2rem;" data-astro-cid-kzxu644f><div class="qr-card" style="background: white; padding: 10px; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid rgba(169,27,34,0.1);" data-astro-cid-kzxu644f><img id="qr-image" src="" alt="QR Code d'invitation" style="width: 140px; height: 140px; display: block;" class="hidden" data-astro-cid-kzxu644f><div id="qr-loader" style="width: 140px; height: 140px; display: flex; align-items: center; justify-content: center;" data-astro-cid-kzxu644f>${renderComponent($$result, "Loader2", Loader2, {
		"class": "spinner",
		"size": 24,
		"data-astro-cid-kzxu644f": true
	})}</div></div><p class="help-text" style="margin-top: 8px;" data-astro-cid-kzxu644f>Faites scanner ce code à votre partenaire pour vous lier instantanément.</p></div></div><div class="divider" data-astro-cid-kzxu644f><span data-astro-cid-kzxu644f>OU</span></div><div class="input-section" data-astro-cid-kzxu644f><h3 data-astro-cid-kzxu644f>J'ai une invitation</h3><input type="text" id="code-input" placeholder="Entrez le code ici... (ex: UNI-ABCD-EFGH)" class="code-input" data-astro-cid-kzxu644f><div id="onboarding-error" class="error-message hidden" data-astro-cid-kzxu644f></div><button id="join-btn" class="btn btn-primary join-btn" data-astro-cid-kzxu644f><span data-astro-cid-kzxu644f>Rejoindre l'Univers</span>${renderComponent($$result, "Loader2", Loader2, {
		"id": "join-spinner",
		"class": "spinner hidden",
		"size": 18,
		"data-astro-cid-kzxu644f": true
	})}</button></div></div></div>` })}${renderScript($$result, "C:/Users/PC/Desktop/univers/src/pages/onboarding.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/PC/Desktop/univers/src/pages/onboarding.astro", void 0);
var $$file = "C:/Users/PC/Desktop/univers/src/pages/onboarding.astro";
var $$url = "/onboarding";
//#endregion
//#region \0virtual:astro:page:src/pages/onboarding@_@astro
var page = () => onboarding_exports;
//#endregion
export { page };
