# Migration Guide: Base44 to Custom Backend

## Current Status ✅

### Completed by Team:
1. **Backend Infrastructure**
   - ✅ Fastify server with CORS
   - ✅ OpenAI integration 
   - ✅ Supabase client setup
   - ✅ Basic API endpoints (invokeLLM, references/filter, references/update)

2. **Frontend Adapter**
   - ✅ `apiClient.js` with core methods
   - ✅ AI components updated to use apiClient

3. **Database Schema**
   - ✅ Complete Supabase schema (schema.sql)
   - ✅ Row-level security policies

## Setup Instructions 🚀

### 1. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to Settings → API
3. Copy your project URL and keys:
   - `Project URL` → SUPABASE_URL
   - `anon public` key → SUPABASE_KEY
   - `service_role` key → SUPABASE_SERVICE_KEY (for backend only)

4. Run the database schema:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `backend/database/schema.sql`
   - Run the SQL

### 2. Configure Environment Variables

Create `backend/.env`:
```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# LLM Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key  # Optional
GOOGLE_AI_API_KEY=your_google_key     # Optional

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 3. Update Frontend Components

Replace all `Reference.filter` and `Reference.update` calls with `apiClient`:

```javascript
// Old (Base44)
import { Reference } from '@/api/entities';
const refs = await Reference.filter({ status: 'pending' });
await Reference.update(id, { status: 'included' });

// New (Custom Backend)
import { apiClient } from '@/api/apiClient';
const refs = await apiClient.filterReferences({ status: 'pending' });
await apiClient.updateReference(id, { status: 'included' });
```

Files to update:
- `src/pages/Screening.jsx` (lines 49, 92)
- `src/pages/DualReview.jsx` (lines 173, 199, 271, 303, 328, 366, 380)
- `src/components/ai/ProcessingQueue.jsx` (line 117)
- `src/components/ai/DualAIScreener.jsx` (lines 101, 125, 145)

### 4. Run the Application

Terminal 1 - Backend:
```bash
cd backend
npm install
npm run dev
```

Terminal 2 - Frontend:
```bash
npm install
npm run dev
```

## Remaining Tasks 📝

### High Priority:
1. **Update all components** to use apiClient instead of Base44 entities
2. **Add authentication** - Implement Supabase Auth
3. **Test the integration** - Verify all features work

### Medium Priority:
4. **Add missing endpoints**:
   - Create/Delete references
   - Review projects management
   - File upload handling
5. **Error handling** - Add retry logic and better error messages
6. **User session management** - Store auth tokens

### Low Priority:
7. **Data migration** - Export from Base44, import to Supabase
8. **Performance optimization** - Add caching, pagination
9. **Monitoring** - Add logging and analytics

## Testing Checklist ✓

- [ ] Backend server starts without errors
- [ ] Frontend connects to backend (check network tab)
- [ ] AI screening works (test with a reference)
- [ ] References can be filtered
- [ ] References can be updated
- [ ] CORS allows frontend requests
- [ ] Supabase connection works

## Troubleshooting 🔧

### "Failed to invoke LLM"
- Check OPENAI_API_KEY in backend/.env
- Verify backend is running on port 3001

### "Failed to filter references"
- Check Supabase credentials
- Verify database schema was created
- Check network tab for specific errors

### CORS errors
- Ensure FRONTEND_URL in .env matches your frontend URL
- Backend must be running before frontend

## Quick Test

After setup, test the connection:
```javascript
// In browser console at http://localhost:5173
const response = await fetch('http://localhost:3001/');
console.log(await response.json()); // Should show {hello: 'world'}
```

## Support

For issues or questions about the migration, check:
- Base44 to Supabase differences
- Supabase documentation
- OpenAI API documentation