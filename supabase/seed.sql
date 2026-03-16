-- ============================================
-- PlanazosBCN Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================

-- Regular plans
INSERT INTO plans (id, slug, type, title, excerpt, description, image, category, category_label, zone, date, price, capacity, spots_taken, featured, sponsored) VALUES
(1, 'ruta-tapas-born', 'plan', 'Ruta de Tapas por El Born', 'Descubre los mejores bares de tapas del barrio más trendy de Barcelona. 5 paradas, 5 tapas, 5 vinos.', 'Una ruta gastronómica por El Born donde visitaremos 5 de los mejores bares de tapas del barrio. Cada parada incluye una tapa y un vino o cerveza. Perfecto para conocer gente y descubrir rincones auténticos.', 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&h=400&fit=crop', 'gastro', 'Gastronomía', 'El Born', 'Sáb 22 Mar', '25', 20, 8, true, false),

(2, 'sunset-bunkers-carmel', 'plan', 'Sunset en los Búnkers del Carmel', 'Las mejores vistas de Barcelona al atardecer. Llevamos snacks, bebidas y buena compañía.', 'Subimos a los Búnkers del Carmel para disfrutar de un atardecer increíble con las mejores vistas 360º de Barcelona.', 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop', 'rutas', 'Rutas', 'Carmel', 'Dom 23 Mar', 'Gratis', 30, 22, true, false),

(3, 'cena-hidden-kitchen', 'plan', 'Cena Secreta: Hidden Kitchen Experience', 'Una experiencia gastronómica exclusiva en una cocina secreta del Raval. Solo 12 plazas.', 'Cena de 5 platos con maridaje en una ubicación secreta del Raval.', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', 'gastro', 'Gastronomía', 'El Raval', 'Vie 21 Mar', '55', 12, 10, false, true),

(4, 'ruta-graffiti-poblenou', 'plan', 'Ruta de Graffiti por Poblenou', 'Street art, cultura urbana y la historia del barrio más creativo de Barcelona.', 'Un paseo de 2 horas por las calles de Poblenou descubriendo los murales más impresionantes de Barcelona.', 'https://images.unsplash.com/photo-1569017388730-020b5f80a004?w=600&h=400&fit=crop', 'cultura', 'Cultura', 'Poblenou', 'Sáb 22 Mar', '10', 25, 5, false, false),

(5, 'senderismo-montserrat', 'plan', 'Senderismo por Montserrat', 'Escapada de un día a la montaña mágica. Ruta de dificultad media con vistas espectaculares.', 'Excursión de un día completo a Montserrat.', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop', 'naturaleza', 'Naturaleza', 'Montserrat', 'Dom 23 Mar', '15', 15, 3, false, false),

(6, 'vermut-sants', 'plan', 'Vermuteo por Sants', 'La tradición del vermut a la barcelonesa. 3 bares emblemáticos de Sants con tapa incluida.', 'Redescubre el arte del vermut en uno de los barrios más auténticos de Barcelona.', 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&h=400&fit=crop', 'gastro', 'Gastronomía', 'Sants', 'Sáb 29 Mar', '18', 18, 12, false, false),

(7, 'noche-jazz-raval', 'plan', 'Noche de Jazz en El Raval', 'Jazz en directo en uno de los bares más míticos de Barcelona.', 'Una noche de jazz en vivo en un bar secreto del Raval.', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop', 'nocturno', 'Nocturno', 'El Raval', 'Jue 20 Mar', '12', 40, 15, false, false),

(8, 'kayak-barceloneta', 'plan', 'Kayak al Amanecer en la Barceloneta', 'Remamos al amanecer por la costa de Barcelona. Incluye fotos y desayuno post-kayak.', 'Experiencia de kayak al amanecer por la costa de Barcelona.', 'https://images.unsplash.com/photo-1472745433479-4556f22e32c2?w=600&h=400&fit=crop', 'naturaleza', 'Naturaleza', 'Barceloneta', 'Sáb 22 Mar', '30', 10, 7, true, false);

-- Evento: La Sobremesa
INSERT INTO plans (id, slug, type, title, excerpt, description, image, poster_image, category, category_label, zone, date, price, venue, address, time_start, time_end, capacity, spots_taken, featured, sponsored, age_restriction) VALUES
(9, 'la-sobremesa-picocos-band', 'evento', 'LA SOBREMESA | PICOCO''S BAND — EL TARDEO DE LOS 90''s-00''s', 'El primer tardeo de Barcelona con los mejores temas de los 90s-00s.', E'Vuelve a Luz de Gas el primer tardeo de Barcelona con los mejores temas de los 90''s-00''s.\n\nPorque hay épocas que merecen ser vividas dos veces.\n\nEntradas disponibles en taquilla según aforo.\nEvento recomendado para mayores de 35 años.\nNo se admiten devoluciones.\nReservado el derecho de admisión.', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=600&fit=crop', 'ocio', 'Ocio & Fiesta', 'Sarrià-Sant Gervasi', 'SÁB. 28 MARZO 2026', '15', 'Luz de Gas', 'C/ de Muntaner, 246, Sarrià-Sant Gervasi, 08021 Barcelona, España', '18:00', '23:30', 200, 145, true, false, '+35 años');

-- Evento: Techno Warehouse
INSERT INTO plans (id, slug, type, title, excerpt, description, image, poster_image, category, category_label, zone, date, price, venue, address, time_start, time_end, capacity, spots_taken, featured, sponsored, age_restriction) VALUES
(10, 'techno-warehouse-poblenou', 'evento', 'TECHNO WAREHOUSE — UNDERGROUND SESSIONS VOL.3', 'La mejor sesión techno underground en un warehouse secreto de Poblenou.', E'Vuelve la tercera edición de Underground Sessions.\n\nAforo limitado a 500 personas.\nNo se admiten devoluciones.', 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400&h=600&fit=crop', 'nocturno', 'Nocturno', 'Poblenou', 'SÁB. 5 ABRIL 2026', '20', 'Warehouse 22', 'C/ de Pallars, 85, Poblenou, 08018 Barcelona, España', '23:00', '06:00', 500, 320, true, true, '+18 años');

-- Tags
INSERT INTO plan_tags (plan_id, tag) VALUES
(9, 'Casual'), (9, 'Disco'), (9, 'Hits'), (9, 'Pop'),
(10, 'Techno'), (10, 'Underground'), (10, 'Electronic');

-- Tickets
INSERT INTO plan_tickets (plan_id, name, price, description, capacity, spots_taken, sold_out, sort_order) VALUES
(9, 'Entrada Anticipada con 1 consumición', '15', '- Incluye 1 consumición.\n- Entrada válida hasta las 19:30h.', 200, 145, false, 0),
(10, 'Early Bird', '15', '- Acceso general\n- Primeras 100 entradas a precio reducido', 100, 100, true, 0),
(10, 'Entrada General', '20', '- Acceso general al evento\n- Válido hasta completar aforo', 300, 180, false, 1),
(10, 'VIP + Copa', '35', '- Acceso zona VIP\n- Incluye 1 copa premium\n- Fast lane sin cola', 100, 40, false, 2);

-- Guest lists
INSERT INTO plan_guest_lists (plan_id, name, time_range, price, description, sold_out, sort_order) VALUES
(9, 'Lista gratis de 18h a 18:30h', '18:00 - 18:30', 'Gratis', 'Desde el inicio del evento hasta la(s) 18:30 gratis\nLa lista no asegura la entrada.', true, 0),
(10, 'Lista gratis de 23h a 00h', '23:00 - 00:00', 'Gratis', 'Entrada gratuita durante la primera hora.\nSujeto a aforo.', false, 0);

-- Schedule
INSERT INTO plan_schedule (plan_id, time, description, sort_order) VALUES
(9, '18:00', 'APERTURA PUERTAS', 0),
(9, '18:30', 'CONCIERTO PICOCO''S BAND', 1),
(9, '20:00', 'DJ Jose Miguel & Julián Buenavista 80s 90s', 2),
(10, '23:00', 'APERTURA PUERTAS — DJ Warm Up', 0),
(10, '00:30', 'LIVE SET — Artista invitado', 1),
(10, '02:00', 'HEADLINER — Sesión principal', 2),
(10, '04:00', 'B2B — Closing set', 3);

-- Reset sequences
SELECT setval('plans_id_seq', 10);
SELECT setval('plan_tags_id_seq', (SELECT MAX(id) FROM plan_tags));
SELECT setval('plan_tickets_id_seq', (SELECT MAX(id) FROM plan_tickets));
SELECT setval('plan_guest_lists_id_seq', (SELECT MAX(id) FROM plan_guest_lists));
SELECT setval('plan_schedule_id_seq', (SELECT MAX(id) FROM plan_schedule));
