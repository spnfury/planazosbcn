"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ImageUploader from "@/components/ImageUploader";
import MediaUploaderButton from "@/components/MediaUploaderButton";
import { AGE_GROUPS, ETIQUETAS } from "@/data/planConstants";
import styles from "../../admin.module.css";

const CATEGORIES = [
  { id: "gastro", label: "Gastronomía" },
  { id: "naturaleza", label: "Naturaleza" },
  { id: "cultura", label: "Cultura" },
  { id: "rutas", label: "Rutas" },
  { id: "nocturno", label: "Nocturno" },
  { id: "servicios", label: "Servicios" },
  { id: "bienestar", label: "Bienestar" },
];

export default function EditPlanPage({ params }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [planId, setPlanId] = useState(null);
  const [form, setForm] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [tickets, setTickets] = useState([]);
  const [guestLists, setGuestLists] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [reels, setReels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [originalPlan, setOriginalPlan] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [publishingState, setPublishingState] = useState({});

  useEffect(() => {
    async function load() {
      const { id } = await params;
      setPlanId(id);

      // Use API route to load plan (bypasses RLS)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/admin/plans/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        router.push("/admin/planes");
        return;
      }

      const plan = await res.json();

      setForm({
        type: plan.type || "plan",
        title: plan.title || "",
        slug: plan.slug || "",
        excerpt: plan.excerpt || "",
        description: plan.description || "",
        image: plan.image || "",
        poster_image: plan.poster_image || "",
        category: plan.category || "gastro",
        category_label: plan.category_label || "",
        zone: plan.zone || "",
        date: plan.date || "",
        price: plan.price || "",
        precio_reserva:
          plan.precio_reserva != null ? String(plan.precio_reserva) : "",
        shipping_cost:
          plan.shipping_cost != null ? String(plan.shipping_cost) : "",
        venue: plan.venue || "",
        address: plan.address || "",
        time_start: plan.time_start || "",
        time_end: plan.time_end || "",
        capacity: plan.capacity != null ? String(plan.capacity) : "0",
        spots_taken: plan.spots_taken != null ? String(plan.spots_taken) : "0",
        featured: plan.featured || false,
        sponsored: plan.sponsored || false,
        published: plan.published !== false,
        age_restriction: plan.age_restriction || "",
        age_groups: plan.age_groups || [],
        etiquetas: plan.etiquetas || [],
        menu_terraza: plan.menu_terraza || "",
        suplemento_terraza: plan.suplemento_terraza || "",
        alojamiento_hotel: plan.alojamiento_hotel || "",
      });

      setOriginalPlan({ ...plan });

      setTags((plan.plan_tags || []).map((t) => t.tag));
      setTickets(
        (plan.plan_tickets || []).sort((a, b) => a.sort_order - b.sort_order),
      );
      setGuestLists(
        (plan.plan_guest_lists || []).sort(
          (a, b) => a.sort_order - b.sort_order,
        ),
      );
      setSchedule(
        (plan.plan_schedule || []).sort((a, b) => a.sort_order - b.sort_order),
      );
      setReels(
        (plan.plan_reels || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((r) => r.url),
      );
      setLoading(false);
    }

    load();
  }, [params, router]);

  function updateForm(field, value) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "category") {
        const cat = CATEGORIES.find((c) => c.id === value);
        updated.category_label = cat?.label || value;
      }
      return updated;
    });
  }

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  }

  async function handleAiGenerate(promptOverride) {
    const text = promptOverride || aiPrompt;
    if (!text.trim()) return;
    setAiLoading(true);
    setError("");

    const currentPlanData = {
      ...form,
      tags,
      tickets,
      schedule,
      guestLists,
      reels,
    };

    try {
      const res = await fetch("/api/admin/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, currentPlanData }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Error modificando plan con IA");

      if (data.type !== undefined) updateForm("type", data.type);
      if (data.title !== undefined) updateForm("title", data.title);
      if (data.excerpt !== undefined) updateForm("excerpt", data.excerpt);
      if (data.description !== undefined)
        updateForm("description", data.description);
      if (data.category !== undefined) updateForm("category", data.category);
      if (data.zone !== undefined) updateForm("zone", data.zone);
      if (data.date !== undefined) updateForm("date", data.date);
      if (data.price !== undefined) updateForm("price", data.price);
      if (data.precio_reserva !== undefined)
        updateForm("precio_reserva", data.precio_reserva);
      if (data.shipping_cost !== undefined)
        updateForm("shipping_cost", data.shipping_cost);
      if (data.capacity !== undefined) updateForm("capacity", data.capacity);
      if (data.venue !== undefined) updateForm("venue", data.venue);
      if (data.address !== undefined) updateForm("address", data.address);
      if (data.time_start !== undefined)
        updateForm("time_start", data.time_start);
      if (data.time_end !== undefined) updateForm("time_end", data.time_end);
      if (data.age_restriction !== undefined)
        updateForm("age_restriction", data.age_restriction);

      if (Array.isArray(data.age_groups))
        updateForm("age_groups", data.age_groups);
      if (Array.isArray(data.etiquetas))
        updateForm("etiquetas", data.etiquetas);

      if (Array.isArray(data.tickets)) setTickets(data.tickets);
      if (Array.isArray(data.schedule)) setSchedule(data.schedule);

      setAiPrompt("");
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setIsTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("audio", audioBlob, "recording.webm");
          const res = await fetch("/api/admin/transcribe", {
            method: "POST",
            body: fd,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error de transcripción");
          if (data.text) {
            setAiPrompt(data.text);
            setIsTranscribing(false);
            handleAiGenerate(data.text);
            return;
          }
        } catch (err) {
          setError(err.message);
        }
        setIsTranscribing(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("No se pudo acceder al micrófono. Asegúrate de dar permiso.");
    }
  }

  function stopRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Bloquear filas incompletas de tickets o listas: o completas o las eliminas.
    const badTicket = tickets.findIndex(
      (t) =>
        (t?.name || "").trim() === "" ||
        t?.price === "" ||
        t?.price === null ||
        t?.price === undefined,
    );
    if (badTicket !== -1) {
      setError(
        `La entrada #${badTicket + 1} está incompleta: rellena nombre y precio o elimínala.`,
      );
      return;
    }
    const badList = guestLists.findIndex(
      (g) =>
        (g?.name || "").trim() === "" ||
        g?.price === "" ||
        g?.price === null ||
        g?.price === undefined,
    );
    if (badList !== -1) {
      setError(
        `La lista #${badList + 1} está incompleta: rellena nombre y precio o elimínala.`,
      );
      return;
    }

    setSaving(true);

    try {
      // Convert numeric strings to numbers for DB
      const payload = {
        ...form,
        precio_reserva: Number(form.precio_reserva) || 0,
        shipping_cost: Number(form.shipping_cost) || 0,
        capacity: Number(form.capacity) || 0,
        spots_taken: Number(form.spots_taken) || 0,
      };

      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token)
        throw new Error("No estás autenticado. Inicia sesión de nuevo.");

      // Use API route (bypasses RLS with supabaseAdmin)
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payload,
          tags,
          tickets: tickets.map((t, i) => ({
            name: t.name,
            price: t.price,
            description: t.description,
            capacity: t.capacity || 0,
            spots_taken: t.spots_taken || 0,
            sold_out: t.sold_out || false,
            sort_order: i,
          })),
          guestLists: guestLists.map((g, i) => ({
            name: g.name,
            time_range: g.time_range,
            price: g.price,
            description: g.description,
            sold_out: g.sold_out || false,
            sort_order: i,
          })),
          schedule: schedule.map((s, i) => ({
            time: s.time,
            description: s.description,
            sort_order: i,
          })),
          reels: reels.filter((url) => url.trim()),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al guardar");

      router.push("/admin/planes");

      // Log changes (fire and forget)
      if (originalPlan) {
        const trackFields = [
          "title",
          "slug",
          "excerpt",
          "description",
          "image",
          "poster_image",
          "category",
          "zone",
          "date",
          "price",
          "precio_reserva",
          "shipping_cost",
          "venue",
          "address",
          "time_start",
          "time_end",
          "capacity",
          "spots_taken",
          "featured",
          "sponsored",
          "published",
          "age_restriction",
          "type",
          "menu_terraza",
          "suplemento_terraza",
          "alojamiento_hotel",
        ];
        const changes = {};
        for (const f of trackFields) {
          if (String(originalPlan[f] ?? "") !== String(payload[f] ?? "")) {
            changes[f] = {
              old: originalPlan[f] ?? null,
              new: payload[f] ?? null,
            };
          }
        }
        if (Object.keys(changes).length > 0) {
          fetch("/api/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "plan.updated",
              details: { planId, title: form.title, changes },
              status: "success",
            }),
          }).catch(() => {});
        }
      }
    } catch (err) {
      setError(err.message || "Error al guardar");
      setSaving(false);
    }
  }

  async function handlePublishIg(videoUrl, index) {
    if (!videoUrl) return;
    setPublishingState((prev) => ({ ...prev, [`ig-${index}`]: true }));
    try {
      const res = await fetch("/api/social/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl,
          caption: form?.title || "",
          coverUrl: form?.image || "",
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Error publicando en Instagram");
      alert("✅ Publicado correctamente en Instagram!");
    } catch (err) {
      alert(`❌ Error en Instagram: ${err.message}`);
    } finally {
      setPublishingState((prev) => ({ ...prev, [`ig-${index}`]: false }));
    }
  }

  async function handlePublishTiktok(videoUrl, index) {
    if (!videoUrl) return;
    setPublishingState((prev) => ({ ...prev, [`ttk-${index}`]: true }));
    try {
      const res = await fetch("/api/social/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl,
          caption: form?.title || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error publicando en TikTok");
      alert("✅ Publicado correctamente en TikTok!");
    } catch (err) {
      alert(`❌ Error en TikTok: ${err.message}`);
    } finally {
      setPublishingState((prev) => ({ ...prev, [`ttk-${index}`]: false }));
    }
  }

  if (loading || !form) {
    return <p style={{ color: "rgba(255,255,255,0.4)" }}>Cargando...</p>;
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Editar plan</h1>
          <p className={styles.pageSubtitle}>{form.title}</p>
        </div>
        {form.slug && (
          <div
            style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
          >
            <Link
              href={`/planes/${form.slug}`}
              target="_blank"
              className={styles.actionBtn}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
              }}
            >
              ↗ Ver en la web
            </Link>
            <Link
              href={`/admin/generador-reels?id=${planId}`}
              className={styles.btnPrimary}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                padding: "0.5rem 1rem",
                background: "linear-gradient(to right, #8B5CF6, #EC4899)",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.85rem",
              }}
            >
              🎬 Generar Reel
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.loginError} style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* IA Assistant */}
        <div
          className={styles.formSection}
          style={{
            border: "2px solid rgba(139,92,246,0.3)",
            background: "rgba(139,92,246,0.05)",
          }}
        >
          <h3 className={styles.formSectionTitle} style={{ color: "#A78BFA" }}>
            ✨ Asistente Mágico
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            Dile al asistente qué cambios quieres hacer a este plan y él
            modificará los campos manteniendo el resto de información intacta.
          </p>
          <div
            style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}
          >
            <textarea
              className={styles.formInput}
              style={{ flex: 1, minHeight: "80px", resize: "vertical" }}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: Baja el precio a la mitad y añade la etiqueta romántico..."
              id="edit-ai-prompt"
              disabled={isRecording || isTranscribing}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => handleAiGenerate()}
                disabled={aiLoading || isRecording || isTranscribing}
                className={styles.btnPrimary}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "linear-gradient(to right, #8B5CF6, #EC4899)",
                  border: "none",
                  height: "fit-content",
                }}
              >
                {aiLoading
                  ? "Aplicando..."
                  : isTranscribing
                    ? "Transcribiendo..."
                    : "Aplicar Cambios"}
              </button>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={aiLoading || isTranscribing}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  border: isRecording
                    ? "2px solid #EF4444"
                    : "2px solid rgba(139,92,246,0.3)",
                  background: isRecording
                    ? "rgba(239,68,68,0.15)"
                    : "rgba(139,92,246,0.08)",
                  color: isRecording ? "#FCA5A5" : "#A78BFA",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s",
                  animation: isRecording ? "pulse 1.5s infinite" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {isRecording ? "⏹ Parar" : "🎤 Voz"}
              </button>
            </div>
          </div>
          {isRecording && (
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#FCA5A5",
                fontSize: "0.85rem",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#EF4444",
                  animation: "pulse 1s infinite",
                }}
              />
              Grabando audio... Pulsa "Parar" cuando termines.
            </div>
          )}
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>

        {/* Basic Info */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📝 Información básica</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo</label>
              <select
                className={styles.formSelect}
                value={form.type}
                onChange={(e) => updateForm("type", e.target.value)}
              >
                <option value="plan">Plan</option>
                <option value="evento">Evento</option>
                <option value="sorpresa">Sorpresa/Regalo</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Categoría</label>
              <select
                className={styles.formSelect}
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Título</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                required
                id="edit-title"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Slug</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.slug}
                onChange={(e) => updateForm("slug", e.target.value)}
                required
                id="edit-slug"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Resumen</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.excerpt}
                onChange={(e) => updateForm("excerpt", e.target.value)}
                id="edit-excerpt"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Descripción</label>
              <textarea
                className={styles.formInput}
                style={{ minHeight: "120px", resize: "vertical" }}
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                id="edit-description"
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>🖼️ Imágenes</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGridFull}>
              <ImageUploader
                value={form.image}
                onChange={(url) => updateForm("image", url)}
                label="Imagen principal"
                id="edit-image"
              />
            </div>
            {form.type === "evento" && (
              <div className={styles.formGridFull}>
                <ImageUploader
                  value={form.poster_image}
                  onChange={(url) => updateForm("poster_image", url)}
                  label="Poster vertical"
                  id="edit-poster"
                />
              </div>
            )}
          </div>
        </div>

        {/* Fecha y Horario */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📅 Fecha y Horario</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Fecha</label>
              <input
                type="date"
                className={styles.formInput}
                value={form.date}
                onChange={(e) => updateForm("date", e.target.value)}
              />
            </div>
            <div className={styles.formGroup} style={{ visibility: "hidden" }}>
              <span />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hora inicio</label>
              <input
                type="time"
                className={styles.formInput}
                value={form.time_start}
                onChange={(e) => updateForm("time_start", e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hora fin</label>
              <input
                type="time"
                className={styles.formInput}
                value={form.time_end}
                onChange={(e) => updateForm("time_end", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Precios */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>💰 Precios</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Precio</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Precio Pre-reserva (€)</label>
              <input
                type="number"
                step="0.01"
                className={styles.formInput}
                value={form.precio_reserva}
                onChange={(e) => updateForm("precio_reserva", e.target.value)}
                min="0"
              />
            </div>
            {form.type === "sorpresa" && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Coste de Envío (€)</label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.formInput}
                  value={form.shipping_cost}
                  onChange={(e) => updateForm("shipping_cost", e.target.value)}
                  min="0"
                />
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                ☀️ Suplemento terraza (€)
              </label>
              <input
                type="text"
                className={styles.formInput}
                value={form.suplemento_terraza}
                onChange={(e) =>
                  updateForm("suplemento_terraza", e.target.value)
                }
                placeholder="3.50"
              />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📍 Ubicación</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Zona</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.zone}
                onChange={(e) => updateForm("zone", e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Venue / Local</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.venue}
                onChange={(e) => updateForm("venue", e.target.value)}
                placeholder="Nombre del local"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Dirección</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.address}
                onChange={(e) => updateForm("address", e.target.value)}
                placeholder="C/ de Muntaner, 246..."
              />
            </div>
          </div>
        </div>

        {/* Capacidad y Acceso */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>👥 Capacidad y Acceso</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Aforo</label>
              <input
                type="number"
                className={styles.formInput}
                value={form.capacity}
                onChange={(e) => updateForm("capacity", e.target.value)}
                min="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Plazas ocupadas</label>
              <input
                type="number"
                className={styles.formInput}
                value={form.spots_taken}
                onChange={(e) => updateForm("spots_taken", e.target.value)}
                min="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Restricción de edad</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.age_restriction}
                onChange={(e) => updateForm("age_restriction", e.target.value)}
                placeholder="+18 años"
              />
            </div>
          </div>
        </div>

        {/* Terraza */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>🌿 Terraza</h3>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Menú en terraza</label>
              <textarea
                className={styles.formInput}
                style={{ minHeight: "60px", resize: "vertical" }}
                value={form.menu_terraza}
                onChange={(e) => updateForm("menu_terraza", e.target.value)}
                placeholder="Descripción del menú en terraza..."
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                ☀️ Suplemento terraza (€)
              </label>
              <input
                type="text"
                className={styles.formInput}
                value={form.suplemento_terraza}
                onChange={(e) =>
                  updateForm("suplemento_terraza", e.target.value)
                }
                placeholder="3.50"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>
                🏨 Alojamiento de Hotel
              </label>
              <textarea
                className={styles.formInput}
                style={{ minHeight: "60px", resize: "vertical" }}
                value={form.alojamiento_hotel}
                onChange={(e) =>
                  updateForm("alojamiento_hotel", e.target.value)
                }
                placeholder="Nombre del hotel, tipo de habitación, régimen..."
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        {form.type === "evento" && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>🏷️ Tags</h3>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginBottom: "0.75rem",
              }}
            >
              {tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: "0.3rem 0.75rem",
                    background: "rgba(139,92,246,0.12)",
                    borderRadius: "100px",
                    color: "#A78BFA",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((_, j) => j !== i))}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#EF4444",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                className={styles.formInput}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Añadir tag..."
                style={{ flex: 1 }}
              />
              <button type="button" className={styles.addBtn} onClick={addTag}>
                ＋
              </button>
            </div>
          </div>
        )}

        {/* Tickets */}
        {(form.type === "evento" || tickets.length > 0) && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>🎟️ Entradas</h3>
            {tickets.map((ticket, i) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.listItemFields}>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Nombre"
                    value={ticket.name}
                    onChange={(e) => {
                      const c = [...tickets];
                      c[i] = { ...c[i], name: e.target.value };
                      setTickets(c);
                    }}
                  />
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Precio"
                    value={ticket.price}
                    onChange={(e) => {
                      const c = [...tickets];
                      c[i] = { ...c[i], price: e.target.value };
                      setTickets(c);
                    }}
                  />
                  <input
                    type="number"
                    className={styles.formInput}
                    placeholder="Capacidad"
                    value={ticket.capacity}
                    onChange={(e) => {
                      const c = [...tickets];
                      c[i] = { ...c[i], capacity: Number(e.target.value) };
                      setTickets(c);
                    }}
                  />
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Descripción"
                    value={ticket.description || ""}
                    onChange={(e) => {
                      const c = [...tickets];
                      c[i] = { ...c[i], description: e.target.value };
                      setTickets(c);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => setTickets(tickets.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addBtn}
              onClick={() =>
                setTickets([
                  ...tickets,
                  {
                    name: "",
                    price: "",
                    description: "",
                    capacity: 0,
                    spots_taken: 0,
                    sold_out: false,
                  },
                ])
              }
            >
              ＋ Añadir entrada
            </button>
          </div>
        )}

        {/* Schedule */}
        {form.type === "evento" && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>🕐 Horario</h3>
            {schedule.map((item, i) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.listItemFields}>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={item.time}
                    onChange={(e) => {
                      const c = [...schedule];
                      c[i] = { ...c[i], time: e.target.value };
                      setSchedule(c);
                    }}
                  />
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Descripción"
                    value={item.description}
                    onChange={(e) => {
                      const c = [...schedule];
                      c[i] = { ...c[i], description: e.target.value };
                      setSchedule(c);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() =>
                    setSchedule(schedule.filter((_, j) => j !== i))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addBtn}
              onClick={() =>
                setSchedule([...schedule, { time: "", description: "" }])
              }
            >
              ＋ Añadir horario
            </button>
          </div>
        )}

        {/* Age groups */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>
            👥 Clasificación por edades
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.8rem",
              marginBottom: "0.75rem",
            }}
          >
            Selecciona uno o varios rangos de edad
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {AGE_GROUPS.map((ag) => {
              const selected = form.age_groups.includes(ag.id);
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => {
                    updateForm(
                      "age_groups",
                      selected
                        ? form.age_groups.filter((g) => g !== ag.id)
                        : [...form.age_groups, ag.id],
                    );
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "100px",
                    border: selected
                      ? "2px solid #8B5CF6"
                      : "2px solid rgba(255,255,255,0.1)",
                    background: selected
                      ? "rgba(139,92,246,0.15)"
                      : "rgba(255,255,255,0.03)",
                    color: selected ? "#A78BFA" : "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    transition: "all 0.2s",
                  }}
                >
                  {ag.emoji} {ag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Etiquetas */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>🏷️ Etiquetas</h3>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.8rem",
              marginBottom: "0.75rem",
            }}
          >
            Selecciona las etiquetas que describen este plan
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: "0.5rem",
            }}
          >
            {ETIQUETAS.map((et) => {
              const selected = form.etiquetas.includes(et.id);
              return (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => {
                    updateForm(
                      "etiquetas",
                      selected
                        ? form.etiquetas.filter((e) => e !== et.id)
                        : [...form.etiquetas, et.id],
                    );
                  }}
                  style={{
                    padding: "0.45rem 0.75rem",
                    borderRadius: "8px",
                    border: selected
                      ? "2px solid #F59E0B"
                      : "2px solid rgba(255,255,255,0.08)",
                    background: selected
                      ? "rgba(245,158,11,0.12)"
                      : "rgba(255,255,255,0.03)",
                    color: selected ? "#FCD34D" : "rgba(255,255,255,0.45)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    textAlign: "left",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{et.emoji}</span>{" "}
                  {et.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Instagram Reels */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>
            📸 Instagram Reels & Videos
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.8rem",
              marginBottom: "0.75rem",
            }}
          >
            Añade hasta 12 URLs de reels de Instagram o sube vídeos RAW para
            promocionar este plan
          </p>
          {reels.map((url, i) => (
            <div
              key={i}
              className={styles.listItem}
              style={{ marginBottom: "0.5rem" }}
            >
              <div className={styles.listItemFields} style={{ flex: 1 }}>
                <input
                  type="url"
                  className={styles.formInput}
                  placeholder="https://www.instagram.com/reel/XXXXX/ o URL de vídeo"
                  value={url}
                  onChange={(e) => {
                    const copy = [...reels];
                    copy[i] = e.target.value;
                    setReels(copy);
                  }}
                />
              </div>
              <MediaUploaderButton
                className={styles.actionBtn}
                text="📤 Subir vídeo"
                onUpload={(newUrl) => {
                  const copy = [...reels];
                  copy[i] = newUrl;
                  setReels(copy);
                }}
                onError={setError}
              />

              {url && url.includes(".mp4") && (
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    type="button"
                    title="Publicar en IG"
                    disabled={publishingState[`ig-${i}`]}
                    onClick={() => handlePublishIg(url, i)}
                    style={{
                      background: "linear-gradient(45deg, #f09433, #dc2743)",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0 8px",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {publishingState[`ig-${i}`] ? "⏳" : "📸"}
                  </button>
                  <button
                    type="button"
                    title="Publicar en TikTok"
                    disabled={publishingState[`ttk-${i}`]}
                    onClick={() => handlePublishTiktok(url, i)}
                    style={{
                      background: "#000",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0 8px",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {publishingState[`ttk-${i}`] ? "⏳" : "🎵"}
                  </button>
                </div>
              )}

              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => setReels(reels.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          {reels.length < 12 && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setReels([...reels, ""])}
            >
              ＋ Añadir reel / vídeo
            </button>
          )}
          {reels.length >= 12 && (
            <p
              style={{
                color: "rgba(245,158,11,0.7)",
                fontSize: "0.8rem",
                marginTop: "0.5rem",
              }}
            >
              Máximo de 12 reels/vídeos alcanzado
            </p>
          )}
        </div>

        {/* Options */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>⚙️ Opciones</h3>
          <div style={{ display: "flex", gap: "2rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => updateForm("featured", e.target.checked)}
              />{" "}
              Destacado
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.sponsored}
                onChange={(e) => updateForm("sponsored", e.target.checked)}
              />{" "}
              Patrocinado
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => updateForm("published", e.target.checked)}
              />{" "}
              Publicado
            </label>
          </div>
        </div>

        <div
          style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
        >
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => router.push("/admin/planes")}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={saving}
            id="edit-submit"
          >
            {saving ? "Guardando..." : "✓ Guardar cambios"}
          </button>
        </div>
      </form>
    </>
  );
}
