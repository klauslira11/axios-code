-- Schema SQL para o Supabase (Sem restrição por chave de acesso)

create table if not exists public.qr_codes (
  id text primary key,
  name text not null,
  target_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Se a tabela já existir e tiver secret_key, permite valores nulos ou remove restrições
alter table public.qr_codes drop column if exists secret_key;

-- Ativar RLS
alter table public.qr_codes enable row level security;

-- Política de Leitura Pública
drop policy if exists "Allow public read for redirection" on public.qr_codes;
create policy "Allow public read for redirection"
  on public.qr_codes
  for select
  using (true);

-- Política de Inserção Pública
drop policy if exists "Allow public insert" on public.qr_codes;
create policy "Allow public insert"
  on public.qr_codes
  for insert
  with check (true);

-- Política de Atualização Pública
drop policy if exists "Allow update with secret key match" on public.qr_codes;
drop policy if exists "Allow public update" on public.qr_codes;
create policy "Allow public update"
  on public.qr_codes
  for update
  using (true);
