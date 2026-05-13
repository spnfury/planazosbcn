"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./outreach.module.css";

const WA_LINK = "https://chat.whatsapp.com/GDiYK6fC7OhHbAu2XipW9z";
const WA_NAME = "PlanazosBCN — Planes en Barcelona 🎉";
const WA_DESC_SHORT =
  "Los mejores planes de Barcelona: gastronomía, cultura, naturaleza y ocio nocturno. Comunidad activa.";
const WA_DESC_LONG =
  "Comunidad oficial de PlanazosBCN 🇪🇸 El mejor grupo de WhatsApp para descubrir planes en Barcelona. Gastronomía, cultura, naturaleza, fiestas y mucho más. Compartimos eventos exclusivos, descuentos y experiencias seleccionadas cada semana. Únete gratis.";

const PLATFORM_META = {
  whatsapp_directory: { label: "Directorios WA", icon: "📋", color: "#25D366" },
  reddit: { label: "Reddit", icon: "🤖", color: "#FF4500" },
  facebook: { label: "Facebook", icon: "👥", color: "#1877F2" },
};

// WA: URL del formulario de envío de cada directorio
const WA_SUBMIT_URLS = {
  "whatsgrouplinks.com": "https://www.whatsgrouplinks.com/submit-group/",
  "groupslor.com": "https://groupslor.com/submit/",
  "whatsgrouplink.com": "https://www.whatsgrouplink.com/submit-group/",
  "chatlinks.app": "https://chatlinks.app/submit",
  "grouplinks.app": "https://grouplinks.app/submit",
  "whatsapp-group-links.com":
    "https://www.whatsapp-group-links.com/submit-group/",
  "grupo-whatsapp.com": "https://grupo-whatsapp.com/submit",
  "invitacionalgrupo.com": "https://invitacionalgrupo.com/agregar-grupo/",
  "comuniza.es": "https://comuniza.es/submit",
  "gruposdewhatsapp.online": "https://gruposdewhatsapp.online/submit",
};

// Facebook: URL del grupo
const FB_GROUP_URLS = {
  "Erasmus Barcelona 2025/2026":
    "https://www.facebook.com/groups/ErasmusBarcelonaSpain/",
  "Vivir en Barcelona — Expats":
    "https://www.facebook.com/groups/barcelonaexpatsgroup/",
  "Spaniards in Barcelona": "https://www.facebook.com/groups/spaniardsinbcn",
  "Eventos y planes en Barcelona":
    "https://www.facebook.com/groups/eventosenbarcelona/",
  "Italiani a Barcellona":
    "https://www.facebook.com/groups/italianiabarcellona/",
  "Français à Barcelone": "https://www.facebook.com/groups/francaisdebarcelone",
  "Jóvenes en Barcelona": "https://www.facebook.com/groups/jovenesbarcelona",
  "Barcelona Expat Hub":
    "https://www.facebook.com/groups/BarcelonaExpatsNetwork/",
};

