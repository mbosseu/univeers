import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { n as supabase, t as $$AppLayout } from "./AppLayout_BkfgsvN2.mjs";
import { useEffect, useState } from "react";
import { Loader2, Lock, Trophy } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/BadgesList.jsx
var BADGE_DEFINITIONS = [
	{
		id: "first_steps",
		title: "Premiers pas 👣",
		description: "Créer votre couple dans Univers.",
		icon: "✨",
		check: () => true
	},
	{
		id: "complicity",
		title: "Complicité 💬",
		description: "Répondre à votre première question du jour.",
		icon: "❤️",
		check: (stats) => stats.responsesCount >= 1
	},
	{
		id: "adventurers",
		title: "Aventuriers 🗺️",
		description: "Enregistrer votre premier souvenir commun.",
		icon: "📸",
		check: (stats) => stats.souvenirsCount >= 1
	},
	{
		id: "first_month",
		title: "Premier mois 🎂",
		description: "Atteindre 30 jours de relation sur l'application.",
		icon: "📅",
		check: (stats) => stats.daysTogether >= 30
	},
	{
		id: "gold_standard",
		title: "365 jours 🌟",
		description: "Célébrer un an ensemble.",
		icon: "👑",
		check: (stats) => stats.daysTogether >= 365
	},
	{
		id: "super_responders",
		title: "100 questions 🧠",
		description: "Répondre à 100 questions complices.",
		icon: "💡",
		check: (stats) => stats.responsesCount >= 100
	},
	{
		id: "quest_masters",
		title: "100 défis ⚔️",
		description: "Relever 100 défis de couple.",
		icon: "🏆",
		check: (stats) => stats.attemptsCount >= 100
	},
	{
		id: "chatty_couple",
		title: "1000 messages 💬",
		description: "Échanger 1000 messages de discussion.",
		icon: "✉️",
		check: (stats) => stats.messagesCount >= 1e3
	},
	{
		id: "album_lovers",
		title: "100 souvenirs 📸",
		description: "Garder 100 précieux souvenirs dans votre album.",
		icon: "🖼️",
		check: (stats) => stats.souvenirsCount >= 100
	}
];
function BadgesList() {
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState({
		daysTogether: 0,
		responsesCount: 0,
		souvenirsCount: 0,
		attemptsCount: 0,
		messagesCount: 0
	});
	useEffect(() => {
		checkUser();
	}, []);
	async function checkUser() {
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) {
			window.location.href = "/";
			return;
		}
		await loadStats(session.user.id);
	}
	async function loadStats(userId) {
		try {
			const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
			if (profile && profile.couple_id) {
				const { data: couple } = await supabase.from("couples").select("*").eq("id", profile.couple_id).single();
				const days = Math.ceil(Math.abs((/* @__PURE__ */ new Date()).getTime() - new Date(couple.anniversary_date || couple.created_at).getTime()) / (1e3 * 60 * 60 * 24));
				const { count: respCount } = await supabase.from("daily_responses").select("*", {
					count: "exact",
					head: true
				}).eq("user_id", userId);
				const { count: souvCount } = await supabase.from("souvenirs").select("*", {
					count: "exact",
					head: true
				}).eq("couple_id", profile.couple_id);
				const { count: attCount } = await supabase.from("quest_attempts").select("*", {
					count: "exact",
					head: true
				}).eq("couple_id", profile.couple_id);
				const { count: msgCount } = await supabase.from("messages").select("*", {
					count: "exact",
					head: true
				}).eq("couple_id", profile.couple_id);
				setStats({
					daysTogether: days,
					responsesCount: respCount || 0,
					souvenirsCount: souvCount || 0,
					attemptsCount: attCount || 0,
					messagesCount: msgCount || 0
				});
			}
			setLoading(false);
		} catch (err) {
			console.error("Error loading stats for badges:", err);
			setLoading(false);
		}
	}
	if (loading) return /* @__PURE__ */ jsxs("div", {
		className: "flex-center",
		style: {
			minHeight: "80vh",
			flexDirection: "column",
			gap: "1rem"
		},
		children: [/* @__PURE__ */ jsx(Loader2, {
			className: "spinner",
			size: 48,
			color: "var(--color-primary)"
		}), /* @__PURE__ */ jsx("p", {
			style: {
				color: "var(--color-text-light)",
				fontWeight: 500
			},
			children: "Chargement de vos badges..."
		})]
	});
	const unlockedCount = BADGE_DEFINITIONS.filter((b) => b.check(stats)).length;
	return /* @__PURE__ */ jsxs("div", {
		className: "dashboard-container",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "dashboard-header",
				style: { marginBottom: "1.5rem" },
				children: [/* @__PURE__ */ jsxs("div", {
					className: "couple-info",
					children: [/* @__PURE__ */ jsx("div", {
						className: "avatar",
						children: "🏆"
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "Badges & Succès" }), /* @__PURE__ */ jsx("p", {
						className: "days-together",
						children: "Célébrez vos victoires complices"
					})] })]
				}), /* @__PURE__ */ jsx("a", {
					href: "/dashboard",
					className: "icon-btn",
					title: "Retour à l'Univers",
					children: "🔥"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "card text-center flex-col",
				style: {
					padding: "1.5rem",
					gap: "8px",
					marginBottom: "1.5rem",
					backgroundColor: "rgba(169, 27, 34, 0.03)",
					border: "1px solid rgba(169, 27, 34, 0.1)"
				},
				children: [/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "8px"
					},
					children: [/* @__PURE__ */ jsx(Trophy, {
						size: 20,
						color: "var(--color-primary)"
					}), /* @__PURE__ */ jsxs("span", {
						style: {
							fontWeight: 700,
							color: "var(--color-text)"
						},
						children: [
							"Badges déverrouillés : ",
							unlockedCount,
							" / ",
							BADGE_DEFINITIONS.length
						]
					})]
				}), /* @__PURE__ */ jsx("div", {
					style: {
						width: "100%",
						height: "8px",
						backgroundColor: "rgba(169, 27, 34, 0.1)",
						borderRadius: "4px",
						marginTop: "6px"
					},
					children: /* @__PURE__ */ jsx("div", { style: {
						width: `${unlockedCount / BADGE_DEFINITIONS.length * 100}%`,
						height: "100%",
						backgroundColor: "var(--color-primary)",
						borderRadius: "4px",
						transition: "width 0.5s ease-out"
					} })
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "badges-list-grid",
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					gap: "12px"
				},
				children: BADGE_DEFINITIONS.map((badge) => {
					const unlocked = badge.check(stats);
					return /* @__PURE__ */ jsxs("div", {
						className: `card badge-card-item ${unlocked ? "unlocked" : "locked"}`,
						style: {
							padding: "1.2rem 1rem",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							textAlign: "center",
							gap: "8px",
							border: unlocked ? "1px solid rgba(46, 125, 50, 0.15)" : "1px solid rgba(169,27,34,0.05)",
							backgroundColor: unlocked ? "var(--color-white)" : "rgba(169,27,34,0.01)",
							opacity: unlocked ? 1 : .7,
							filter: unlocked ? "none" : "grayscale(30%)",
							position: "relative"
						},
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "badge-visual",
								style: {
									fontSize: "2.5rem",
									width: "60px",
									height: "60px",
									borderRadius: "50%",
									backgroundColor: unlocked ? "rgba(46, 125, 50, 0.05)" : "rgba(169, 27, 34, 0.05)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: unlocked ? "0 4px 6px rgba(46, 125, 50, 0.1)" : "none"
								},
								children: badge.icon
							}),
							!unlocked && /* @__PURE__ */ jsx("div", {
								style: {
									position: "absolute",
									top: "10px",
									right: "10px",
									color: "var(--color-text-light)"
								},
								title: "Verrouillé",
								children: /* @__PURE__ */ jsx(Lock, { size: 14 })
							}),
							/* @__PURE__ */ jsx("h4", {
								style: {
									margin: 0,
									fontSize: "0.95rem",
									color: "var(--color-text)",
									fontWeight: 700
								},
								children: badge.title
							}),
							/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									fontSize: "0.75rem",
									color: "var(--color-text-light)",
									lineHeight: "1.4"
								},
								children: badge.description
							})
						]
					}, badge.id);
				})
			})
		]
	});
}
//#endregion
//#region src/pages/badges.astro
var badges_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Badges,
	file: () => $$file,
	url: () => $$url
});
var $$Badges = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Nos Succès & Badges" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "BadgesListComponent", BadgesList, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/PC/Desktop/univers/src/components/BadgesList.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "C:/Users/PC/Desktop/univers/src/pages/badges.astro", void 0);
var $$file = "C:/Users/PC/Desktop/univers/src/pages/badges.astro";
var $$url = "/badges";
//#endregion
//#region \0virtual:astro:page:src/pages/badges@_@astro
var page = () => badges_exports;
//#endregion
export { page };
