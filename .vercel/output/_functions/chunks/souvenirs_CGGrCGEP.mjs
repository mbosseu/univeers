import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { n as supabase, t as $$AppLayout } from "./AppLayout_BkfgsvN2.mjs";
import { useEffect, useRef, useState } from "react";
import { Calendar, CalendarHeart, Compass, History, Image, Loader2, MapPin, Plus } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/Souvenirs.jsx
var EMOTIONS = [
	{
		label: "Heureux 😊",
		emoji: "😊"
	},
	{
		label: "Amoureux ❤️",
		emoji: "❤️"
	},
	{
		label: "Amusé 😂",
		emoji: "😂"
	},
	{
		label: "Paisible ☕",
		emoji: "☕"
	},
	{
		label: "Festif 🎉",
		emoji: "🎉"
	}
];
var PLACEHOLDER_IMAGES = {
	"😊": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop",
	"❤️": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop",
	"😂": "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=600&auto=format&fit=crop",
	"☕": "https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=600&auto=format&fit=crop",
	"🎉": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600&auto=format&fit=crop"
};
function Souvenirs() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [souvenirs, setSouvenirs] = useState([]);
	const [showAddForm, setShowAddForm] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [locationName, setLocationName] = useState("");
	const [souvenirDate, setSouvenirDate] = useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
	const [selectedEmotion, setSelectedEmotion] = useState("❤️");
	const [imageFile, setImageFile] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [viewingSouvenir, setViewingSouvenir] = useState(null);
	const [editingSouvenir, setEditingSouvenir] = useState(null);
	const channelRef = useRef(null);
	useEffect(() => {
		checkUser();
		return () => {
			if (channelRef.current) supabase.removeChannel(channelRef.current);
		};
	}, []);
	useEffect(() => {
		if (typeof window !== "undefined" && window.L && souvenirs.length > 0) {
			if (document.getElementById("souvenirs-map")) {
				if (window.souvenirsMap) window.souvenirsMap.remove();
				const validCoords = souvenirs.filter((s) => s.latitude && s.longitude);
				const center = validCoords.length > 0 ? [validCoords[0].latitude, validCoords[0].longitude] : [46.2276, 2.2137];
				const map = window.L.map("souvenirs-map").setView(center, 5);
				window.souvenirsMap = map;
				window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
				validCoords.forEach((s) => {
					const markerIcon = window.L.divIcon({
						html: `<div style="font-size: 24px; text-align: center;">📍</div>`,
						className: "custom-pin",
						iconSize: [30, 30],
						iconAnchor: [15, 30]
					});
					window.L.marker([s.latitude, s.longitude], { icon: markerIcon }).addTo(map).bindPopup(`
              <div style="font-family: sans-serif; text-align: center;">
                <b>${s.title}</b><br/>
                <span style="font-size: 11px; color: #795548;">${s.location_name || ""}</span><br/>
                <span style="font-size: 16px;">${s.description?.substring(0, 50) || ""}</span>
              </div>
            `);
				});
			}
		}
	}, [souvenirs]);
	async function checkUser() {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				window.location.href = "/";
				return;
			}
			setUser(session.user);
			await fetchSouvenirs(session.user.id);
		} catch (err) {
			console.error(err);
			setLoading(false);
		}
	}
	async function fetchSouvenirs(userId) {
		try {
			const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", userId).single();
			setProfile(userProfile);
			if (userProfile.couple_id) {
				const { data: list, error } = await supabase.from("souvenirs").select("*").eq("couple_id", userProfile.couple_id).order("souvenir_date", { ascending: false });
				if (error) throw error;
				setSouvenirs(list || []);
				if (channelRef.current) supabase.removeChannel(channelRef.current);
				const channel = supabase.channel("souvenirs_realtime").on("postgres_changes", {
					event: "*",
					schema: "public",
					table: "souvenirs",
					filter: `couple_id=eq.${userProfile.couple_id}`
				}, (payload) => {
					if (payload.eventType === "INSERT") setSouvenirs((prev) => [payload.new, ...prev]);
					else if (payload.eventType === "DELETE") setSouvenirs((prev) => prev.filter((s) => s.id !== payload.old.id));
					else if (payload.eventType === "UPDATE") setSouvenirs((prev) => prev.map((s) => s.id === payload.new.id ? payload.new : s));
				}).subscribe();
				channelRef.current = channel;
			}
			setLoading(false);
		} catch (err) {
			console.error("Error fetching souvenirs:", err);
			setLoading(false);
		}
	}
	const handleImageChange = (e) => {
		if (e.target.files && e.target.files.length > 0) setImageFile(e.target.files[0]);
	};
	const handleEditClick = (souvenir) => {
		setEditingSouvenir(souvenir);
		setTitle(souvenir.title);
		setDescription(souvenir.description || "");
		setLocationName(souvenir.location_name || "");
		setSouvenirDate(souvenir.souvenir_date ? souvenir.souvenir_date.split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
		setSelectedEmotion("❤️");
		setShowAddForm(true);
		setViewingSouvenir(null);
	};
	const handleDelete = async (id) => {
		if (!window.confirm("Voulez-vous vraiment supprimer ce souvenir ?")) return;
		try {
			const { error } = await supabase.from("souvenirs").delete().eq("id", id);
			if (error) throw error;
			setSouvenirs((prev) => prev.filter((s) => s.id !== id));
			setViewingSouvenir(null);
		} catch (err) {
			console.error(err);
			alert("Erreur lors de la suppression.");
		}
	};
	const compressImage = (file, maxWidth = 800, quality = .7) => {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new window.Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					let w = img.width;
					let h = img.height;
					if (w > maxWidth) {
						h = h * maxWidth / w;
						w = maxWidth;
					}
					canvas.width = w;
					canvas.height = h;
					canvas.getContext("2d").drawImage(img, 0, 0, w, h);
					resolve(canvas.toDataURL("image/jpeg", quality));
				};
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		});
	};
	const handleAddSouvenir = async (e) => {
		e.preventDefault();
		if (!title.trim() || submitting) return;
		setSubmitting(true);
		try {
			let imageUrl = PLACEHOLDER_IMAGES[selectedEmotion];
			if (imageFile) {
				const fileExt = imageFile.name.split(".").pop();
				const filePath = `${`${profile.couple_id}/${Math.random().toString(36).substring(2)}.${fileExt}`}`;
				const { data: uploadData, error: uploadErr } = await supabase.storage.from("souvenir-media").upload(filePath, imageFile);
				if (!uploadErr) {
					const { data: { publicUrl } } = supabase.storage.from("souvenir-media").getPublicUrl(filePath);
					imageUrl = publicUrl;
				} else {
					console.warn("Storage upload error (using base64 fallback):", uploadErr);
					imageUrl = await compressImage(imageFile);
				}
			}
			let lat = 46.2276 + (Math.random() - .5) * 2;
			let lng = 2.2137 + (Math.random() - .5) * 2;
			if (locationName.toLowerCase().includes("paris")) {
				lat = 48.8566;
				lng = 2.3522;
			} else if (locationName.toLowerCase().includes("lyon")) {
				lat = 45.764;
				lng = 4.8357;
			} else if (locationName.toLowerCase().includes("marseille")) {
				lat = 43.2965;
				lng = 5.3698;
			}
			const payload = {
				title: title.trim(),
				description: description.trim(),
				media_url: imageUrl,
				location_name: locationName.trim(),
				latitude: lat,
				longitude: lng,
				souvenir_date: souvenirDate
			};
			if (editingSouvenir) {
				const { data, error } = await supabase.from("souvenirs").update(payload).eq("id", editingSouvenir.id).select().single();
				if (error) throw error;
			} else {
				payload.couple_id = profile.couple_id;
				const { data: newSouvenir, error } = await supabase.from("souvenirs").insert([payload]).select().single();
				if (error) throw error;
				const { data: couple } = await supabase.from("couples").select("flame_xp, flame_energy").eq("id", profile.couple_id).single();
				if (couple) await supabase.from("couples").update({
					flame_xp: couple.flame_xp + 30,
					flame_energy: Math.min(100, couple.flame_energy + 10)
				}).eq("id", profile.couple_id);
			}
			setTitle("");
			setDescription("");
			setLocationName("");
			setImageFile(null);
			setSelectedEmotion("❤️");
			setShowAddForm(false);
			setEditingSouvenir(null);
		} catch (err) {
			console.error(err);
		} finally {
			setSubmitting(false);
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
			children: "Chargement de vos souvenirs..."
		})]
	});
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
						children: "📸"
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "Album Souvenirs" }), /* @__PURE__ */ jsx("p", {
						className: "days-together",
						children: "Tous nos plus beaux moments gravés"
					})] })]
				}), /* @__PURE__ */ jsx("button", {
					onClick: () => setShowAddForm(true),
					className: "icon-btn",
					title: "Créer un souvenir",
					children: /* @__PURE__ */ jsx(Plus, {
						size: 24,
						color: "var(--color-primary)"
					})
				})]
			}),
			souvenirs.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "card",
				style: {
					padding: "12px",
					marginBottom: "1.5rem"
				},
				children: [/* @__PURE__ */ jsxs("h4", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: "6px",
						marginBottom: "8px",
						fontSize: "0.95rem"
					},
					children: [/* @__PURE__ */ jsx(Compass, {
						size: 16,
						color: "var(--color-primary)"
					}), /* @__PURE__ */ jsx("span", { children: "Notre carte des souvenirs" })]
				}), /* @__PURE__ */ jsx("div", {
					id: "souvenirs-map",
					style: {
						height: "220px",
						borderRadius: "12px",
						zIndex: 1
					}
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "souvenirs-grid",
				style: {
					display: "flex",
					flexDirection: "column",
					gap: "1.5rem"
				},
				children: souvenirs.length === 0 ? /* @__PURE__ */ jsxs("div", {
					className: "card text-center",
					style: { padding: "3rem 1.5rem" },
					children: [
						/* @__PURE__ */ jsx(Image, {
							size: 48,
							color: "var(--color-text-light)",
							style: {
								opacity: .5,
								marginBottom: "1rem"
							}
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "title-cursive",
							style: { fontSize: "2rem" },
							children: "Aucun souvenir encore..."
						}),
						/* @__PURE__ */ jsx("p", {
							style: {
								fontSize: "0.95rem",
								color: "var(--color-text-light)",
								margin: "0.5rem 0 1.5rem 0"
							},
							children: "Enregistrez vos voyages, vos rendez-vous romantiques, et vos fous rires !"
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: () => setShowAddForm(true),
							className: "btn btn-small",
							style: { margin: "0 auto" },
							children: "Ajouter notre premier souvenir"
						})
					]
				}) : souvenirs.map((s) => /* @__PURE__ */ jsxs("div", {
					className: "card souvenir-card",
					style: {
						padding: 0,
						overflow: "hidden",
						cursor: "pointer"
					},
					onClick: () => setViewingSouvenir(s),
					children: [/* @__PURE__ */ jsx("div", {
						className: "souvenir-image",
						style: { backgroundImage: `url(${s.media_url})` },
						children: /* @__PURE__ */ jsx("div", {
							className: "souvenir-emotion-badge",
							children: s.selected_emotion || "❤️"
						})
					}), /* @__PURE__ */ jsxs("div", {
						className: "souvenir-body",
						style: { padding: "1.2rem" },
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "souvenir-meta",
								style: {
									display: "flex",
									gap: "12px",
									fontSize: "0.85rem",
									color: "var(--color-text-light)",
									marginBottom: "6px"
								},
								children: [/* @__PURE__ */ jsxs("span", {
									className: "flex-center",
									style: { gap: "4px" },
									children: [/* @__PURE__ */ jsx(Calendar, { size: 14 }), new Date(s.souvenir_date).toLocaleDateString([], {
										day: "numeric",
										month: "long",
										year: "numeric"
									})]
								}), s.location_name && /* @__PURE__ */ jsxs("span", {
									className: "flex-center",
									style: { gap: "4px" },
									children: [/* @__PURE__ */ jsx(MapPin, { size: 14 }), s.location_name]
								})]
							}),
							/* @__PURE__ */ jsx("h4", {
								style: {
									fontSize: "1.25rem",
									marginBottom: "8px",
									color: "var(--color-text)"
								},
								children: s.title
							}),
							/* @__PURE__ */ jsx("p", {
								style: {
									fontSize: "0.95rem",
									color: "var(--color-text-light)",
									lineHeight: "1.5",
									margin: 0
								},
								children: s.description
							})
						]
					})]
				}, s.id))
			}),
			viewingSouvenir && /* @__PURE__ */ jsx("div", {
				className: "modal-overlay",
				children: /* @__PURE__ */ jsxs("div", {
					className: "modal-card",
					style: {
						padding: "2rem 1.5rem",
						maxWidth: "500px"
					},
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "modal-header",
							style: { marginBottom: "1.5rem" },
							children: [/* @__PURE__ */ jsx("h2", {
								className: "title-cursive",
								style: { fontSize: "2.2rem" },
								children: viewingSouvenir.title
							}), /* @__PURE__ */ jsx("button", {
								onClick: () => setViewingSouvenir(null),
								className: "close-btn",
								children: "×"
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							style: { marginBottom: "1.5rem" },
							children: /* @__PURE__ */ jsx("img", {
								src: viewingSouvenir.media_url,
								alt: viewingSouvenir.title,
								style: {
									width: "100%",
									height: "300px",
									objectFit: "cover",
									borderRadius: "12px"
								}
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								gap: "1rem",
								marginBottom: "1rem",
								color: "var(--color-text-light)",
								fontSize: "0.9rem"
							},
							children: [/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx(Calendar, {
								size: 14,
								style: {
									display: "inline",
									verticalAlign: "text-bottom",
									marginRight: "4px"
								}
							}), new Date(viewingSouvenir.souvenir_date).toLocaleDateString()] }), viewingSouvenir.location_name && /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx(MapPin, {
								size: 14,
								style: {
									display: "inline",
									verticalAlign: "text-bottom",
									marginRight: "4px"
								}
							}), viewingSouvenir.location_name] })]
						}),
						/* @__PURE__ */ jsx("p", {
							style: {
								lineHeight: "1.6",
								marginBottom: "2rem"
							},
							children: viewingSouvenir.description
						}),
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								gap: "1rem",
								justifyContent: "flex-end"
							},
							children: [/* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => handleEditClick(viewingSouvenir),
								className: "btn btn-outline",
								style: {
									padding: "8px 16px",
									fontSize: "0.9rem"
								},
								children: "Modifier"
							}), /* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => handleDelete(viewingSouvenir.id),
								className: "btn",
								style: {
									background: "#d32f2f",
									padding: "8px 16px",
									fontSize: "0.9rem"
								},
								children: "Supprimer"
							})]
						})
					]
				})
			}),
			showAddForm && /* @__PURE__ */ jsx("div", {
				className: "modal-overlay",
				children: /* @__PURE__ */ jsxs("div", {
					className: "modal-card",
					style: {
						padding: "2rem 1.5rem",
						maxWidth: "450px"
					},
					children: [/* @__PURE__ */ jsxs("div", {
						className: "modal-header",
						style: { marginBottom: "1.5rem" },
						children: [/* @__PURE__ */ jsx("h2", {
							className: "title-cursive",
							style: { fontSize: "2.2rem" },
							children: editingSouvenir ? "Modifier le souvenir" : "Nouveau souvenir"
						}), /* @__PURE__ */ jsx("button", {
							onClick: () => {
								setShowAddForm(false);
								setEditingSouvenir(null);
							},
							className: "close-btn",
							children: "×"
						})]
					}), /* @__PURE__ */ jsxs("form", {
						onSubmit: handleAddSouvenir,
						className: "auth-form",
						style: { gap: "1.2rem" },
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "input-group",
								children: [/* @__PURE__ */ jsx("label", { children: "Titre du moment" }), /* @__PURE__ */ jsx("input", {
									type: "text",
									value: title,
									onChange: (e) => setTitle(e.target.value),
									placeholder: "Ex: Notre pique-nique au parc...",
									required: true
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "input-group",
								children: [/* @__PURE__ */ jsx("label", { children: "Description / Anecdote" }), /* @__PURE__ */ jsx("textarea", {
									className: "response-textarea",
									value: description,
									onChange: (e) => setDescription(e.target.value),
									placeholder: "Racontez ce moment spécial...",
									style: { minHeight: "60px" }
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "input-group",
								children: [/* @__PURE__ */ jsx("label", { children: "Lieu (Nom de la ville/endroit)" }), /* @__PURE__ */ jsx("input", {
									type: "text",
									value: locationName,
									onChange: (e) => setLocationName(e.target.value),
									placeholder: "Ex: Tour Eiffel, Paris"
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "input-group",
								children: [/* @__PURE__ */ jsx("label", { children: "Date du souvenir" }), /* @__PURE__ */ jsx("input", {
									type: "date",
									value: souvenirDate,
									onChange: (e) => setSouvenirDate(e.target.value),
									required: true
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "input-group",
								children: [/* @__PURE__ */ jsx("label", { children: "Émotion générale" }), /* @__PURE__ */ jsx("div", {
									className: "emotions-picker",
									style: {
										display: "flex",
										gap: "10px",
										marginTop: "4px"
									},
									children: EMOTIONS.map((em) => /* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: () => setSelectedEmotion(em.emoji),
										className: `emotion-btn ${selectedEmotion === em.emoji ? "active" : ""}`,
										style: {
											padding: "8px",
											fontSize: "1.3rem",
											background: selectedEmotion === em.emoji ? "rgba(169, 27, 34, 0.1)" : "transparent",
											border: selectedEmotion === em.emoji ? "1px solid var(--color-primary)" : "1px solid #ccc",
											borderRadius: "12px",
											cursor: "pointer",
											boxShadow: "none"
										},
										children: em.emoji
									}, em.emoji))
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "input-group",
								children: [/* @__PURE__ */ jsx("label", { children: "Ajouter une photo (optionnel)" }), /* @__PURE__ */ jsx("input", {
									type: "file",
									accept: "image/*",
									onChange: handleImageChange,
									style: {
										border: "none",
										background: "none",
										padding: 0
									}
								})]
							}),
							/* @__PURE__ */ jsxs("button", {
								type: "submit",
								disabled: submitting,
								className: "btn submit-btn",
								children: [/* @__PURE__ */ jsx("span", { children: "Créer le souvenir (+30 XP)" }), submitting && /* @__PURE__ */ jsx(Loader2, {
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
						className: "nav-item",
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
						className: "nav-item active",
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
//#region src/pages/souvenirs.astro
var souvenirs_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Souvenirs,
	file: () => $$file,
	url: () => $$url
});
var $$Souvenirs = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Nos Souvenirs" }, { "default": ($$result) => renderTemplate`<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""><\/script>${renderComponent($$result, "SouvenirsComponent", Souvenirs, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/PC/Desktop/univers/src/components/Souvenirs.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "C:/Users/PC/Desktop/univers/src/pages/souvenirs.astro", void 0);
var $$file = "C:/Users/PC/Desktop/univers/src/pages/souvenirs.astro";
var $$url = "/souvenirs";
//#endregion
//#region \0virtual:astro:page:src/pages/souvenirs@_@astro
var page = () => souvenirs_exports;
//#endregion
export { page };
