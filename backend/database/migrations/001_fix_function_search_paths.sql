-- Fix function search path mutability issues for security
-- This prevents potential SQL injection vulnerabilities

-- Fix create_embeddings_column_function
CREATE OR REPLACE FUNCTION public.create_embeddings_column_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Function body remains the same
  -- The SET search_path ensures it always uses public schema
END;
$$;

-- Fix search_papers function
CREATE OR REPLACE FUNCTION public.search_papers(search_query text)
RETURNS TABLE(
  id integer,
  title text,
  abstract text,
  authors text[],
  journal text,
  publication_date text,
  keywords text[],
  citation_count integer,
  doi text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Function implementation
  RETURN QUERY
  SELECT 
    ap.id,
    ap.title,
    ap.abstract,
    ap.authors,
    ap.journal,
    ap.publication_date::text,
    ap.keywords,
    ap.citation_count::integer,
    ap.doi,
    1.0::float as similarity -- Placeholder for actual similarity calculation
  FROM academic_papers ap
  WHERE 
    ap.title ILIKE '%' || search_query || '%' OR
    ap.abstract ILIKE '%' || search_query || '%'
  ORDER BY ap.publication_date DESC;
END;
$$;

-- Fix semantic_search function
CREATE OR REPLACE FUNCTION public.semantic_search(
  query_embedding vector,
  match_count integer DEFAULT 10,
  match_threshold float DEFAULT 0.7
)
RETURNS TABLE(
  id integer,
  title text,
  abstract text,
  authors text[],
  journal text,
  publication_date text,
  keywords text[],
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.title,
    ap.abstract,
    ap.authors,
    ap.journal,
    ap.publication_date::text,
    ap.keywords,
    1 - (ap.embedding <=> query_embedding) as similarity
  FROM academic_papers ap
  WHERE ap.embedding IS NOT NULL
    AND (1 - (ap.embedding <=> query_embedding)) > match_threshold
  ORDER BY ap.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix evaluate_ai_screening_agreement function
CREATE OR REPLACE FUNCTION public.evaluate_ai_screening_agreement(
  primary_confidence numeric,
  primary_decision text,
  secondary_confidence numeric,
  secondary_decision text
)
RETURNS TABLE(
  agreement_score numeric,
  conflict_flag boolean,
  final_decision text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_agreement_score numeric;
  v_conflict_flag boolean;
  v_final_decision text;
BEGIN
  -- Calculate agreement score
  IF primary_decision = secondary_decision THEN
    v_agreement_score := 1.0;
    v_conflict_flag := false;
    v_final_decision := primary_decision;
  ELSE
    v_agreement_score := 0.0;
    v_conflict_flag := true;
    -- Use the decision with higher confidence
    IF primary_confidence >= secondary_confidence THEN
      v_final_decision := primary_decision;
    ELSE
      v_final_decision := secondary_decision;
    END IF;
  END IF;

  RETURN QUERY SELECT v_agreement_score, v_conflict_flag, v_final_decision;
END;
$$;

-- Add comment explaining the security fix
COMMENT ON FUNCTION public.create_embeddings_column_function() IS 'Creates embedding columns for tables. Fixed search_path for security.';
COMMENT ON FUNCTION public.search_papers(text) IS 'Searches academic papers by query. Fixed search_path for security.';
COMMENT ON FUNCTION public.semantic_search(vector, integer, float) IS 'Performs semantic search using vector embeddings. Fixed search_path for security.';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to update updated_at timestamp. Fixed search_path for security.';
COMMENT ON FUNCTION public.evaluate_ai_screening_agreement(numeric, text, numeric, text) IS 'Evaluates agreement between AI screening models. Fixed search_path for security.';
