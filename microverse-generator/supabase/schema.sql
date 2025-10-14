-- Enable pgvector
create extension if not exists vector;

-- Documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  work text not null,
  author text not null,
  year int,
  era text,
  topic text[] default '{}',
  content text not null,
  embedding vector(384) not null
);

-- Vector index (cosine)
create index if not exists documents_embedding_ivfflat on public.documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Ensure only one unambiguous RPC signature exists.
-- Drop the old vector-typed version if it exists to avoid overload ambiguity in PostgREST.
drop function if exists public.match_documents(vector(384), integer, double precision);

-- RPC for nearest neighbors (accepts array and casts to vector)
create or replace function public.match_documents(
  query_embedding double precision[],
  match_count integer,
  min_similarity double precision
)
returns table (
  id uuid,
  work text,
  author text,
  content text,
  similarity double precision
) as $$
  with
  -- Cast the incoming array to vector once
  q as (
    select (query_embedding)::vector(384) as v
  ),
  -- Increase probes so the IVFFlat index checks more lists (important for tiny datasets)
  _probe as (
    select set_config('ivfflat.probes', '100', true)
  )
  select d.id, d.work, d.author, d.content,
         1 - (d.embedding <=> q.v) as similarity
  from public.documents d, q, _probe
  where 1 - (d.embedding <=> q.v) >= min_similarity
  order by d.embedding <=> q.v
  limit match_count;
$$ language sql stable;

-- Exact (sequential) search fallback for tiny datasets or testing
create or replace function public.match_documents_exact(
  query_embedding double precision[],
  match_count integer
)
returns table (
  id uuid,
  work text,
  author text,
  content text,
  similarity double precision
) language sql stable as $$
  with
  q as (
    select (query_embedding)::vector(384) as v
  ),
  _scan as (
    -- Force sequential scan to compute exact distances over all rows
    select set_config('enable_indexscan', 'off', true),
           set_config('enable_bitmapscan', 'off', true),
           set_config('enable_seqscan', 'on', true)
  )
  select d.id, d.work, d.author, d.content,
         1 - (d.embedding <=> q.v) as similarity
  from public.documents d, q, _scan
  order by d.embedding <=> q.v
  limit match_count;
$$;

-- RLS (enable and add read-only policy for anon). Adjust to your needs.
alter table public.documents enable row level security;
-- example policy (allow public read):
-- create policy "anon can read documents" on public.documents for select using (true);
-- Do NOT allow insert/update/delete to anon.
