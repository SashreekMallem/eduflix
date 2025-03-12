-- Step 1: Convert text[] to text
ALTER TABLE user_profiles
    ALTER COLUMN extracted_skills TYPE text USING array_to_string(extracted_skills, ','),
    ALTER COLUMN knowledge_gaps TYPE text USING array_to_string(knowledge_gaps, ',');

-- Step 2: Convert text to jsonb
ALTER TABLE user_profiles
    ALTER COLUMN extracted_skills TYPE jsonb USING to_jsonb(extracted_skills::text),
    ALTER COLUMN knowledge_gaps TYPE jsonb USING to_jsonb(knowledge_gaps::text);

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS university TEXT,
    ADD COLUMN IF NOT EXISTS degree TEXT,
    ADD COLUMN IF NOT EXISTS field_of_study TEXT,
    ADD COLUMN IF NOT EXISTS relevant_courses JSONB,
    ADD COLUMN IF NOT EXISTS added_degrees JSONB,
    ADD COLUMN IF NOT EXISTS certifications JSONB,
    ADD COLUMN IF NOT EXISTS online_courses JSONB,
    ADD COLUMN IF NOT EXISTS work_experience JSONB,
    ADD COLUMN IF NOT EXISTS preferred_learning_pace TEXT,
    ADD COLUMN IF NOT EXISTS learning_commitment TEXT,
    ADD COLUMN IF NOT EXISTS preferred_learning_methods JSONB,
    ADD COLUMN IF NOT EXISTS learning_goals JSONB,
    ADD COLUMN IF NOT EXISTS project_file TEXT,
    ADD COLUMN IF NOT EXISTS project_description TEXT,
    ADD COLUMN IF NOT EXISTS publications JSONB,
    ADD COLUMN IF NOT EXISTS career_goals JSONB,
    ADD COLUMN IF NOT EXISTS skills JSONB;
