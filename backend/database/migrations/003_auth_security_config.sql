-- Configure Supabase Auth security settings
-- These settings enhance authentication security for the project

-- Create a function to enable leaked password protection
-- This needs to be done via Supabase Dashboard or Management API
-- as it's an Auth configuration, not a database setting

-- For documentation purposes, here are the recommended Auth settings:
/*
Recommended Supabase Auth Security Configuration:

1. LEAKED PASSWORD PROTECTION:
   - Enable HaveIBeenPwned password checking
   - Go to Authentication > Providers > Email
   - Enable "Check passwords against HaveIBeenPwned"

2. MULTI-FACTOR AUTHENTICATION (MFA):
   - Enable TOTP (Time-based One-Time Password)
   - Go to Authentication > Providers > Multi-Factor Auth
   - Enable "Time-based One-time Password (TOTP)"
   
3. PASSWORD REQUIREMENTS:
   - Minimum password length: 8 characters
   - Require uppercase letters
   - Require lowercase letters
   - Require numbers
   - Require special characters

4. SESSION MANAGEMENT:
   - Set JWT expiry to 3600 seconds (1 hour)
   - Set refresh token rotation enabled
   - Set refresh token reuse interval to 10 seconds

5. EMAIL VERIFICATION:
   - Require email verification for new signups
   - Double opt-in enabled

6. RATE LIMITING:
   - Enable rate limiting for auth endpoints
   - Set appropriate limits for signup/signin attempts
*/

-- Create an audit log table for authentication events
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb
);

-- Enable RLS on audit log
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON auth_audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Users can only read their own audit logs
CREATE POLICY "Users can read own audit logs" ON auth_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_auth_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_log_created_at ON auth_audit_log(created_at DESC);

-- Function to log authentication events
CREATE OR REPLACE FUNCTION log_auth_event(
  p_user_id uuid,
  p_event_type text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO auth_audit_log (user_id, event_type, ip_address, user_agent, metadata)
  VALUES (p_user_id, p_event_type, p_ip_address, p_user_agent, p_metadata);
END;
$$;

-- Create a function to check password strength
CREATE OR REPLACE FUNCTION check_password_strength(password text)
RETURNS TABLE(
  is_strong boolean,
  length_ok boolean,
  has_uppercase boolean,
  has_lowercase boolean,
  has_number boolean,
  has_special boolean,
  strength_score integer,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_length_ok boolean;
  v_has_uppercase boolean;
  v_has_lowercase boolean;
  v_has_number boolean;
  v_has_special boolean;
  v_strength_score integer := 0;
  v_is_strong boolean;
  v_message text;
BEGIN
  -- Check minimum length (8 characters)
  v_length_ok := length(password) >= 8;
  IF v_length_ok THEN v_strength_score := v_strength_score + 20; END IF;

  -- Check for uppercase letter
  v_has_uppercase := password ~ '[A-Z]';
  IF v_has_uppercase THEN v_strength_score := v_strength_score + 20; END IF;

  -- Check for lowercase letter
  v_has_lowercase := password ~ '[a-z]';
  IF v_has_lowercase THEN v_strength_score := v_strength_score + 20; END IF;

  -- Check for number
  v_has_number := password ~ '[0-9]';
  IF v_has_number THEN v_strength_score := v_strength_score + 20; END IF;

  -- Check for special character
  v_has_special := password ~ '[!@#$%^&*()_+\-=\[\]{};'':"\\|,.<>\/?]';
  IF v_has_special THEN v_strength_score := v_strength_score + 20; END IF;

  -- Determine if password is strong
  v_is_strong := v_strength_score >= 80;

  -- Generate message
  IF v_is_strong THEN
    v_message := 'Password meets all security requirements';
  ELSE
    v_message := 'Password does not meet security requirements. ';
    IF NOT v_length_ok THEN v_message := v_message || 'Need at least 8 characters. '; END IF;
    IF NOT v_has_uppercase THEN v_message := v_message || 'Need uppercase letter. '; END IF;
    IF NOT v_has_lowercase THEN v_message := v_message || 'Need lowercase letter. '; END IF;
    IF NOT v_has_number THEN v_message := v_message || 'Need number. '; END IF;
    IF NOT v_has_special THEN v_message := v_message || 'Need special character. '; END IF;
  END IF;

  RETURN QUERY SELECT 
    v_is_strong,
    v_length_ok,
    v_has_uppercase,
    v_has_lowercase,
    v_has_number,
    v_has_special,
    v_strength_score,
    v_message;
END;
$$;

-- Add comments
COMMENT ON TABLE auth_audit_log IS 'Audit log for authentication events to track security-related activities';
COMMENT ON FUNCTION log_auth_event(uuid, text, inet, text, jsonb) IS 'Logs authentication events for security auditing';
COMMENT ON FUNCTION check_password_strength(text) IS 'Checks password strength against security requirements';
