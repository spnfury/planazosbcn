'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  GENDER_OPTIONS, PRONOUNS_OPTIONS, RELATIONSHIP_OPTIONS, SEXUAL_ORIENTATION_OPTIONS,
  BODY_TYPE_OPTIONS, EYE_COLOR_OPTIONS, HAIR_COLOR_OPTIONS, TATTOOS_OPTIONS,
  PIERCINGS_OPTIONS, STYLE_DRESS_OPTIONS, HAS_CHILDREN_OPTIONS, WANTS_CHILDREN_OPTIONS,
  LIVES_WITH_OPTIONS, PETS_OPTIONS, EDUCATION_LEVEL_OPTIONS, LANGUAGES_OPTIONS,
  SMOKING_OPTIONS, DRINKING_OPTIONS, DIET_OPTIONS, EXERCISE_OPTIONS, SLEEP_SCHEDULE_OPTIONS,
  ZODIAC_SIGNS, PERSONALITY_TYPES, PLAN_PREFERENCES, MUSIC_GENRES, CUISINE_OPTIONS,
  BUDGET_OPTIONS, TRANSPORT_OPTIONS, AVAILABILITY_OPTIONS, HOBBIES_OPTIONS,
  SPORTS_OPTIONS, TRAVEL_STYLE_OPTIONS, LOOKING_FOR_OPTIONS, PROFILE_SECTIONS,
} from '@/lib/profileOptions';
import styles from './perfil.module.css';

// All profile fields (excluding id, created_at, updated_at, avatar_url, full_name, phone which are handled elsewhere)
const ALL_PROFILE_FIELDS = [
  'nickname', 'birthdate', 'gender', 'pronouns', 'city', 'neighborhood',
  'country_origin', 'nationality', 'height_cm', 'body_type', 'eye_color',
  'hair_color', 'tattoos', 'piercings', 'style_dress', 'relationship_status',
  'sexual_orientation', 'has_children', 'wants_children', 'lives_with', 'pets',
  'occupation', 'company', 'education_level', 'university', 'languages',
  'smoking', 'drinking', 'diet', 'exercise_frequency', 'sleep_schedule',
  'zodiac_sign', 'personality_type', 'plan_preferences', 'music_genres',
  'favorite_cuisines', 'budget_range', 'transport_preference', 'availability',
  'hobbies', 'sports', 'favorite_movies_series', 'favorite_books', 'travel_style',
  'instagram_handle', 'tiktok_handle', 'twitter_handle', 'spotify_url', 'linkedin_url',
  'bio', 'fun_fact', 'best_plan_ever', 'ideal_weekend', 'looking_for',
  'full_name', 'phone', 'avatar_url',
];

const ARRAY_FIELDS = [
  'languages', 'plan_preferences', 'music_genres', 'favorite_cuisines',
  'hobbies', 'sports',
];

function calculateCompletion(profile) {
  if (!profile) return 0;
  const fields = ALL_PROFILE_FIELDS.filter(f => f !== 'avatar_url');
  let filled = 0;
  for (const f of fields) {
    const val = profile[f];
    if (Array.isArray(val) ? val.length > 0 : val && val.toString().trim()) filled++;
  }
  return Math.round((filled / fields.length) * 100);
}

// ─── Reusable field components ───

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <select className={styles.fieldSelect} value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder || 'Seleccionar...'}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = 'text', maxLength }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        type={type}
        className={styles.fieldInput}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, maxLength = 500 }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <textarea
        className={styles.fieldTextarea}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
      />
      <span className={styles.charCount}>{(value || '').length}/{maxLength}</span>
    </div>
  );
}