// Facebook: texto a copiar por grupo
const FB_TEXTS = {
  "Erasmus Barcelona 2025/2026": `🎉 ¡Hola Erasmus! ¿Buscáis planes en Barcelona?\n\nHemos creado PlanazosBCN, una comunidad gratuita donde compartimos los mejores planes cada semana:\n\n🍽️ Gastronomía y restaurantes\n🎭 Cultura y exposiciones\n🌿 Naturaleza y actividades al aire libre\n🎶 Ocio nocturno y fiestas\n\n🔗 Únete al grupo de WhatsApp: ${WA_LINK}\n🌐 Web: https://planazosbcn.com\n📸 Instagram: @planazosbcnreal\n\n¡Completamente gratis!`,
  "Vivir en Barcelona — Expats": `🇪🇸 Para todos los que vivís en Barcelona!\n\nOs presento PlanazosBCN — la guía definitiva de planes en la ciudad. Tenemos un grupo de WhatsApp gratuito donde cada semana compartimos:\n\n✅ Eventos curados (no spam)\n✅ Gastronomía, cultura, naturaleza y ocio\n✅ Planes exclusivos con descuentos\n\n👉 Grupo WhatsApp: ${WA_LINK}\n🌐 https://planazosbcn.com\n📸 @planazosbcnreal\n\n¡Gratis, sin spam, comunidad activa!`,
  "Spaniards in Barcelona": `¡Hola a todos! 👋\n\nSoy Sergio de PlanazosBCN, una plataforma dedicada a los mejores planes de Barcelona.\n\nTenemos un grupo de WhatsApp gratuito donde compartimos eventos seleccionados cada semana: gastronomía, cultura, naturaleza, fiestas y mucho más.\n\n🔗 Únete aquí: ${WA_LINK}\n🌐 https://planazosbcn.com\n📸 @planazosbcnreal en Instagram\n\n¡Sin spam y comunidad activa!`,
  "Eventos y planes en Barcelona": `¡Hola a todos! 👋\n\nSoy Sergio de PlanazosBCN, una plataforma dedicada a los mejores planes de Barcelona.\n\nTenemos un grupo de WhatsApp gratuito donde compartimos eventos seleccionados cada semana: gastronomía, cultura, naturaleza, fiestas y mucho más.\n\n🔗 Únete aquí: ${WA_LINK}\n🌐 https://planazosbcn.com\n📸 @planazosbcnreal en Instagram\n\n¡Sin spam y comunidad activa!`,
  "Italiani a Barcellona": `Ciao a tutti! 🇮🇹🇪🇸\n\nVi presento PlanazosBCN — una community gratuita su WhatsApp con i migliori eventi a Barcellona ogni settimana.\n\nGastronomia, cultura, natura, vita notturna — tutto curato e gratuito!\n\n📱 Gruppo WhatsApp: ${WA_LINK}\n🌐 https://planazosbcn.com\n📸 @planazosbcnreal`,
  "Français à Barcelone": `Salut tout le monde! 🇫🇷🇪🇸\n\nJe partage PlanazosBCN — une communauté WhatsApp gratuite avec les meilleurs plans à Barcelone chaque semaine.\n\nGastronomie, culture, nature, vie nocturne — tout sélectionné, sans spam!\n\n📱 Groupe WhatsApp: ${WA_LINK}\n🌐 https://planazosbcn.com\n📸 @planazosbcnreal`,
  "Jóvenes en Barcelona": `¡Buenas! 🎉\n\nSi buscáis planes en Barcelona, os presento PlanazosBCN.\n\nCada semana compartimos los mejores eventos y actividades en nuestra web y grupo de WhatsApp. Todo curado y gratuito.\n\n📱 WhatsApp: ${WA_LINK}\n🌐 Web: https://planazosbcn.com\n📸 IG: @planazosbcnreal`,
  "Barcelona Expat Hub": `Hey everyone! 👋\n\nSharing PlanazosBCN — a free platform + WhatsApp community for the best plans in Barcelona.\n\nWeekly curated events: gastronomy, culture, outdoor activities, nightlife. No spam, just good plans.\n\n📱 WhatsApp group: ${WA_LINK}\n🌐 https://planazosbcn.com\n📸 @planazosbcnreal on Instagram\n\nFeel free to join!`,
};

const TARGETS = {
  whatsapp_directory: Object.keys(WA_SUBMIT_URLS),
  reddit: [
    "r/WhatsAppGroups",
    "r/Barcelona",
    "r/Spain",
    "r/Erasmus",
    "r/expats",
  ],
  facebook: Object.keys(FB_GROUP_URLS),
};

