# Supabase Setup Guide for EduFlix AI

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new account or sign in
2. Create a new project
3. Wait for the project to be set up

## 2. Get Your Credentials

1. Go to your project settings
2. Navigate to the "API" section
3. Copy the following:
   - Project URL
   - `anon/public` key
   - `service_role` key (for server-side operations)

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Create Database Tables

Run the following SQL in your Supabase SQL editor:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  career_goals TEXT[],
  learning_goals TEXT[],
  knowledge_gaps TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create analysis_results table
CREATE TABLE analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  extracted_skills JSONB,
  final_score NUMERIC,
  impact_statements TEXT[],
  scoring_inputs JSONB,
  industry_validation JSONB,
  debug_messages TEXT[],
  learning_pathway JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create learning_pathways table for storing AI-generated learning plans
CREATE TABLE learning_pathways (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    career_goal TEXT,
    estimated_completion_time TEXT,
    modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    skill_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_pathways ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own analysis results" ON analysis_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis results" ON analysis_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis results" ON analysis_results
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their own learning pathways
CREATE POLICY "Users can view own learning pathways" ON learning_pathways
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own learning pathways
CREATE POLICY "Users can insert own learning pathways" ON learning_pathways
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own learning pathways
CREATE POLICY "Users can update own learning pathways" ON learning_pathways
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own learning pathways
CREATE POLICY "Users can delete own learning pathways" ON learning_pathways
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX learning_pathways_user_id_idx ON learning_pathways(user_id);
CREATE INDEX learning_pathways_created_at_idx ON learning_pathways(created_at);
```

## 5. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your site URL: `http://localhost:3000` (for development)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`

## 6. Set Up OAuth Providers (Optional)

### Google OAuth:
1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials

### GitHub OAuth:
1. Go to Authentication > Providers
2. Enable GitHub provider
3. Add your GitHub OAuth credentials

## 7. Email Templates

Customize your email templates in Authentication > Email Templates:

- Confirm signup
- Reset password
- Email change confirmation

## 8. Database Functions (Optional)

Create a function to automatically create a user profile when a user signs up:

```sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 9. Test Your Setup

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/auth`
3. Try signing up with email/password
4. Check if the user appears in your Supabase auth dashboard
5. Verify the user profile was created in the `user_profiles` table

## Security Notes

- Never expose your `service_role` key in client-side code
- Always use Row Level Security (RLS) policies
- Validate data on both client and server side
- Use environment variables for all sensitive data

## Production Deployment

When deploying to production:

1. Update your site URL in Supabase settings
2. Add your production domain to redirect URLs
3. Update environment variables with production values
4. Enable email confirmation for signups
5. Configure proper CORS settings
