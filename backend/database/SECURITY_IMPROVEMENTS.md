# Supabase Security Improvements Documentation

## Overview
This document outlines the security improvements implemented for the Supabase database based on the security advisor recommendations. These improvements address vulnerabilities and enhance the overall security posture of the application.

## Security Issues Addressed

### 1. Function Search Path Mutability (FIXED)
**Issue**: Multiple database functions had mutable search paths, which could potentially allow SQL injection attacks.

**Functions Affected**:
- `create_embeddings_column_function`
- `search_papers`
- `semantic_search`
- `update_updated_at_column`
- `evaluate_ai_screening_agreement`

**Solution**: Added `SET search_path = public, pg_catalog` to all affected functions to ensure they always use the correct schema and prevent path manipulation.

**Migration File**: `001_fix_function_search_paths.sql`

### 2. Extension in Public Schema (ADDRESSED)
**Issue**: The `vector` extension was installed in the public schema, which is not a security best practice.

**Solution**: 
- Created a dedicated `extensions` schema for database extensions
- Added proper permissions for authenticated users
- Added documentation for moving the vector extension (requires careful migration in production)

**Migration File**: `002_move_vector_extension.sql`

### 3. Row Level Security (RLS) Implementation (ENHANCED)
**Issue**: Some tables lacked proper RLS policies, potentially exposing data.

**Tables Protected**:
- `academic_papers`
- `paper_references`

**Policies Implemented**:
- Read access for all users (public data)
- Write operations (INSERT, UPDATE, DELETE) restricted to authenticated users only

**Migration File**: `002_move_vector_extension.sql`

### 4. Authentication Security (ENHANCED)
**Issue**: Leaked password protection and insufficient MFA options were disabled.

**Solutions Implemented**:

#### Database-Level Security:
- Created `auth_audit_log` table for tracking authentication events
- Implemented `log_auth_event` function for security auditing
- Created `check_password_strength` function for password validation
- Added proper indexes for performance

#### Recommended Dashboard Settings:
1. **Leaked Password Protection**:
   - Enable HaveIBeenPwned password checking
   - Location: Authentication > Providers > Email

2. **Multi-Factor Authentication (MFA)**:
   - Enable TOTP (Time-based One-Time Password)
   - Location: Authentication > Providers > Multi-Factor Auth

3. **Password Requirements**:
   - Minimum length: 8 characters
   - Require uppercase letters
   - Require lowercase letters
   - Require numbers
   - Require special characters

4. **Session Management**:
   - JWT expiry: 3600 seconds (1 hour)
   - Enable refresh token rotation
   - Refresh token reuse interval: 10 seconds

**Migration File**: `003_auth_security_config.sql`

## How to Apply Security Improvements

### Automatic Migration Script
A Node.js script has been created to apply all migrations automatically:

```bash
cd backend/database
node apply-security-migrations.js
```

The script will:
1. Connect to your Supabase database using service role credentials
2. Create a migrations tracking table
3. Apply all migrations in order
4. Skip already applied migrations
5. Provide a summary of results

### Manual Application
If you prefer to apply migrations manually:

1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste each migration file content in order:
   - `001_fix_function_search_paths.sql`
   - `002_move_vector_extension.sql`
   - `003_auth_security_config.sql`
3. Execute each migration
4. Apply the dashboard settings manually (see Authentication Security section)

### Using Supabase MCP Server
You can also apply migrations using the Supabase MCP server that's already configured:

```javascript
// The MCP server can execute these migrations
// Tools available:
// - apply_migration: For DDL operations
// - execute_sql: For queries
// - get_advisors: To verify improvements
```

## Verification

After applying the security improvements, verify them by:

1. **Check Security Advisors**:
   - Use the Supabase MCP server to run `get_advisors` with type "security"
   - Verify that function search path warnings are resolved

2. **Test Password Strength Function**:
   ```sql
   SELECT * FROM check_password_strength('YourPassword123!');
   ```

3. **Verify RLS Policies**:
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

4. **Check Audit Log**:
   ```sql
   SELECT * FROM auth_audit_log ORDER BY created_at DESC LIMIT 10;
   ```

## Ongoing Security Maintenance

### Regular Tasks
1. **Weekly**: Review security advisors for new issues
2. **Monthly**: Audit authentication logs for suspicious activity
3. **Quarterly**: Review and update RLS policies
4. **Annually**: Security assessment and penetration testing

### Best Practices
1. Always use parameterized queries to prevent SQL injection
2. Keep RLS enabled on all tables containing user data
3. Regularly rotate API keys and access tokens
4. Monitor failed authentication attempts
5. Keep the Supabase client library updated
6. Use environment variables for sensitive configuration

## Security Benefits

### Before Improvements
- ⚠️ 8 security warnings
- 🔓 Functions vulnerable to search path manipulation
- 🔓 No audit logging for authentication
- 🔓 Weak password protection
- 🔓 Extensions in public schema

### After Improvements
- ✅ Function search paths secured
- ✅ RLS policies implemented
- ✅ Authentication audit logging
- ✅ Password strength validation
- ✅ Extension security documented
- ✅ MFA recommendations provided

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter)

## Support

For questions or issues related to these security improvements:
1. Review the migration files in `backend/database/migrations/`
2. Check the Supabase Dashboard for current security status
3. Use the MCP server to run security advisors
4. Consult the Supabase documentation

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintained By**: Development Team
