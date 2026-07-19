--
-- PostgreSQL database dump
--

\restrict 9ehvDp2x8Od07GsWWiX1J3bNjm4N3GHuY5ln4m3Fz5FMLs6yDDSSt4djnV09SI7

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

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

--
-- Name: enum_Bookings_session; Type: TYPE; Schema: public; Owner: muhammedshakirva
--

CREATE TYPE public."enum_Bookings_session" AS ENUM (
    'Morning',
    'Evening',
    'Full Day'
);


ALTER TYPE public."enum_Bookings_session" OWNER TO muhammedshakirva;

--
-- Name: enum_Bookings_status; Type: TYPE; Schema: public; Owner: muhammedshakirva
--

CREATE TYPE public."enum_Bookings_status" AS ENUM (
    'Enquiry',
    'Pending Payment',
    'Confirmed',
    'Completed',
    'Cancelled'
);


ALTER TYPE public."enum_Bookings_status" OWNER TO muhammedshakirva;

--
-- Name: enum_Users_role; Type: TYPE; Schema: public; Owner: muhammedshakirva
--

CREATE TYPE public."enum_Users_role" AS ENUM (
    'Owner',
    'Manager',
    'Staff'
);


ALTER TYPE public."enum_Users_role" OWNER TO muhammedshakirva;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Bookings; Type: TABLE; Schema: public; Owner: muhammedshakirva
--

