-- ═══════════════════════════════════════════════════════════════════
--  SanderTone CRM — Supabase Schema
--  Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. CLIENTES ────────────────────────────────────────────────────
create table if not exists crm_clientes (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  email           text not null,
  telefono        text,
  empresa         text,
  ciudad          text,
  notas           text,
  vip             boolean default false,
  eventos_totales integer default 0,
  gasto_total     numeric(10,2) default 0,
  ultimo_evento   date,
  created_at      timestamptz default now()
);

-- ─── 2. LEADS ────────────────────────────────────────────────────────
-- status: nuevo | contactado | presupuesto_enviado | ganado | perdido
create table if not exists crm_leads (
  id                    uuid primary key default gen_random_uuid(),
  nombre                text not null,
  email                 text not null,
  telefono              text,
  tipo_evento           text,
  fecha_evento          date,
  ubicacion             text,
  pack_seleccionado     text,
  equipo_extra          text,
  presupuesto_estimado  numeric(10,2) default 0,
  status                text not null default 'nuevo'
                          check (status in ('nuevo','contactado','presupuesto_enviado','ganado','perdido')),
  notas                 text,
  cliente_id            uuid references crm_clientes(id) on delete set null,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── 3. EVENTOS ─────────────────────────────────────────────────────
-- status: confirmado | tentativo | completado | cancelado
create table if not exists crm_eventos (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  cliente_id   uuid references crm_clientes(id) on delete set null,
  lead_id      uuid references crm_leads(id) on delete set null,
  fecha        date not null,
  hora_inicio  time,
  hora_fin     time,
  ubicacion    text,
  tipo         text,
  pack         text,
  importe      numeric(10,2) default 0,
  status       text not null default 'tentativo'
                 check (status in ('confirmado','tentativo','completado','cancelado')),
  notas        text,
  created_at   timestamptz default now()
);

-- ─── 4. FACTURAS ────────────────────────────────────────────────────
-- status: pendiente | pagada | vencida
create table if not exists crm_facturas (
  id                  uuid primary key default gen_random_uuid(),
  numero              text not null unique,
  cliente_id          uuid references crm_clientes(id) on delete set null,
  evento_id           uuid references crm_eventos(id) on delete set null,
  concepto            text,
  importe             numeric(10,2) not null,
  fecha_emision       date not null default current_date,
  fecha_vencimiento   date,
  fecha_pago          date,
  status              text not null default 'pendiente'
                        check (status in ('pendiente','pagada','vencida')),
  created_at          timestamptz default now()
);

-- ─── 5. ROW LEVEL SECURITY (opcional, recomendado) ──────────────────
-- Si tu dashboard es solo para ti, puedes deshabilitar RLS:
-- alter table crm_clientes disable row level security;
-- alter table crm_leads disable row level security;
-- alter table crm_eventos disable row level security;
-- alter table crm_facturas disable row level security;

-- O habilitar y crear políticas para tu user:
-- alter table crm_clientes enable row level security;
-- create policy "Allow all for authenticated" on crm_clientes
--   for all using (auth.role() = 'authenticated');

-- ─── 6. TRIGGER: updated_at en leads ────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on crm_leads
  for each row execute function update_updated_at();

-- ─── 7. VISTA: resumen de facturación ───────────────────────────────
create or replace view crm_facturacion_resumen as
select
  extract(year  from fecha_emision)::int as año,
  extract(month from fecha_emision)::int as mes,
  count(*)                               as num_facturas,
  sum(importe)                           as total_facturado,
  sum(case when status = 'pagada' then importe else 0 end) as total_cobrado,
  sum(case when status = 'pendiente' then importe else 0 end) as total_pendiente,
  sum(case when status = 'vencida' then importe else 0 end) as total_vencido
from crm_facturas
group by 1, 2
order by 1 desc, 2 desc;

-- ═══════════════════════════════════════════════════════════════════
--  CÓMO CONECTAR CON LA WEB (formulario de contacto)
-- ═══════════════════════════════════════════════════════════════════
-- Cuando llega una solicitud desde index.html, el server.js puede:
--
--   const { data, error } = await supabase
--     .from('crm_leads')
--     .insert({
--       nombre: req.body.name,
--       email: req.body.email,
--       telefono: req.body.phone,
--       tipo_evento: req.body.event_type,
--       fecha_evento: req.body.event_date,
--       ubicacion: req.body.location,
--       pack_seleccionado: req.body.cart_summary,  // cart exportado
--       presupuesto_estimado: req.body.cart_total,
--       equipo_extra: req.body.message,
--       status: 'nuevo'
--     });
--
-- El CRM mostrará el lead inmediatamente en /crm/leads
-- ═══════════════════════════════════════════════════════════════════

-- ─── 5. DJ DISPONIBILIDAD ────────────────────────────────────────────────────
-- Tabla para registrar fechas no disponibles de los DJs
-- Se llena vía el formulario público /disponibilidad

create table if not exists dj_disponibilidad (
  id            uuid primary key default gen_random_uuid(),
  dj            text not null check (dj in ('Felipe', 'Diego', 'Peche')),
  fecha_inicio  date not null,
  fecha_fin     date not null,
  motivo        text,
  created_at    timestamptz default now()
);

-- Índice para consultar por DJ y fechas
create index if not exists idx_dj_disp_dj         on dj_disponibilidad(dj);
create index if not exists idx_dj_disp_fecha       on dj_disponibilidad(fecha_inicio, fecha_fin);

-- RLS: permitir inserts públicos (el formulario no requiere auth)
alter table dj_disponibilidad enable row level security;

create policy "Allow public insert"
  on dj_disponibilidad for insert
  with check (true);

create policy "Allow authenticated read"
  on dj_disponibilidad for select
  using (true);
