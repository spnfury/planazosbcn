-- ============================================
-- Profile Details — Add comprehensive profile fields
-- Run in Supabase SQL Editor
-- ============================================

-- Datos personales
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_origin TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationality TEXT;

-- Físico y apariencia
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS eye_color TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hair_color TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tattoos TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS piercings TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS style_dress TEXT;

-- Situación personal
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sexual_orientation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_children TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_children TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lives_with TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pets TEXT;

-- Profesión y estudios
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- Estilo de vida
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS smoking TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS drinking TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS diet TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exercise_frequency TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_schedule TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zodiac_sign TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_type TEXT;

-- Preferencias de planes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_preferences TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS music_genres TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_cuisines TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget_range TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS transport_preference TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability TEXT;

-- Intereses y hobbies
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sports TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_movies_series TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_books TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS travel_style TEXT;

-- Redes sociales
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Bio y personalidad
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fun_fact TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_plan_ever TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ideal_weekend TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for TEXT;
