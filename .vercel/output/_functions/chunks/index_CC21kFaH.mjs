import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, m as maybeRenderHead, u as renderTemplate } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { r as renderScript, t as $$AppLayout } from "./AppLayout_BkfgsvN2.mjs";
import { Loader2, Lock, Mail, Sparkles } from "lucide-react";
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
var $$Index = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, {
		"title": "Accueil",
		"data-astro-cid-lcdefpme": true
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="landing-container" data-astro-cid-lcdefpme><!-- Loading Screen --><div id="loading-screen" class="loading-screen" data-astro-cid-lcdefpme><div class="spinner-container" data-astro-cid-lcdefpme>${renderComponent($$result, "Loader2", Loader2, {
		"class": "spinner",
		"size": 48,
		"color": "var(--color-primary)",
		"data-astro-cid-lcdefpme": true
	})}<p data-astro-cid-lcdefpme>Chargement de votre Univers...</p></div></div><!-- Landing Content --><div class="header" data-astro-cid-lcdefpme><h1 class="logo-text title-cursive" data-astro-cid-lcdefpme>Univers</h1><p class="slogan" data-astro-cid-lcdefpme>Chaque geste d'amour nourrit votre flamme.</p></div><div class="flame-illustration" data-astro-cid-lcdefpme><div class="flame-spark" data-astro-cid-lcdefpme>🔥</div><div class="flame-glow" data-astro-cid-lcdefpme></div></div><div class="actions" data-astro-cid-lcdefpme><button id="btn-show-signup" class="btn btn-primary" data-astro-cid-lcdefpme>${renderComponent($$result, "Sparkles", Sparkles, {
		"size": 18,
		"data-astro-cid-lcdefpme": true
	})}Créer un Univers</button><button id="btn-show-login" class="btn btn-secondary" data-astro-cid-lcdefpme>J'ai déjà un compte</button></div><!-- Auth Modal --><div id="auth-modal" class="modal-overlay hidden" data-astro-cid-lcdefpme><div class="modal-card" data-astro-cid-lcdefpme><div class="modal-header" data-astro-cid-lcdefpme><h2 id="modal-title" class="title-cursive" data-astro-cid-lcdefpme>Rejoindre l'Univers</h2><button id="btn-close-modal" class="close-btn" data-astro-cid-lcdefpme>&times;</button></div><form id="auth-form" class="auth-form" data-astro-cid-lcdefpme><div class="input-group" data-astro-cid-lcdefpme><label for="email" data-astro-cid-lcdefpme>${renderComponent($$result, "Mail", Mail, {
		"size": 16,
		"data-astro-cid-lcdefpme": true
	})} Email</label><input type="email" id="email" required placeholder="amour@exemple.com" data-astro-cid-lcdefpme></div><div class="input-group" data-astro-cid-lcdefpme><label for="password" data-astro-cid-lcdefpme>${renderComponent($$result, "Lock", Lock, {
		"size": 16,
		"data-astro-cid-lcdefpme": true
	})} Mot de passe</label><input type="password" id="password" required placeholder="••••••••" minlength="6" data-astro-cid-lcdefpme></div><div id="auth-error" class="error-message hidden" data-astro-cid-lcdefpme></div><button type="submit" id="btn-submit-auth" class="btn btn-primary submit-btn" data-astro-cid-lcdefpme><span id="submit-btn-text" data-astro-cid-lcdefpme>Se connecter</span>${renderComponent($$result, "Loader2", Loader2, {
		"id": "submit-spinner",
		"class": "spinner hidden",
		"size": 18,
		"data-astro-cid-lcdefpme": true
	})}</button></form></div></div></div>` })}${renderScript($$result, "C:/Users/PC/Desktop/univers/src/pages/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/PC/Desktop/univers/src/pages/index.astro", void 0);
var $$file = "C:/Users/PC/Desktop/univers/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
