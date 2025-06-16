-- 1. User Profiles Table (Main profile data)
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  date_of_birth DATE,
  current_status TEXT NOT NULL,
  linkedin_profile TEXT,
  github_profile TEXT,
  skills TEXT[] DEFAULT '{}',
  career_goals TEXT[] DEFAULT '{}',
  learning_goals TEXT[] DEFAULT '{}',
  learning_pace TEXT,
  learning_commitment TEXT,
  learning_methods TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Education Table
CREATE TABLE user_education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  university TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  graduation_year TEXT,
  grade TEXT,
  relevant_courses TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Work Experience Table
CREATE TABLE user_work_experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Projects Table
CREATE TABLE user_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[] DEFAULT '{}',
  link TEXT,
  github_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Certifications Table
CREATE TABLE user_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  date_obtained DATE,
  verification_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User Online Courses Table
CREATE TABLE user_online_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  status TEXT NOT NULL,
  verification_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. User Skill Proficiencies Table
CREATE TABLE user_skill_proficiencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- 8. User Documents Storage (for file references)
CREATE TABLE user_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'resume', 'transcript', 'certificate'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_online_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_proficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Users can only access their own data)
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own education" ON user_education FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own education" ON user_education FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own education" ON user_education FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own education" ON user_education FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own work experience" ON user_work_experience FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work experience" ON user_work_experience FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work experience" ON user_work_experience FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own work experience" ON user_work_experience FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own projects" ON user_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON user_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON user_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON user_projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own certifications" ON user_certifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own certifications" ON user_certifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own certifications" ON user_certifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own certifications" ON user_certifications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own courses" ON user_online_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON user_online_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own courses" ON user_online_courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own courses" ON user_online_courses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own skill proficiencies" ON user_skill_proficiencies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill proficiencies" ON user_skill_proficiencies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skill proficiencies" ON user_skill_proficiencies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skill proficiencies" ON user_skill_proficiencies FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own documents" ON user_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON user_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON user_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON user_documents FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_education_user_id ON user_education(user_id);
CREATE INDEX idx_user_work_experience_user_id ON user_work_experience(user_id);
CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_certifications_user_id ON user_certifications(user_id);
CREATE INDEX idx_user_online_courses_user_id ON user_online_courses(user_id);
CREATE INDEX idx_user_skill_proficiencies_user_id ON user_skill_proficiencies(user_id);
CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);

-- Create Storage bucket for user documents
INSERT INTO storage.buckets (id, name, public) VALUES ('user-documents', 'user-documents', false);

-- Storage policy for user documents
CREATE POLICY "Users can upload own documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'user-documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'user-documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own documents" ON storage.objects FOR UPDATE USING (
  bucket_id = 'user-documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE USING (
  bucket_id = 'user-documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);