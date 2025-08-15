import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const apiClient = {
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
