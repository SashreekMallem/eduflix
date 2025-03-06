import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import json

# Load DeepSeek R1 8B Model & Tokenizer
MODEL_NAME = "deepseek-ai/deepseek-coder-8b-instruct"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME, torch_dtype=torch.float16, device_map="auto"
)

# **Dynamic Prompts for DeepSeek R1 8B**
SKILL_EXTRACTION_PROMPT = """Extract all technical and non-technical skills from the following resume/job description:
{text}
Provide output in JSON:
{
  "skills": ["Skill1", "Skill2", ...],
  "experience_years": { "Skill1": years, "Skill2": years, ... }
}
"""

PROFICIENCY_PROMPT = """Estimate the proficiency level (Beginner, Intermediate, Advanced, Expert) for these skills:
{skills}
Provide output as JSON:
{
  "proficiency": { "Skill1": "Level", "Skill2": "Level", ... }
}
"""

GAP_ANALYSIS_PROMPT = """Compare the following:
Extracted Skills: {extracted_skills}
Required Skills: {required_skills}
Identify missing skills.
Provide output as JSON:
{
  "missing_skills": ["Skill1", "Skill2", ...]
}
"""

ASSESSMENT_PROMPT = """Generate 3 multiple-choice questions to test these skills:
{skills}
Format output in JSON:
{
  "questions": [
    {
      "question": "What is ...?",
      "options": ["A", "B", "C", "D"],
      "answer": "Correct Option"
    }
  ]
}
"""

MATCHING_PROMPT = """Match the following skill set:
Skills: {skills}
with the best job description from this list:
{job_descriptions}
Return the best-matched job description.
"""

def query_deepseek(prompt):
    """Generates a response from DeepSeek R1 8B."""
    inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
    output = model.generate(**inputs, max_new_tokens=300)
    response = tokenizer.decode(output[0], skip_special_tokens=True)
    return response.strip()

def extract_skills(text):
    """Extracts skills & experience years using DeepSeek."""
    prompt = SKILL_EXTRACTION_PROMPT.format(text=text)
    response = query_deepseek(prompt)
    return json.loads(response)

def analyze_proficiency(skills):
    """Analyzes skill proficiency levels using DeepSeek."""
    prompt = PROFICIENCY_PROMPT.format(skills=skills)
    response = query_deepseek(prompt)
    return json.loads(response)

def detect_skill_gaps(extracted_skills, required_skills):
    """Detects missing skills based on job requirements."""
    prompt = GAP_ANALYSIS_PROMPT.format(extracted_skills=extracted_skills, required_skills=required_skills)
    response = query_deepseek(prompt)
    return json.loads(response)

def generate_assessment(skills):
    """Generates skill-based test questions."""
    prompt = ASSESSMENT_PROMPT.format(skills=skills)
    response = query_deepseek(prompt)
    return json.loads(response)

def match_skills_to_jobs(skills, job_descriptions):
    """Matches skills to the best job description."""
    prompt = MATCHING_PROMPT.format(skills=skills, job_descriptions=job_descriptions)
    response = query_deepseek(prompt)
    return response.strip()

# === Sample Execution ===

resume_text = """
Experienced Supply Chain Manager with expertise in SAP ERP, Agile Project Management, and Six Sigma methodologies. 
Proficient in demand forecasting, order fulfillment, and process optimization.
"""

job_texts = [
    "Looking for a Product Manager skilled in Agile methodologies, market research, and feature prioritization.",
    "Hiring a Supply Chain Analyst with expertise in ERP implementation, Six Sigma, and demand forecasting."
]

# **Run the pipeline using DeepSeek R1 8B**
skills_data = extract_skills(resume_text)
print("Extracted Skills:", skills_data)

proficiency_data = analyze_proficiency(skills_data["skills"])
print("Proficiency Levels:", proficiency_data)

required_skills = ["Python", "SQL", "Machine Learning", "Git"]
gap_data = detect_skill_gaps(skills_data["skills"], required_skills)
print("Skill Gaps:", gap_data)

assessment = generate_assessment(skills_data["skills"])
print("Generated Test Questions:", assessment)

best_fit_job = match_skills_to_jobs(skills_data["skills"], job_texts)
print("Best Matched Job Description:", best_fit_job)
