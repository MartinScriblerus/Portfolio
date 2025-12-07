-- DSP RAG Schema for Supabase Vector Store
-- Extends the existing vector setup with DSP-specific fields

-- Enable pgvector (if not already enabled)
create extension if not exists vector;

-- DSP Documents table
create table if not exists public.dsp_docs (
  id uuid primary key default gen_random_uuid(),
  title text,
  type text not null check (type in ('code', 'doc', 'ir', 'audio', 'patch', 'paper')),
  language text check (language in ('chuck', 'faust', 'pd', 'max', 'js', 'glsl', 'text')),
  tool text check (tool in ('webchuck', 'faust', 'meyda', 'librosa', 'hydra', 'mingus', 'tunejs')),
  content text not null,
  tokens_est int,
  chunk_of uuid references public.dsp_docs(id) on delete cascade,
  chunk_index int,
  chunk_total int,
  perceptual_tags text[] default '{}',
  technical_tags text[] default '{}',
  ugens text[] default '{}',
  params jsonb,
  example_usage text,
  license text check (license in ('cc-by', 'cc0', 'public-domain', 'gpl', 'mit', 'proprietary')),
  source_url text,
  created_at timestamptz default now(),

  -- Embeddings (384-dim to match existing embedding model)
  embed_semantic vector(384),
  embed_code vector(384),

  -- Optional numeric audio features for IRs or sample metadata
  mfcc_mean double precision[],
  spectral_centroid double precision,
  spectral_flux double precision,
  loudness double precision
);

-- Vector indexes
create index if not exists dsp_docs_embed_semantic_ivfflat 
  on public.dsp_docs using ivfflat (embed_semantic vector_cosine_ops) 
  with (lists = 100)
  where embed_semantic is not null;

create index if not exists dsp_docs_embed_code_ivfflat 
  on public.dsp_docs using ivfflat (embed_code vector_cosine_ops) 
  with (lists = 100)
  where embed_code is not null;

-- Metadata indexes for fast filtering
create index if not exists dsp_docs_language_idx on public.dsp_docs (language);
create index if not exists dsp_docs_type_idx on public.dsp_docs (type);
create index if not exists dsp_docs_tool_idx on public.dsp_docs (tool);
create index if not exists dsp_docs_perceptual_tags_idx on public.dsp_docs using gin (perceptual_tags);
create index if not exists dsp_docs_technical_tags_idx on public.dsp_docs using gin (technical_tags);
create index if not exists dsp_docs_ugens_idx on public.dsp_docs using gin (ugens);

-- RPC for semantic nearest neighbors search
create or replace function public.match_dsp_docs(
  query_embedding double precision[],
  match_count integer default 12,
  min_similarity double precision default 0.5,
  filter_language text default null,
  filter_type text default null,
  filter_tool text default null,
  perceptual_tags_filter text[] default null,
  technical_tags_filter text[] default null
)
returns table (
  id uuid,
  title text,
  type text,
  language text,
  tool text,
  content text,
  perceptual_tags text[],
  technical_tags text[],
  ugens text[],
  params jsonb,
  example_usage text,
  license text,
  source_url text,
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
    d.language,
    d.tool,
    d.content,
    d.perceptual_tags,
    d.technical_tags,
    d.ugens,
    d.params,
    d.example_usage,
    d.license,
    d.source_url,
    1 - (d.embed_semantic <=> q.v) as similarity
  from public.dsp_docs d, q, _probe
  where d.embed_semantic is not null
    and 1 - (d.embed_semantic <=> q.v) >= min_similarity
    and (filter_language is null or d.language = filter_language)
    and (filter_type is null or d.type = filter_type)
    and (filter_tool is null or d.tool = filter_tool)
    and (perceptual_tags_filter is null or d.perceptual_tags && perceptual_tags_filter)
    and (technical_tags_filter is null or d.technical_tags && technical_tags_filter)
  order by d.embed_semantic <=> q.v
  limit match_count;
$$ language sql stable;

-- RPC for code structure search (uses embed_code)
create or replace function public.match_dsp_docs_code(
  query_embedding double precision[],
  match_count integer default 8,
  min_similarity double precision default 0.5,
  filter_language text default null
)
returns table (
  id uuid,
  title text,
  type text,
  language text,
  tool text,
  content text,
  perceptual_tags text[],
  technical_tags text[],
  ugens text[],
  params jsonb,
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
    d.language,
    d.tool,
    d.content,
    d.perceptual_tags,
    d.technical_tags,
    d.ugens,
    d.params,
    1 - (d.embed_code <=> q.v) as similarity
  from public.dsp_docs d, q, _probe
  where d.embed_code is not null
    and 1 - (d.embed_code <=> q.v) >= min_similarity
    and (filter_language is null or d.language = filter_language)
  order by d.embed_code <=> q.v
  limit match_count;
$$ language sql stable;

-- Hybrid search (weighted combination of semantic + code)
create or replace function public.match_dsp_docs_hybrid(
  query_embedding_semantic double precision[],
  query_embedding_code double precision[],
  match_count integer default 12,
  semantic_weight double precision default 0.6,
  code_weight double precision default 0.4,
  min_similarity double precision default 0.5,
  filter_language text default null
)
returns table (
  id uuid,
  title text,
  type text,
  language text,
  tool text,
  content text,
  perceptual_tags text[],
  technical_tags text[],
  ugens text[],
  params jsonb,
  similarity double precision
) as $$
  with
  q_sem as (
    select (query_embedding_semantic)::vector(384) as v
  ),
  q_code as (
    select (query_embedding_code)::vector(384) as v
  ),
  _probe as (
    select set_config('ivfflat.probes', '100', true)
  )
  select 
    d.id,
    d.title,
    d.type,
    d.language,
    d.tool,
    d.content,
    d.perceptual_tags,
    d.technical_tags,
    d.ugens,
    d.params,
    (semantic_weight * (1 - (d.embed_semantic <=> q_sem.v)) + 
     code_weight * coalesce(1 - (d.embed_code <=> q_code.v), 0)) as similarity
  from public.dsp_docs d, q_sem, q_code, _probe
  where d.embed_semantic is not null
    and (semantic_weight * (1 - (d.embed_semantic <=> q_sem.v)) + 
         code_weight * coalesce(1 - (d.embed_code <=> q_code.v), 0)) >= min_similarity
    and (filter_language is null or d.language = filter_language)
  order by similarity desc
  limit match_count;
$$ language sql stable;

-- RLS policies
alter table public.dsp_docs enable row level security;

-- Allow public read access (for RAG search)
create policy "anon can read dsp_docs" on public.dsp_docs for select using (true);

-- Note: Insert/update/delete should be restricted to authenticated users or service role
-- Add your authenticated policy here:
-- create policy "authenticated can insert dsp_docs" on public.dsp_docs for insert with check (auth.role() = 'authenticated');


