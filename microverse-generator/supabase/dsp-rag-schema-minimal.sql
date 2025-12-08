-- MINIMAL VERSION - Just the essentials to get started
-- Run this first if you want a simpler setup, then add the full version later

-- Enable pgvector (if not already enabled)
create extension if not exists vector;

-- Basic DSP Documents table (minimal fields)
create table if not exists public.dsp_docs (
  id uuid primary key default gen_random_uuid(),
  title text,
  type text,
  content text not null,
  perceptual_tags text[] default '{}',
  technical_tags text[] default '{}',
  embed_semantic vector(384),
  created_at timestamptz default now()
);

-- Essential vector index for search
create index if not exists dsp_docs_embed_semantic_ivfflat 
  on public.dsp_docs using ivfflat (embed_semantic vector_cosine_ops) 
  with (lists = 100)
  where embed_semantic is not null;

-- Basic security
alter table public.dsp_docs enable row level security;
create policy "anon can read dsp_docs" on public.dsp_docs for select using (true);

-- Simple search function (basic version)
create or replace function public.match_dsp_docs(
  query_embedding double precision[],
  match_count integer default 12,
  min_similarity double precision default 0.5
)
returns table (
  id uuid,
  title text,
  type text,
  content text,
  perceptual_tags text[],
  technical_tags text[],
  similarity double precision
) as $$
  with
  q as (
    select (query_embedding)::vector(384) as v
  ),
  _probe as (
    select set_config('ivfflat.probes', '100', true)
  )
  select 
    d.id, 
    d.title,
    d.type,
    d.content,
    d.perceptual_tags,
    d.technical_tags,
    1 - (d.embed_semantic <=> q.v) as similarity
  from public.dsp_docs d, q, _probe
  where d.embed_semantic is not null
    and 1 - (d.embed_semantic <=> q.v) >= min_similarity
  order by d.embed_semantic <=> q.v
  limit match_count;
$$ language sql stable;




