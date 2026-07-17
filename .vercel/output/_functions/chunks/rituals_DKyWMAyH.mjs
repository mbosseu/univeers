import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { n as supabase, t as $$AppLayout } from "./AppLayout_BkfgsvN2.mjs";
import { useEffect, useRef, useState } from "react";
import { Award, CalendarHeart, Heart, History, Loader2, Moon, Send, Sun, Sunset } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/Rituals.jsx
var ROMANTIC_QUOTES = [
	"Le plus grand bonheur après celui d'aimer, c'est de confesser son amour. - Gide",
	"Aimer, ce n'est pas se regarder l'un l'autre, c'est regarder ensemble dans la même direction. - Saint-Exupéry",
	"Il n'y a qu'un bonheur dans la vie, c'est d'aimer et d'être aimé. - George Sand",
	"Quand on aime quelqu'un, on l'aime tel qu'il est, et non tel qu'on voudrait qu'il soit. - Tolstoï",
	"Si je sais ce qu'est l'amour, c'est grâce à toi. - Hermann Hesse"
];
function Rituals() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [partnerProfile, setPartnerProfile] = useState(null);
	const [activeTab, setActiveTab] = useState("morning");
	const [quote, setQuote] = useState("");
	const [goalText, setGoalText] = useState("");
	const [goalSaved, setGoalSaved] = useState(false);
	const [savingGoal, setSavingGoal] = useState(false);
	const [sweetNote, setSweetNote] = useState("");
	const [notesList, setNotesList] = useState([]);
	const [sendingNote, setSendingNote] = useState(false);
	const [reflection1, setReflection1] = useState("");
	const [reflection2, setReflection2] = useState("");
	const [reflection3, setReflection3] = useState("");
	const [myReflection, setMyReflection] = useState(null);
	const [partnerReflection, setPartnerReflection] = useState(null);
	const [submittingReflection, setSubmittingReflection] = useState(false);
	const channelRefs = useRef([]);
	useEffect(() => {
		checkUser();
		return () => {
			channelRefs.current.forEach((c) => supabase.removeChannel(c));
		};
	}, []);
	async function checkUser() {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				window.location.href = "/";
				return;
			}
			setUser(session.user);
			const hour = (/* @__PURE__ */ new Date()).getHours();
			if (hour >= 5 && hour < 12) setActiveTab("morning");
			else if (hour >= 12 && hour < 18) setActiveTab("noon");
			else setActiveTab("evening");
			await loadData(session.user.id);
		} catch (err) {
			console.error(err);
			setLoading(false);
		}
	}
	async function loadData(userId) {
		try {
			const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", userId).single();
			setProfile(userProfile);
			const { data: partners } = await supabase.from("profiles").select("*").eq("couple_id", userProfile.couple_id).neq("id", userId);
			let currentPartner = null;
			if (partners && partners.length > 0) {
				currentPartner = partners[0];
				setPartnerProfile(currentPartner);
			}
			const day = (/* @__PURE__ */ new Date()).getDate();
			setQuote(ROMANTIC_QUOTES[day % ROMANTIC_QUOTES.length]);
			const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
			const { data: dailyGoal } = await supabase.from("couple_goals").select("*").eq("couple_id", userProfile.couple_id).eq("created_at", todayStr).maybeSingle();
			if (dailyGoal) {
				setGoalText(dailyGoal.goal_text);
				setGoalSaved(true);
			}
			const { data: notes } = await supabase.from("sweet_notes").select("*").eq("couple_id", userProfile.couple_id).order("created_at", { ascending: false });
			if (notes) setNotesList(notes);
			const { data: myRef } = await supabase.from("evening_reflections").select("*").eq("user_id", userId).eq("created_at", todayStr).maybeSingle();
			if (myRef) setMyReflection(myRef);
			if (currentPartner) {
				const { data: partRef } = await supabase.from("evening_reflections").select("*").eq("user_id", currentPartner.id).eq("created_at", todayStr).maybeSingle();
				if (partRef) setPartnerReflection(partRef);
			}
			if (userProfile.couple_id) {
				channelRefs.current.forEach((c) => supabase.removeChannel(c));
				channelRefs.current = [];
				const goalsChannel = supabase.channel("rituals_goals_realtime").on("postgres_changes", {
					event: "INSERT",
					schema: "public",
					table: "couple_goals",
					filter: `couple_id=eq.${userProfile.couple_id}`
				}, (payload) => {
					setGoalText(payload.new.goal_text);
					setGoalSaved(true);
				}).subscribe();
				const notesChannel = supabase.channel("rituals_notes_realtime").on("postgres_changes", {
					event: "INSERT",
					schema: "public",
					table: "sweet_notes",
					filter: `couple_id=eq.${userProfile.couple_id}`
				}, (payload) => {
					setNotesList((prev) => {
						if (prev.some((n) => n.id === payload.new.id)) return prev;
						return [payload.new, ...prev];
					});
				}).subscribe();
				const reflectionsChannel = supabase.channel("rituals_reflections_realtime").on("postgres_changes", {
					event: "INSERT",
					schema: "public",
					table: "evening_reflections",
					filter: `couple_id=eq.${userProfile.couple_id}`
				}, (payload) => {
					if (payload.new.user_id !== userId) setPartnerReflection(payload.new);
				}).subscribe();
				channelRefs.current = [
					goalsChannel,
					notesChannel,
					reflectionsChannel
				];
			}
			setLoading(false);
		} catch (err) {
			console.error("Error loading rituals data:", err);
			setLoading(false);
		}
	}
	const handleSaveGoal = async () => {
		if (!goalText.trim() || savingGoal) return;
		setSavingGoal(true);
		try {
			const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
			const { error } = await supabase.from("couple_goals").insert([{
				couple_id: profile.couple_id,
				creator_id: user.id,
				goal_text: goalText.trim(),
				created_at: todayStr
			}]);
			if (error) throw error;
			await awardCoupleRewards(10, 5);
			setGoalSaved(true);
		} catch (err) {
			console.error(err);
		} finally {
			setSavingGoal(false);
		}
	};
	const handleSendNote = async (e) => {
		e.preventDefault();
		if (!sweetNote.trim() || sendingNote) return;
		setSendingNote(true);
		try {
			const { data: newNote, error } = await supabase.from("sweet_notes").insert([{
				couple_id: profile.couple_id,
				sender_id: user.id,
				note_text: sweetNote.trim()
			}]).select().single();
			if (error) throw error;
			await awardCoupleRewards(5, 5);
			setNotesList((prev) => [newNote, ...prev]);
			setSweetNote("");
		} catch (err) {
			console.error(err);
		} finally {
			setSendingNote(false);
		}
	};
	const handleSendReflection = async (e) => {
		e.preventDefault();
		if (!reflection1.trim() || !reflection2.trim() || !reflection3.trim() || submittingReflection) return;
		setSubmittingReflection(true);
		try {
			const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
			const { data: myRef, error } = await supabase.from("evening_reflections").insert([{
				couple_id: profile.couple_id,
				user_id: user.id,
				answer_1: reflection1.trim(),
				answer_2: reflection2.trim(),
				answer_3: reflection3.trim(),
				created_at: todayStr
			}]).select().single();
			if (error) throw error;
			await awardCoupleRewards(20, 10);
			setMyReflection(myRef);
		} catch (err) {
			console.error(err);
		} finally {
			setSubmittingReflection(false);
		}
	};
	async function awardCoupleRewards(xpGained, energyGained) {
		try {
			const { data: currentCouple } = await supabase.from("couples").select("flame_xp, flame_energy").eq("id", profile.couple_id).single();
			if (currentCouple) await supabase.from("couples").update({
				flame_xp: currentCouple.flame_xp + xpGained,
				flame_energy: Math.min(100, currentCouple.flame_energy + energyGained)
			}).eq("id", profile.couple_id);
		} catch (err) {
			console.error("Error awarding rewards:", err);
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
			children: "Chargement de vos rituels..."
		})]
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "dashboard-container",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "dashboard-header",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "couple-info",
					children: [/* @__PURE__ */ jsx("div", {
						className: "avatar",
						children: "🌸"
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "Rituels du Jour" }), /* @__PURE__ */ jsx("p", {
						className: "days-together",
						children: "Nourrissez votre amour étape par étape"
					})] })]
				}), /* @__PURE__ */ jsx("a", {
					href: "/dashboard",
					className: "icon-btn",
					title: "Retour à l'Univers",
					children: "🔥"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "tabs-container",
				children: [
					/* @__PURE__ */ jsxs("button", {
						onClick: () => setActiveTab("morning"),
						className: `tab-btn ${activeTab === "morning" ? "active" : ""}`,
						children: [/* @__PURE__ */ jsx(Sun, { size: 18 }), /* @__PURE__ */ jsx("span", { children: "Matin" })]
					}),
					/* @__PURE__ */ jsxs("button", {
						onClick: () => setActiveTab("noon"),
						className: `tab-btn ${activeTab === "noon" ? "active" : ""}`,
						children: [/* @__PURE__ */ jsx(Sunset, { size: 18 }), /* @__PURE__ */ jsx("span", { children: "Midi" })]
					}),
					/* @__PURE__ */ jsxs("button", {
						onClick: () => setActiveTab("evening"),
						className: `tab-btn ${activeTab === "evening" ? "active" : ""}`,
						children: [/* @__PURE__ */ jsx(Moon, { size: 18 }), /* @__PURE__ */ jsx("span", { children: "Soir" })]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "tab-content",
				style: { marginTop: "1.5rem" },
				children: [
					activeTab === "morning" && /* @__PURE__ */ jsxs("div", {
						class: "card flex-col",
						style: { gap: "1.5rem" },
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "tab-intro",
								children: [/* @__PURE__ */ jsx("h3", {
									className: "title-cursive",
									style: { fontSize: "2.2rem" },
									children: "Bonjour ❤️"
								}), /* @__PURE__ */ jsx("p", { children: "Commencez la journée avec des pensées positives et un but commun." })]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "quote-box",
								children: [/* @__PURE__ */ jsx("span", {
									className: "quote-icon",
									children: "“"
								}), /* @__PURE__ */ jsx("p", {
									className: "quote-text",
									children: quote
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "goal-box flex-col",
								style: { gap: "0.8rem" },
								children: [
									/* @__PURE__ */ jsx("h4", { children: "Objectif complice du jour" }),
									/* @__PURE__ */ jsx("p", {
										style: {
											fontSize: "0.9rem",
											color: "var(--color-text-light)"
										},
										children: "Définissez un défi amical ou une petite attention à réaliser ensemble aujourd'hui."
									}),
									!goalSaved ? /* @__PURE__ */ jsxs("div", {
										class: "flex-col",
										style: { gap: "0.8rem" },
										children: [/* @__PURE__ */ jsx("input", {
											type: "text",
											className: "goal-input",
											value: goalText,
											onChange: (e) => setGoalText(e.target.value),
											placeholder: "Ex: S'appeler au moins 10 minutes ce soir..."
										}), /* @__PURE__ */ jsxs("button", {
											onClick: handleSaveGoal,
											disabled: savingGoal,
											className: "btn",
											children: [/* @__PURE__ */ jsx("span", { children: "Valider l'objectif (+10 XP)" }), savingGoal && /* @__PURE__ */ jsx(Loader2, {
												className: "spinner",
												size: 14
											})]
										})]
									}) : /* @__PURE__ */ jsxs("div", {
										className: "completed-badge",
										children: [/* @__PURE__ */ jsx(Heart, {
											size: 18,
											color: "#a91b22"
										}), /* @__PURE__ */ jsxs("span", { children: ["Objectif validé : ", /* @__PURE__ */ jsx("strong", { children: goalText })] })]
									})
								]
							})
						]
					}),
					activeTab === "noon" && /* @__PURE__ */ jsxs("div", {
						class: "card flex-col",
						style: { gap: "1.5rem" },
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "tab-intro",
								children: [/* @__PURE__ */ jsx("h3", {
									className: "title-cursive",
									style: { fontSize: "2.2rem" },
									children: "Midi 🌸"
								}), /* @__PURE__ */ jsx("p", { children: "« Dis-lui quelque chose de gentil. » Envoyez un mot doux instantané." })]
							}),
							/* @__PURE__ */ jsxs("form", {
								onSubmit: handleSendNote,
								className: "flex-col",
								style: { gap: "0.8rem" },
								children: [/* @__PURE__ */ jsx("textarea", {
									className: "response-textarea",
									value: sweetNote,
									onChange: (e) => setSweetNote(e.target.value),
									placeholder: "Écrivez un mot d'amour spontané...",
									required: true,
									style: { minHeight: "60px" }
								}), /* @__PURE__ */ jsxs("button", {
									type: "submit",
									disabled: sendingNote,
									className: "btn",
									children: [/* @__PURE__ */ jsx("span", { children: "Envoyer le mot doux (+5 XP)" }), sendingNote ? /* @__PURE__ */ jsx(Loader2, {
										className: "spinner",
										size: 14
									}) : /* @__PURE__ */ jsx(Send, { size: 14 })]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "notes-feed flex-col",
								style: {
									gap: "0.8rem",
									marginTop: "0.5rem"
								},
								children: [/* @__PURE__ */ jsx("h4", { children: "Mots doux récents" }), notesList.length === 0 ? /* @__PURE__ */ jsx("p", {
									style: {
										fontStyle: "italic",
										fontSize: "0.9rem",
										color: "var(--color-text-light)"
									},
									children: "Pas encore de mots doux aujourd'hui. Soyez le premier !"
								}) : /* @__PURE__ */ jsx("div", {
									className: "notes-list",
									children: notesList.map((note) => {
										const isMe = note.sender_id === user.id;
										return /* @__PURE__ */ jsxs("div", {
											className: `note-bubble ${isMe ? "note-me" : "note-partner"}`,
											children: [
												/* @__PURE__ */ jsxs("strong", { children: [isMe ? "Vous" : partnerProfile?.display_name || "Partenaire", " :"] }),
												/* @__PURE__ */ jsx("p", { children: note.note_text }),
												/* @__PURE__ */ jsx("span", {
													className: "note-time",
													children: new Date(note.created_at).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit"
													})
												})
											]
										}, note.id);
									})
								})]
							})
						]
					}),
					activeTab === "evening" && /* @__PURE__ */ jsxs("div", {
						class: "card flex-col",
						style: { gap: "1.5rem" },
						children: [/* @__PURE__ */ jsxs("div", {
							className: "tab-intro",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "title-cursive",
								style: { fontSize: "2.2rem" },
								children: "Soir 🌙"
							}), /* @__PURE__ */ jsx("p", { children: "Prenez un instant pour faire le bilan complice de votre journée." })]
						}), !myReflection ? /* @__PURE__ */ jsxs("form", {
							onSubmit: handleSendReflection,
							className: "flex-col",
							style: { gap: "1.2rem" },
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "input-group",
									children: [/* @__PURE__ */ jsx("label", { children: "1. Quel moment t'a rendu heureux aujourd'hui ?" }), /* @__PURE__ */ jsx("textarea", {
										className: "response-textarea",
										value: reflection1,
										onChange: (e) => setReflection1(e.target.value),
										placeholder: "Ma réponse...",
										required: true
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "input-group",
									children: [/* @__PURE__ */ jsx("label", { children: "2. Qu'apprécies-tu aujourd'hui chez ton partenaire ?" }), /* @__PURE__ */ jsx("textarea", {
										className: "response-textarea",
										value: reflection2,
										onChange: (e) => setReflection2(e.target.value),
										placeholder: "Ma réponse...",
										required: true
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "input-group",
									children: [/* @__PURE__ */ jsx("label", { children: "3. Que voudrais-tu vivre ensemble demain ?" }), /* @__PURE__ */ jsx("textarea", {
										className: "response-textarea",
										value: reflection3,
										onChange: (e) => setReflection3(e.target.value),
										placeholder: "Ma réponse...",
										required: true
									})]
								}),
								/* @__PURE__ */ jsxs("button", {
									type: "submit",
									disabled: submittingReflection,
									className: "btn",
									children: [/* @__PURE__ */ jsx("span", { children: "Enregistrer mon bilan (+20 XP)" }), submittingReflection && /* @__PURE__ */ jsx(Loader2, {
										className: "spinner",
										size: 14
									})]
								})
							]
						}) : /* @__PURE__ */ jsxs("div", {
							className: "reflections-display flex-col",
							style: { gap: "1.5rem" },
							children: [/* @__PURE__ */ jsxs("div", {
								className: "completed-badge",
								children: [/* @__PURE__ */ jsx(Award, {
									size: 18,
									color: "#2e7d32"
								}), /* @__PURE__ */ jsx("span", { children: "Votre bilan du jour est enregistré !" })]
							}), partnerReflection ? /* @__PURE__ */ jsxs("div", {
								className: "reflections-comparison",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "comparison-row",
										children: [/* @__PURE__ */ jsx("h5", { children: "1. Moment heureux" }), /* @__PURE__ */ jsxs("div", {
											className: "comparison-boxes",
											children: [/* @__PURE__ */ jsxs("div", {
												className: "comparison-box me",
												children: [/* @__PURE__ */ jsx("strong", { children: "Vous :" }), /* @__PURE__ */ jsx("p", { children: myReflection.answer_1 })]
											}), /* @__PURE__ */ jsxs("div", {
												className: "comparison-box partner",
												children: [/* @__PURE__ */ jsxs("strong", { children: [partnerProfile?.display_name || "Partenaire", " :"] }), /* @__PURE__ */ jsx("p", { children: partnerReflection.answer_1 })]
											})]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "comparison-row",
										children: [/* @__PURE__ */ jsx("h5", { children: "2. Appréciation mutuelle" }), /* @__PURE__ */ jsxs("div", {
											className: "comparison-boxes",
											children: [/* @__PURE__ */ jsxs("div", {
												className: "comparison-box me",
												children: [/* @__PURE__ */ jsx("strong", { children: "Vous :" }), /* @__PURE__ */ jsx("p", { children: myReflection.answer_2 })]
											}), /* @__PURE__ */ jsxs("div", {
												className: "comparison-box partner",
												children: [/* @__PURE__ */ jsxs("strong", { children: [partnerProfile?.display_name || "Partenaire", " :"] }), /* @__PURE__ */ jsx("p", { children: partnerReflection.answer_2 })]
											})]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "comparison-row",
										children: [/* @__PURE__ */ jsx("h5", { children: "3. Demain ensemble" }), /* @__PURE__ */ jsxs("div", {
											className: "comparison-boxes",
											children: [/* @__PURE__ */ jsxs("div", {
												className: "comparison-box me",
												children: [/* @__PURE__ */ jsx("strong", { children: "Vous :" }), /* @__PURE__ */ jsx("p", { children: myReflection.answer_3 })]
											}), /* @__PURE__ */ jsxs("div", {
												className: "comparison-box partner",
												children: [/* @__PURE__ */ jsxs("strong", { children: [partnerProfile?.display_name || "Partenaire", " :"] }), /* @__PURE__ */ jsx("p", { children: partnerReflection.answer_3 })]
											})]
										})]
									})
								]
							}) : /* @__PURE__ */ jsx("div", {
								className: "waiting-box",
								children: /* @__PURE__ */ jsxs("p", { children: [
									"⏳ Vos réponses sont verrouillées. Elles s'afficheront dès que ",
									partnerProfile?.display_name || "votre partenaire",
									" aura aussi soumis son bilan !"
								] })
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("nav", {
				className: "bottom-nav",
				children: [
					/* @__PURE__ */ jsxs("a", {
						href: "/dashboard",
						className: "nav-item",
						children: [/* @__PURE__ */ jsx("div", {
							className: "nav-icon",
							children: "🔥"
						}), /* @__PURE__ */ jsx("span", { children: "Univers" })]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: "/rituals",
						className: "nav-item active",
						children: [/* @__PURE__ */ jsx("div", {
							className: "nav-icon",
							children: /* @__PURE__ */ jsx(CalendarHeart, {})
						}), /* @__PURE__ */ jsx("span", { children: "Rituels" })]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: "/messages",
						className: "nav-item",
						children: [/* @__PURE__ */ jsx("div", {
							className: "nav-icon",
							children: "💬"
						}), /* @__PURE__ */ jsx("span", { children: "Discussion" })]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: "/capsules",
						className: "nav-item",
						children: [/* @__PURE__ */ jsx("div", {
							className: "nav-icon",
							children: "⏳"
						}), /* @__PURE__ */ jsx("span", { children: "Capsules" })]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: "/souvenirs",
						className: "nav-item",
						children: [/* @__PURE__ */ jsx("div", {
							className: "nav-icon",
							children: /* @__PURE__ */ jsx(History, {})
						}), /* @__PURE__ */ jsx("span", { children: "Souvenirs" })]
					})
				]
			})
		]
	});
}
//#endregion
//#region src/pages/rituals.astro
var rituals_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Rituals,
	file: () => $$file,
	url: () => $$url
});
var $$Rituals = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Nos Rituels" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "RitualsComponent", Rituals, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/PC/Desktop/univers/src/components/Rituals.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "C:/Users/PC/Desktop/univers/src/pages/rituals.astro", void 0);
var $$file = "C:/Users/PC/Desktop/univers/src/pages/rituals.astro";
var $$url = "/rituals";
//#endregion
//#region \0virtual:astro:page:src/pages/rituals@_@astro
var page = () => rituals_exports;
//#endregion
export { page };
