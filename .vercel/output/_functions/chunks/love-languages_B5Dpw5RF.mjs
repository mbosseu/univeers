import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { n as supabase, t as $$AppLayout } from "./AppLayout_BkfgsvN2.mjs";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, Heart, Loader2, Sparkles } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/LoveLanguages.jsx
var QUESTIONS = [
	{
		id: 1,
		text: "Je me sens le plus aimé(e) quand mon partenaire...",
		options: [
			{
				text: "Me fait des compliments sincères ou m'encourage.",
				language: "Paroles valorisantes"
			},
			{
				text: "Passe du temps de qualité seul à seul avec moi.",
				language: "Temps de qualité"
			},
			{
				text: "M'offre un petit cadeau surprise sans occasion particulière.",
				language: "Cadeaux"
			},
			{
				text: "M'aide spontanément dans mes tâches ou corvées.",
				language: "Services rendus"
			},
			{
				text: "Me prend tendrement dans ses bras ou me tient la main.",
				language: "Contact physique"
			}
		]
	},
	{
		id: 2,
		text: "Pour une soirée de week-end parfaite, je préfère...",
		options: [
			{
				text: "Discuter longuement autour d'un verre, sans distractions.",
				language: "Temps de qualité"
			},
			{
				text: "Qu'il ou elle prépare mon repas préféré pour me faire plaisir.",
				language: "Services rendus"
			},
			{
				text: "Être blotti(e) ensemble pour regarder un film.",
				language: "Contact physique"
			},
			{
				text: "Entendre des mots doux et des déclarations d'amour.",
				language: "Paroles valorisantes"
			},
			{
				text: "Découvrir un petit objet ou une attention qu'il/elle a acheté pour moi.",
				language: "Cadeaux"
			}
		]
	},
	{
		id: 3,
		text: "Quand je traverse une période difficile, j'ai le plus besoin que mon partenaire...",
		options: [
			{
				text: "Me rassure avec des mots encourageants et positifs.",
				language: "Paroles valorisantes"
			},
			{
				text: "Soit juste là à m'écouter attentivement.",
				language: "Temps de qualité"
			},
			{
				text: "Me fasse un long massage ou un câlin réconfortant.",
				language: "Contact physique"
			},
			{
				text: "Prenne en charge certaines de mes responsabilités quotidiennes.",
				language: "Services rendus"
			},
			{
				text: "M'apporte des fleurs ou un chocolat pour me remonter le moral.",
				language: "Cadeaux"
			}
		]
	},
	{
		id: 4,
		text: "Qu'est-ce qui vous touche le plus au quotidien ?",
		options: [
			{
				text: "Qu'il/elle prenne ma voiture pour faire le plein.",
				language: "Services rendus"
			},
			{
				text: "Qu'il/elle écrive un petit mot doux sur le miroir du bain.",
				language: "Paroles valorisantes"
			},
			{
				text: "Un baiser inattendu dans le cou.",
				language: "Contact physique"
			},
			{
				text: "Un souvenir de voyage ou une babiole ramenée d'une course.",
				language: "Cadeaux"
			},
			{
				text: "Une promenade main dans la main le soir.",
				language: "Temps de qualité"
			}
		]
	},
	{
		id: 5,
		text: "Après une séparation de quelques jours, ce qui me comble le plus c'est...",
		options: [
			{
				text: "Un grand câlin passionné et des baisers à l'aéroport/gare.",
				language: "Contact physique"
			},
			{
				text: "Qu'il/elle me dise 'Tu m'as tellement manqué, je t'aime'.",
				language: "Paroles valorisantes"
			},
			{
				text: "Préparer une vraie soirée retrouvailles à deux.",
				language: "Temps de qualité"
			},
			{
				text: "Découvrir une petite surprise qu'il/elle a préparée.",
				language: "Cadeaux"
			},
			{
				text: "Qu'il/elle ait nettoyé toute la maison avant mon retour.",
				language: "Services rendus"
			}
		]
	}
];
function LoveLanguages() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [partnerProfile, setPartnerProfile] = useState(null);
	const [quizStarted, setQuizStarted] = useState(false);
	const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
	const [answers, setAnswers] = useState([]);
	const [quizCompleted, setQuizCompleted] = useState(false);
	const [savingResult, setSavingResult] = useState(false);
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
		await loadProfiles(session.user.id);
	}
	async function loadProfiles(userId) {
		try {
			const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", userId).single();
			setProfile(userProfile);
			if (userProfile.love_language) setQuizCompleted(true);
			const { data: partners } = await supabase.from("profiles").select("*").eq("couple_id", userProfile.couple_id).neq("id", userId);
			if (partners && partners.length > 0) setPartnerProfile(partners[0]);
			setLoading(false);
		} catch (err) {
			console.error(err);
			setLoading(false);
		}
	}
	const handleOptionSelect = (lang) => {
		const nextAnswers = [...answers, lang];
		setAnswers(nextAnswers);
		if (currentQuestionIdx < QUESTIONS.length - 1) setCurrentQuestionIdx((prev) => prev + 1);
		else {
			const counts = {};
			let dominant = "";
			let maxCount = 0;
			nextAnswers.forEach((ans) => {
				counts[ans] = (counts[ans] || 0) + 1;
				if (counts[ans] > maxCount) {
					maxCount = counts[ans];
					dominant = ans;
				}
			});
			saveResult(dominant);
		}
	};
	const saveResult = async (language) => {
		setSavingResult(true);
		try {
			const { error } = await supabase.from("profiles").update({ love_language: language }).eq("id", user.id);
			if (error) throw error;
			const { data: couple } = await supabase.from("couples").select("flame_xp, flame_energy").eq("id", profile.couple_id).single();
			if (couple) await supabase.from("couples").update({
				flame_xp: couple.flame_xp + 25,
				flame_energy: Math.min(100, couple.flame_energy + 10)
			}).eq("id", profile.couple_id);
			setProfile((prev) => ({
				...prev,
				love_language: language
			}));
			setQuizCompleted(true);
		} catch (err) {
			console.error(err);
		} finally {
			setSavingResult(false);
		}
	};
	const handleRetake = () => {
		setAnswers([]);
		setCurrentQuestionIdx(0);
		setQuizCompleted(false);
		setQuizStarted(true);
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
			children: "Chargement du questionnaire..."
		})]
	});
	const currentQuestion = QUESTIONS[currentQuestionIdx];
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
						children: "💖"
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "Langages de l'amour" }), /* @__PURE__ */ jsx("p", {
						className: "days-together",
						children: "Découvrez comment vous vous sentez aimés"
					})] })]
				}), /* @__PURE__ */ jsx("a", {
					href: "/dashboard",
					className: "icon-btn",
					title: "Retour à l'Univers",
					children: "🔥"
				})]
			}),
			!quizStarted && !quizCompleted && /* @__PURE__ */ jsxs("div", {
				className: "card text-center flex-col",
				style: {
					padding: "3rem 1.5rem",
					gap: "1rem"
				},
				children: [
					/* @__PURE__ */ jsx(Heart, {
						size: 48,
						color: "var(--color-primary)",
						style: {
							alignSelf: "center",
							animation: "pulse 1.5s infinite alternate"
						}
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "title-cursive",
						style: { fontSize: "2.2rem" },
						children: "Quel est votre langage ?"
					}),
					/* @__PURE__ */ jsx("p", {
						style: {
							fontSize: "0.95rem",
							color: "var(--color-text-light)",
							lineHeight: "1.5"
						},
						children: "Selon la psychologie de couple, il existe 5 langages principaux pour exprimer et ressentir l'amour. Remplissez ce questionnaire pour révéler le vôtre et comprendre celui de votre partenaire."
					}),
					/* @__PURE__ */ jsxs("button", {
						onClick: () => setQuizStarted(true),
						className: "btn flex-center",
						style: {
							gap: "6px",
							margin: "1rem auto 0 auto"
						},
						children: [/* @__PURE__ */ jsx("span", { children: "Commencer le Quiz (5 questions)" }), /* @__PURE__ */ jsx(ArrowRight, { size: 16 })]
					})
				]
			}),
			quizStarted && !quizCompleted && /* @__PURE__ */ jsxs("div", {
				className: "card flex-col",
				style: { gap: "1.5rem" },
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "quiz-progress",
						style: {
							fontSize: "0.85rem",
							color: "var(--color-text-light)",
							fontWeight: 700
						},
						children: [
							"Question ",
							currentQuestion.id,
							" sur ",
							QUESTIONS.length,
							/* @__PURE__ */ jsx("div", {
								className: "progress-bar",
								style: {
									width: "100%",
									height: "4px",
									backgroundColor: "rgba(169, 27, 34, 0.1)",
									borderRadius: "2px",
									marginTop: "6px"
								},
								children: /* @__PURE__ */ jsx("div", {
									className: "progress-fill",
									style: {
										width: `${currentQuestion.id / QUESTIONS.length * 100}%`,
										height: "100%",
										backgroundColor: "var(--color-primary)",
										borderRadius: "2px",
										transition: "width 0.3s ease"
									}
								})
							})
						]
					}),
					/* @__PURE__ */ jsx("h3", {
						style: {
							fontSize: "1.25rem",
							color: "var(--color-text)",
							lineHeight: "1.4"
						},
						children: currentQuestion.text
					}),
					/* @__PURE__ */ jsx("div", {
						className: "options-list flex-col",
						style: { gap: "10px" },
						children: currentQuestion.options.map((opt, idx) => /* @__PURE__ */ jsx("button", {
							onClick: () => handleOptionSelect(opt.language),
							className: "option-select-btn",
							style: {
								width: "100%",
								padding: "14px",
								borderRadius: "12px",
								backgroundColor: "var(--color-white)",
								border: "1px solid rgba(169, 27, 34, 0.15)",
								color: "var(--color-text)",
								fontSize: "0.95rem",
								fontWeight: 500,
								textAlign: "left",
								cursor: "pointer",
								boxShadow: "none",
								lineHeight: "1.4"
							},
							children: opt.text
						}, idx))
					})
				]
			}),
			quizCompleted && /* @__PURE__ */ jsxs("div", {
				className: "card flex-col",
				style: { gap: "1.5rem" },
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "text-center",
						children: [/* @__PURE__ */ jsx(CheckCircle, {
							size: 48,
							color: "#2e7d32",
							style: {
								alignSelf: "center",
								marginBottom: "8px"
							}
						}), /* @__PURE__ */ jsx("h3", {
							className: "title-cursive",
							style: { fontSize: "2.5rem" },
							children: "Votre profil amoureux"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "result-box text-center",
						style: {
							backgroundColor: "rgba(169, 27, 34, 0.03)",
							padding: "1.5rem",
							borderRadius: "16px",
							border: "1px solid rgba(169, 27, 34, 0.1)"
						},
						children: [
							/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									fontSize: "0.9rem",
									color: "var(--color-text-light)",
									fontWeight: 600
								},
								children: "Votre langage de l'amour dominant :"
							}),
							/* @__PURE__ */ jsx("h2", {
								style: {
									margin: "8px 0",
									color: "var(--color-primary)",
									fontSize: "2rem",
									fontWeight: 800
								},
								children: profile?.love_language
							}),
							/* @__PURE__ */ jsxs("p", {
								style: {
									margin: 0,
									fontSize: "0.9rem",
									color: "var(--color-text-light)",
									lineHeight: "1.5",
									marginTop: "0.5rem"
								},
								children: [
									profile?.love_language === "Paroles valorisantes" && "Vous vous sentez particulièrement aimé(e) lorsque votre partenaire vous adresse des mots encourageants, des compliments ou de doux messages.",
									profile?.love_language === "Temps de qualité" && "Le temps passé à deux, sans distractions ni écrans, est le moyen le plus fort de remplir votre réservoir émotionnel.",
									profile?.love_language === "Cadeaux" && "Pour vous, les cadeaux sont le symbole visible de la pensée attentionnée et du soin apporté par votre partenaire.",
									profile?.love_language === "Services rendus" && "Les actes de service, l'aide spontanée au quotidien, sont les preuves d'amour les plus concrètes pour vous.",
									profile?.love_language === "Contact physique" && "Les câlins, les baisers, le contact des mains et la proximité physique sont votre moyen d'expression privilégié."
								]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "partner-result-box",
						style: {
							borderTop: "1px solid rgba(169,27,34,0.1)",
							paddingTop: "1.5rem"
						},
						children: [/* @__PURE__ */ jsxs("h4", {
							style: {
								fontSize: "1.1rem",
								marginBottom: "8px",
								color: "var(--color-text)"
							},
							children: ["Profil de ", partnerProfile?.display_name || "votre partenaire"]
						}), partnerProfile?.love_language ? /* @__PURE__ */ jsxs("div", {
							className: "partner-result-badge",
							style: {
								display: "flex",
								alignItems: "center",
								gap: "10px",
								backgroundColor: "rgba(46, 125, 50, 0.05)",
								padding: "12px",
								borderRadius: "12px",
								border: "1px solid rgba(46, 125, 50, 0.1)"
							},
							children: [/* @__PURE__ */ jsx(Sparkles, {
								size: 20,
								color: "#2e7d32"
							}), /* @__PURE__ */ jsxs("span", {
								style: {
									fontSize: "1rem",
									color: "#2e7d32",
									fontWeight: 600
								},
								children: ["Langage dominant : ", /* @__PURE__ */ jsx("strong", { children: partnerProfile.love_language })]
							})]
						}) : /* @__PURE__ */ jsxs("p", {
							style: {
								margin: 0,
								fontSize: "0.9rem",
								color: "var(--color-text-light)",
								fontStyle: "italic"
							},
							children: [
								"⏳ ",
								partnerProfile?.display_name || "Votre partenaire",
								" n'a pas encore rempli le questionnaire."
							]
						})]
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: handleRetake,
						className: "btn btn-secondary",
						style: {
							margin: "1rem auto 0 auto",
							width: "auto"
						},
						children: "Refaire le questionnaire"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/pages/love-languages.astro
var love_languages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$LoveLanguages,
	file: () => $$file,
	url: () => $$url
});
var $$LoveLanguages = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Nos Langages de l'Amour" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "LoveLanguagesComponent", LoveLanguages, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/PC/Desktop/univers/src/components/LoveLanguages.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "C:/Users/PC/Desktop/univers/src/pages/love-languages.astro", void 0);
var $$file = "C:/Users/PC/Desktop/univers/src/pages/love-languages.astro";
var $$url = "/love-languages";
//#endregion
//#region \0virtual:astro:page:src/pages/love-languages@_@astro
var page = () => love_languages_exports;
//#endregion
export { page };
