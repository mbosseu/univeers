import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { n as supabase, t as $$AppLayout } from "./AppLayout_BkfgsvN2.mjs";
import { useEffect, useRef, useState } from "react";
import { Award, Calendar, CalendarHeart, Gamepad2, History, Loader2, MessageCircleHeart, Plus, Send, Settings, Sparkles } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/Flame.jsx
function Flame({ level = 2, energy = 60 }) {
	const [pulse, setPulse] = useState(false);
	useEffect(() => {
		const interval = setInterval(() => {
			setPulse((p) => !p);
		}, 2e3);
		return () => clearInterval(interval);
	}, []);
	const getFlameClass = () => {
		let classes = ["flame-container"];
		if (pulse) classes.push("pulse");
		switch (level) {
			case 1:
				classes.push("level-1");
				break;
			case 2:
				classes.push("level-2");
				break;
			case 3:
				classes.push("level-3");
				break;
			case 4:
				classes.push("level-4");
				break;
			case 5:
				classes.push("level-5");
				break;
			case 6:
				classes.push("level-6");
				break;
			default: classes.push("level-2");
		}
		return classes.join(" ");
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "flame-wrapper",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "energy-ring",
				style: { "--energy-percent": `${energy}%` }
			}),
			/* @__PURE__ */ jsxs("div", {
				className: getFlameClass(),
				children: [
					/* @__PURE__ */ jsx("div", { className: "flame-core" }),
					/* @__PURE__ */ jsx("div", { className: "flame-outer" }),
					level >= 3 && /* @__PURE__ */ jsx("div", { className: "flame-sparks" })
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "energy-text",
				children: [energy, "%"]
			})
		]
	});
}
//#endregion
//#region src/components/Dashboard.jsx
var MOODS = [
	{
		label: "Super 💖",
		value: "💖"
	},
	{
		label: "Bien 😊",
		value: "😊"
	},
	{
		label: "Fatigué(e) 😴",
		value: "😴"
	},
	{
		label: "Triste 🥺",
		value: "🥺"
	},
	{
		label: "Stressé(e) 🤯",
		value: "🤯"
	}
];
var CITATIONS = [
	"Le plus beau voyage, c'est celui qu'on n'a pas encore fait ensemble.",
	"Aimer, c'est savoir dire je t'aime sans parler.",
	"À deux, la vie est une aventure merveilleuse.",
	"Chaque seconde près de toi est une éternité de douceur.",
	"Ton amour est le soleil qui illumine mon Univers."
];
var TOUR_STEPS = [
	{
		title: "Bienvenue sur Univers ! ❤️🔥",
		desc: "Votre sanctuaire d'amour à deux. Faisons un petit tour pour découvrir les boutons clés de votre espace complice.",
		target: "body"
	},
	{
		title: "La Flamme Centrale ❤️🔥",
		desc: "C'est le cœur d'Univers. Complétez des défis, répondez à la question du soir ou envoyez des souvenirs pour faire grimper son XP et déverrouiller des effets magiques (jusqu'au niveau 6 !).",
		target: ".flame-section"
	},
	{
		title: "L'Assistant d'Amour 🔮",
		desc: "En manque d'inspiration ? Cliquez sur la boule de cristal pour générer des poèmes, lettres d'amour, excuses sincères ou des idées de rendez-vous en un clic avec l'IA Gemini.",
		target: ".icon-btn[href='/assistant']"
	},
	{
		title: "Le Menu Complice 📱",
		desc: "Naviguez facilement entre votre Univers (🔥), vos Rituels quotidiens (🌸), la Discussion de couple avec messages secrets (💬), vos Capsules temporelles (⏳) et votre Album photo géolocalisé (📸).",
		target: ".bottom-nav"
	},
	{
		title: "Réglages & Thèmes ⚙️",
		desc: "Cliquez sur l'engrenage pour changer de thème visuel (Rose, Bleu ou Crème), passer le quiz des Langages de l'amour, et consulter vos Badges de succès déverrouillés !",
		target: ".icon-btn[href='/settings']"
	}
];
function Dashboard() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [partnerProfile, setPartnerProfile] = useState(null);
	const [couple, setCouple] = useState(null);
	const [question, setQuestion] = useState(null);
	const [myResponse, setMyResponse] = useState("");
	const [hasAnsweredQuestion, setHasAnsweredQuestion] = useState(false);
	const [partnerResponseText, setPartnerResponseText] = useState(null);
	const [submittingAnswer, setSubmittingAnswer] = useState(false);
	const [challenge, setChallenge] = useState(null);
	const [challengeCompleted, setChallengeCompleted] = useState(false);
	const [submittingChallenge, setSubmittingChallenge] = useState(false);
	const [citation, setCitation] = useState("");
	const [lastSouvenir, setLastSouvenir] = useState(null);
	const [events, setEvents] = useState([]);
	const [showEventModal, setShowEventModal] = useState(false);
	const [eventTitle, setEventTitle] = useState("");
	const [eventDate, setEventDate] = useState("");
	const [submittingEvent, setSubmittingEvent] = useState(false);
	const [myMood, setMyMood] = useState("");
	const [tourStep, setTourStep] = useState(-1);
	const [showInstallPrompt, setShowInstallPrompt] = useState(false);
	const [deferredPrompt, setDeferredPrompt] = useState(null);
	const [showIosInstallTip, setShowIosInstallTip] = useState(false);
	const channelRef = useRef([]);
	useEffect(() => {
		checkUser();
		if (!localStorage.getItem("univers-tour-done")) setTourStep(0);
		const handleInstallPrompt = (e) => {
			e.preventDefault();
			setDeferredPrompt(e);
			setShowInstallPrompt(true);
		};
		window.addEventListener("beforeinstallprompt", handleInstallPrompt);
		const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		const isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
		if (isIos && !isStandalone) setShowIosInstallTip(true);
		return () => {
			window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
			channelRef.current.forEach((c) => supabase.removeChannel(c));
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
			await fetchDashboardData(session.user.id);
		} catch (err) {
			console.error("Error in auth check:", err);
			setLoading(false);
		}
	}
	async function fetchDashboardData(userId) {
		try {
			const { data: userProfile, error: profileErr } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
			if (profileErr) throw profileErr;
			if (!userProfile || !userProfile.couple_id) {
				window.location.href = "/onboarding";
				return;
			}
			setProfile(userProfile);
			const { data: coupleDetails, error: coupleErr } = await supabase.from("couples").select("*").eq("id", userProfile.couple_id).single();
			if (coupleErr) throw coupleErr;
			setCouple(coupleDetails);
			const { data: partners, error: partnerErr } = await supabase.from("profiles").select("*").eq("couple_id", userProfile.couple_id).neq("id", userId);
			if (partnerErr) throw partnerErr;
			let currentPartner = null;
			if (partners && partners.length > 0) {
				currentPartner = partners[0];
				setPartnerProfile(currentPartner);
			}
			if (currentPartner) {
				const isP1 = userId < currentPartner.id;
				setMyMood(isP1 ? coupleDetails.mood_p1 : coupleDetails.mood_p2);
			}
			const { data: questions } = await supabase.from("daily_questions").select("*").limit(1);
			if (questions && questions.length > 0) {
				const dailyQ = questions[0];
				setQuestion(dailyQ);
				const { data: myResp } = await supabase.from("daily_responses").select("*").eq("question_id", dailyQ.id).eq("user_id", userId).maybeSingle();
				if (myResp) {
					setHasAnsweredQuestion(true);
					setMyResponse(myResp.response_text);
				}
				if (currentPartner) {
					const { data: partnerResp } = await supabase.from("daily_responses").select("*").eq("question_id", dailyQ.id).eq("user_id", currentPartner.id).maybeSingle();
					if (partnerResp) setPartnerResponseText(partnerResp.response_text);
				}
			}
			const { data: quests } = await supabase.from("quests").select("*").limit(1);
			if (quests && quests.length > 0) {
				const dailyCh = quests[0];
				setChallenge(dailyCh);
				const { data: attempt } = await supabase.from("quest_attempts").select("*").eq("quest_id", dailyCh.id).eq("couple_id", userProfile.couple_id).maybeSingle();
				if (attempt) setChallengeCompleted(true);
			}
			const { data: lastSouv } = await supabase.from("souvenirs").select("*").eq("couple_id", userProfile.couple_id).order("souvenir_date", { ascending: false }).limit(1).maybeSingle();
			if (lastSouv) setLastSouvenir(lastSouv);
			const { data: coupleEvts } = await supabase.from("couple_events").select("*").eq("couple_id", userProfile.couple_id).order("event_date", { ascending: true });
			if (coupleEvts) setEvents(coupleEvts);
			const day = (/* @__PURE__ */ new Date()).getDate();
			setCitation(CITATIONS[day % CITATIONS.length]);
			if (userProfile.couple_id) {
				channelRef.current.forEach((c) => supabase.removeChannel(c));
				channelRef.current = [];
				const coupleChannel = supabase.channel("dashboard_couple_realtime").on("postgres_changes", {
					event: "UPDATE",
					schema: "public",
					table: "couples",
					filter: `id=eq.${userProfile.couple_id}`
				}, (payload) => {
					setCouple(payload.new);
					if (currentPartner) {
						const isP1 = userId < currentPartner.id;
						setMyMood(isP1 ? payload.new.mood_p1 : payload.new.mood_p2);
					}
				}).subscribe();
				const responseChannel = supabase.channel("dashboard_responses_realtime").on("postgres_changes", {
					event: "INSERT",
					schema: "public",
					table: "daily_responses",
					filter: `couple_id=eq.${userProfile.couple_id}`
				}, (payload) => {
					if (payload.new.user_id !== userId) setPartnerResponseText(payload.new.response_text);
				}).subscribe();
				const questChannel = supabase.channel("dashboard_quests_realtime").on("postgres_changes", {
					event: "INSERT",
					schema: "public",
					table: "quest_attempts",
					filter: `couple_id=eq.${userProfile.couple_id}`
				}, (payload) => {
					setChallengeCompleted(true);
				}).subscribe();
				channelRef.current = [
					coupleChannel,
					responseChannel,
					questChannel
				];
			}
			setLoading(false);
		} catch (err) {
			console.error("Error fetching dashboard data:", err);
			setLoading(false);
		}
	}
	const handleMoodSelect = async (mood) => {
		if (!partnerProfile || !couple) return;
		setMyMood(mood);
		try {
			const updateData = user.id < partnerProfile.id ? { mood_p1: mood } : { mood_p2: mood };
			const { error } = await supabase.from("couples").update(updateData).eq("id", profile.couple_id);
			if (error) throw error;
			setCouple((prev) => ({
				...prev,
				...updateData
			}));
		} catch (err) {
			console.error("Error updating mood:", err);
		}
	};
	const triggerInstall = async () => {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === "accepted") {
			setShowInstallPrompt(false);
			setDeferredPrompt(null);
		}
	};
	const handleNextTourStep = () => {
		if (tourStep < TOUR_STEPS.length - 1) setTourStep((prev) => prev + 1);
		else handleCompleteTour();
	};
	const handleCompleteTour = () => {
		setTourStep(-1);
		localStorage.setItem("univers-tour-done", "true");
	};
	const handleAddEvent = async (e) => {
		e.preventDefault();
		if (!eventTitle.trim() || !eventDate || submittingEvent) return;
		setSubmittingEvent(true);
		try {
			const { data: newEvt, error } = await supabase.from("couple_events").insert([{
				couple_id: profile.couple_id,
				title: eventTitle.trim(),
				event_date: eventDate
			}]).select().single();
			if (error) throw error;
			setEvents((prev) => [...prev, newEvt].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
			setEventTitle("");
			setEventDate("");
			setShowEventModal(false);
		} catch (err) {
			console.error(err);
		} finally {
			setSubmittingEvent(false);
		}
	};
	const getFlameLevel = (xp) => {
		if (xp >= 1500) return 6;
		if (xp >= 1e3) return 5;
		if (xp >= 600) return 4;
		if (xp >= 300) return 3;
		if (xp >= 100) return 2;
		return 1;
	};
	const getLevelName = (level) => {
		switch (level) {
			case 1: return "Étincelle 🕯️";
			case 2: return "Flamme 🔥";
			case 3: return "Brasier ❤️";
			case 4: return "Diamant 💎";
			case 5: return "Âmes sœurs 👑";
			case 6: return "Légende ✨";
			default: return "Flamme";
		}
	};
	const handleAnswerSubmit = async (e) => {
		e.preventDefault();
		if (!myResponse.trim() || submittingAnswer || !question) return;
		setSubmittingAnswer(true);
		try {
			const { error: insertErr } = await supabase.from("daily_responses").insert([{
				question_id: question.id,
				user_id: user.id,
				couple_id: profile.couple_id,
				response_text: myResponse.trim()
			}]);
			if (insertErr) throw insertErr;
			const newXp = couple.flame_xp + 15;
			const newEnergy = Math.min(100, couple.flame_energy + 10);
			const { error: updateErr } = await supabase.from("couples").update({
				flame_xp: newXp,
				flame_energy: newEnergy
			}).eq("id", profile.couple_id);
			if (updateErr) throw updateErr;
			setCouple((prev) => ({
				...prev,
				flame_xp: newXp,
				flame_energy: newEnergy
			}));
			setHasAnsweredQuestion(true);
		} catch (err) {
			console.error("Error submitting answer:", err);
		} finally {
			setSubmittingAnswer(false);
		}
	};
	const handleCompleteChallenge = async () => {
		if (challengeCompleted || submittingChallenge || !challenge) return;
		setSubmittingChallenge(true);
		try {
			const { error: insertErr } = await supabase.from("quest_attempts").insert([{
				quest_id: challenge.id,
				couple_id: profile.couple_id,
				completed_by_user_id: user.id
			}]);
			if (insertErr) throw insertErr;
			const newXp = couple.flame_xp + challenge.xp_reward;
			const newEnergy = Math.min(100, couple.flame_energy + challenge.energy_reward);
			const { error: updateErr } = await supabase.from("couples").update({
				flame_xp: newXp,
				flame_energy: newEnergy
			}).eq("id", profile.couple_id);
			if (updateErr) throw updateErr;
			setCouple((prev) => ({
				...prev,
				flame_xp: newXp,
				flame_energy: newEnergy
			}));
			setChallengeCompleted(true);
		} catch (err) {
			console.error("Error completing challenge:", err);
		} finally {
			setSubmittingChallenge(false);
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
			children: "Connexion à votre Univers..."
		})]
	});
	const daysTogether = couple ? Math.ceil(Math.abs((/* @__PURE__ */ new Date()).getTime() - new Date(couple.anniversary_date || couple.created_at).getTime()) / (1e3 * 60 * 60 * 24)) : 0;
	const currentLevel = couple ? getFlameLevel(couple.flame_xp) : 1;
	const isP1 = partnerProfile ? user.id < partnerProfile.id : true;
	const partnerMood = partnerProfile && couple ? isP1 ? couple.mood_p2 : couple.mood_p1 : null;
	const nextEvent = events.length > 0 ? events[0] : null;
	return /* @__PURE__ */ jsxs("div", {
		className: "dashboard-container",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "dashboard-header",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "couple-info",
					children: [/* @__PURE__ */ jsx("div", {
						className: "avatar",
						children: "💑"
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h2", { children: [
						profile?.display_name,
						" & ",
						partnerProfile?.display_name || "Partenaire"
					] }), /* @__PURE__ */ jsxs("p", {
						className: "days-together",
						children: [daysTogether, " jours ensemble"]
					})] })]
				}), /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						gap: "8px"
					},
					children: [/* @__PURE__ */ jsx("a", {
						href: "/assistant",
						className: "icon-btn",
						title: "Assistant d'Amour",
						style: {
							fontSize: "1.2rem",
							textDecoration: "none"
						},
						children: "🔮"
					}), /* @__PURE__ */ jsx("a", {
						href: "/settings",
						className: "icon-btn",
						title: "Réglages",
						style: {
							display: "flex",
							alignItems: "center"
						},
						children: /* @__PURE__ */ jsx(Settings, {
							size: 24,
							color: "var(--color-primary)"
						})
					})]
				})]
			}),
			showInstallPrompt && /* @__PURE__ */ jsxs("div", {
				className: "pwa-install-banner flex-center",
				style: {
					gap: "10px",
					padding: "10px 14px",
					background: "var(--color-primary)",
					color: "white",
					borderRadius: "12px",
					marginBottom: "1.5rem",
					justifyContent: "space-between",
					boxShadow: "var(--shadow-sm)"
				},
				children: [/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: "8px"
					},
					children: [/* @__PURE__ */ jsx(Sparkles, { size: 18 }), /* @__PURE__ */ jsx("span", {
						style: {
							fontSize: "0.85rem",
							fontWeight: 600
						},
						children: "Installer Univers sur votre écran d'accueil !"
					})]
				}), /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						gap: "8px"
					},
					children: [/* @__PURE__ */ jsx("button", {
						onClick: triggerInstall,
						className: "btn-small",
						style: {
							background: "white",
							color: "var(--color-primary)",
							border: "none",
							padding: "6px 12px",
							borderRadius: "6px",
							fontSize: "0.75rem",
							fontWeight: 700,
							cursor: "pointer",
							boxShadow: "none"
						},
						children: "Installer"
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => setShowInstallPrompt(false),
						style: {
							background: "transparent",
							border: "none",
							color: "white",
							fontSize: "1.2rem",
							cursor: "pointer",
							padding: 0,
							boxShadow: "none"
						},
						children: "×"
					})]
				})]
			}),
			showIosInstallTip && /* @__PURE__ */ jsxs("div", {
				className: "pwa-install-banner flex-col",
				style: {
					gap: "6px",
					padding: "12px 14px",
					background: "rgba(169, 27, 34, 0.05)",
					border: "1px solid rgba(169, 27, 34, 0.1)",
					color: "var(--color-text)",
					borderRadius: "12px",
					marginBottom: "1.5rem",
					boxShadow: "var(--shadow-sm)"
				},
				children: [/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						justifyContent: "space-between",
						width: "100%",
						alignItems: "center"
					},
					children: [/* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: "8px"
						},
						children: [/* @__PURE__ */ jsx(Sparkles, {
							size: 18,
							color: "var(--color-primary)"
						}), /* @__PURE__ */ jsx("span", {
							style: {
								fontSize: "0.85rem",
								fontWeight: 700
							},
							children: "Installer sur votre iPhone"
						})]
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => setShowIosInstallTip(false),
						style: {
							background: "transparent",
							border: "none",
							color: "var(--color-text-light)",
							fontSize: "1.2rem",
							cursor: "pointer",
							padding: 0,
							boxShadow: "none"
						},
						children: "×"
					})]
				}), /* @__PURE__ */ jsxs("p", {
					style: {
						margin: 0,
						fontSize: "0.8rem",
						color: "var(--color-text-light)",
						lineHeight: "1.4"
					},
					children: [
						"Appuyez sur le bouton de partage ",
						/* @__PURE__ */ jsx("strong", {
							style: { fontSize: "1.1rem" },
							children: "📤"
						}),
						" en bas de Safari, puis faites défiler et sélectionnez ",
						/* @__PURE__ */ jsx("strong", {
							style: { color: "var(--color-primary)" },
							children: "➕ Sur l'écran d'accueil"
						}),
						"."
					]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "card mood-card",
				style: {
					marginBottom: "1.5rem",
					padding: "1.2rem"
				},
				children: /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center"
					},
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
						style: {
							margin: 0,
							fontSize: "0.95rem",
							color: "var(--color-text)"
						},
						children: "Mon humeur"
					}), /* @__PURE__ */ jsx("div", {
						style: {
							display: "flex",
							gap: "6px",
							marginTop: "6px"
						},
						children: MOODS.map((m) => /* @__PURE__ */ jsx("button", {
							onClick: () => handleMoodSelect(m.value),
							className: `mood-select-btn ${myMood === m.value ? "active" : ""}`,
							style: {
								padding: "6px 8px",
								fontSize: "1.2rem",
								background: myMood === m.value ? "rgba(169, 27, 34, 0.08)" : "transparent",
								border: myMood === m.value ? "1px solid var(--color-primary)" : "1px solid transparent",
								borderRadius: "8px",
								cursor: "pointer",
								boxShadow: "none"
							},
							children: m.value
						}, m.value))
					})] }), /* @__PURE__ */ jsxs("div", {
						style: {
							textAlign: "right",
							borderLeft: "1px solid rgba(169,27,34,0.1)",
							paddingLeft: "12px"
						},
						children: [/* @__PURE__ */ jsxs("h4", {
							style: {
								margin: 0,
								fontSize: "0.95rem",
								color: "var(--color-text)"
							},
							children: ["Humeur de ", partnerProfile?.display_name || "mon amour"]
						}), /* @__PURE__ */ jsx("div", {
							style: {
								fontSize: "2rem",
								marginTop: "4px",
								textAlign: "center"
							},
							children: partnerMood || "❔"
						})]
					})]
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flame-section",
				children: [
					/* @__PURE__ */ jsx(Flame, {
						level: currentLevel,
						energy: couple?.flame_energy || 50
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "flame-title title-cursive",
						children: getLevelName(currentLevel)
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "flame-subtitle",
						children: [
							"XP de votre Univers : ",
							couple?.flame_xp,
							" XP"
						]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "card citation-card-widget",
				style: {
					marginBottom: "1.5rem",
					textAlign: "center",
					fontStyle: "italic",
					color: "var(--color-text-light)",
					borderLeft: "4px solid var(--color-primary)",
					padding: "12px 20px"
				},
				children: /* @__PURE__ */ jsxs("p", {
					style: {
						margin: 0,
						fontSize: "1rem",
						lineHeight: "1.5"
					},
					children: [
						"« ",
						citation,
						" »"
					]
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "cards-grid",
				children: [
					question && /* @__PURE__ */ jsxs("div", {
						className: "card action-card",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "card-header-icon",
								children: [/* @__PURE__ */ jsx(MessageCircleHeart, {
									color: "var(--color-primary)",
									size: 24
								}), /* @__PURE__ */ jsx("h4", { children: "Question du jour" })]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "question-text",
								children: [
									"« ",
									question.question_text,
									" »"
								]
							}),
							!hasAnsweredQuestion ? /* @__PURE__ */ jsxs("form", {
								onSubmit: handleAnswerSubmit,
								style: {
									width: "100%",
									marginTop: "0.5rem"
								},
								children: [/* @__PURE__ */ jsx("textarea", {
									className: "response-textarea",
									value: myResponse,
									onChange: (e) => setMyResponse(e.target.value),
									placeholder: "Écrivez votre réponse secrète ici...",
									required: true
								}), /* @__PURE__ */ jsxs("button", {
									type: "submit",
									disabled: submittingAnswer,
									className: "btn btn-small btn-submit-response",
									children: [/* @__PURE__ */ jsx("span", { children: "Envoyer" }), submittingAnswer ? /* @__PURE__ */ jsx(Loader2, {
										className: "spinner",
										size: 14
									}) : /* @__PURE__ */ jsx(Send, { size: 14 })]
								})]
							}) : /* @__PURE__ */ jsxs("div", {
								className: "responses-display",
								style: { width: "100%" },
								children: [/* @__PURE__ */ jsxs("div", {
									className: "my-response-box",
									children: [/* @__PURE__ */ jsx("strong", { children: "Votre réponse :" }), /* @__PURE__ */ jsx("p", { children: myResponse })]
								}), /* @__PURE__ */ jsxs("div", {
									className: "partner-response-box",
									children: [/* @__PURE__ */ jsxs("strong", { children: [
										"Réponse de ",
										partnerProfile?.display_name || "votre partenaire",
										" :"
									] }), partnerResponseText ? /* @__PURE__ */ jsx("p", { children: partnerResponseText }) : /* @__PURE__ */ jsx("p", {
										className: "waiting-text",
										children: "⏳ En attente de sa réponse pour la révéler..."
									})]
								})]
							})
						]
					}),
					challenge && /* @__PURE__ */ jsxs("div", {
						className: "card action-card",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "card-header-icon",
								children: [/* @__PURE__ */ jsx(Gamepad2, {
									color: "var(--color-primary)",
									size: 24
								}), /* @__PURE__ */ jsx("h4", { children: "Défi du jour" })]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "challenge-title",
								children: /* @__PURE__ */ jsx("strong", { children: challenge.title })
							}),
							/* @__PURE__ */ jsx("p", {
								className: "challenge-desc",
								children: challenge.description
							}),
							!challengeCompleted ? /* @__PURE__ */ jsxs("button", {
								onClick: handleCompleteChallenge,
								disabled: submittingChallenge,
								className: "btn btn-small",
								children: [/* @__PURE__ */ jsxs("span", { children: [
									"Relever le défi (+",
									challenge.xp_reward,
									" XP)"
								] }), submittingChallenge && /* @__PURE__ */ jsx(Loader2, {
									className: "spinner",
									size: 14
								})]
							}) : /* @__PURE__ */ jsxs("div", {
								className: "completed-badge",
								children: [/* @__PURE__ */ jsx(Award, {
									size: 18,
									color: "#2e7d32"
								}), /* @__PURE__ */ jsx("span", { children: "Défi complété aujourd'hui !" })]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "card action-card",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "card-header-icon",
							style: { justifyContent: "space-between" },
							children: [/* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: "8px"
								},
								children: [/* @__PURE__ */ jsx(Calendar, {
									color: "var(--color-primary)",
									size: 24
								}), /* @__PURE__ */ jsx("h4", { children: "Événement à venir" })]
							}), /* @__PURE__ */ jsx("button", {
								onClick: () => setShowEventModal(true),
								className: "icon-btn",
								style: { padding: "2px" },
								title: "Ajouter une date",
								children: /* @__PURE__ */ jsx(Plus, {
									size: 16,
									color: "var(--color-primary)"
								})
							})]
						}), nextEvent ? /* @__PURE__ */ jsxs("div", {
							style: { width: "100%" },
							children: [/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									fontWeight: 700,
									fontSize: "1.05rem",
									color: "var(--color-text)"
								},
								children: nextEvent.title
							}), /* @__PURE__ */ jsx("p", {
								style: {
									margin: "4px 0 0 0",
									fontSize: "0.9rem",
									color: "var(--color-text-light)"
								},
								children: new Date(nextEvent.event_date).toLocaleDateString([], {
									day: "numeric",
									month: "long",
									year: "numeric"
								})
							})]
						}) : /* @__PURE__ */ jsx("p", {
							style: {
								margin: 0,
								color: "var(--color-text-light)",
								fontSize: "0.9rem"
							},
							children: "Aucune date importante enregistrée."
						})]
					}),
					lastSouvenir && /* @__PURE__ */ jsxs("div", {
						className: "card souvenir-card",
						style: {
							padding: 0,
							overflow: "hidden"
						},
						children: [/* @__PURE__ */ jsx("div", {
							className: "souvenir-image",
							style: {
								backgroundImage: `url(${lastSouvenir.media_url})`,
								height: "120px"
							}
						}), /* @__PURE__ */ jsxs("div", {
							style: { padding: "12px" },
							children: [
								/* @__PURE__ */ jsx("h5", {
									style: {
										margin: "0 0 2px 0",
										fontSize: "0.85rem",
										color: "var(--color-primary)",
										fontWeight: 600
									},
									children: "Dernier Souvenir"
								}),
								/* @__PURE__ */ jsx("h4", {
									style: {
										margin: "0 0 4px 0",
										fontSize: "1.1rem",
										color: "var(--color-text)"
									},
									children: lastSouvenir.title
								}),
								/* @__PURE__ */ jsx("p", {
									style: {
										margin: 0,
										fontSize: "0.85rem",
										color: "var(--color-text-light)"
									},
									children: lastSouvenir.location_name
								})
							]
						})]
					})
				]
			}),
			showEventModal && /* @__PURE__ */ jsx("div", {
				className: "modal-overlay",
				children: /* @__PURE__ */ jsxs("div", {
					className: "modal-card",
					style: {
						padding: "2rem 1.5rem",
						maxWidth: "400px"
					},
					children: [/* @__PURE__ */ jsxs("div", {
						className: "modal-header",
						style: { marginBottom: "1.5rem" },
						children: [/* @__PURE__ */ jsx("h2", {
							className: "title-cursive",
							style: { fontSize: "2.2rem" },
							children: "Ajouter une date"
						}), /* @__PURE__ */ jsx("button", {
							onClick: () => setShowEventModal(false),
							className: "close-btn",
							children: "×"
						})]
					}), /* @__PURE__ */ jsxs("form", {
						onSubmit: handleAddEvent,
						className: "auth-form",
						style: { gap: "1.2rem" },
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "input-group",
								children: [/* @__PURE__ */ jsx("label", { children: "Nom de l'événement" }), /* @__PURE__ */ jsx("input", {
									type: "text",
									value: eventTitle,
									onChange: (e) => setEventTitle(e.target.value),
									placeholder: "Ex: Notre anniversaire, Prochain voyage...",
									required: true
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "input-group",
								children: [/* @__PURE__ */ jsx("label", { children: "Date de l'événement" }), /* @__PURE__ */ jsx("input", {
									type: "date",
									value: eventDate,
									onChange: (e) => setEventDate(e.target.value),
									required: true
								})]
							}),
							/* @__PURE__ */ jsxs("button", {
								type: "submit",
								disabled: submittingEvent,
								className: "btn submit-btn",
								children: [/* @__PURE__ */ jsx("span", { children: "Enregistrer" }), submittingEvent && /* @__PURE__ */ jsx(Loader2, {
									className: "spinner",
									size: 18
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ jsxs("nav", {
				className: "bottom-nav",
				children: [
					/* @__PURE__ */ jsxs("a", {
						href: "/dashboard",
						className: "nav-item active",
						children: [/* @__PURE__ */ jsx("div", {
							className: "nav-icon",
							children: "🔥"
						}), /* @__PURE__ */ jsx("span", { children: "Univers" })]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: "/rituals",
						className: "nav-item",
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
			}),
			tourStep >= 0 && tourStep < TOUR_STEPS.length && /* @__PURE__ */ jsx("div", {
				className: "tour-overlay",
				style: {
					position: "fixed",
					top: 0,
					left: 0,
					width: "100vw",
					height: "100vh",
					backgroundColor: "rgba(0, 0, 0, 0.6)",
					zIndex: 1e5,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "1rem",
					backdropFilter: "blur(3px)"
				},
				children: /* @__PURE__ */ jsxs("div", {
					className: "tour-card card animate-pop",
					style: {
						maxWidth: "360px",
						width: "100%",
						padding: "1.5rem",
						display: "flex",
						flexDirection: "column",
						gap: "12px",
						boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
						border: "1px solid rgba(169, 27, 34, 0.1)",
						background: "white"
					},
					children: [
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center"
							},
							children: [/* @__PURE__ */ jsxs("span", {
								style: {
									fontSize: "0.75rem",
									fontWeight: 800,
									color: "var(--color-primary)",
									textTransform: "uppercase",
									letterSpacing: "1px"
								},
								children: [
									"Guide Univers (",
									tourStep + 1,
									" / ",
									TOUR_STEPS.length,
									")"
								]
							}), /* @__PURE__ */ jsx("button", {
								onClick: handleCompleteTour,
								style: {
									background: "transparent",
									border: "none",
									color: "var(--color-text-light)",
									cursor: "pointer",
									fontSize: "0.85rem",
									padding: 0,
									boxShadow: "none"
								},
								children: "Ignorer"
							})]
						}),
						/* @__PURE__ */ jsx("h3", {
							style: {
								margin: 0,
								fontSize: "1.15rem",
								color: "var(--color-text)",
								fontWeight: 700
							},
							children: TOUR_STEPS[tourStep].title
						}),
						/* @__PURE__ */ jsx("p", {
							style: {
								margin: 0,
								fontSize: "0.85rem",
								color: "var(--color-text-light)",
								lineHeight: "1.5"
							},
							children: TOUR_STEPS[tourStep].desc
						}),
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								justifyContent: "space-between",
								marginTop: "8px",
								alignItems: "center"
							},
							children: [/* @__PURE__ */ jsx("div", {
								style: {
									display: "flex",
									gap: "4px"
								},
								children: TOUR_STEPS.map((_, idx) => /* @__PURE__ */ jsx("div", { style: {
									width: "6px",
									height: "6px",
									borderRadius: "50%",
									backgroundColor: idx === tourStep ? "var(--color-primary)" : "rgba(0,0,0,0.1)",
									transition: "background-color 0.2s"
								} }, idx))
							}), /* @__PURE__ */ jsx("button", {
								onClick: handleNextTourStep,
								className: "btn btn-small",
								style: {
									width: "auto",
									padding: "6px 14px",
									fontSize: "0.8rem"
								},
								children: /* @__PURE__ */ jsx("span", { children: tourStep === TOUR_STEPS.length - 1 ? "Terminer" : "Suivant" })
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
//#region src/pages/dashboard.astro
var dashboard_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Dashboard,
	file: () => $$file,
	url: () => $$url
});
var $$Dashboard = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Notre Univers" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "DashboardComponent", Dashboard, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/PC/Desktop/univers/src/components/Dashboard.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "C:/Users/PC/Desktop/univers/src/pages/dashboard.astro", void 0);
var $$file = "C:/Users/PC/Desktop/univers/src/pages/dashboard.astro";
var $$url = "/dashboard";
//#endregion
//#region \0virtual:astro:page:src/pages/dashboard@_@astro
var page = () => dashboard_exports;
//#endregion
export { page };
