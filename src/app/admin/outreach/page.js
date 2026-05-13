"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./outreach.module.css";

const PLATFORM_META = {
  whatsapp_directory: { label: "Directorios WA", icon: "📋", color: "#25D366" },
  reddit: { label: "Reddit", icon: "🤖", color: "#FF4500" },
  facebook: { label: "Facebook", icon: "👥", color: "#1877F2" },
  instagram_dm: { label: "Instagram DMs", icon: "📸", color: "#E1306C" },
};

const TARGETS = {
  whatsapp_directory: [
    "whatsgrouplinks.com",
    "groupslor.com",
    "whatsgrouplink.com",
    "chatlinks.app",
    "grouplinks.app",
    "whatsapp-group-links.com",
    "grupo-whatsapp.com",
    "invitacionalgrupo.com",
    "comuniza.es",
    "gruposdewhatsapp.online",
  ],
  reddit: [
    "r/WhatsAppGroups",
    "r/Barcelona",
    "r/Spain",
    "r/Erasmus",
    "r/expats",
  ],
  facebook: [
    "Erasmus Barcelona 2025/2026",
    "Vivir en Barcelona — Expats",
    "Spaniards in Barcelona",
    "Eventos y planes en Barcelona",
    "Italiani a Barcellona",
    "Français à Barcelone",
    "Jóvenes en Barcelona",
    "Barcelona Expat Hub",
  ],
};

const SCRIPTS = {
  whatsapp_directory: "node scripts/outreach/run-all.js --wa",
  reddit: "node scripts/outreach/run-all.js --reddit",
  facebook: "node scripts/outreach/run-all.js --fb",
  instagram_dm: "node scripts/outreach/sender.js",
};

export default function OutreachPage() {
  const [supabase] = useState(() => createClient());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null); // { platform, target }
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("/api/admin/outreach", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  async function markPosted(platform, target) {
    setAdding({ platform, target });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
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

  async function deletePost(id) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
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

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>📣 Outreach — Crecimiento Comunidad</h1>
        <p className={styles.subtitle}>
          Controla qué plataformas ya tienes cubiertas para crecer en WhatsApp e
          Instagram.
        </p>
      </div>

      {/* Stats row */}
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

      {/* Platforms */}
      {Object.entries(TARGETS).map(([platform, targets]) => {
        const meta = PLATFORM_META[platform];
        const script = SCRIPTS[platform];
        return (
          <div key={platform} className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>{meta.icon}</span>
              <h2 className={styles.sectionTitle}>{meta.label}</h2>
              <button
                className={styles.copyBtn}
                onClick={() => copyText(script, `script-${platform}`)}
              >
                {copied === `script-${platform}` ? "✅ Copiado" : `$ ${script}`}
              </button>
            </div>

            <div className={styles.targetGrid}>
              {targets.map((target) => {
                const posted = isPosted(platform, target);
                const date = lastPosted(platform, target);
                const isAdding =
                  adding?.platform === platform && adding?.target === target;
                return (
                  <div
                    key={target}
                    className={`${styles.targetCard} ${posted ? styles.targetPosted : ""}`}
                  >
                    <div className={styles.targetName}>{target}</div>
                    {date && <div className={styles.targetDate}>✅ {date}</div>}
                    {!posted && (
                      <button
                        className={styles.markBtn}
                        onClick={() => markPosted(platform, target)}
                        disabled={isAdding}
                      >
                        {isAdding ? "..." : "Marcar como publicado"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Log reciente */}
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
