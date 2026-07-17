import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_DaiMCY8D.mjs";
import { t as createComponent } from "./compiler_eBKWP4FC.mjs";
import { n as supabase, t as $$AppLayout } from "./AppLayout_BkfgsvN2.mjs";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Lock, Mic, Send, Sparkles, Square, Unlock, X } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/Chat.jsx
function Chat() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [partnerProfile, setPartnerProfile] = useState(null);
	const [messages, setMessages] = useState([]);
	const [inputText, setInputText] = useState("");
	const [isSecret, setIsSecret] = useState(false);
	const [sending, setSending] = useState(false);
	const [photoFile, setPhotoFile] = useState(null);
	const [photoPreview, setPhotoPreview] = useState(null);
	const [revealedSecrets, setRevealedSecrets] = useState(/* @__PURE__ */ new Set());
	const [isRecording, setIsRecording] = useState(false);
	const [mediaRecorder, setMediaRecorder] = useState(null);
	const [recordingSeconds, setRecordingSeconds] = useState(0);
	const messagesEndRef = useRef(null);
	const channelRef = useRef(null);
	const fileInputRef = useRef(null);
	useEffect(() => {
		let interval;
		if (isRecording) interval = setInterval(() => {
			setRecordingSeconds((prev) => prev + 1);
		}, 1e3);
		else setRecordingSeconds(0);
		return () => clearInterval(interval);
	}, [isRecording]);
	useEffect(() => {
		checkUser();
		return () => {
			if (channelRef.current) supabase.removeChannel(channelRef.current);
		};
	}, []);
	useEffect(() => {
		scrollToBottom();
	}, [messages]);
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};
	async function checkUser() {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				window.location.href = "/";
				return;
			}
			setUser(session.user);
			await loadChatData(session.user.id);
		} catch (err) {
			console.error("Error in checkUser:", err);
			setLoading(false);
		}
	}
	async function loadChatData(userId) {
		try {
			const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", userId).single();
			setProfile(userProfile);
			if (!userProfile?.couple_id) {
				setLoading(false);
				return;
			}
			const { data: partners } = await supabase.from("profiles").select("*").eq("couple_id", userProfile.couple_id).neq("id", userId);
			if (partners && partners.length > 0) setPartnerProfile(partners[0]);
			const { data: pastMsgs, error } = await supabase.from("messages").select("*").eq("couple_id", userProfile.couple_id).order("created_at", { ascending: true });
			if (error) throw error;
			setMessages(pastMsgs || []);
			if (channelRef.current) supabase.removeChannel(channelRef.current);
			const channel = supabase.channel("room_messages").on("postgres_changes", {
				event: "INSERT",
				schema: "public",
				table: "messages",
				filter: `couple_id=eq.${userProfile.couple_id}`
			}, (payload) => {
				setMessages((prev) => {
					if (prev.some((m) => m.id === payload.new.id)) return prev;
					return [...prev, payload.new];
				});
			}).subscribe();
			channelRef.current = channel;
			setLoading(false);
		} catch (err) {
			console.error("Error loading chat:", err);
			setLoading(false);
		}
	}
	const handlePhotoSelect = (e) => {
		const file = e.target.files?.[0];
		if (file) {
			setPhotoFile(file);
			const reader = new FileReader();
			reader.onloadend = () => setPhotoPreview(reader.result);
			reader.readAsDataURL(file);
		}
	};
	const clearPhoto = () => {
		setPhotoFile(null);
		setPhotoPreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
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
	const uploadPhoto = async (file) => {
		try {
			const fileExt = file.name.split(".").pop();
			const filePath = `chat-photos/${`${profile.couple_id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`}`;
			const { error: uploadErr } = await supabase.storage.from("souvenir-media").upload(filePath, file);
			if (uploadErr) throw uploadErr;
			const { data: { publicUrl } } = supabase.storage.from("souvenir-media").getPublicUrl(filePath);
			return publicUrl;
		} catch (err) {
			console.warn("Storage upload failed, using compressed base64 fallback:", err.message);
			return await compressImage(file);
		}
	};
	const handleSendMessage = async (e) => {
		e.preventDefault();
		if (!inputText.trim() && !photoFile || sending) return;
		setSending(true);
		try {
			let msgText = inputText.trim();
			let type = "text";
			if (photoFile) {
				type = "photo";
				msgText = await uploadPhoto(photoFile);
			} else if (isSecret) type = "secret";
			const { data: newMsg, error } = await supabase.from("messages").insert([{
				couple_id: profile.couple_id,
				sender_id: user.id,
				message_text: msgText,
				message_type: type
			}]).select().single();
			if (error) throw error;
			const { data: couple } = await supabase.from("couples").select("flame_xp, flame_energy").eq("id", profile.couple_id).single();
			if (couple) await supabase.from("couples").update({
				flame_xp: couple.flame_xp + 1,
				flame_energy: Math.min(100, couple.flame_energy + 1)
			}).eq("id", profile.couple_id);
			setMessages((prev) => {
				if (prev.some((m) => m.id === newMsg.id)) return prev;
				return [...prev, newMsg];
			});
			try {
				fetch("/api/notify", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						coupleId: profile.couple_id,
						senderId: user.id,
						messageText: msgText,
						messageType: type,
						title: profile.display_name || "Votre partenaire"
					})
				}).catch((err) => console.warn("Push trigger failed", err));
			} catch (err) {
				console.warn("Push error", err);
			}
			setInputText("");
			clearPhoto();
			setIsSecret(false);
		} catch (err) {
			console.error(err);
			alert(`Erreur lors de l'envoi du message: ${err.message || JSON.stringify(err)}`);
		} finally {
			setSending(false);
		}
	};
	const toggleSecretReveal = (msgId) => {
		setRevealedSecrets((prev) => {
			const next = new Set(prev);
			if (next.has(msgId)) next.delete(msgId);
			else next.add(msgId);
			return next;
		});
	};
	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			let options = void 0;
			if (MediaRecorder.isTypeSupported("audio/mp4")) options = { mimeType: "audio/mp4" };
			else if (MediaRecorder.isTypeSupported("audio/webm")) options = { mimeType: "audio/webm" };
			const recorder = new MediaRecorder(stream, options);
			const chunks = [];
			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunks.push(e.data);
			};
			recorder.onstop = async () => {
				const mime = recorder.mimeType || (options ? options.mimeType : "audio/mp4");
				const audioBlob = new Blob(chunks, { type: mime });
				await uploadAudio(audioBlob);
				stream.getTracks().forEach((track) => track.stop());
			};
			setMediaRecorder(recorder);
			recorder.start();
			setIsRecording(true);
		} catch (err) {
			console.error("Error accessing microphone:", err);
			alert("Impossible d'accéder au micro. Veuillez vérifier vos autorisations.");
		}
	};
	const stopRecording = () => {
		if (mediaRecorder && mediaRecorder.state !== "inactive") {
			mediaRecorder.stop();
			setIsRecording(false);
		}
	};
	const cancelRecording = () => {
		if (mediaRecorder) {
			mediaRecorder.onstop = null;
			if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
			if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((t) => t.stop());
		}
		setIsRecording(false);
	};
	const uploadAudio = async (audioBlob) => {
		setSending(true);
		try {
			const filePath = `chat-audio/${`${profile.couple_id}/${Date.now()}.webm`}`;
			let audioUrl;
			const { error: uploadErr } = await supabase.storage.from("souvenir-media").upload(filePath, audioBlob);
			if (!uploadErr) {
				const { data: { publicUrl } } = supabase.storage.from("souvenir-media").getPublicUrl(filePath);
				audioUrl = publicUrl;
			} else {
				console.warn("Storage upload failed, using base64 fallback for audio:", uploadErr);
				audioUrl = await new Promise((resolve) => {
					const reader = new FileReader();
					reader.onloadend = () => resolve(reader.result);
					reader.readAsDataURL(audioBlob);
				});
			}
			const { data: newMsg, error: insertErr } = await supabase.from("messages").insert([{
				couple_id: profile.couple_id,
				sender_id: user.id,
				message_text: audioUrl,
				message_type: "audio"
			}]).select().single();
			if (insertErr) throw insertErr;
			const { data: couple } = await supabase.from("couples").select("flame_xp, flame_energy").eq("id", profile.couple_id).single();
			if (couple) await supabase.from("couples").update({
				flame_xp: couple.flame_xp + 1,
				flame_energy: Math.min(100, couple.flame_energy + 1)
			}).eq("id", profile.couple_id);
			setMessages((prev) => {
				if (prev.some((m) => m.id === newMsg.id)) return prev;
				return [...prev, newMsg];
			});
			try {
				fetch("/api/notify", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						coupleId: profile.couple_id,
						senderId: user.id,
						messageText: "",
						messageType: "audio",
						title: profile.display_name || "Votre partenaire"
					})
				}).catch((err) => console.warn("Push trigger failed", err));
			} catch (err) {
				console.warn("Push error", err);
			}
		} catch (err) {
			console.error("Error sending voice note:", err);
			alert("Erreur lors de l'envoi de la note vocale.");
		} finally {
			setSending(false);
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
			children: "Chargement de la messagerie..."
		})]
	});
	if (!profile?.couple_id) return /* @__PURE__ */ jsxs("div", {
		className: "flex-center",
		style: {
			minHeight: "80vh",
			flexDirection: "column",
			gap: "1rem",
			padding: "2rem",
			textAlign: "center"
		},
		children: [
			/* @__PURE__ */ jsx(Sparkles, {
				size: 48,
				color: "var(--color-primary)"
			}),
			/* @__PURE__ */ jsx("h3", {
				style: { color: "var(--color-text)" },
				children: "Pas encore de partenaire"
			}),
			/* @__PURE__ */ jsx("p", {
				style: { color: "var(--color-text-light)" },
				children: "Liez-vous avec votre partenaire pour commencer à discuter !"
			}),
			/* @__PURE__ */ jsx("a", {
				href: "/dashboard",
				className: "btn btn-small",
				children: "Retour à l'univers"
			})
		]
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "chat-container",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "chat-header",
				children: [/* @__PURE__ */ jsx("a", {
					href: "/dashboard",
					className: "back-arrow-btn",
					children: "←"
				}), /* @__PURE__ */ jsxs("div", {
					className: "partner-status",
					children: [/* @__PURE__ */ jsx("div", {
						className: "partner-avatar",
						children: "💖"
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: partnerProfile?.display_name || "Votre partenaire" }), /* @__PURE__ */ jsxs("p", {
						className: "status-indicator",
						children: [/* @__PURE__ */ jsx("span", { className: "status-dot" }), "En ligne dans votre Univers"]
					})] })]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "messages-feed",
				children: [messages.length === 0 ? /* @__PURE__ */ jsxs("div", {
					className: "chat-empty",
					children: [
						/* @__PURE__ */ jsx(Sparkles, {
							size: 32,
							color: "var(--color-primary)",
							style: { marginBottom: "8px" }
						}),
						/* @__PURE__ */ jsx("p", { children: "Envoyez un message pour démarrer la discussion." }),
						/* @__PURE__ */ jsx("p", {
							className: "subtext",
							children: "Chaque message nourrit discrètement votre flamme !"
						})
					]
				}) : messages.map((m) => {
					const isMe = m.sender_id === user.id;
					const isSecretType = m.message_type === "secret";
					const isPhotoType = m.message_type === "photo";
					const isAudioType = m.message_type === "audio";
					const isRevealed = revealedSecrets.has(m.id);
					return /* @__PURE__ */ jsx("div", {
						className: `msg-wrapper ${isMe ? "msg-me" : "msg-partner"}`,
						children: /* @__PURE__ */ jsxs("div", {
							className: `msg-bubble ${isSecretType ? "msg-secret" : ""} ${isPhotoType ? "msg-photo" : ""} ${isAudioType ? "audio-message-bubble" : ""}`,
							onClick: () => isSecretType && toggleSecretReveal(m.id),
							style: { cursor: isSecretType ? "pointer" : "default" },
							children: [isSecretType ? /* @__PURE__ */ jsx("div", {
								className: "secret-content",
								children: isRevealed ? /* @__PURE__ */ jsxs("div", {
									className: "revealed-text",
									children: [/* @__PURE__ */ jsxs("span", {
										className: "secret-badge",
										children: [/* @__PURE__ */ jsx(Unlock, { size: 12 }), " Message Secret"]
									}), /* @__PURE__ */ jsx("p", { children: m.message_text })]
								}) : /* @__PURE__ */ jsxs("div", {
									className: "hidden-text",
									children: [/* @__PURE__ */ jsx(Lock, { size: 18 }), /* @__PURE__ */ jsx("span", { children: "Message secret (cliquez pour révéler)" })]
								})
							}) : isPhotoType ? /* @__PURE__ */ jsx("img", {
								src: m.message_text,
								alt: "Photo partagée",
								className: "chat-img-media"
							}) : isAudioType ? /* @__PURE__ */ jsx("audio", {
								src: m.message_text,
								controls: true,
								className: "chat-audio-player"
							}) : /* @__PURE__ */ jsx("p", { children: m.message_text }), /* @__PURE__ */ jsx("span", {
								className: "msg-time",
								children: new Date(m.created_at).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit"
								})
							})]
						})
					}, m.id);
				}), /* @__PURE__ */ jsx("div", { ref: messagesEndRef })]
			}),
			photoPreview && /* @__PURE__ */ jsxs("div", {
				className: "photo-preview-bar",
				children: [
					/* @__PURE__ */ jsx("img", {
						src: photoPreview,
						alt: "Aperçu",
						className: "photo-preview-thumb"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "photo-preview-label",
						children: "Photo prête à envoyer"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: clearPhoto,
						className: "photo-preview-close",
						children: /* @__PURE__ */ jsx(X, { size: 16 })
					})
				]
			}),
			/* @__PURE__ */ jsx("input", {
				type: "file",
				accept: "image/*",
				capture: "environment",
				ref: fileInputRef,
				onChange: handlePhotoSelect,
				style: { display: "none" }
			}),
			/* @__PURE__ */ jsx("form", {
				onSubmit: handleSendMessage,
				className: `chat-input-area ${isSecret ? "secret-active" : ""}`,
				children: isRecording ? /* @__PURE__ */ jsxs("div", {
					className: "input-row recording-active-row",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "recording-status",
						children: [/* @__PURE__ */ jsx("span", { className: "recording-dot" }), /* @__PURE__ */ jsxs("span", { children: [
							"Enregistrement : ",
							Math.floor(recordingSeconds / 60),
							":",
							(recordingSeconds % 60).toString().padStart(2, "0")
						] })]
					}), /* @__PURE__ */ jsxs("div", {
						className: "recording-actions",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: cancelRecording,
							className: "cancel-record-btn",
							children: "Annuler"
						}), /* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: stopRecording,
							className: "stop-record-btn",
							children: [/* @__PURE__ */ jsx(Square, { size: 14 }), " Envoyer"]
						})]
					})]
				}) : /* @__PURE__ */ jsxs("div", {
					className: "input-row",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => fileInputRef.current?.click(),
							className: `tool-btn ${photoFile ? "active" : ""}`,
							title: "Joindre une photo",
							children: /* @__PURE__ */ jsx(Camera, { size: 20 })
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => setIsSecret(!isSecret),
							className: `tool-btn secret-toggle-btn ${isSecret ? "active" : ""}`,
							title: "Message Secret",
							children: isSecret ? /* @__PURE__ */ jsx(Lock, {
								size: 20,
								color: "var(--color-primary)"
							}) : /* @__PURE__ */ jsx(Unlock, { size: 20 })
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: startRecording,
							className: "tool-btn mic-btn",
							title: "Enregistrer un message vocal",
							children: /* @__PURE__ */ jsx(Mic, { size: 20 })
						}),
						/* @__PURE__ */ jsx("input", {
							type: "text",
							value: inputText,
							onChange: (e) => setInputText(e.target.value),
							placeholder: isSecret ? "Écrire un message secret..." : "Écrire un message...",
							disabled: !!photoFile
						}),
						/* @__PURE__ */ jsx("button", {
							type: "submit",
							disabled: sending || inputText.trim() === "" && !photoFile,
							className: "send-btn",
							children: sending ? /* @__PURE__ */ jsx(Loader2, {
								className: "spinner",
								size: 18
							}) : /* @__PURE__ */ jsx(Send, { size: 18 })
						})
					]
				})
			})
		]
	});
}
//#endregion
//#region src/pages/messages.astro
var messages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Messages,
	file: () => $$file,
	url: () => $$url
});
var $$Messages = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "AppLayout", $$AppLayout, { "title": "Notre Discussion" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "ChatComponent", Chat, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/PC/Desktop/univers/src/components/Chat.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "C:/Users/PC/Desktop/univers/src/pages/messages.astro", void 0);
var $$file = "C:/Users/PC/Desktop/univers/src/pages/messages.astro";
var $$url = "/messages";
//#endregion
//#region \0virtual:astro:page:src/pages/messages@_@astro
var page = () => messages_exports;
//#endregion
export { page };
