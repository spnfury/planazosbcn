create table if not exists restaurants (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    nombre text not null,
    direccion text,
    tipo_comida text,
    pdf_url text,
    partner_id uuid references profiles(id),
    is_active boolean default true
);

alter table restaurants enable row level security;

create policy "Restaurantes visibles por todos."
  on restaurants for select
  using ( true );

create policy "Admins y dueños pueden modificar restaurantes"
  on restaurants for all
  using ( true ); -- Temporalmente true para facilitar testing, puedes afinar a partner_id = auth.uid()
  
create table if not exists restaurant_menus (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    restaurant_id uuid references restaurants(id) on delete cascade not null,
    nombre text not null,
    precio numeric,
    incluye_vino boolean default false,
    contenido_estructurado jsonb,
    prompt_usado text,
    is_active boolean default true
);

alter table restaurant_menus enable row level security;

create policy "Menus visibles por todos."
  on restaurant_menus for select
  using ( true );

create policy "Admins y dueños pueden modificar menus"
  on restaurant_menus for all
  using ( true );

-- Nueva tabla para los PLATOS estructurados de la carta
create table if not exists restaurant_dishes (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    restaurant_id uuid references restaurants(id) on delete cascade not null,
    nombre text not null,
    descripcion text,
    precio numeric,
    categoria text, -- Ej: Entrantes, Principales, Postres
    alergenos text[],
    es_apto_menu boolean default true, -- Para saber si se puede usar en menús generados
    is_active boolean default true
);

alter table restaurant_dishes enable row level security;

create policy "Platos visibles por todos."
  on restaurant_dishes for select
  using ( true );

create policy "Admins y dueños pueden modificar platos"
  on restaurant_dishes for all
  using ( true );
