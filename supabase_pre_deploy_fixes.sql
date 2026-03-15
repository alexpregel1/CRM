-- ═══════════════════════════════════════════════════════════════════
--  SanderTone CRM — Pre-deployment SQL fixes
--  Ejecutar en: Supabase Dashboard → SQL Editor → New Query
--  Ejecutar TODO de una vez (es seguro relanzar si ya aplicado)
-- ═══════════════════════════════════════════════════════════════════


-- ─── FIX 1: dj_disponibilidad — ampliar constraint a los 10 DJs ──────────────
--
-- El constraint original solo permitía Felipe, Diego, Peche.
-- Los 7 DJs nuevos (Luis, Juan Cavero, Ichi, Raiboc, Los Pregel, Ramón, Topete)
-- fallarían al intentar registrar disponibilidad desde el formulario público.

ALTER TABLE dj_disponibilidad
DROP CONSTRAINT IF EXISTS dj_disponibilidad_dj_check;

ALTER TABLE dj_disponibilidad
ADD CONSTRAINT dj_disponibilidad_dj_check
CHECK (dj IN (
    'Felipe', 'Diego', 'Peche', 'Luis', 'Juan Cavero',
    'Ichi', 'Raiboc', 'Los Pregel', 'Ramón', 'Topete'
));


-- ─── FIX 2: crm_leads — añadir columnas que faltan ───────────────────────────
--
-- El frontend ya usa dj_asignado y fecha_ultimo_contacto.
-- Sin estas columnas, los INSERTs desde el CRM fallarán al conectar Supabase.

ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS dj_asignado          text,
ADD COLUMN IF NOT EXISTS fecha_ultimo_contacto date;


-- ─── FIX 3: crm_leads — corregir CHECK de status ────────────────────────────
--
-- El schema original usaba 'ganado', el frontend usa 'confirmado'.
-- También se añade 'señal_recibida' para alinearlo con el pipeline completo.

ALTER TABLE crm_leads
DROP CONSTRAINT IF EXISTS crm_leads_status_check;

ALTER TABLE crm_leads
ADD CONSTRAINT crm_leads_status_check
CHECK (status IN (
    'nuevo',
    'contactado',
    'presupuesto_enviado',
    'confirmado',
    'señal_recibida',
    'perdido'
));


-- ─── FIX 4: RLS — habilitar acceso para usuarios autenticados ────────────────
--
-- Sin estas políticas, las queries desde el CRM (sesión Supabase)
-- devolverán arrays vacíos aunque haya datos en las tablas.

-- crm_leads
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON crm_leads;
CREATE POLICY "Allow all for authenticated" ON crm_leads
    FOR ALL USING (auth.role() = 'authenticated');

-- crm_clientes
ALTER TABLE crm_clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON crm_clientes;
CREATE POLICY "Allow all for authenticated" ON crm_clientes
    FOR ALL USING (auth.role() = 'authenticated');

-- crm_facturas
ALTER TABLE crm_facturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON crm_facturas;
CREATE POLICY "Allow all for authenticated" ON crm_facturas
    FOR ALL USING (auth.role() = 'authenticated');

-- crm_eventos
ALTER TABLE crm_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON crm_eventos;
CREATE POLICY "Allow all for authenticated" ON crm_eventos
    FOR ALL USING (auth.role() = 'authenticated');


-- ═══════════════════════════════════════════════════════════════════
--  Verificación — ejecuta esto para confirmar que todo está correcto
-- ═══════════════════════════════════════════════════════════════════
SELECT
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('dj_disponibilidad', 'crm_leads')
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name;
