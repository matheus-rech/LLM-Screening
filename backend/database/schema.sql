-- Supabase Database Schema for Review AI Application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review Projects table
CREATE TABLE IF NOT EXISTS public.review_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- References table
CREATE TABLE IF NOT EXISTS public.references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.review_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Bibliographic data
    title TEXT,
    abstract TEXT,
    authors TEXT,
    year INTEGER,
    journal TEXT,
    doi TEXT,
    pmid TEXT,
    url TEXT,
    
    -- Screening data
    screening_status TEXT DEFAULT 'pending' CHECK (screening_status IN ('pending', 'include', 'exclude', 'maybe', 'conflict')),
    ai_recommendation TEXT,
    ai_confidence NUMERIC(3,2),
    ai_reasoning TEXT,
    ai_analysis JSONB,
    
    -- Dual review data
    ai_reviewer_1 TEXT,
    ai_reviewer_1_confidence NUMERIC(3,2),
    ai_reviewer_1_reasoning TEXT,
    ai_reviewer_2 TEXT,
    ai_reviewer_2_confidence NUMERIC(3,2),
    ai_reviewer_2_reasoning TEXT,
    dual_ai_completed BOOLEAN DEFAULT FALSE,
    dual_ai_agreement BOOLEAN,
    
    -- User review data
    user_decision TEXT,
    user_notes TEXT,
    
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screening criteria table
CREATE TABLE IF NOT EXISTS public.screening_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.review_projects(id) ON DELETE CASCADE,
    population TEXT,
    intervention TEXT,
    comparator TEXT,
    outcome TEXT,
    study_designs TEXT[],
    inclusion_criteria JSONB DEFAULT '[]',
    exclusion_criteria JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_references_project_id ON public.references(project_id);
CREATE INDEX idx_references_user_id ON public.references(user_id);
CREATE INDEX idx_references_status ON public.references(status);
CREATE INDEX idx_references_doi ON public.references(doi);
CREATE INDEX idx_references_pmid ON public.references(pmid);
CREATE INDEX idx_review_projects_user_id ON public.review_projects(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_criteria ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Review projects policies
CREATE POLICY "Users can view own projects" ON public.review_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects" ON public.review_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.review_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.review_projects
    FOR DELETE USING (auth.uid() = user_id);

-- References policies
CREATE POLICY "Users can view own references" ON public.references
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create references" ON public.references
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own references" ON public.references
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own references" ON public.references
    FOR DELETE USING (auth.uid() = user_id);

-- Screening criteria policies
CREATE POLICY "Users can view criteria for own projects" ON public.screening_criteria
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.review_projects
            WHERE review_projects.id = screening_criteria.project_id
            AND review_projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage criteria for own projects" ON public.screening_criteria
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.review_projects
            WHERE review_projects.id = screening_criteria.project_id
            AND review_projects.user_id = auth.uid()
        )
    );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_projects_updated_at BEFORE UPDATE ON public.review_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_references_updated_at BEFORE UPDATE ON public.references
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screening_criteria_updated_at BEFORE UPDATE ON public.screening_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();