function ChipSelector({ label, selected = [], options, onChange, max = 10 }) {
  function toggle(opt) {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else if (selected.length < max) {
      onChange([...selected, opt]);
    }
  }
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label} <span className={styles.chipCount}>({selected.length}/{max})</span>
      </label>
      <div className={styles.chipGrid}>
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            className={`${styles.chip} ${selected.includes(opt) ? styles.chipActive : ''}`}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, placeholder, min, max, suffix }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.numberWrap}>
        <input
          type="number"
          className={styles.fieldInput}
          value={value || ''}
          onChange={e => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
          placeholder={placeholder}
          min={min}
          max={max}
        />
        {suffix && <span className={styles.numberSuffix}>{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Main component ───

export default function PerfilPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [openSections, setOpenSections] = useState({ basic: true });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select(ALL_PROFILE_FIELDS.join(','))
        .eq('id', user.id)
        .single();

      if (data) {
        // Ensure array fields are arrays
        for (const f of ARRAY_FIELDS) {
          if (!Array.isArray(data[f])) data[f] = data[f] ? [data[f]] : [];
        }
        setProfile(data);
      }
      setLoading(false);
    }
    load();
  }, [user, authLoading, router]);

  const updateField = useCallback((field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);

    // Build update payload excluding id, created_at, updated_at
    const payload = {};
    for (const f of ALL_PROFILE_FIELDS) {
      if (profile[f] !== undefined) {
        payload[f] = profile[f];
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      setError('Error al guardar. Inténtalo de nuevo.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function toggleSection(key) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (authLoading || loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p>Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  const completion = calculateCompletion(profile);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/cuenta" className={styles.backLink} id="profile-back">
            ← Volver a mi cuenta
          </Link>
          <h1 className={styles.title}>Mi perfil</h1>
          <p className={styles.subtitle}>
            Completa tu perfil para conectar mejor con otros planazer@s
          </p>

          {/* Progress bar */}
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              {completion}% completo
            </span>
          </div>
        </div>

        {/* Error / Success */}
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Sections */}
        <div className={styles.sections}>
          {/* ─── Datos básicos ─── */}
          <Section
            section={PROFILE_SECTIONS[0]}
            isOpen={openSections.basic}
            onToggle={() => toggleSection('basic')}
          >
            <TextField label="Apodo / Nickname" value={profile.nickname} onChange={v => updateField('nickname', v)} placeholder="¿Cómo te gusta que te llamen?" />
            <TextAreaField label="Bio" value={profile.bio} onChange={v => updateField('bio', v)} placeholder="Cuéntanos sobre ti en pocas palabras..." maxLength={500} />
            <TextField label="Fecha de nacimiento" value={profile.birthdate} onChange={v => updateField('birthdate', v)} type="date" />
            <SelectField label="Género" value={profile.gender} onChange={v => updateField('gender', v)} options={GENDER_OPTIONS} />
            <SelectField label="Pronombres" value={profile.pronouns} onChange={v => updateField('pronouns', v)} options={PRONOUNS_OPTIONS} />
            <TextField label="Ciudad" value={profile.city} onChange={v => updateField('city', v)} placeholder="p.ej. Barcelona" />
            <TextField label="Barrio" value={profile.neighborhood} onChange={v => updateField('neighborhood', v)} placeholder="p.ej. Gràcia, Eixample..." />
            <TextField label="País de origen" value={profile.country_origin} onChange={v => updateField('country_origin', v)} placeholder="p.ej. España, Colombia..." />
            <TextField label="Nacionalidad" value={profile.nationality} onChange={v => updateField('nationality', v)} placeholder="p.ej. Española" />
          </Section>

          {/* ─── Apariencia ─── */}
          <Section
            section={PROFILE_SECTIONS[1]}
            isOpen={openSections.appearance}
            onToggle={() => toggleSection('appearance')}
          >
            <NumberField label="Altura" value={profile.height_cm} onChange={v => updateField('height_cm', v)} placeholder="170" min={100} max={250} suffix="cm" />
            <SelectField label="Tipo de cuerpo" value={profile.body_type} onChange={v => updateField('body_type', v)} options={BODY_TYPE_OPTIONS} />
            <SelectField label="Color de ojos" value={profile.eye_color} onChange={v => updateField('eye_color', v)} options={EYE_COLOR_OPTIONS} />
            <SelectField label="Color de pelo" value={profile.hair_color} onChange={v => updateField('hair_color', v)} options={HAIR_COLOR_OPTIONS} />
            <SelectField label="Tatuajes" value={profile.tattoos} onChange={v => updateField('tattoos', v)} options={TATTOOS_OPTIONS} />
            <SelectField label="Piercings" value={profile.piercings} onChange={v => updateField('piercings', v)} options={PIERCINGS_OPTIONS} />
            <SelectField label="Estilo de vestir" value={profile.style_dress} onChange={v => updateField('style_dress', v)} options={STYLE_DRESS_OPTIONS} />
          </Section>

          {/* ─── Situación personal ─── */}
          <Section
            section={PROFILE_SECTIONS[2]}
            isOpen={openSections.personal}
            onToggle={() => toggleSection('personal')}
          >
            <SelectField label="Estado sentimental" value={profile.relationship_status} onChange={v => updateField('relationship_status', v)} options={RELATIONSHIP_OPTIONS} />
            <SelectField label="Orientación sexual" value={profile.sexual_orientation} onChange={v => updateField('sexual_orientation', v)} options={SEXUAL_ORIENTATION_OPTIONS} />
            <SelectField label="¿Tienes hijos?" value={profile.has_children} onChange={v => updateField('has_children', v)} options={HAS_CHILDREN_OPTIONS} />
            <SelectField label="¿Quieres tener hijos?" value={profile.wants_children} onChange={v => updateField('wants_children', v)} options={WANTS_CHILDREN_OPTIONS} />
            <SelectField label="¿Con quién vives?" value={profile.lives_with} onChange={v => updateField('lives_with', v)} options={LIVES_WITH_OPTIONS} />
            <SelectField label="Mascotas" value={profile.pets} onChange={v => updateField('pets', v)} options={PETS_OPTIONS} />
          </Section>

          {/* ─── Profesión y estudios ─── */}
          <Section
            section={PROFILE_SECTIONS[3]}
            isOpen={openSections.career}
            onToggle={() => toggleSection('career')}
          >
            <TextField label="Profesión / Ocupación" value={profile.occupation} onChange={v => updateField('occupation', v)} placeholder="p.ej. Diseñador/a, Ingeniero/a..." />
            <TextField label="Empresa / Lugar de trabajo" value={profile.company} onChange={v => updateField('company', v)} placeholder="¿Dónde trabajas?" />
            <SelectField label="Nivel de estudios" value={profile.education_level} onChange={v => updateField('education_level', v)} options={EDUCATION_LEVEL_OPTIONS} />
            <TextField label="Universidad / Centro de estudios" value={profile.university} onChange={v => updateField('university', v)} placeholder="p.ej. UB, UPC, UPF..." />
            <ChipSelector label="Idiomas que hablas" selected={profile.languages || []} options={LANGUAGES_OPTIONS} onChange={v => updateField('languages', v)} max={8} />
          </Section>

          {/* ─── Estilo de vida ─── */}
          <Section
            section={PROFILE_SECTIONS[4]}
            isOpen={openSections.lifestyle}
            onToggle={() => toggleSection('lifestyle')}
          >
            <SelectField label="¿Fumas?" value={profile.smoking} onChange={v => updateField('smoking', v)} options={SMOKING_OPTIONS} />
            <SelectField label="¿Bebes?" value={profile.drinking} onChange={v => updateField('drinking', v)} options={DRINKING_OPTIONS} />
            <SelectField label="Dieta" value={profile.diet} onChange={v => updateField('diet', v)} options={DIET_OPTIONS} />
            <SelectField label="¿Con qué frecuencia haces ejercicio?" value={profile.exercise_frequency} onChange={v => updateField('exercise_frequency', v)} options={EXERCISE_OPTIONS} />
            <SelectField label="Horario de sueño" value={profile.sleep_schedule} onChange={v => updateField('sleep_schedule', v)} options={SLEEP_SCHEDULE_OPTIONS} />
            <SelectField label="Signo del zodíaco" value={profile.zodiac_sign} onChange={v => updateField('zodiac_sign', v)} options={ZODIAC_SIGNS} />
            <SelectField label="Tipo de personalidad (MBTI)" value={profile.personality_type} onChange={v => updateField('personality_type', v)} options={PERSONALITY_TYPES} />
          </Section>

          {/* ─── Preferencias de planes ─── */}
          <Section
            section={PROFILE_SECTIONS[5]}
            isOpen={openSections.plans}
            onToggle={() => toggleSection('plans')}
          >
            <ChipSelector label="¿Qué tipo de planes te gustan?" selected={profile.plan_preferences || []} options={PLAN_PREFERENCES} onChange={v => updateField('plan_preferences', v)} max={15} />
            <ChipSelector label="Géneros de música favoritos" selected={profile.music_genres || []} options={MUSIC_GENRES} onChange={v => updateField('music_genres', v)} max={10} />
            <ChipSelector label="Cocinas / comidas favoritas" selected={profile.favorite_cuisines || []} options={CUISINE_OPTIONS} onChange={v => updateField('favorite_cuisines', v)} max={10} />
            <SelectField label="Presupuesto habitual por plan" value={profile.budget_range} onChange={v => updateField('budget_range', v)} options={BUDGET_OPTIONS} />
            <SelectField label="¿Cómo te mueves?" value={profile.transport_preference} onChange={v => updateField('transport_preference', v)} options={TRANSPORT_OPTIONS} />
            <SelectField label="Disponibilidad" value={profile.availability} onChange={v => updateField('availability', v)} options={AVAILABILITY_OPTIONS} />
          </Section>

          {/* ─── Intereses y hobbies ─── */}
          <Section
            section={PROFILE_SECTIONS[6]}
            isOpen={openSections.interests}
            onToggle={() => toggleSection('interests')}
          >
            <ChipSelector label="Hobbies" selected={profile.hobbies || []} options={HOBBIES_OPTIONS} onChange={v => updateField('hobbies', v)} max={15} />
            <ChipSelector label="Deportes" selected={profile.sports || []} options={SPORTS_OPTIONS} onChange={v => updateField('sports', v)} max={10} />
            <TextField label="Películas / Series favoritas" value={profile.favorite_movies_series} onChange={v => updateField('favorite_movies_series', v)} placeholder="p.ej. Breaking Bad, El Padrino..." />
            <TextField label="Libros favoritos" value={profile.favorite_books} onChange={v => updateField('favorite_books', v)} placeholder="p.ej. Cien años de soledad..." />
            <SelectField label="Estilo de viaje" value={profile.travel_style} onChange={v => updateField('travel_style', v)} options={TRAVEL_STYLE_OPTIONS} />
          </Section>

          {/* ─── Redes sociales ─── */}
          <Section
            section={PROFILE_SECTIONS[7]}
            isOpen={openSections.social}
            onToggle={() => toggleSection('social')}
          >
            <TextField label="Instagram" value={profile.instagram_handle} onChange={v => updateField('instagram_handle', v)} placeholder="@tu_usuario" />
            <TextField label="TikTok" value={profile.tiktok_handle} onChange={v => updateField('tiktok_handle', v)} placeholder="@tu_usuario" />
            <TextField label="Twitter / X" value={profile.twitter_handle} onChange={v => updateField('twitter_handle', v)} placeholder="@tu_usuario" />
            <TextField label="Spotify" value={profile.spotify_url} onChange={v => updateField('spotify_url', v)} placeholder="URL de tu perfil de Spotify" />
            <TextField label="LinkedIn" value={profile.linkedin_url} onChange={v => updateField('linkedin_url', v)} placeholder="URL de tu perfil de LinkedIn" />
          </Section>

          {/* ─── Sobre ti ─── */}
          <Section
            section={PROFILE_SECTIONS[8]}
            isOpen={openSections.about}
            onToggle={() => toggleSection('about')}
          >
            <TextAreaField label="Dato curioso sobre ti" value={profile.fun_fact} onChange={v => updateField('fun_fact', v)} placeholder="Algo que la gente no esperaría de ti..." maxLength={300} />
            <TextAreaField label="El mejor plan que has hecho" value={profile.best_plan_ever} onChange={v => updateField('best_plan_ever', v)} placeholder="Cuéntanos esa experiencia memorable..." maxLength={300} />
            <TextAreaField label="Tu fin de semana ideal" value={profile.ideal_weekend} onChange={v => updateField('ideal_weekend', v)} placeholder="¿Cómo sería tu sábado perfecto?" maxLength={300} />
            <ChipSelector label="¿Qué buscas?" selected={Array.isArray(profile.looking_for) ? profile.looking_for : profile.looking_for ? [profile.looking_for] : []} options={LOOKING_FOR_OPTIONS} onChange={v => updateField('looking_for', v.join(', '))} max={5} />
          </Section>
        </div>

        {/* Sticky save bar */}
        <div className={styles.saveBar}>
          <div className={styles.saveBarInner}>
            {saved && (
              <span className={styles.savedLabel}>✅ Perfil guardado</span>
            )}
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
              id="profile-save"
            >
              {saving ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Accordion section component ───

function Section({ section, isOpen, onToggle, children }) {
  return (
    <div className={`${styles.section} ${isOpen ? styles.sectionOpen : ''}`}>
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={onToggle}
        id={`section-toggle-${section.key}`}
      >
        <div className={styles.sectionLeft}>
          <span className={styles.sectionIcon}>{section.icon}</span>
          <div>
            <h2 className={styles.sectionTitle}>{section.label}</h2>
            <p className={styles.sectionDesc}>{section.description}</p>
          </div>
        </div>
        <span className={`${styles.sectionChevron} ${isOpen ? styles.sectionChevronOpen : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className={styles.sectionBody}>
          <div className={styles.fieldsGrid}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
