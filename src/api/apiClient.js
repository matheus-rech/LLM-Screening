import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const apiClient = {
  // LLM operations - Direct API calls
  async invokeLLM(prompt, responseSchema = null, provider = 'google', model = null) {
    try {
      if (provider === 'google') {
        // Direct Gemini API call
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${prompt}\n\nRespond with valid JSON only.`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const jsonResponse = data.candidates[0].content.parts[0].text;
        
        // Try to parse JSON response
        try {
          return JSON.parse(jsonResponse);
        } catch (e) {
          // Fallback: extract JSON from text
          const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          throw new Error('Invalid JSON response from Gemini');
        }
      } else if (provider === 'openai') {
        // Direct OpenAI API call
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: model || 'gpt-4',
            messages: [{
              role: 'user',
              content: `${prompt}\n\nRespond with valid JSON only.`
            }],
            temperature: 0.1,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const jsonResponse = data.choices[0].message.content;
        
        try {
          return JSON.parse(jsonResponse);
        } catch (e) {
          const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          throw new Error('Invalid JSON response from OpenAI');
        }
      }
    } catch (error) {
      console.error('LLM API error:', error);
      return {
        recommendation: 'uncertain',
        confidence: 0,
        reasoning: `LLM API error: ${error.message}`,
      };
    }
  },

  // Reference operations
  async listReferences() {
    const { data, error } = await supabase
      .from('references')
      .select('*')
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async filterReferences(filters, sortBy = 'created_date', limit = 100) {
    let query = supabase
      .from('references')
      .select('*');
    
    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value.in) {
          // Handle 'in' operator for array filters
          query = query.in(key, value.in);
        } else if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }
    
    // Apply sorting
    if (sortBy) {
      const [column, order] = sortBy.startsWith('-') 
        ? [sortBy.slice(1), 'desc'] 
        : [sortBy, 'asc'];
      query = query.order(column, { ascending: order === 'asc' });
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  async updateReference(id, updates) {
    const { data, error } = await supabase
      .from('references')
      .update(updates)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createReference(referenceData) {
    const { data, error } = await supabase
      .from('references')
      .insert(referenceData)
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteReference(id) {
    const { error } = await supabase
      .from('references')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },

  // Project operations
  async listProjects(sortBy = '-created_date', limit = 10) {
    let query = supabase
      .from('review_projects')
      .select('*');
    
    // Apply sorting
    if (sortBy) {
      const [column, order] = sortBy.startsWith('-') 
        ? [sortBy.slice(1), 'desc'] 
        : [sortBy, 'asc'];
      query = query.order(column, { ascending: order === 'asc' });
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  async getProject(id) {
    const { data, error } = await supabase
      .from('review_projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createProject(projectData) {
    const { data, error } = await supabase
      .from('review_projects')
      .insert(projectData)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProject(id, updates) {
    const { data, error } = await supabase
      .from('review_projects')
      .update(updates)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProject(id) {
    const { error } = await supabase
      .from('review_projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },

  // Analytics and reporting
  async getScreeningStats(projectId = null) {
    let query = supabase
      .from('references')
      .select('screening_status, dual_ai_completed, ai_reviewer_1, ai_reviewer_2');
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      screened: data.filter(r => r.screening_status !== 'pending').length,
      included: data.filter(r => r.screening_status === 'include').length,
      excluded: data.filter(r => r.screening_status === 'exclude').length,
      maybe: data.filter(r => r.screening_status === 'maybe').length,
      conflicts: data.filter(r => r.screening_status === 'conflict').length,
      dual_ai_completed: data.filter(r => r.dual_ai_completed).length,
      agreements: data.filter(r => 
        r.dual_ai_completed && 
        r.ai_reviewer_1 === r.ai_reviewer_2
      ).length
    };
    
    return stats;
  },

  async getConflictAnalysis(projectId = null) {
    let query = supabase
      .from('references')
      .select('ai_reviewer_1, ai_reviewer_2, screening_status')
      .eq('dual_ai_completed', true)
      .eq('screening_status', 'conflict');
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return {
      total: data.length,
      includeVsExclude: data.filter(r =>
        (r.ai_reviewer_1 === 'include' && r.ai_reviewer_2 === 'exclude') ||
        (r.ai_reviewer_1 === 'exclude' && r.ai_reviewer_2 === 'include')
      ).length,
      includeVsUncertain: data.filter(r =>
        (r.ai_reviewer_1 === 'include' && r.ai_reviewer_2 === 'uncertain') ||
        (r.ai_reviewer_1 === 'uncertain' && r.ai_reviewer_2 === 'include')
      ).length,
      excludeVsUncertain: data.filter(r =>
        (r.ai_reviewer_1 === 'exclude' && r.ai_reviewer_2 === 'uncertain') ||
        (r.ai_reviewer_1 === 'uncertain' && r.ai_reviewer_2 === 'exclude')
      ).length
    };
  },

  // Batch operations
  async batchUpdateReferences(updates) {
    const { data, error } = await supabase
      .from('references')
      .upsert(updates);
    
    if (error) throw error;
    return data;
  },

  async batchCreateReferences(references) {
    const { data, error } = await supabase
      .from('references')
      .insert(references);
    
    if (error) throw error;
    return data;
  },

  // Search and filtering utilities
  async searchReferences(searchTerm, projectId = null) {
    let query = supabase
      .from('references')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,abstract.ilike.%${searchTerm}%,authors.ilike.%${searchTerm}%`);
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // Export functionality
  async exportReferences(projectId = null, format = 'json') {
    let query = supabase
      .from('references')
      .select('*');
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      return [headers, ...rows].join('\n');
    }
    
    return data;
  }
};
