-- Supabase-compatible database backup
-- Removed pg_dump specific commands for Supabase SQL Editor compatibility

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Create function
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- Create tables
CREATE TABLE IF NOT EXISTS public.admins (
    id integer NOT NULL,
    admin_email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(100),
    role character varying(20) DEFAULT 'admin'::character varying NOT NULL,
    club character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admins_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'club_leader'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.event_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
    id integer NOT NULL,
    event_id integer NOT NULL,
    student_id integer NOT NULL,
    registration_date timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'registered'::character varying NOT NULL,
    CONSTRAINT event_registrations_status_check CHECK (((status)::text = ANY ((ARRAY['registered'::character varying, 'attended'::character varying, 'cancelled'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.event_subcategories (
    id integer NOT NULL,
    category_id integer NOT NULL,
    name character varying(100) NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.events (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    location character varying(255) NOT NULL,
    category character varying(100) DEFAULT 'General'::character varying NOT NULL,
    max_participants integer,
    image_url character varying(500),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'upcoming'::character varying, 'ongoing'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'rejected'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.student_registrations (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    admission_number character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    phone character varying(20),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_registrations_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'deleted'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    key character varying(100) NOT NULL,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.event_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.event_registrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.event_subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.student_registrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Set sequence ownership
ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;
ALTER SEQUENCE public.event_categories_id_seq OWNED BY public.event_categories.id;
ALTER SEQUENCE public.event_registrations_id_seq OWNED BY public.event_registrations.id;
ALTER SEQUENCE public.event_subcategories_id_seq OWNED BY public.event_subcategories.id;
ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;
ALTER SEQUENCE public.student_registrations_id_seq OWNED BY public.student_registrations.id;

-- Set defaults
ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);
ALTER TABLE ONLY public.event_categories ALTER COLUMN id SET DEFAULT nextval('public.event_categories_id_seq'::regclass);
ALTER TABLE ONLY public.event_registrations ALTER COLUMN id SET DEFAULT nextval('public.event_registrations_id_seq'::regclass);
ALTER TABLE ONLY public.event_subcategories ALTER COLUMN id SET DEFAULT nextval('public.event_subcategories_id_seq'::regclass);
ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);
ALTER TABLE ONLY public.student_registrations ALTER COLUMN id SET DEFAULT nextval('public.student_registrations_id_seq'::regclass);

-- Insert data
INSERT INTO public.admins (id, admin_email, password_hash, name, role, club, created_at) VALUES
(1, 'admin@zetech.ac.ke', '$2b$12$eOoRqLNM8u4ZbNgDVSi1EOLag9xUo.10yZWHiLlHk0tbPUSvtX0Ha', 'System Administrator', 'admin', NULL, '2026-05-23 17:08:37.784841+00'),
(2, 'izet@zetech.ac.ke', '$2b$12$JkIFKAR7kk1ePNhgra1ywuJBcJ7yY75MP8Brjfbng69Ky1uz6fEjK', 'Mercy muthoni', 'club_leader', 'IZET club', '2026-05-23 17:13:23.775269+00');

INSERT INTO public.event_categories (id, name, display_order, created_at) VALUES
(1, 'Tech & Academic', 0, '2026-05-24 00:31:35.957045+00'),
(2, 'Social & Community', 1, '2026-05-24 00:31:35.957045+00'),
(3, 'Sports & Games', 2, '2026-05-24 00:31:35.957045+00'),
(4, 'Religious Groups', 3, '2026-05-24 00:31:35.957045+00'),
(5, 'Student Leadership', 4, '2026-05-24 00:31:35.957045+00'),
(12, 'Creative & Media', 5, '2026-05-24 16:05:06.625379+00');

INSERT INTO public.event_subcategories (id, category_id, name, display_order, created_at) VALUES
(1, 1, 'Tourism Club', 7, '2026-05-24 00:31:35.96047+00'),
(2, 1, 'Hotel Club', 6, '2026-05-24 00:31:35.96047+00'),
(3, 1, 'Entrepreneurs Club', 5, '2026-05-24 00:31:35.96047+00'),
(4, 1, 'Journalism Club', 4, '2026-05-24 00:31:35.96047+00'),
(5, 1, 'Ajira Club', 3, '2026-05-24 00:31:35.96047+00'),
(6, 1, 'Innovation & Mentorship Hub (iZET)', 2, '2026-05-24 00:31:35.96047+00'),
(7, 1, 'Engineering Club', 1, '2026-05-24 00:31:35.96047+00'),
(8, 1, 'IT Club (iTech)', 0, '2026-05-24 00:31:35.96047+00'),
(9, 2, 'Rotaract Club', 3, '2026-05-24 00:31:35.96047+00'),
(10, 2, 'Lions Club', 2, '2026-05-24 00:31:35.96047+00'),
(11, 2, 'Knowledge Ambassadors Club (ZUKA)', 1, '2026-05-24 00:31:35.96047+00'),
(12, 2, 'Community Development Club', 0, '2026-05-24 00:31:35.96047+00'),
(13, 3, 'Chess', 3, '2026-05-24 00:31:35.96047+00'),
(14, 3, 'Rugby', 2, '2026-05-24 00:31:35.96047+00'),
(15, 3, 'Basketball teams', 1, '2026-05-24 00:31:35.96047+00'),
(16, 3, 'Football teams', 0, '2026-05-24 00:31:35.96047+00'),
(17, 4, 'Catholic Action', 3, '2026-05-24 00:31:35.96047+00'),
(18, 4, 'SDA (Seventh Day Adventist)', 2, '2026-05-24 00:31:35.96047+00'),
(19, 4, 'Muslim Association', 1, '2026-05-24 00:31:35.96047+00'),
(20, 4, 'Christian Union', 0, '2026-05-24 00:31:35.96047+00'),
(21, 5, 'Zetech university Student Association (ZUSA)', 0, '2026-05-24 00:31:35.96047+00');

INSERT INTO public.events (id, title, description, date, "time", location, category, max_participants, image_url, status, created_by, created_at, updated_at) VALUES
(2, '8th Zetech University Research & Innovation Week', 'The 8th Zetech University Research & Innovation Week is an official university event aimed at promoting research, innovation, entrepreneurship, and industry collaboration among students, researchers, innovators, and technology stakeholders. The event will feature exhibitions, innovation showcases, panel discussions, networking sessions, and presentations focused on sustainable technological advancement and research-driven solutions. The program seeks to encourage creativity, practical problem-solving, and interdisciplinary collaboration within the university and industry ecosystem.\n\nTheme*\nDriving Sustainable Futures through Research, Innovation & Industry', '2026-06-09', '08:00:00', 'Technology Park, Mang''u Campus', 'IZET club', NULL, '/uploads/1779584038951-651874946.jpg', 'upcoming', 2, '2026-05-24 00:54:03.304245+00', '2026-05-24 00:54:30.786802+00'),
(3, 'Gemini Hackathon', 'The Gemini Hackathon is a university-organized innovation and technology competition designed to promote creativity, problem-solving, and collaborative software development among students. The event brings together participants from various disciplines to design and develop technology-based solutions addressing real-world challenges. Teams will demonstrate technical competence, innovation, and effective presentation of their projects. The hackathon aims to foster a culture of research, innovation, and practical application of digital skills within the university community.\n\nDate *', '2026-05-29', '08:00:00', 'Main Hall', 'IZET club', NULL, '/uploads/1779586124230-102203566.jpg', 'upcoming', 2, '2026-05-24 01:28:49.346335+00', '2026-05-24 01:29:12.238232+00');

INSERT INTO public.student_registrations (id, first_name, last_name, admission_number, email, password, phone, status, last_login, created_at) VALUES
(1, 'Alex', 'Kariuki', 'DCS-01-0161/2025', 'machariakariuki@zetech.ac.ke', '$2b$12$4WLjropMBIjLFZ6kyCbVb.86rXYELFdg1EMsEV.2uUVyZWj9XIbx2', NULL, 'active', '2026-05-24 00:21:48.518+00', '2026-05-23 17:53:32.450009+00');

INSERT INTO public.system_settings (key, value, updated_at) VALUES
('system_name', 'Zetech Events Hub', '2026-05-23 16:58:40.040995+00'),
('system_description', 'Campus event management platform for Zetech University', '2026-05-23 16:58:40.040995+00'),
('sms_enabled', 'false', '2026-05-23 16:58:40.040995+00'),
('registration_open', 'true', '2026-05-23 16:58:40.040995+00'),
('maintenance_mode', 'false', '2026-05-23 16:58:40.040995+00'),
('sms_sender_id', 'ZetechHub', '2026-05-23 16:58:40.040995+00'),
('max_events_per_club', '50', '2026-05-23 16:58:40.040995+00'),
('contact_email', 'events@zetech.ac.ke', '2026-05-23 16:58:40.040995+00');

-- Set sequence values
SELECT pg_catalog.setval('public.admins_id_seq', 2, true);
SELECT pg_catalog.setval('public.event_categories_id_seq', 18, true);
SELECT pg_catalog.setval('public.event_registrations_id_seq', 1, true);
SELECT pg_catalog.setval('public.event_subcategories_id_seq', 63, true);
SELECT pg_catalog.setval('public.events_id_seq', 3, true);
SELECT pg_catalog.setval('public.student_registrations_id_seq', 1, true);

-- Create constraints
ALTER TABLE ONLY public.admins ADD CONSTRAINT admins_admin_email_key UNIQUE (admin_email);
ALTER TABLE ONLY public.admins ADD CONSTRAINT admins_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.event_categories ADD CONSTRAINT event_categories_name_key UNIQUE (name);
ALTER TABLE ONLY public.event_categories ADD CONSTRAINT event_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.event_registrations ADD CONSTRAINT event_registrations_event_id_student_id_key UNIQUE (event_id, student_id);
ALTER TABLE ONLY public.event_registrations ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.event_subcategories ADD CONSTRAINT event_subcategories_category_id_name_key UNIQUE (category_id, name);
ALTER TABLE ONLY public.event_subcategories ADD CONSTRAINT event_subcategories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.student_registrations ADD CONSTRAINT student_registrations_admission_number_key UNIQUE (admission_number);
ALTER TABLE ONLY public.student_registrations ADD CONSTRAINT student_registrations_email_key UNIQUE (email);
ALTER TABLE ONLY public.student_registrations ADD CONSTRAINT student_registrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.system_settings ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_reg_event_id ON public.event_registrations USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_status ON public.event_registrations USING btree (status);
CREATE INDEX IF NOT EXISTS idx_event_reg_student_id ON public.event_registrations USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events USING btree (date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events USING btree (status);
CREATE INDEX IF NOT EXISTS idx_student_reg_admission ON public.student_registrations USING btree (admission_number);
CREATE INDEX IF NOT EXISTS idx_student_reg_created ON public.student_registrations USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_reg_email ON public.student_registrations USING btree (email);
CREATE INDEX IF NOT EXISTS idx_student_reg_status ON public.student_registrations USING btree (status);

-- Create trigger
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create foreign keys
ALTER TABLE ONLY public.event_registrations ADD CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.event_registrations ADD CONSTRAINT event_registrations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_registrations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.event_subcategories ADD CONSTRAINT event_subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.event_categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.events ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id);