CREATE TABLE public."Bookings" (
    id integer NOT NULL,
    "bookingId" character varying(255),
    "customerName" character varying(255) NOT NULL,
    phone character varying(255) NOT NULL,
    "eventType" character varying(255) NOT NULL,
    hall character varying(255) NOT NULL,
    date character varying(255) NOT NULL,
    session public."enum_Bookings_session" DEFAULT 'Full Day'::public."enum_Bookings_session",
    guests integer DEFAULT 0,
    advance integer DEFAULT 0,
    "totalAmount" integer DEFAULT 0,
    status public."enum_Bookings_status" DEFAULT 'Enquiry'::public."enum_Bookings_status",
    notes text DEFAULT ''::text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Bookings" OWNER TO muhammedshakirva;

--
-- Name: Bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: muhammedshakirva
--

CREATE SEQUENCE public."Bookings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Bookings_id_seq" OWNER TO muhammedshakirva;

--
-- Name: Bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: muhammedshakirva
--

ALTER SEQUENCE public."Bookings_id_seq" OWNED BY public."Bookings".id;


--
-- Name: Expenses; Type: TABLE; Schema: public; Owner: muhammedshakirva
--

CREATE TABLE public."Expenses" (
    id integer NOT NULL,
    category character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    amount integer NOT NULL,
    date character varying(255) NOT NULL,
    recurring boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Expenses" OWNER TO muhammedshakirva;

--
-- Name: Expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: muhammedshakirva
--

CREATE SEQUENCE public."Expenses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Expenses_id_seq" OWNER TO muhammedshakirva;

--
-- Name: Expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: muhammedshakirva
--

ALTER SEQUENCE public."Expenses_id_seq" OWNED BY public."Expenses".id;


--
-- Name: Settings; Type: TABLE; Schema: public; Owner: muhammedshakirva
--

CREATE TABLE public."Settings" (
    id integer NOT NULL,
    "venueName" character varying(255) DEFAULT 'Sreelakshmi Convention Centre'::character varying,
    "ownerName" character varying(255) DEFAULT 'Rajan P.K.'::character varying,
    location character varying(255) DEFAULT 'Taliparamba, Kannur, Kerala'::character varying,
    phone character varying(255) DEFAULT '+91 94470 12345'::character varying,
    email character varying(255) DEFAULT ''::character varying,
    gstin character varying(255) DEFAULT ''::character varying,
    halls jsonb DEFAULT '[]'::jsonb,
    "blackoutDates" jsonb DEFAULT '[]'::jsonb,
    notifications jsonb DEFAULT '{}'::jsonb,
    gallery jsonb DEFAULT '[]'::jsonb,
    "eventTypes" jsonb DEFAULT '["Wedding", "Reception", "Engagement", "Birthday", "Conference", "Anniversary", "Baptism", "Other"]'::jsonb,
    sessions jsonb DEFAULT '[{"name": "Morning", "time": "09:00 AM - 02:00 PM"}, {"name": "Evening", "time": "04:00 PM - 10:00 PM"}, {"name": "Full Day", "time": "09:00 AM - 10:00 PM"}]'::jsonb,
    "expenseCategories" jsonb DEFAULT '["Staff Salaries", "Maintenance", "Utilities", "Catering Prep", "Miscellaneous"]'::jsonb,
    "managerRevenueEnabled" boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Settings" OWNER TO muhammedshakirva;

--
-- Name: Settings_id_seq; Type: SEQUENCE; Schema: public; Owner: muhammedshakirva
--

CREATE SEQUENCE public."Settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Settings_id_seq" OWNER TO muhammedshakirva;

--
-- Name: Settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: muhammedshakirva
--

ALTER SEQUENCE public."Settings_id_seq" OWNED BY public."Settings".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: muhammedshakirva
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public."enum_Users_role" DEFAULT 'Staff'::public."enum_Users_role",
    phone character varying(255) DEFAULT ''::character varying,
    active boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Users" OWNER TO muhammedshakirva;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: muhammedshakirva
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Users_id_seq" OWNER TO muhammedshakirva;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: muhammedshakirva
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: Bookings id; Type: DEFAULT; Schema: public; Owner: muhammedshakirva
--

ALTER TABLE ONLY public."Bookings" ALTER COLUMN id SET DEFAULT nextval('public."Bookings_id_seq"'::regclass);


--
-- Name: Expenses id; Type: DEFAULT; Schema: public; Owner: muhammedshakirva
--

ALTER TABLE ONLY public."Expenses" ALTER COLUMN id SET DEFAULT nextval('public."Expenses_id_seq"'::regclass);


--
-- Name: Settings id; Type: DEFAULT; Schema: public; Owner: muhammedshakirva
--

ALTER TABLE ONLY public."Settings" ALTER COLUMN id SET DEFAULT nextval('public."Settings_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: muhammedshakirva
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Data for Name: Bookings; Type: TABLE DATA; Schema: public; Owner: muhammedshakirva
--

COPY public."Bookings" (id, "bookingId", "customerName", phone, "eventType", hall, date, session, guests, advance, "totalAmount", status, notes, "createdAt", "updatedAt") FROM stdin;
1	BK001	Arun & Divya	9447012345	Wedding	Main Hall	2026-05-10	Full Day	450	10000	35000	Confirmed	Sadya for 450 guests, stage decoration needed	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
2	BK002	Sreekumar Family	9447056789	Reception	Main Hall	2026-05-12	Evening	300	5000	20000	Confirmed	Evening reception, DJ required	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
3	BK003	Priya & Vishnu	9895012345	Engagement	Mini Hall	2026-05-15	Morning	100	3000	10000	Confirmed		2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
4	BK004	St. Mary's Church	9447098765	Baptism	Mini Hall	2026-05-18	Morning	80	2000	8000	Pending Payment	Church event, no catering needed	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
5	BK005	Anitha Nair	9946012345	Birthday	Mini Hall	2026-05-20	Evening	120	0	9000	Enquiry	60th birthday celebration	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
6	BK006	Moosa & Fathima	9747012345	Wedding	Main Hall	2026-05-22	Full Day	500	15000	40000	Confirmed	Full sadya, need generator backup	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
7	BK007	Rajesh Kumar	9847023456	Corporate Event	Mini Hall	2026-05-25	Full Day	100	5000	15000	Confirmed	Company annual meeting	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
8	BK008	Lakshmi & Suresh	9447034567	Seemantham	Mini Hall	2026-05-28	Morning	60	2000	7000	Confirmed		2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
9	BK009	Thomas & Mary	9447045678	Wedding	Main Hall	2026-06-02	Full Day	400	10000	38000	Confirmed	Christian wedding	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
10	BK010	Vinod Family	9946023456	Reception	Open Stage	2026-06-05	Evening	250	4000	18000	Pending Payment	Outdoor reception, need extra lights	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
11	BK011	Santhosh & Meera	9747034567	Wedding	Main Hall	2026-06-08	Full Day	480	12000	42000	Confirmed		2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
12	BK012	PTA Taliparamba School	9447067890	Annual Day	Main Hall	2026-06-15	Full Day	350	8000	25000	Confirmed	School program, need projector screen	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
13	BK013	Rema & Biju	9895034567	Engagement	Mini Hall	2026-04-22	Morning	90	3000	9000	Completed		2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
14	BK014	Abdul & Safiya	9447078901	Wedding	Main Hall	2026-04-28	Full Day	460	15000	39000	Completed		2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
15	BK015	Gopalan Nair	9946045678	Birthday	Mini Hall	2026-04-25	Evening	70	2000	7000	Completed	75th birthday	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
16	BK016	Deepa & Anil	9747056789	Wedding	Main Hall	2026-06-20	Full Day	500	0	40000	Enquiry	Referred by Vinod family	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
17	BK017	CSI Church Kannur	9447089012	Conference	Main Hall	2026-06-22	Full Day	200	5000	20000	Confirmed		2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
18	BK018	Nisha & Praveen	9895056789	Reception	Main Hall	2026-06-25	Evening	350	8000	22000	Confirmed		2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
19	BK019	Manoj Family	9946067890	Seemantham	Mini Hall	2026-04-30	Morning	50	2000	6000	Completed		2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
20	BK020	Faisal & Reshma	9747067890	Wedding	Main Hall	2026-07-05	Full Day	420	10000	38000	Confirmed	Need Halal catering vendor	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
21	BK021	Sneha & Rahul	9447112233	Wedding	Main Hall	2026-06-29	Full Day	600	20000	45000	Confirmed	VVIP guests attending, special security needed	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
22	BK022	Kannan & Meenakshi	9447122334	Engagement	Mini Hall	2026-06-30	Evening	150	5000	12000	Confirmed	Floral decorations needed	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
23	BK023	Lulu Group	9447133445	Corporate	Main Hall	2026-07-10	Full Day	300	15000	35000	Confirmed	Corporate retreat	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
24	BK024	Malabar Gold	9447144556	Corporate	Open Stage	2026-07-12	Evening	400	10000	25000	Confirmed	Staff annual gathering	2026-06-29 07:14:10.338-07	2026-06-29 07:14:10.338-07
\.


--
-- Data for Name: Expenses; Type: TABLE DATA; Schema: public; Owner: muhammedshakirva
--

COPY public."Expenses" (id, category, description, amount, date, recurring, "createdAt", "updatedAt") FROM stdin;
1	Staff Salaries	Hall Manager – Rajan P.K.	35000	2026-04-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
2	Staff Salaries	Caretaker – Suresh Kumar	18000	2026-04-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
3	Staff Salaries	Security Guard (2 staff)	24000	2026-04-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
4	Staff Salaries	Cleaning Staff (3 members)	21000	2026-04-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
5	Maintenance	AC Service – Main Hall	8500	2026-04-05	f	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
6	Maintenance	Generator Fuel & Service	12000	2026-04-08	f	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
7	Utilities	Electricity Bill – April	22000	2026-04-10	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
8	Utilities	Water Bill – April	3500	2026-04-10	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
9	Utilities	Internet & Phone	1800	2026-04-10	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
10	Catering Prep	Catering Equipment Restock	6500	2026-04-18	f	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
11	Miscellaneous	Office Supplies & Stationery	2200	2026-04-20	f	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
12	Miscellaneous	Flower Decoration (event support)	3800	2026-04-22	f	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
13	Staff Salaries	Hall Manager – Rajan P.K.	35000	2026-05-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
14	Staff Salaries	Caretaker – Suresh Kumar	18000	2026-05-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
15	Staff Salaries	Security Guard (2 staff)	24000	2026-05-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
16	Staff Salaries	Cleaning Staff (3 members)	21000	2026-05-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
17	Utilities	Electricity Bill – May	24500	2026-05-10	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
18	Utilities	Water Bill – May	3800	2026-05-10	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
19	Staff Salaries	Hall Manager – Rajan P.K.	35000	2026-06-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
20	Staff Salaries	Caretaker – Suresh Kumar	18000	2026-06-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
21	Staff Salaries	Security Guard (2 staff)	24000	2026-06-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
22	Staff Salaries	Cleaning Staff (3 members)	21000	2026-06-01	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
23	Utilities	Electricity Bill – June	25000	2026-06-10	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
24	Utilities	Water Bill – June	4000	2026-06-10	t	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
25	Maintenance	Plumbing repair in Kitchen	4500	2026-06-15	f	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
26	Miscellaneous	Onam advance for staff	10000	2026-06-25	f	2026-06-29 07:14:10.342-07	2026-06-29 07:14:10.342-07
\.


--
-- Data for Name: Settings; Type: TABLE DATA; Schema: public; Owner: muhammedshakirva
--

COPY public."Settings" (id, "venueName", "ownerName", location, phone, email, gstin, halls, "blackoutDates", notifications, gallery, "eventTypes", sessions, "expenseCategories", "managerRevenueEnabled", "createdAt", "updatedAt") FROM stdin;
1	Sreelakshmi Convention Centre	Rajan P.K.	Taliparamba, Kannur, Kerala	+91 94470 12345			[{"icon": "🏛️", "name": "Main Hall", "price": 15000, "capacity": 600, "description": "Grand ballroom with full AV setup"}, {"icon": "🏠", "name": "Mini Hall", "price": 6000, "capacity": 150, "description": "Intimate setting for smaller events"}, {"icon": "🌿", "name": "Open Stage", "price": 8000, "capacity": 300, "description": "Outdoor stage with natural surroundings"}]	[]	{}	[]	["Wedding", "Reception", "Engagement", "Birthday", "Conference", "Anniversary", "Baptism", "Other"]	[{"name": "Morning", "time": "09:00 AM - 02:00 PM"}, {"name": "Evening", "time": "04:00 PM - 10:00 PM"}, {"name": "Full Day", "time": "09:00 AM - 10:00 PM"}]	["Staff Salaries", "Maintenance", "Utilities", "Catering Prep", "Miscellaneous"]	t	2026-06-29 07:14:10.345-07	2026-06-29 07:14:10.345-07
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: muhammedshakirva
--

COPY public."Users" (id, name, email, password, role, phone, active, "createdAt", "updatedAt") FROM stdin;
1	Rajan P.K.	owner@venueza.com	$2b$12$0BuqUcSQeHbqJtFWV6hllOHPSFVnEphGUh32mpj9GmFqTmZgZmIMe	Owner	9447012345	t	2026-06-29 07:14:09.705-07	2026-06-29 07:14:09.705-07
2	Suresh Kumar	manager@venueza.com	$2b$12$JzmtLZZxer7ZN/N5lwFJ1OUbJzzLFCA5Bkv6yKfPL5RSgXOQoKJuy	Manager	9447056789	t	2026-06-29 07:14:09.921-07	2026-06-29 07:14:09.921-07
3	Anitha Nair	staff@venueza.com	$2b$12$LpjfmqXh1zPi4Jr8p01TA.gO7maP6cYnM4gw7CSOPHot5FYIsEWiS	Staff	9447098765	t	2026-06-29 07:14:10.129-07	2026-06-29 07:14:10.129-07
\.


--
-- Name: Bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: muhammedshakirva
--

SELECT pg_catalog.setval('public."Bookings_id_seq"', 24, true);


--
-- Name: Expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: muhammedshakirva
--

SELECT pg_catalog.setval('public."Expenses_id_seq"', 26, true);


--
-- Name: Settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: muhammedshakirva
--

SELECT pg_catalog.setval('public."Settings_id_seq"', 1, true);


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: muhammedshakirva
--

SELECT pg_catalog.setval('public."Users_id_seq"', 3, true);


--
-- Name: Bookings Bookings_bookingId_key; Type: CONSTRAINT; Schema: public; Owner: muhammedshakirva
--

ALTER TABLE ONLY public."Bookings"
    ADD CONSTRAINT "Bookings_bookingId_key" UNIQUE ("bookingId");


--
-- Name: Bookings Bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: muhammedshakirva
--

ALTER TABLE ONLY public."Bookings"
    ADD CONSTRAINT "Bookings_pkey" PRIMARY KEY (id);


--
-- Name: Expenses Expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: muhammedshakirva
--

ALTER TABLE ONLY public."Expenses"
    ADD CONSTRAINT "Expenses_pkey" PRIMARY KEY (id);


--
-- Name: Settings Settings_pkey; Type: CONSTRAINT; Schema: public; Owner: muhammedshakirva
--

ALTER TABLE ONLY public."Settings"
    ADD CONSTRAINT "Settings_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: muhammedshakirva
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: muhammedshakirva
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 9ehvDp2x8Od07GsWWiX1J3bNjm4N3GHuY5ln4m3Fz5FMLs6yDDSSt4djnV09SI7

