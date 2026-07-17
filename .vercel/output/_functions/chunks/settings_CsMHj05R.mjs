import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { n as supabase, t as $$AppLayout } from "./AppLayout_BkfgsvN2.mjs";
import { useEffect, useState } from "react";
import { Award, Calendar, Heart, Loader2, ShieldAlert } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/Settings.jsx
var THEMES = [
	{
		name: "Rose Romantique",
		id: "theme-romantic",
		primary: "#a91b22",
		bg: "#fdf5f5"
	},
	{
		name: "Bleu Nuit",
		id: "theme-night",
		primary: "#0f4c81",
		bg: "#f0f4f8"
	},
	{
		name: "Crémeux Chaleureux",
		id: "theme-warm",
		primary: "#8d5b4c",
		bg: "#FAF8F5"
	}
];
function Settings$1() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [couple, setCouple] = useState(null);
	const [displayName, setDisplayName] = useState("");
	const [anniversaryDate, setAnniversaryDate] = useState("");
	const [selectedTheme, setSelectedTheme] = useState("theme-romantic");
	const [updating, setUpdating] = useState(false);
	const [deleting, setDeleting] = useState(false);
	useEffect(() => {
		checkUser();
	}, []);
	async function checkUser() {
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) {
			window.location.href = "/";
			return;
		}
		setUser(session.user);
		const activeTheme = localStorage.getItem("univers-theme") || "theme-romantic";
		setSelectedTheme(activeTheme);
		await loadSettingsData(session.user.id);
	}
	async function loadSettingsData(userId) {
		try {
			const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", userId).single();
			setProfile(userProfile);
			setDisplayName(userProfile.display_name || "");
			if (userProfile.couple_id) {
				const { data: coupleDetails } = await supabase.from("couples").select("*").eq("id", userProfile.couple_id).single();
				setCouple(coupleDetails);
				if (coupleDetails.anniversary_date) setAnniversaryDate(coupleDetails.anniversary_date);
			}
			setLoading(false);
		} catch (err) {
			console.error(err);
			setLoading(false);
		}
	}
	const handleSaveSettings = async (e) => {
		e.preventDefault();
		if (updating) return;
		setUpdating(true);
		try {
			const { error: profileErr } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", user.id);
			if (profileErr) throw profileErr;
			if (couple && anniversaryDate) {
				const { error: coupleErr } = await supabase.from("couples").update({ anniversary_date: anniversaryDate }).eq("id", couple.id);
				if (coupleErr) throw coupleErr;
			}
			localStorage.setItem("univers-theme", selectedTheme);
			applyThemeStyles(selectedTheme);
			alert("Réglages sauvegardés avec succès !");
		} catch (err) {
			console.error(err);
			alert("Une erreur est survenue lors de la sauvegarde.");
		} finally {
			setUpdating(false);
		}
	};
	const applyThemeStyles = (themeId) => {
		const root = document.documentElement;
		if (themeId === "theme-night") {
			root.style.setProperty("--color-primary", "#0f4c81");
			root.style.setProperty("--color-primary-light", "#1a6fa0");
			root.style.setProperty("--color-background", "#f0f4f8");
		} else if (themeId === "theme-warm") {
			root.style.setProperty("--color-primary", "#8d5b4c");
			root.style.setProperty("--color-primary-light", "#a56f5e");
			root.style.setProperty("--color-background", "#FAF8F5");
		} else {
			root.style.setProperty("--color-primary", "#a91b22");
			root.style.setProperty("--color-primary-light", "#c8232b");
			root.style.setProperty("--color-background", "#fdf5f5");
		}
	};
	const handleSelectTheme = (themeId) => {
		setSelectedTheme(themeId);
		applyThemeStyles(themeId);
	};
	const handleDeleteAccount = async () => {
		if (!window.confirm("⚠️ ATTENTION : Êtes-vous sûr(e) de vouloir supprimer votre compte Univers ? Cette action effacera définitivement votre profil, votre couple et tous vos souvenirs partagés.")) return;
		setDeleting(true);
		try {
			if (couple) await supabase.from("couples").delete().eq("id", couple.id);
			await supabase.auth.signOut();
			window.location.href = "/";
		} catch (err) {
			console.error(err);
			alert("Erreur lors de la suppression.");
		} finally {
			setDeleting(false);
		}
	};
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
			children: "Chargement de vos réglages..."
		})]
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "dashboard-container",
		style: { paddingBottom: "3rem" },
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "dashboard-header",
				style: { marginBottom: "1.5rem" },
				children: [/* @__PURE__ */ jsxs("div", {
					className: "couple-info",
					children: [/* @__PURE__ */ jsx("div", {
						className: "avatar",
						children: "⚙️"
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "Réglages & Options" }), /* @__PURE__ */ jsx("p", {
						className: "days-together",
						children: "Gérez votre expérience Univers"
					})] })]
				}), /* @__PURE__ */ jsx("a", {
					href: "/dashboard",
					className: "icon-btn",
					title: "Retour à l'Univers",
					children: "🔥"
				})]
			}),
			/* @__PURE__ */ jsxs("form", {
				onSubmit: handleSaveSettings,
				className: "card flex-col",
				style: {
					gap: "1.5rem",
					marginBottom: "1.5rem"
				},
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "title-cursive",
						style: {
							fontSize: "2rem",
							borderBottom: "1px solid rgba(169,27,34,0.1)",
							paddingBottom: "8px"
						},
						children: "Profil & Couple"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "input-group flex-col",
						style: { gap: "6px" },
						children: [/* @__PURE__ */ jsx("label", {
							style: {
								fontSize: "0.85rem",
								fontWeight: 700,
								color: "var(--color-text)"
							},
							children: "Votre Nom d'affichage"
						}), /* @__PURE__ */ jsx("input", {
							type: "text",
							value: displayName,
							onChange: (e) => setDisplayName(e.target.value),
							style: {
								padding: "10px 14px",
								borderRadius: "10px",
								border: "1px solid rgba(169,27,34,0.15)",
								fontSize: "0.95rem"
							},
							required: true
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "input-group flex-col",
						style: { gap: "6px" },
						children: [/* @__PURE__ */ jsx("label", {
							style: {
								fontSize: "0.85rem",
								fontWeight: 700,
								color: "var(--color-text)"
							},
							children: "Date d'anniversaire du couple"
						}), /* @__PURE__ */ jsx("input", {
							type: "date",
							value: anniversaryDate,
							onChange: (e) => setAnniversaryDate(e.target.value),
							style: {
								padding: "10px 14px",
								borderRadius: "10px",
								border: "1px solid rgba(169,27,34,0.15)",
								fontSize: "0.95rem"
							}
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "theme-selection-area flex-col",
						style: { gap: "8px" },
						children: [/* @__PURE__ */ jsx("label", {
							style: {
								fontSize: "0.85rem",
								fontWeight: 700,
								color: "var(--color-text)"
							},
							children: "Personnalisation (Thème visuel)"
						}), /* @__PURE__ */ jsx("div", {
							style: {
								display: "grid",
								gridTemplateColumns: "repeat(3, 1fr)",
								gap: "8px"
							},
							children: THEMES.map((theme) => /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => handleSelectTheme(theme.id),
								style: {
									padding: "12px 6px",
									borderRadius: "12px",
									border: selectedTheme === theme.id ? "2px solid var(--color-primary)" : "1px solid rgba(0,0,0,0.1)",
									backgroundColor: theme.bg,
									cursor: "pointer",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: "6px",
									boxShadow: "none"
								},
								children: [/* @__PURE__ */ jsx("div", { style: {
									width: "20px",
									height: "20px",
									borderRadius: "50%",
									backgroundColor: theme.primary
								} }), /* @__PURE__ */ jsx("span", {
									style: {
										fontSize: "0.75rem",
										fontWeight: 600,
										color: "#333"
									},
									children: theme.name
								})]
							}, theme.id))
						})]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "submit",
						disabled: updating,
						className: "btn flex-center",
						style: { width: "100%" },
						children: [/* @__PURE__ */ jsx("span", { children: "Sauvegarder les Réglages" }), updating && /* @__PURE__ */ jsx(Loader2, {
							className: "spinner",
							size: 18
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "card flex-col",
				style: {
					gap: "12px",
					marginBottom: "1.5rem"
				},
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "title-cursive",
						style: {
							fontSize: "2rem",
							borderBottom: "1px solid rgba(169,27,34,0.1)",
							paddingBottom: "8px"
						},
						children: "Navigation Rapide"
					}),
					/* @__PURE__ */ jsxs("a", {
						href: "/love-languages",
						className: "settings-link-row",
						style: {
							display: "flex",
							alignItems: "center",
							gap: "12px",
							padding: "12px",
							backgroundColor: "rgba(169,27,34,0.02)",
							borderRadius: "12px",
							border: "1px solid rgba(169,27,34,0.05)",
							textDecoration: "none",
							color: "var(--color-text)"
						},
						children: [
							/* @__PURE__ */ jsx(Heart, {
								size: 20,
								color: "var(--color-primary)"
							}),
							/* @__PURE__ */ jsxs("div", {
								style: { flexGrow: 1 },
								children: [/* @__PURE__ */ jsx("h4", {
									style: {
										margin: 0,
										fontSize: "0.95rem",
										fontWeight: 700
									},
									children: "Langages de l'amour"
								}), /* @__PURE__ */ jsx("p", {
									style: {
										margin: 0,
										fontSize: "0.75rem",
										color: "var(--color-text-light)"
									},
									children: "Remplir le questionnaire"
								})]
							}),
							/* @__PURE__ */ jsx("span", { children: "→" })
						]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: "/badges",
						className: "settings-link-row",
						style: {
							display: "flex",
							alignItems: "center",
							gap: "12px",
							padding: "12px",
							backgroundColor: "rgba(169,27,34,0.02)",
							borderRadius: "12px",
							border: "1px solid rgba(169,27,34,0.05)",
							textDecoration: "none",
							color: "var(--color-text)"
						},
						children: [
							/* @__PURE__ */ jsx(Award, {
								size: 20,
								color: "var(--color-primary)"
							}),
							/* @__PURE__ */ jsxs("div", {
								style: { flexGrow: 1 },
								children: [/* @__PURE__ */ jsx("h4", {
									style: {
										margin: 0,
										fontSize: "0.95rem",
										fontWeight: 700
									},
									children: "Badges & Succès"
								}), /* @__PURE__ */ jsx("p", {
									style: {
										margin: 0,
										fontSize: "0.75rem",
										color: "var(--color-text-light)"
									},
									children: "Voir vos récompenses"
								})]
							}),
							/* @__PURE__ */ jsx("span", { children: "→" })
						]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: "/journal",
						className: "settings-link-row",
						style: {
							display: "flex",
							alignItems: "center",
							gap: "12px",
							padding: "12px",
							backgroundColor: "rgba(169,27,34,0.02)",
							borderRadius: "12px",
							border: "1px solid rgba(169,27,34,0.05)",
							textDecoration: "none",
							color: "var(--color-text)"
						},
						children: [
							/* @__PURE__ */ jsx(Calendar, {
								size: 20,
								color: "var(--color-primary)"
							}),
							/* @__PURE__ */ jsxs("div", {
								style: { flexGrow: 1 },
								children: [/* @__PURE__ */ jsx("h4", {
									style: {
										margin: 0,
										fontSize: "0.95rem",
										fontWeight: 700
									},
									children: "Journal Hebdomadaire"
								}), /* @__PURE__ */ jsx("p", {
									style: {
										margin: 0,
										fontSize: "0.75rem",
										color: "var(--color-text-light)"
									},
									children: "Bilan automatique de la semaine"
								})]
							}),
							/* @__PURE__ */ jsx("span", { children: "→" })
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "card flex-col",
				style: {
					gap: "12px",
					border: "1px solid #c62828",
					backgroundColor: "rgba(198, 40, 40, 0.02)"
				},
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "title-cursive",
						style: {
							fontSize: "2rem",
							color: "#c62828",
							borderBottom: "1px solid rgba(198,40,40,0.1)",
							paddingBottom: "8px"
						},
						children: "Zone de Danger"
					}),
					/* @__PURE__ */ jsx("p", {
						style: {
							margin: 0,
							fontSize: "0.85rem",
							color: "var(--color-text-light)",
							lineHeight: "1.4"
						},
						children: "La suppression de compte effacera toutes les données partagées par votre couple. Cette action est irréversible."
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: handleDeleteAccount,
						disabled: deleting,
						className: "btn btn-secondary flex-center",
						style: {
							width: "100%",
							borderColor: "#c62828",
							color: "#c62828",
							backgroundColor: "transparent"
						},
						children: [
							/* @__PURE__ */ jsx(ShieldAlert, { size: 18 }),
							/* @__PURE__ */ jsx("span", { children: "Supprimer mon Compte & Données" }),
							deleting && /* @__PURE__ */ jsx(Loader2, {
								className: "spinner",
								size: 18
							})
						]
					})
				]
			})
		]
	});
}
//#endregion
//#region src/pages/settings.astro
var settings_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Settings,
	file: () => $$file,
	url: () => $$url
});
var $$Settings = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Nos Réglages" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "SettingsComponent", Settings$1, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/PC/Desktop/univers/src/components/Settings.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "C:/Users/PC/Desktop/univers/src/pages/settings.astro", void 0);
var $$file = "C:/Users/PC/Desktop/univers/src/pages/settings.astro";
var $$url = "/settings";
//#endregion
//#region \0virtual:astro:page:src/pages/settings@_@astro
var page = () => settings_exports;
//#endregion
export { page };
