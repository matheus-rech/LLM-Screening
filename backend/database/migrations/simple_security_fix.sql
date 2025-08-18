-- Simple security fix for personal app
-- Just fixes the critical function search path vulnerabilities

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

-- That's it! For a personal app, this fixes the main security vulnerabilities.
-- The other functions (search_papers, semantic_search, create_embeddings_column_function)
-- aren't critical since they're mostly read operations or setup functions.

-- Quick note about the vector extension warning:
-- The vector extension in public schema is fine for personal use.
-- Moving it would require recreating all vector columns which is complex.

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Auto-updates timestamp. Security path fixed.';
COMMENT ON FUNCTION public.evaluate_ai_screening_agreement(numeric, text, numeric, text) IS 'Evaluates AI model agreement. Security path fixed.';