export default function OutreachPage() {
  const [supabase] = useState(() => createClient());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [running, setRunning] = useState({}); // { "r/Barcelona": "loading"|"ok"|"error"|"cooldown" }
  const [runMsg, setRunMsg] = useState({});
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function getToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function loadPosts() {
    const token = await getToken();
    const res = await fetch("/api/admin/outreach", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  async function markPosted(platform, target) {
    setAdding({ platform, target });
    const token = await getToken();
    await fetch("/api/admin/outreach", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ platform, target, status: "posted" }),
    });
    await loadPosts();
    setAdding(null);
  }

  async function postReddit(subreddit) {
    setRunning((r) => ({ ...r, [subreddit]: "loading" }));
    setRunMsg((m) => ({ ...m, [subreddit]: "" }));
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/outreach/run-reddit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subreddit }),
      });
      const data = await res.json();
      if (data.status === "posted") {
        setRunning((r) => ({ ...r, [subreddit]: "ok" }));
        setRunMsg((m) => ({ ...m, [subreddit]: data.url || "Publicado" }));
        await loadPosts();
      } else if (data.status === "cooldown") {
        setRunning((r) => ({ ...r, [subreddit]: "cooldown" }));
        setRunMsg((m) => ({ ...m, [subreddit]: data.message }));
      } else {
        setRunning((r) => ({ ...r, [subreddit]: "error" }));
        setRunMsg((m) => ({
          ...m,
          [subreddit]: data.error || "Error desconocido",
        }));
      }
    } catch (err) {
      setRunning((r) => ({ ...r, [subreddit]: "error" }));
      setRunMsg((m) => ({ ...m, [subreddit]: err.message }));
    }
  }

  async function deletePost(id) {
    const token = await getToken();
    await fetch(`/api/admin/outreach?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setPosts((p) => p.filter((x) => x.id !== id));
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function isPosted(platform, target) {
    return posts.some(
      (p) =>
        p.platform === platform && p.target === target && p.status === "posted",
    );
  }

  function lastPosted(platform, target) {
    const found = posts.find(
      (p) => p.platform === platform && p.target === target,
    );
    if (!found) return null;
    return new Date(found.posted_at).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const stats = Object.keys(PLATFORM_META).map((platform) => {
    const targets = TARGETS[platform] || [];
    const done = targets.filter((t) => isPosted(platform, t)).length;
    return { platform, total: targets.length, done };
  });

  if (loading) return <div className={styles.loading}>Cargando...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>📣 Outreach — Crecimiento Comunidad</h1>
        <p className={styles.subtitle}>
          Controla qué plataformas ya tienes cubiertas para crecer en WhatsApp e
          Instagram.
        </p>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {stats.map(({ platform, total, done }) => {
          const meta = PLATFORM_META[platform];
          return (
            <div
              key={platform}
              className={styles.statCard}
              style={{ "--accent": meta.color }}
            >
              <div className={styles.statIcon}>{meta.icon}</div>
              <div className={styles.statBody}>
                <div className={styles.statLabel}>{meta.label}</div>
                <div className={styles.statFraction}>
                  <span className={styles.statDone}>{done}</span>
                  <span className={styles.statOf}>/{total}</span>
                </div>
                <div className={styles.statBar}>
                  <div
                    className={styles.statBarFill}
                    style={{
                      width: `${total ? (done / total) * 100 : 0}%`,
                      background: meta.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── WA Directories ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📋</span>
          <h2 className={styles.sectionTitle}>Directorios WA</h2>
          <span className={styles.sectionHint}>
            Manual — abre el sitio, pega el contenido, marca como publicado
          </span>
        </div>

        {/* Contenido para copiar */}
        <div className={styles.contentBox}>
          <div className={styles.contentRow}>
            <span className={styles.contentLabel}>Nombre</span>
            <span className={styles.contentValue}>{WA_NAME}</span>
            <button
              className={styles.copyInline}
              onClick={() => copyText(WA_NAME, "wa-name")}
            >
              {copied === "wa-name" ? "✅" : "Copiar"}
            </button>
          </div>
          <div className={styles.contentRow}>
            <span className={styles.contentLabel}>Enlace</span>
            <span className={styles.contentValue}>{WA_LINK}</span>
            <button
              className={styles.copyInline}
              onClick={() => copyText(WA_LINK, "wa-link")}
            >
              {copied === "wa-link" ? "✅" : "Copiar"}
            </button>
          </div>
          <div className={styles.contentRow}>
            <span className={styles.contentLabel}>Desc. corta</span>
            <span className={styles.contentValue}>{WA_DESC_SHORT}</span>
            <button
              className={styles.copyInline}
              onClick={() => copyText(WA_DESC_SHORT, "wa-short")}
            >
              {copied === "wa-short" ? "✅" : "Copiar"}
            </button>
          </div>
          <div className={styles.contentRow}>
            <span className={styles.contentLabel}>Desc. larga</span>
            <span className={styles.contentValue}>{WA_DESC_LONG}</span>
            <button
              className={styles.copyInline}
              onClick={() => copyText(WA_DESC_LONG, "wa-long")}
            >
              {copied === "wa-long" ? "✅" : "Copiar"}
            </button>
          </div>
        </div>

        <div className={styles.targetGrid}>
          {TARGETS.whatsapp_directory.map((target) => {
            const posted = isPosted("whatsapp_directory", target);
            const date = lastPosted("whatsapp_directory", target);
            const isAdding =
              adding?.platform === "whatsapp_directory" &&
              adding?.target === target;
            return (
              <div
                key={target}
                className={`${styles.targetCard} ${posted ? styles.targetPosted : ""}`}
              >
                <div className={styles.targetName}>{target}</div>
                {date && <div className={styles.targetDate}>✅ {date}</div>}
                {!posted && (
                  <div className={styles.cardActions}>
                    <a
                      href={WA_SUBMIT_URLS[target]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openBtn}
                    >
                      Abrir sitio ↗
                    </a>
                    <button
                      className={styles.markBtn}
                      onClick={() => markPosted("whatsapp_directory", target)}
                      disabled={isAdding}
                    >
                      {isAdding ? "..." : "✓ Marcar publicado"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Reddit ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🤖</span>
          <h2 className={styles.sectionTitle}>Reddit</h2>
          <span className={styles.sectionHint}>
            Automático — requiere REDDIT_* en variables de entorno
          </span>
        </div>
        <div className={styles.targetGrid}>
          {TARGETS.reddit.map((target) => {
            const posted = isPosted("reddit", target);
            const date = lastPosted("reddit", target);
            const state = running[target];
            const msg = runMsg[target];
            return (
              <div
                key={target}
                className={`${styles.targetCard} ${posted ? styles.targetPosted : ""}`}
              >
                <div className={styles.targetName}>{target}</div>
                {date && <div className={styles.targetDate}>✅ {date}</div>}
                {state === "ok" && msg && (
                  <a
                    href={msg}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.targetDate}
                  >
                    ✅ Ver post ↗
                  </a>
                )}
                {state === "cooldown" && (
                  <div className={styles.targetCooldown}>
                    ⏭ Cooldown activo
                  </div>
                )}
                {state === "error" && (
                  <div className={styles.targetError}>❌ {msg}</div>
                )}
                {!posted && state !== "ok" && (
                  <button
                    className={`${styles.markBtn} ${styles.markBtnRun}`}
                    onClick={() => postReddit(target)}
                    disabled={state === "loading"}
                  >
                    {state === "loading"
                      ? "Publicando..."
                      : "🚀 Publicar ahora"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Facebook ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>👥</span>
          <h2 className={styles.sectionTitle}>Facebook grupos</h2>
          <span className={styles.sectionHint}>
            Manual — abre el grupo, copia el texto, pégalo y marca como
            publicado
          </span>
        </div>
        <div className={styles.targetGrid}>
          {TARGETS.facebook.map((target) => {
            const posted = isPosted("facebook", target);
            const date = lastPosted("facebook", target);
            const isAdding =
              adding?.platform === "facebook" && adding?.target === target;
            const text = FB_TEXTS[target];
            return (
              <div
                key={target}
                className={`${styles.targetCard} ${posted ? styles.targetPosted : ""}`}
              >
                <div className={styles.targetName}>{target}</div>
                {date && <div className={styles.targetDate}>✅ {date}</div>}
                {!posted && (
                  <div className={styles.cardActions}>
                    {text && (
                      <button
                        className={styles.openBtn}
                        onClick={() => copyText(text, `fb-${target}`)}
                      >
                        {copied === `fb-${target}`
                          ? "✅ Copiado"
                          : "Copiar texto"}
                      </button>
                    )}
                    <a
                      href={FB_GROUP_URLS[target]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openBtn}
                    >
                      Abrir grupo ↗
                    </a>
                    <button
                      className={styles.markBtn}
                      onClick={() => markPosted("facebook", target)}
                      disabled={isAdding}
                    >
                      {isAdding ? "..." : "✓ Marcar publicado"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial */}
      {posts.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>📝</span>
            <h2 className={styles.sectionTitle}>Historial</h2>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Plataforma</th>
                <th>Target</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 50).map((p) => {
                const meta = PLATFORM_META[p.platform] || {
                  icon: "❓",
                  label: p.platform,
                };
                return (
                  <tr key={p.id}>
                    <td>
                      {meta.icon} {meta.label}
                    </td>
                    <td>{p.target}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${p.status === "posted" ? styles.badgePosted : styles.badgeFailed}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>{new Date(p.posted_at).toLocaleDateString("es-ES")}</td>
                    <td>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => deletePost(p.id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
