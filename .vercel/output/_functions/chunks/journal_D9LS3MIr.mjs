import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { n as supabase, t as $$AppLayout } from "./AppLayout_BkfgsvN2.mjs";
import { useEffect, useState } from "react";
import { Award, Image, Loader2, MessageCircle, Sparkles, Star } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/Journal.jsx
function Journal() {
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState(null);
	const [partnerProfile, setPartnerProfile] = useState(null);
	const [stats, setStats] = useState({
		daysTogether: 0,
		weeklyChallenges: 0,
		weeklyPhotos: 0,
		weeklyMessages: 0,
		recentSouvenirs: []
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
		await loadWeeklyJournal(session.user.id);
	}
	async function loadWeeklyJournal(userId) {
		try {
			const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", userId).single();
			setProfile(userProfile);
			const { data: partners } = await supabase.from("profiles").select("*").eq("couple_id", userProfile.couple_id).neq("id", userId);
			let currentPartner = null;
			if (partners && partners.length > 0) {
				currentPartner = partners[0];
				setPartnerProfile(currentPartner);
			}
			if (userProfile.couple_id) {
				const { data: couple } = await supabase.from("couples").select("*").eq("id", userProfile.couple_id).single();
				const days = Math.ceil(Math.abs((/* @__PURE__ */ new Date()).getTime() - new Date(couple.anniversary_date || couple.created_at).getTime()) / (1e3 * 60 * 60 * 24));
				const sevenDaysAgo = /* @__PURE__ */ new Date();
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
				const isoString = sevenDaysAgo.toISOString();
				const { data: attempts } = await supabase.from("quest_attempts").select("*").eq("couple_id", userProfile.couple_id).gte("completed_at", isoString);
				const { data: weeklySouv } = await supabase.from("souvenirs").select("*").eq("couple_id", userProfile.couple_id).gte("souvenir_date", isoString.split("T")[0]);
				const { count: msgCount } = await supabase.from("messages").select("*", {
					count: "exact",
					head: true
				}).eq("couple_id", userProfile.couple_id).gte("created_at", isoString);
				setStats({
					daysTogether: days,
					weeklyChallenges: attempts ? attempts.length : 0,
					weeklyPhotos: weeklySouv ? weeklySouv.length : 0,
					weeklyMessages: msgCount || 0,
					recentSouvenirs: weeklySouv || []
				});
			}
			setLoading(false);
		} catch (err) {
			console.error("Error loading weekly journal:", err);
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
			children: "Préparation de votre Journal Hebdomadaire..."
		})]
	});
	const getWeeklyCommentary = () => {
		const totalActivity = stats.weeklyChallenges + stats.weeklyPhotos + (stats.weeklyMessages > 10 ? 1 : 0);
		if (totalActivity >= 5) return "Une semaine fantastique de connexion et de partage ! Votre flamme rayonne de mille feux. Continuez à prendre soin l'un de l'autre ! ✨";
		else if (totalActivity >= 2) return "Une belle semaine complice. Vous trouvez toujours du temps pour vous lier au milieu du quotidien. C'est précieux. ❤️";
		else return "Une semaine un peu plus calme. C'est le moment idéal pour s'envoyer un mot doux ou planifier un rendez-vous surprise ! 🌸";
	};
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
						children: "📖"
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "Journal de Couple" }), /* @__PURE__ */ jsx("p", {
						className: "days-together",
						children: "Votre rétrospective hebdomadaire"
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
					padding: "2rem 1.5rem",
					gap: "1.5rem",
					background: "linear-gradient(135deg, rgba(169, 27, 34, 0.02) 0%, rgba(169, 27, 34, 0.06) 100%)",
					border: "1px solid rgba(169, 27, 34, 0.1)"
				},
				children: [
					/* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							alignItems: "center"
						},
						children: [
							/* @__PURE__ */ jsx(Sparkles, {
								size: 36,
								color: "var(--color-primary)",
								style: { animation: "bounce 2s infinite" }
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "title-cursive",
								style: {
									fontSize: "2.4rem",
									margin: "8px 0 0 0"
								},
								children: "Bilan de la Semaine"
							}),
							/* @__PURE__ */ jsx("p", {
								style: {
									fontSize: "0.85rem",
									color: "var(--color-text-light)",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "1px"
								},
								children: "Rétrospective Univers"
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "weekly-stats-grid",
						style: {
							display: "grid",
							gridTemplateColumns: "repeat(3, 1fr)",
							gap: "12px",
							width: "100%",
							marginTop: "0.5rem"
						},
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "stat-card",
								style: {
									padding: "12px 6px",
									background: "white",
									borderRadius: "12px",
									border: "1px solid rgba(169,27,34,0.05)",
									boxShadow: "var(--shadow-sm)"
								},
								children: [
									/* @__PURE__ */ jsx(Award, {
										size: 20,
										color: "var(--color-primary)",
										style: { margin: "0 auto 6px auto" }
									}),
									/* @__PURE__ */ jsx("h4", {
										style: {
											margin: 0,
											fontSize: "1.2rem",
											fontWeight: 800
										},
										children: stats.weeklyChallenges
									}),
									/* @__PURE__ */ jsx("p", {
										style: {
											margin: 0,
											fontSize: "0.75rem",
											color: "var(--color-text-light)"
										},
										children: "Défis relevés"
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "stat-card",
								style: {
									padding: "12px 6px",
									background: "white",
									borderRadius: "12px",
									border: "1px solid rgba(169,27,34,0.05)",
									boxShadow: "var(--shadow-sm)"
								},
								children: [
									/* @__PURE__ */ jsx(Image, {
										size: 20,
										color: "var(--color-primary)",
										style: { margin: "0 auto 6px auto" }
									}),
									/* @__PURE__ */ jsx("h4", {
										style: {
											margin: 0,
											fontSize: "1.2rem",
											fontWeight: 800
										},
										children: stats.weeklyPhotos
									}),
									/* @__PURE__ */ jsx("p", {
										style: {
											margin: 0,
											fontSize: "0.75rem",
											color: "var(--color-text-light)"
										},
										children: "Nouveaux souvenirs"
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "stat-card",
								style: {
									padding: "12px 6px",
									background: "white",
									borderRadius: "12px",
									border: "1px solid rgba(169,27,34,0.05)",
									boxShadow: "var(--shadow-sm)"
								},
								children: [
									/* @__PURE__ */ jsx(MessageCircle, {
										size: 20,
										color: "var(--color-primary)",
										style: { margin: "0 auto 6px auto" }
									}),
									/* @__PURE__ */ jsx("h4", {
										style: {
											margin: 0,
											fontSize: "1.2rem",
											fontWeight: 800
										},
										children: stats.weeklyMessages
									}),
									/* @__PURE__ */ jsx("p", {
										style: {
											margin: 0,
											fontSize: "0.75rem",
											color: "var(--color-text-light)"
										},
										children: "Messages échangés"
									})
								]
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "weekly-commentary",
						style: {
							backgroundColor: "white",
							padding: "15px",
							borderRadius: "16px",
							border: "1px dashed rgba(169, 27, 34, 0.2)",
							fontSize: "0.95rem",
							color: "var(--color-text)",
							lineHeight: "1.5"
						},
						children: /* @__PURE__ */ jsx("p", {
							style: {
								margin: 0,
								fontStyle: "italic"
							},
							children: getWeeklyCommentary()
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "weekly-souvenirs-section",
				style: { marginTop: "1.5rem" },
				children: [/* @__PURE__ */ jsxs("h3", {
					style: {
						fontSize: "1.2rem",
						color: "var(--color-text)",
						fontWeight: 700,
						marginBottom: "12px",
						display: "flex",
						alignItems: "center",
						gap: "8px"
					},
					children: [/* @__PURE__ */ jsx(Star, {
						size: 18,
						color: "var(--color-primary)"
					}), "Moments forts de la semaine"]
				}), stats.recentSouvenirs.length === 0 ? /* @__PURE__ */ jsx("div", {
					className: "card text-center",
					style: { padding: "2rem 1rem" },
					children: /* @__PURE__ */ jsx("p", {
						style: {
							margin: 0,
							color: "var(--color-text-light)",
							fontSize: "0.9rem"
						},
						children: "Aucun souvenir créé cette semaine. Ajoutez vos photos dans l'onglet Souvenirs pour enrichir votre journal !"
					})
				}) : /* @__PURE__ */ jsx("div", {
					className: "recent-souvenirs-list flex-col",
					style: { gap: "12px" },
					children: stats.recentSouvenirs.map((souv) => /* @__PURE__ */ jsxs("div", {
						className: "card souvenir-horizontal-card",
						style: {
							display: "flex",
							gap: "12px",
							padding: "10px",
							alignItems: "center",
							border: "1px solid rgba(169,27,34,0.05)"
						},
						children: [/* @__PURE__ */ jsx("div", {
							className: "souv-thumb",
							style: {
								width: "60px",
								height: "60px",
								borderRadius: "8px",
								backgroundImage: `url(${souv.media_url})`,
								backgroundSize: "cover",
								backgroundPosition: "center",
								flexShrink: 0
							}
						}), /* @__PURE__ */ jsxs("div", {
							style: { flexGrow: 1 },
							children: [/* @__PURE__ */ jsx("h4", {
								style: {
									margin: 0,
									fontSize: "1rem",
									fontWeight: 700,
									color: "var(--color-text)"
								},
								children: souv.title
							}), /* @__PURE__ */ jsxs("p", {
								style: {
									margin: "2px 0 0 0",
									fontSize: "0.8rem",
									color: "var(--color-text-light)"
								},
								children: [
									"📍 ",
									souv.location_name,
									" • ",
									new Date(souv.souvenir_date).toLocaleDateString([], {
										day: "numeric",
										month: "short"
									})
								]
							})]
						})]
					}, souv.id))
				})]
			})
		]
	});
}
//#endregion
//#region src/pages/journal.astro
var journal_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Journal,
	file: () => $$file,
	url: () => $$url
});
var $$Journal = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Notre Journal Hebdomadaire" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "JournalComponent", Journal, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/PC/Desktop/univers/src/components/Journal.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "C:/Users/PC/Desktop/univers/src/pages/journal.astro", void 0);
var $$file = "C:/Users/PC/Desktop/univers/src/pages/journal.astro";
var $$url = "/journal";
//#endregion
//#region \0virtual:astro:page:src/pages/journal@_@astro
var page = () => journal_exports;
//#endregion
export { page };
