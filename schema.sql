-- Schema SQL pour l'application Univers
-- À exécuter dans l'éditeur SQL de votre projet Supabase.

-- Habiliter l'extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE DES COUPLES
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anniversary_date DATE,
    flame_xp INTEGER DEFAULT 0 NOT NULL,
    flame_energy INTEGER DEFAULT 50 NOT NULL,
    mood_p1 VARCHAR(255),
    mood_p2 VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLE DES PROFILS UTILISATEURS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
    love_language TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLE DES INVITATIONS (pour lier les partenaires)
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(15) UNIQUE NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLE DES QUESTIONS
CREATE TABLE IF NOT EXISTS public.daily_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLE DES RÉPONSES AUX QUESTIONS
CREATE TABLE IF NOT EXISTS public.daily_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.daily_questions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    response_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_question UNIQUE (question_id, user_id)
);

-- 6. TABLE DES DÉFIS (LOVE QUESTS)
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 10 NOT NULL,
    energy_reward INTEGER DEFAULT 5 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLE DES ESSAIS/RÉUSSITES DE DÉFIS
CREATE TABLE IF NOT EXISTS public.quest_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE NOT NULL,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    completed_by_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABLE DES SOUVENIRS
CREATE TABLE IF NOT EXISTS public.souvenirs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_url TEXT,
    location_name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    souvenir_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8a. TABLE DES OBJECTIFS DU MATIN
CREATE TABLE IF NOT EXISTS public.couple_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    goal_text TEXT NOT NULL,
    created_at DATE DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT unique_couple_goal_day UNIQUE (couple_id, created_at)
);

-- 8b. TABLE DES MOTS DOUX DU MIDI
CREATE TABLE IF NOT EXISTS public.sweet_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8c. TABLE DES RÉFLEXIONS DU SOIR
CREATE TABLE IF NOT EXISTS public.evening_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    answer_1 TEXT NOT NULL,
    answer_2 TEXT NOT NULL,
    answer_3 TEXT NOT NULL,
    created_at DATE DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT unique_user_reflection_day UNIQUE (user_id, created_at)
);


-- 8d. TABLE DES CAPSULES TEMPORELLES
CREATE TABLE IF NOT EXISTS public.time_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    letter_content TEXT NOT NULL,
    unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);



-- 9. DÉCLENCHEUR (TRIGGER) POUR CRÉER AUTOMATIQUEMENT LE PROFIL À L'INSCRIPTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. INSERTION DE QUELQUES QUESTIONS ET DÉFIS PAR DÉFAUT
INSERT INTO public.daily_questions (question_text, category) VALUES
('Quel souvenir ensemble t''a fait le plus rire ?', 'Relation'),
('Quelle est la plus grande leçon sur l''amour que tu as apprise jusqu''à présent ?', 'Relation'),
('Si on pouvait partir n''importe où demain, où irions-nous ?', 'Voyages'),
('Quel est ton rituel préféré que l''on partage tous les deux ?', 'Relation'),
('Qu''apprécies-tu le plus chez moi aujourd''hui ?', 'Valeurs')
ON CONFLICT DO NOTHING;

INSERT INTO public.quests (title, description, xp_reward, energy_reward) VALUES
('Faire un compliment', 'Dites ou envoyez un compliment sincère et inattendu à votre partenaire aujourd''hui.', 15, 10),
('Partager une photo drôle', 'Envoyez une photo drôle de vous ou de votre journée à votre partenaire.', 10, 5),
('Appeler 10 minutes', 'Passez un appel vocal ou vidéo de 10 minutes sans distraction.', 20, 15),
('Écrire un mot doux', 'Laissez un mot d''amour écrit à la main ou envoyez un message secret.', 15, 10)
ON CONFLICT DO NOTHING;

-- 11. FONCTION DE LIAISON DE COUPLE (RPC)
CREATE OR REPLACE FUNCTION public.link_partners(invite_code TEXT)
RETURNS UUID AS $$
DECLARE
    v_creator_id UUID;
    v_couple_id UUID;
    v_caller_id UUID;
BEGIN
    -- Obtenir l'ID de l'appelant
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Non authentifié';
    END IF;

    -- Obtenir l'invitation correspondante
    SELECT creator_id INTO v_creator_id
    FROM public.invitations
    WHERE code = invite_code AND active = true;

    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Code d''invitation invalide ou expiré';
    END IF;

    IF v_creator_id = v_caller_id THEN
        RAISE EXCEPTION 'Vous ne pouvez pas lier votre propre code';
    END IF;

    -- Vérifier si l'un des utilisateurs est déjà en couple
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_caller_id AND couple_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Vous êtes déjà en couple';
    END IF;

    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_creator_id AND couple_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Votre partenaire est déjà en couple';
    END IF;

    -- Créer le couple
    INSERT INTO public.couples (flame_xp, flame_energy)
    VALUES (0, 50)
    RETURNING id INTO v_couple_id;

    -- Mettre à jour les profils des deux partenaires
    UPDATE public.profiles
    SET couple_id = v_couple_id
    WHERE id IN (v_caller_id, v_creator_id);

    -- Rendre l'invitation inactive
    UPDATE public.invitations
    SET active = false
    WHERE code = invite_code;

    RETURN v_couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 12. TABLE DES MESSAGES (CHAT)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' NOT NULL, -- 'text', 'photo', 'secret', 'letter'
    is_opened BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 13. TABLE DES ÉVÉNEMENTS DU COUPLE
CREATE TABLE IF NOT EXISTS public.couple_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 14. DÉSACTIVATION DE LA SÉCURITÉ RLS POUR CHAQUE TABLE (pour éviter les erreurs d'accès de l'API cliente)
ALTER TABLE public.couples DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.souvenirs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sweet_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evening_reflections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_capsules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_events DISABLE ROW LEVEL SECURITY;

-- 15. TABLE DES ABONNEMENTS PUSH
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subscription_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);
ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;

-- 16. HABILITER LE TEMPS RÉEL (REALTIME) POUR L'APPLICATION
alter publication supabase_realtime add table public.messages, public.couples, public.daily_responses, public.quest_attempts, public.souvenirs, public.couple_goals, public.sweet_notes, public.evening_reflections, public.time_capsules;
