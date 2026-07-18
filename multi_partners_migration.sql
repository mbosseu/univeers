-- 1. Création de la table de liaison pour les couples multiples
CREATE TABLE IF NOT EXISTS public.user_couples (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, couple_id)
);
ALTER TABLE public.user_couples DISABLE ROW LEVEL SECURITY;

-- 2. Migrer les données existantes (les couples actuels) vers cette nouvelle table
INSERT INTO public.user_couples (user_id, couple_id)
SELECT id, couple_id FROM public.profiles WHERE couple_id IS NOT NULL
ON CONFLICT (user_id, couple_id) DO NOTHING;

-- 3. Mise à jour de la fonction link_partners pour permettre d'avoir plusieurs partenaires
CREATE OR REPLACE FUNCTION public.link_partners(invite_code TEXT)
RETURNS UUID AS $$
DECLARE
    v_creator_id UUID;
    v_couple_id UUID;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Non authentifié';
    END IF;

    SELECT creator_id INTO v_creator_id
    FROM public.invitations
    WHERE code = invite_code AND active = true;

    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Code d''invitation invalide ou expiré';
    END IF;

    IF v_creator_id = v_caller_id THEN
        RAISE EXCEPTION 'Vous ne pouvez pas lier votre propre code';
    END IF;

    -- Créer le nouveau couple
    INSERT INTO public.couples (flame_xp, flame_energy)
    VALUES (0, 50)
    RETURNING id INTO v_couple_id;

    -- Ajouter ce couple aux deux utilisateurs
    INSERT INTO public.user_couples (user_id, couple_id) VALUES (v_caller_id, v_couple_id);
    INSERT INTO public.user_couples (user_id, couple_id) VALUES (v_creator_id, v_couple_id);

    -- Le nouveau couple devient le couple "actif" par défaut pour les deux
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
