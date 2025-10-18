-- Enable pgvector for embeddings (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table used by LangChain SupabaseVectorStore
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(1536) -- text-embedding-3-small
);

-- Indexes for fast vector search
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN (metadata);
-- IVFFlat index (requires `SET ivfflat.probes = <n>` per session as needed)
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_l2_ops);

-- RPC similar to Supabase docs; supports metadata filter
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents AS d
  WHERE (filter = '{}'::jsonb OR d.metadata @> filter)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


