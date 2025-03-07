from openai import OpenAI
import os
import json
import re
import numpy as np

client = OpenAI()

# ✅ Call GPT-4o using the new OpenAI SDK
def call_gpt4o(prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "You are an expert in skill extraction and proficiency assessment."},
                      {"role": "user", "content": prompt}],
            temperature=0
        )
        content = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ GPT-4o API call failed: {e}")
        return ""
    # Handle empty response and remove formatting
    if not content or content == "{}":
        print("❌ GPT-4o returned an empty or invalid response!")
        return "{}"
    return re.sub(r"```json\n|\n```", "", content).strip()


# Extract key skills from text
import json

def extract_skills(text, career_path, impact_statements):
    prompt = f"""
    You are an expert in skill extraction, proficiency assessment, and industry validation.
    Extract ALL key skills from the given text and categorize them properly.
    In addition to explicitly mentioned skills, analyze sentence relationships and context to infer any implicit skills.
    Consider the fact that the skills maybe be across differnt roles in experience, projects, and certifications.
    
    IMPORTANT: For each skill, also calculate a BASE proficiency score (0-100) based on:
      - Number of years of experience.
      - Complexity of work and projects performed using that skill.
      - Overall work and impact accomplished with that skill.
    Make sure the base score reflects a realistic proficiency level.
    
    ---
    
    ### **🔹 Extraction Rules:**
    - Capture **all** skills, including:
      - **Technical Skills** (e.g., Python, SQL, AI/ML)
      - **Soft Skills** (e.g., leadership, problem-solving, adaptability)
      - **Tools & Frameworks** (e.g., SAP ERP, TensorFlow, JIRA)
      - **Certifications** (e.g., AWS Certified, PMP, Six Sigma)
      - **Industry Knowledge** (e.g., Supply Chain Optimization, Financial Analysis)
    
    - **Determine the proficiency level** for each skill based on:
      - **Years of experience** in relevant roles/projects.
      - **Project involvement** and complexity.
      - **Impact statements** (e.g., "Improved efficiency by 20%") → Cross-check `{impact_statements}`
      - **Sum up experiences** if a skill appears in multiple roles/projects.
    

    ---
    
    ### **🔹 Additional Enhancements**
    - **Normalize Skills**: Remove duplicates (e.g., "Python" appearing under multiple roles, projects and implications in certifications).
    - **Implicit Extraction**: Identify skills that are contextually implied even if not explicitly stated.


    - **Certification Analysis**:
      - Extract **certifications** and assign:
        - **Credibility**: High, Medium, Low.
        - **Reputation Score (0-100%)**: Measures industry recognition.
        - **Certification Level**: Basic, Intermediate, Advanced.
      - Assign **proficiency score** based on reputation and credibility instead of using fixed values.
    
    ---
    
    ### **🔹 Example Input:**
    "I have experience in Python, SQL, machine learning, project management, and leadership.  
    I worked on fraud detection using ML and optimized supply chain processes in SAP ERP.  
    I also hold an AWS Cloud Practitioner Certification and a PMP certification."

    ---
    
    ### **🔹 Expected JSON Output:**
    {{
        "Technical Skills": [
            {{"name": "Python", "proficiency": 85}},
            {{"name": "SQL", "proficiency": 80}},
            {{"name": "Machine Learning", "proficiency": 90}}
        ],
        "Soft Skills": [
            {{"name": "Project Management", "proficiency": 75}},
            {{"name": "Leadership", "proficiency": 80}}
        ],
        "Tools & Frameworks": [
            {{"name": "SAP ERP", "proficiency": 88}},
            {{"name": "JIRA", "proficiency": 70}}
        ],
        "Certifications": [
            {{
                "name": "AWS Cloud Practitioner Certification",
                "credibility": "High",
                "reputation_score": 85,
                "certification_level": "Intermediate",
                "proficiency": 85
            }},
            {{
                "name": "PMP",
                "credibility": "High",
                "reputation_score": 92,
                "certification_level": "Advanced",
                "proficiency": 92
            }}
        ],
        "Industry Knowledge": [
            {{"name": "Supply Chain Optimization", "proficiency": 85}},
            {{"name": "Fraud Detection", "proficiency": 90}}
        ]
    }}

    ---

    ### **Text to Process:**
    {text}
    """

    extracted_skills = call_gpt4o(prompt)

    # ✅ Clean response: Remove markdown formatting (` ```json ... ``` `)
    extracted_skills = re.sub(r"```json\n|\n```", "", extracted_skills).strip()

    # ✅ Debug Print
    print("🔹 Cleaned Response (Skills):\n", extracted_skills)

    try:
        extracted_skills_json = json.loads(extracted_skills)
        return normalize_skills(extracted_skills_json)
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parsing Failed (Skills): {e}")
        return {"error": "Skill extraction failed"}



# New helper function: Calculate base proficiency using research-based logic.
def assign_base_proficiency(years, complexity):
    """
    Uses research-based mapping to assign a base proficiency.
    Years of Experience:
        <1 year: 40
        1–3 years: 60
        3–5 years: 78
        5+ years: 90
    Complexity boost:
        Simple: +0
        Medium: +5
        High: +10
    Returns the sum, capped at 100.
    """
    if years is None:
        years = 1  # default to entry-level if not provided
    if years < 1:
        base = 40
    elif years < 3:
        base = 60
    elif years < 5:
        base = 78
    else:
        base = 90
    if complexity is None:
        complexity = "simple"
    level = complexity.lower()
    if level == "simple":
        boost = 0
    elif level == "medium":
        boost = 5
    elif level == "high":
        boost = 10
    else:
        boost = 0
    return min(base + boost, 100)


def normalize_skills(extracted_skills):
    """
    Removes duplicate skills, ensures uniform categorization, and consolidates redundant skills.
    Additionally, if available, reassigns the base proficiency using research-based logic.
    """
    normalized_skills = set()
    cleaned_skills = {}
    for category, skills in extracted_skills.items():
        cleaned_skills[category] = []
        for skill in skills:
            skill_name = skill['name'].strip().lower()
            if skill_name not in normalized_skills:
                normalized_skills.add(skill_name)
                # If the skill contains 'years_experience' and 'project_complexity', reassign base score.
                if skill.get("years_experience") is not None or skill.get("project_complexity") is not None:
                    years = skill.get("years_experience")
                    complexity = skill.get("project_complexity")
                    new_base = assign_base_proficiency(years, complexity)
                    skill["proficiency"] = new_base
                    details = (f"Research-based assignment: For {years if years is not None else 'unspecified'} years of experience "
                               f"and a '{complexity if complexity is not None else 'simple'}' project complexity, base score set to {new_base}.")
                    append_explanation(skill, "base score", details)
                else:
                    # Otherwise, use the existing proficiency and explanation.
                    base = skill.get("proficiency", 0)
                    details = f"Base score of {base} assigned based on years of experience, project complexity, and overall impact."
                    append_explanation(skill, "base score", details)
                cleaned_skills[category].append(skill)
    return cleaned_skills


# Extract impact statements with dynamic categorization
import json

def extract_impact_statements(text, career_path, extracted_skills):
    prompt = f"""
    You are an expert in **impact-driven analysis** and **career-specific performance metrics**.  
    Extract **quantifiable impact statements** from the given text and categorize them accordingly.

    ---
    
    ### **🔹 Extraction Rules**
    - **Identify all measurable impact statements** that include quantifiable improvements.  
    - **Determine the primary impact area dynamically** based on the content and context of the statement.
    - **Assess the impact level**: High, Medium, Low based on the significance of the improvement.
      - If a skill has a **high-impact statement**, **increase proficiency based on the complexity and actual impact that portrays his proficiency in skill and boosts the score by appropriate number**.
      - If **moderate impact**, **increase proficiency based on the complexity and actual impact that portrays his proficiency in skill and boosts the score by appropriate number**.
      - If **low impact**, **increase proficiency based on the complexity and actual impact that portrays his proficiency in skill and boosts the score by appropriate number**.
    - **Cross-check extracted impact statements against extracted skills** in `{extracted_skills}`
      - If an impact statement directly aligns with a **technical, managerial, or industry skill**, tag it accordingly.
    
    ---

    ### **🔹 Example Input:**  
    "Optimized supply chain workflows, reducing costs by 18% and improving delivery speed by 25%. Increased forecasting accuracy by 30%, reducing stockouts."

    ### **🔹 Expected JSON Output:**  
    {{
        "Impact Statements": [
            {{
                "statement": "Reduced costs by 18% through supply chain optimization.",
                "impact_area": "Cost Optimization",
                "impact_level": "Medium",
                "affected_skills": ["Supply Chain Management"],
                "boost": 10
            }},
            {{
                "statement": "Improved delivery speed by 25%.",
                "impact_area": "Logistics Optimization",
                "impact_level": "High",
                "affected_skills": ["Logistics", "Operations"],
                "boost": 2
            }},
            {{
                "statement": "Increased forecasting accuracy by 30%, reducing stockouts.",
                "impact_area": "Predictive Analytics",
                "impact_level": "High",
                "affected_skills": ["Data Analysis", "Forecasting"],
                "boost": 11
            }}
        ]
    }}

    ---

    ### **🔹 Process the following text:**
    {text}
    """

    impact_statements = call_gpt4o(prompt)

    # ✅ Clean response: Remove markdown formatting
    impact_statements = re.sub(r"```json\n|\n```", "", impact_statements).strip()

    # ✅ Debug Print
    print("🔹 Cleaned Response (Impact Statements):\n", impact_statements)

    try:
        extracted_impact_json = json.loads(impact_statements)
        return validate_impact_statements(extracted_impact_json, extracted_skills)
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parsing Failed (Impact Statements): {e}")
        return {"error": "Impact extraction failed"}



def validate_impact_statements(impact_data, extracted_skills):
    """
    Validates and links extracted impact statements to relevant skills.
    - Matches impact statements to extracted skills dynamically.
    - Ensures no duplicate impact statements.
    - Normalizes skill names and impact statements for case-insensitive matching.
    """

    # Flatten extracted_skills into a set of normalized skill names (all lowercase for matching).
    flat_skills = {}
    for category, skills in extracted_skills.items():
        for skill in skills:
            skill_name = skill["name"].strip().lower()
            flat_skills[skill_name] = skill["name"]  # Store original casing for final output

    validated_impact_statements = []
    seen_statements = set()

    for impact in impact_data.get("Impact Statements", []):
        statement_text = impact["statement"].strip()

        # Ensure we do not add duplicate impact statements
        if statement_text.lower() not in seen_statements:
            seen_statements.add(statement_text.lower())

            # Link affected skills: if a skill name appears in the impact statement, add it.
            linked_skills = []
            for skill_name, original_name in flat_skills.items():
                if skill_name in statement_text.lower():
                    linked_skills.append(original_name)  # Preserve original capitalization

            # Merge existing affected_skills with linked skills (ensuring uniqueness)
            existing_skills = set(impact.get("affected_skills", []))  # Convert to set for unique values
            impact["affected_skills"] = list(existing_skills.union(linked_skills))  # Merge sets and convert back to list

            validated_impact_statements.append(impact)

    return {"Impact Statements": validated_impact_statements}


# Updated get_dynamic_boost_for_impact with hybrid impact-based boosts
def get_dynamic_boost_for_impact(impact):
    """
    Calls GPT-4o to determine a dynamic boost percentage based on the impact statement.
    The prompt now instructs GPT-4o to assess the qualitative impact, and return:
       - High Impact: a boost between 15 and 20%
       - Medium Impact: a boost between 5 and 10%
       - Low Impact: a boost between 2 and 5%
    Returns a float boost value.
    """
    prompt = f"""
    You are an expert in assessing the quantitative impact of work.
    Given the impact statement: "{impact['statement']}" with a qualitative impact level of "{impact['impact_level']}",
    determine an appropriate boost percentage using this mapping:
      - High Impact (significant financial impact, strategic changes, major innovations): between 15 and 20%.
      - Medium Impact (automation improvements, minor process enhancements): between 5 and 10%.
      - Low Impact (documentation, minor corrections): between 2 and 5%.
    Return your result as a JSON object like: {{"dynamic_boost": 17}}.
    """
    response = call_gpt4o(prompt)
    try:
        result = json.loads(response)
        return float(result.get("dynamic_boost", 0))
    except Exception as e:
        print(f"❌ Error parsing dynamic boost: {e}")
        return 0.0  # fallback if GPT call fails

def get_dynamic_adjustment_for_experience(experience):
    """
    Calls GPT-4o to determine a dynamic adjustment factor for a work experience entry.
    Provide context like role, company reputation and industry relevance.
    Returns a float multiplier (e.g. 1.20 means +20% boost).
    """
    role = experience.get("role", "")
    company = experience.get("company", "")
    relevance = experience.get("industry_relevance", "Unknown")
    
    prompt = f"""
    Given a work experience with role "{role}", company "{company}", and industry relevance "{relevance}",
    determine an appropriate multiplier to adjust competency. Return a JSON like: {{"multiplier": 1.20}}.
    """
    response = call_gpt4o(prompt)
    try:
        result = json.loads(response)
        return float(result.get("multiplier", 1.0))
    except Exception as e:
        print(f"❌ Error parsing dynamic adjustment: {e}")
        return 1.0  # fallback multiplier

# Update helper function to return detailed explanations for every adjustment.
def append_explanation(skill, change_type, details):
    """
    Appends a detailed explanation for an adjustment to the skill.
    For every adjustment—including base scoring, dynamic boosts, decay reductions,
    trend bonuses, certification boosts, and course boosts—this function asks GPT-4o to
    provide a breakdown of how much each factor (years of experience, project complexity,
    and overall impact) contributed to the change.
    """
    if change_type == "base score":
        prompt = f"""
You are an expert in skill scoring justification.
Explain in detail how the base score of a skill was determined.
Details: {details}
Break down what percentage of the base score is due to years of experience, what is due to project complexity, 
and what is contributed by overall impact.
Return a single sentence explanation with explicit percentages.
"""
    else:
        prompt = f"""
You are an expert in explaining score adjustments.
Provide a detailed breakdown for a {change_type} adjustment.
Details: {details}
Include explicit percentages that explain the contribution from candidate's years of experience, project complexity,
and overall impact for this adjustment.
Return a single sentence summary.
"""
    try:
        explanation = call_gpt4o(prompt)
    except Exception as e:
        print(f"❌ Error obtaining explanation: {e}")
        explanation = "No explanation available."
    if "boost_reasoning" not in skill:
        skill["boost_reasoning"] = []
    skill["boost_reasoning"].append(explanation)

# Modify apply_proficiency_boosts to use dynamic boost percentages
def apply_proficiency_boosts(extracted_skills, impact_statements):
    """
    Adjusts skill proficiency levels based on impact statements.
    For each impact statement, a dynamic boost percentage is determined by GPT-4o
    and then applied to the corresponding skill.
    Caps proficiency at 100%.
    """
    skill_dict = {}
    for category, skills in extracted_skills.items():
        for skill in skills:
            skill_name = skill["name"].strip().lower()
            skill_dict[skill_name] = skill

    for impact in impact_statements.get("Impact Statements", []):
        # Get a dynamic boost percentage from GPT-4o for this impact
        dynamic_boost = get_dynamic_boost_for_impact(impact)
        for affected_skill in impact.get("affected_skills", []):
            skill_name = affected_skill.strip().lower()
            if skill_name in skill_dict:
                skill_obj = skill_dict[skill_name]
                base = skill_obj["proficiency"]
                new_value = base + (base * (dynamic_boost / 100))
                updated = min(round(new_value), 100)
                skill_obj["proficiency"] = updated
                details = (f"Impact: '{impact['statement']}', Level: {impact['impact_level']}, "
                           f"Base score: {base}, dynamic boost: {dynamic_boost}%, updated to {updated}.")
                append_explanation(skill_obj, "dynamic boost", details)
    return extracted_skills

# UPDATED helper function for company reputation boost using GPT-4 with limited companies check.
def get_company_reputation_boost(company_name):
    prompt = f"""
    You are an expert in industry analysis.
    Determine the tier of the company "{company_name}" using the following lists:
      - Top-tier: Google, Amazon, Microsoft, JPMorgan.
      - Mid-tier: Intel, Cisco, Accenture, Deloitte.
    If the company name includes any of the above (case-insensitive), return the corresponding tier ("top-tier" or "mid-tier").
    Otherwise, return "other".
    Return your answer as a JSON object like: {{"tier": "top-tier"}}.
    """
    response = call_gpt4o(prompt)
    try:
        result = json.loads(response)
        tier = result.get("tier", "other").lower()
    except Exception as e:
        print(f"❌ Error determining company tier for '{company_name}': {e}")
        tier = "other"
    
    if tier == "top-tier":
        return 15.0
    elif tier == "mid-tier":
        return 8.5
    else:
        return 5.0

# NEW helper function for role-based boost (Work Experience Boost - Hybrid) using GPT-4.
def get_role_based_boost(role, years_experience):
    prompt = f"""
    You are an expert in career evaluation.
    Given the role title "{role}" and {years_experience} years of experience, classify the position among the following limited categories:
      - "senior" or "director" for high-level roles,
      - "manager" or "team lead" for mid-level roles,
      - "analyst" or "associate" for entry-level roles.
    Return your answer as a JSON object like: {{"level": "senior"}}.
    """
    response = call_gpt4o(prompt)
    try:
        result = json.loads(response)
        level = result.get("level", "").lower()
    except Exception as e:
        print(f"❌ Error determining role level for '{role}': {e}")
        level = ""

    if level in ["senior", "director"]:
        return 12.5
    elif level in ["manager", "team lead"]:
        return 8.5
    elif level in ["analyst", "associate"]:
        return 2.5
    else:
        return 0.0

# New function: Apply Skill Decay for stale experiences
def apply_skill_decay(extracted_skills, work_experiences):
    """
    For each skill, if no work experience (assumed to include 'end_date' and 'skills' fields)
    is found within the last 5 years, reduce its proficiency by 15%.
    """
    from datetime import datetime, timedelta
    decay_threshold = datetime.utcnow() - timedelta(days=5*365)
    recent_skills = set()
    for exp in work_experiences:
        end_date = exp.get("end_date")
        if end_date:
            try:
                exp_end = datetime.strptime(end_date, "%Y-%m-%d")
                if exp_end >= decay_threshold:
                    for sk in exp.get("skills", []):
                        recent_skills.add(sk.strip().lower())
            except Exception:
                continue
    for category, skills in extracted_skills.items():
        for skill in skills:
            if skill["name"].strip().lower() not in recent_skills:
                base = skill["proficiency"]
                updated = round(base * 0.85, 2)
                skill["proficiency"] = updated
                details = f"Skill '{skill['name']}' not used in work experiences within 5 years. Base: {base} decayed to {updated}."
                append_explanation(skill, "decay", details)
    return extracted_skills

# New function: Apply Industry Trend Bonus for high-demand skills
def apply_industry_trend_bonus(extracted_skills):
    """
    Increase proficiency for trending skills by 5% (capped at 100).
    """
    trending_skills = {"python", "machine learning", "aws", "docker", "kubernetes", "javascript", "reactjs"}
    for category, skills in extracted_skills.items():
        for skill in skills:
            if skill["name"].strip().lower() in trending_skills:
                base = skill["proficiency"]
                bonus = base * 0.05
                updated = min(round(base + bonus, 2), 100)
                skill["proficiency"] = updated
                details = f"Trending skill bonus applied to '{skill['name']}': {base} increased by 5% to {updated}."
                append_explanation(skill, "trend bonus", details)
    return extracted_skills

# NEW helper function for certification boosts (Step 3: Certification-Based Boost)
def get_certification_boost(cert_name):
    # Tier 1: Highly Respected certifications
    if any(term in cert_name for term in ["AWS", "PMP", "Google Cloud", "CISSP"]):
        return 10  # +10%
    # Tier 2: Moderate Value certifications
    elif any(term in cert_name for term in ["Coursera", "LinkedIn", "Udemy Advanced"]):
        return 5   # +5%
    else:
        return 2   # Tier 3: +2%

# Modified apply_certification_boosts with fixed boost percentages
def apply_certification_boosts(extracted_skills, certifications):
    for cert in certifications:
        cert_name = cert["name"]
        prompt = f"""
        You are an expert in industry certifications. Analyze the certification "{cert_name}" and return the following details:
        {{
            "credibility": "High",
            "reputation_score": 92,
            "certification_level": "Advanced"
        }}
        """
        cert_analysis = call_gpt4o(prompt)
        try:
            cert_analysis_json = json.loads(cert_analysis)
            cert["credibility"] = cert_analysis_json.get("credibility", "Unknown")
            cert["reputation_score"] = float(cert_analysis_json.get("reputation_score", 50))
            cert["certification_level"] = cert_analysis_json.get("certification_level", "Unknown")
        except (json.JSONDecodeError, TypeError, ValueError):
            print(f"❌ Error: Failed to parse GPT-4o response for certification: {cert_name}")
            cert["credibility"] = "Unknown"
            cert["reputation_score"] = 50.0
            cert["certification_level"] = "Unknown"
        cert["proficiency"] = round(cert["reputation_score"], 2)
        boost_percentage = get_certification_boost(cert_name)
        for category, skills in extracted_skills.items():
            for skill in skills:
                if cert_name.lower() in skill["name"].lower():
                    base = skill["proficiency"]
                    updated = round(min(base + cert["proficiency"] * (boost_percentage / 100), 100), 2)
                    skill["proficiency"] = updated
                    details = (f"Certification '{cert_name}' applied to '{skill['name']}': base {base} increased by fixed boost of "
                               f"{boost_percentage}% to {updated}.")
                    append_explanation(skill, "certification boost", details)
    return extracted_skills

# NEW helper function for online course boosts (Step 4: Online Course Boost)
def get_course_boost(course_name):
    prompt = f"""You are an expert in evaluating online courses based on research and industry standards. Given the course name "{course_name}", determine a suitable boost percentage that reflects its quality: advanced courses should yield around +10%, mid-level courses around +5%, and lower-tier courses around +2%. Return your answer as a JSON object in the format: {{"boost": <value>}}."""
    response = call_gpt4o(prompt)
    try:
        result = json.loads(response)
        return float(result.get("boost", 2))  # default to +2% if not available
    except Exception as e:
        print(f"Error determining course boost for {course_name}: {e}")
        return 2.0

# Modified apply_course_boosts to use dynamic GPT-4 based boost
def apply_course_boosts(extracted_skills, courses):
    for course in courses:
        course_name = course["name"]
        boost = get_course_boost(course_name)
        for category, skills in extracted_skills.items():
            for skill in skills:
                if course_name.lower() in skill["name"].lower():
                    old_prof = skill["proficiency"]
                    skill["proficiency"] = round(skill["proficiency"] * (1 + boost / 100), 2)
                    details = (f"Online course '{course_name}' applied to '{skill['name']}': "
                               f"proficiency increased from {old_prof} by dynamic boost of {boost}% to {skill['proficiency']}.")
                    append_explanation(skill, "course boost", details)
    return extracted_skills

def apply_course_boosts(extracted_skills, courses):
    """
    Adjusts skill proficiency based on online courses.
    - Advanced-level (MITx, Stanford, Harvard) → +10% boost
    - Mid-level (Udemy, LinkedIn, Coursera) → +5% boost
    """

    advanced_courses = {"MITx", "Stanford Online", "HarvardX"}
    mid_level_courses = {"Udemy", "LinkedIn Learning", "Coursera"}

    for course in courses:
        course_name = course["name"]
        boost = 0

        # **1️⃣ Apply Boost Based on Course Level**
        if any(adv in course_name for adv in advanced_courses):
            boost = 10  # **+10% for Advanced Courses**
        elif any(mid in course_name for mid in mid_level_courses):
            boost = 5  # **+5% for Mid-Level Courses**

        # **2️⃣ Apply Proficiency Boost to Related Skills**
        for category, skills in extracted_skills.items():
            for skill in skills:
                if course_name.lower() in skill["name"].lower():
                    skill["proficiency"] = round(skill["proficiency"] * (1 + boost / 100), 2)

    return extracted_skills



def is_top_tier_company(company_name):
    """
    Uses GPT-4o to determine if a company is a top-tier organization.
    Returns True if the company is prestigious, otherwise False.
    """
    if not company_name:
        return False  # No company name provided

    prompt = f"""
    You are an expert in industry analysis.  
    Is the company "{company_name}" considered **top-tier** in its industry?  

    - A top-tier company is globally recognized, a Fortune 500 company, a leading innovator, or dominant in its field.  
    - If the company meets these criteria, return **"Yes"**.  
    - Otherwise, return **"No"**.
    """

    response = call_gpt4o(prompt)
    return response.lower() == "yes"


import json

# ✅ Function to Extract Structured Inputs for Scoring
def extract_scoring_inputs(text, extracted_skills, impact_statements):
    prompt = f"""
    You are an expert in **career evaluation and proficiency scoring**.  
    Extract the required **structured data** to compute a **career readiness score** based on **industry standards**.

    ---
    
    ### **🔹 Data Categories & Extraction Rules:**
    Extract **relevant information** for the following **scoring categories**:
    
    **1️⃣ Degrees & Courses (Weight: 25%)**
    - **Extract all degree details, not just the highest level of degree**: (e.g., Bachelor's in Engineering, Master's in Business Analytics).
    - **Determine relevance**: Compare degree to `{extracted_skills}`.
    - **Assess level**: (Bachelor’s = base score, Master’s = +10% boost, and PHD and all other degrees that i might have missed give boost scores based on their level of degree).
    - **Check for specializations or high-impact coursework** (e.g., "AI in Supply Chain Management").

    **2️⃣ Work Experience (Weight: 30%)**
    - **Extract job roles & duration** (e.g., "Project Manager, 3 years at Google").
    - **Analyze job complexity and seniority**: Include explicit annotations for senior-level positions (e.g., "Senior", "Lead") and company reputation.
    - **Measure impact**: Cross-check `{impact_statements}` for achievements and improvements.
    - **Apply weighted adjustments**:
         - Senior-level job (e.g., "Senior", "Lead") = **+20% boost**.
         - Experience at top-tier companies (e.g., Google, Johns Hopkins) = **+15% boost**.
         - High relevance to `{extracted_skills}` = **+25% boost**.
         - Low-relevance company = **-10% penalty**.
         - Irrelevant field = **-20% penalty**.

    **3️⃣ Projects (Weight: 20%)**
    - **Extract project details**: Scope, tools, technologies, methodologies used.
    - **Evaluate depth & complexity**:
         - Advanced AI-based projects = **+15% boost**.
         - Real-world impact (measured in `{impact_statements}`) = **+10% boost**.
    - **Check for research-based, innovative, or leadership-driven projects**.

    **4️⃣ Certifications (Weight: 10%)**
    - **Extract industry-recognized certifications** (e.g., AWS, PMP, Lean Six Sigma).
    - **Assess credibility**:
         - High-value certs (e.g., AWS, Google Cloud) = **+10% boost**.
         - Moderate certs (e.g., Coursera, LinkedIn Learning) = **+5% boost**.
         - Non-industry standard = **-10% penalty**.
    - **Check if aligned with `{extracted_skills}`**.

    **5️⃣ Online Courses (Weight: 15%)**
    - **Extract course details & provider** (e.g., "MITx AI for Business").
    - **Evaluate reputation & difficulty level**:
         - Advanced-level courses (e.g., MITx, Stanford Online) = **+10% boost**.
         - Mid-level courses (e.g., Udemy, LinkedIn) = **+5% boost**.
    - **Cross-check for relevance to `{extracted_skills}`**.

    ---

    ### **🔹 Example Input:**
    "I completed a Master’s in Engineering Management with coursework in AI.  
    Worked as a Data Scientist for 3 years at Google AI.  
    Developed an ML model that improved fraud detection by 30%.  
    Completed an AWS Cloud Certification and a Coursera Python Course."

    ### **🔹 Expected JSON Output:**
    {{
        "Degrees & Courses": {{
            "degree": "Master’s in Engineering Management",
            "relevance": "High",
            "level": "Master’s",
            "specialized_coursework": ["AI in Engineering"]
        }},
        "Work Experience": {{
            "roles": [
                {{"title": "Data Scientist", "company": "Google AI", "duration": "3 years", "seniority": "Senior-level", "industry_relevance": "Top-tier"}}
            ],
            "complexity": "Senior-level",
            "impact_statements": [
                "Improved fraud detection by 30% using ML."
            ],
            "adjustments": {{
                "seniority_boost": 20,
                "top_company_boost": 15,
                "high_relevance_boost": 25
            }}
        }},
        "Projects": [
            {{
                "title": "ML Fraud Detection Model",
                "tools_used": ["Python", "TensorFlow"],
                "complexity": "High",
                "impact": "Fraud detection accuracy improved by 30%"
            }}
        ],
        "Certifications": [
            {{"name": "AWS Cloud Certification", "credibility": "High"}},
            {{"name": "Coursera Python Course", "credibility": "Medium"}}
        ],
        "Online Courses": [
            {{"name": "MITx AI for Business", "level": "Advanced"}}
        ]
    }}

    ---

    ### **🔹 Process the following text:**
    {text}
    """
    extracted_inputs = call_gpt4o(prompt)

    # ✅ Handle Empty Response
    if not extracted_inputs.strip():  
        print("❌ Error: GPT-4o response is empty or invalid.")
        return {"error": "Invalid JSON response from GPT-4o"}

    # ✅ Remove Markdown Formatting (` ```json ... ``` `)
    extracted_inputs = re.sub(r"```json\n|\n```", "", extracted_inputs).strip()

    # ✅ Debug Print
    print("🔹 Cleaned Response (Scoring Inputs):\n", extracted_inputs)

    try:
        extracted_inputs_json = json.loads(extracted_inputs)

        # ✅ Ensure Response is a Dictionary
        if not isinstance(extracted_inputs_json, dict):  
            print("❌ Error: GPT-4o response is not a dictionary.")
            return {"error": "Unexpected response structure"}

        # ✅ 1️⃣ Apply Work Experience Adjustments
        if "Work Experience" in extracted_inputs_json:
            if isinstance(extracted_inputs_json["Work Experience"], list):
                extracted_inputs_json["Work Experience"] = adjust_work_experience_weights(
                    extracted_inputs_json["Work Experience"], extracted_skills
                )
            elif isinstance(extracted_inputs_json["Work Experience"], dict):  # Convert dict to list
                print("⚠️ Warning: 'Work Experience' was a dictionary, converting to a list...")
                extracted_inputs_json["Work Experience"] = [extracted_inputs_json["Work Experience"]]
            else:
                print("❌ Error: 'Work Experience' is in an unexpected format. Setting to empty list...")
                extracted_inputs_json["Work Experience"] = []

        return extracted_inputs_json

    except json.JSONDecodeError as e:
        print(f"❌ JSON Parsing Failed (Scoring Inputs): {e}")
        return {"error": "Scoring input extraction failed"}





# ✅ Dynamic Weight Redistribution Logic
def adjust_weights_updated(user_data, extracted_skills):
    """
    Adjusts scoring weights dynamically if any data categories are missing.
    Also incorporates updated skill proficiency scores to improve calculations.
    """

    base_weights = {
        'degrees_courses': 0.25,
        'work_experience': 0.30,
        'projects': 0.20,
        'certifications': 0.10,
        'online_courses': 0.15
    }

    priority_order = {
        'degrees_courses': ['work_experience', 'projects', 'online_courses', 'certifications'],
        'work_experience': ['degrees_courses', 'projects', 'online_courses', 'certifications'],
        'projects': ['work_experience', 'degrees_courses', 'online_courses', 'certifications'],
        'certifications': ['online_courses', 'degrees_courses', 'work_experience', 'projects'],
        'online_courses': ['certifications', 'degrees_courses', 'work_experience', 'projects']
    }

    missing = [key for key, value in user_data.items() if not value]
    final_weights = base_weights.copy()

    for missing_cat in missing:
        missing_weight = final_weights.pop(missing_cat, 0)  # Remove weight for missing category

        for priority_cat in priority_order[missing_cat]:
            if priority_cat in final_weights:
                final_weights[priority_cat] += missing_weight
                break  # Assign missing weight to the first available category in priority

    # ✅ Normalize weights to always sum to 1 (100%)
    total_weight = sum(final_weights.values())
    for cat in final_weights:
        final_weights[cat] = round(final_weights[cat] / total_weight, 4)  # Keep precision

    # **Apply Adjusted Weights to Skill Proficiency**
    for category, skills in extracted_skills.items():
        for skill in skills:
            try:
                skill["proficiency"] = float(skill["proficiency"])  # Convert to float
                skill["weighted_proficiency"] = round(skill["proficiency"] * final_weights.get(category, 1), 2)
            except ValueError:
                print(f"❌ Error: Invalid proficiency value for skill: {skill}")
                skill["proficiency"] = 0.0  # Default to 0 if conversion fails
                skill["weighted_proficiency"] = 0.0


    return final_weights

def calculate_final_score(extracted_skills):
    """
    Computes the final career readiness score based on skill proficiency levels.
    """
    total_proficiency = 0
    skill_count = 0

    for category, skills in extracted_skills.items():
        for skill in skills:
            total_proficiency += skill.get("proficiency", 0)
            skill_count += 1

    if skill_count == 0:
        return 0  # Avoid division by zero

    return round(total_proficiency / skill_count, 2)




# Example Text for Testing
example_text = """
carrer goal: Senior software engineer
Learnig goal: python, SQL, machine learning, project management, leadership, fraud detection, supply chain optimization, AWS Cloud Practitioner Certification, PMP certification, AI in Supply Chain Management, MITx AI for Business.
PUSHPANJALI DIVI
+1 352 204 6244 | divi.p@ufl.edu | linkedin.com/in/pushpanjalidivi/
EDUCATION
University of Florida, Gainesville, FL Masters in Computer Science Aug 2022 – Dec 2023
GPA - 3.7
Coursework: Advanced Data Structures, Analysis of Algorithms, Database Management Systems, Software Engineering, Math for
Intelligent Systems, Distributed Operating System Principles, Machine Learning, Advanced Blockchain, Designing Integrated
Media Environments
G. Narayanamma Institute of Technology and Science, Hyderabad Bachelors in Computer Science Jul 2018 – July 2022
GPA - 4.0
SKILLS
Languages: C, C++, C#, Java, Python, Kotlin, Rust, MA TLAB, SQL, JavaScript, HTML, CSS, Typescript, GO
Frameworks and Libraries: .NET Core, Bootstrap, Spring Boot, ReactJS, NodeJS, Django, Flask, Flutter, Figma, REST API, D3.js
Big Data & ML: Spark, Hadoop, Hive, Statistics, ML models, Numpy, Pandas, Beautiful Soup, Sklearn Libraries, Web Scraping
DevOps and Cloud: Ansible, Docker, Jenkins, Kubernetes, Terraform, AWS
Tools and Utilities: Splunk, Postman, Wireshark, Prometheus, OpenCV , GitHub & Bitbucket
PROFESSIONAL EXPERIENCE
University of Florida | Full Stack Web Developer Jun 2023 - Dec 2023
● Executed a seamless migration of a legacy Shark bite victims database A WS server, optimizing storage and database performance
with column analysis, refinement, and an admin dashboard.
● Leveraged the extensive functionalities of the D3.js framework to create comprehensive data visualizations based on shark attacks
and geolocations.
● Employed Splunk for monitoring and analytics, providing valuable insights and enhancing system performance.
University of Florida | Full Stack Web Developer Jan 2023 - Jun 2023
● Designed a fully functional web application to retrieve files from Amazon S3 buckets, enabling efficient real-time traffic
monitoring by streamlining sensor data for over 100 traffic intersections in large-scale cities like Orlando.
● Employed a high-availability deployment strategy using Nginx and Docker services on AWS, ensuring 0 downtime and seamless
updates across multiple cluster nodes.
JP Morgan Chase | Software Developer Feb 2022 - Aug 2022
● Built and deployed multiple applications using CDK, contributing to the efficient provisioning and management of cloud
infrastructure.
● Designed and implemented RESTful endpoint APIs utilizing Kotlin and DynamoDB, incorporating core functionality, resulting
in optimized APIs with 30% faster response time and achieving 99.9% uptime.
● Conducted thorough unit and integration testing with MockK and Mockito frameworks, achieving a 30% reduction in the
number of defects discovered in production and decreasing the time required for bug fixing by 25%.
● Improved code readability through klint code formatting and reduced code review time by 20%.
● Created efficient connectivity code between the data and control plane layers, leveraging Java and Splunk, leading to a 50%
reduction in data access latency.
EPAM Systems | Software Developer Aug 2021 – Jan 2022
● A key member of the client demo team and individually configured product environments for prospective clients.
● Implemented Agile methodologies through Azure DevOps, managed project requirements, code deployment, and version control.
● Resolved production issues and customized products to align with the distinct business requirements of four clients.
● Implemented admin UI using React JS, Material UI, and Redux, collaborating with major banks in the United States.
● Developed an API-driven import/export capability of data with Apache Camel, RabbitMq, XML, and Spring Boot, streamlining
environment configuration for the organization.
JP Morgan Chase | Software Developer May 2021 – Jul 2021
● Implemented efficient automation solutions across various Business Intelligence platforms, resulting in a 30% reduction in
manual effort and improved data accuracy.
● Designed and deployed over 50 micro-solutions using Python to streamline the migration of Cognos to new data centers,
reducing migration time by 50% and minimizing disruptions to business operations.
● Created a cloud-based self-service portal that empowered users to manage their data, accounts, and reports independently, leading
to a 40% decrease in support ticket volume and increased user satisfaction.
PROJECTS
Tweeter Bot Nov 2023 – Oct 2023
● Created a Twitter-like platform with a client simulator and an integrated engine for tasks like registration and tweet dispatches.
Leveraging a WebSocket interface with the Gossip protocol ensured efficient tweet exchanges. The robust system built with
Erlang capably managed 5,000 concurrent simulated clients.
Kubernetes Integration with Python-CGI Jul 2023 – May 2023
● Designed and deployed a Flask web app with a UI enabling users to run Kubernetes operations using plain English commands.
The platform integrates features like custom pod naming, specific deployments, port-oriented service exposure, and replica
adjustments, all presented with a straightforward menu guide.
Live Streaming Video Chat App Jan 2023 – Feb 2023
● Contributed to the creation of a multi-user Live Streaming Video Chat App using Python’s CV2 module, integrating socket
programming for real-time communication and ensuring an optimized user experience
High Availability Proxy Load Balancer Sep 2022 – Oct 2022
● Participated in the deployment of a scalable load balancer on AWS using Ansible, optimized to support a million users, while
streamlining the automation of multiple web server setups.
Website Development Jan 2022 – May 2022
● Designed and implemented a robotic electronics blog, meticulously optimizing content and user experience, which resulted in
consistently attracting organic monthly traffic of 10,000 users, showcasing the site’s growing popularity and relevance in the
niche.
Heal Meal, Javascript & Go, React.js, MySQL, Cypress Sep 2021 – Dec 2021
● Built and launched a customized meal subscription website for individuals with specific dietary needs and allergies, leveraging
GoLang for API scripting and React.js for front-end implementation.
● Orchestrated a cross-functional team for project delivery within a 5-week timeline, implementing agile methodologies across 4
sprints.
● Ensured a seamless user experience by collaborating with designers and executing comprehensive testing, fortifying security
measures, and seamlessly integrating third-party APIs for payment processing and authentication.
A W ARDS AND CERTIFICATION
● Recipient of the Y oung Promising Engineer Award, Indian Society of Tech and Education
● Girls Who Code Achiever, Flipkart GWC 3.0
● Winner in JPMC Code for Good Hackathon
● AWS Certified Solutions Architect
PATENT
● Secured a patent on NICE wristband which has the potential to revolutionize how we monitor and manage our health in real time.
My role in developing and patenting the NICE wristband involved extensive research, experimentation, and collaboration with a
team of experts in electronics, software development, and biomedical engineering.

"""

def validate_skills_against_industry(extracted_skills, career_goals, learning_goals):
    """
    Uses GPT-4o to compare the extracted skills with a comprehensive, detailed list of skills, courses, and knowledge 
    required for the user's career and learning goals. It validates both explicit and implicit competencies along with 
    certifications and courses. The function then identifies the value of each and reports any gaps.
    
    Returns a JSON with:
      "industry_standards": a detailed list of all essential skills, courses, and knowledge required,
      "missing_skills": a list of elements that are either missing or under-represented.
    """
    skills_list = list({skill["name"] for cat in extracted_skills.values() for skill in cat})
    prompt = f"""
    You are an expert in establishing industry skill standards and evaluating career readiness.
    Given the following extracted skills: {skills_list},
    and considering the user's Career Goals: {career_goals} and Learning Goals: {learning_goals},
    compare these against a comprehensive and detailed list of all skills, courses, and knowledge that are critical for 
    success in this domain.
    
    In your evaluation, consider:
    - Explicit skills and those implicitly inferred from context.
    - The relative value or importance of each skill, certification, and course.
    
    Your response should be in JSON format with two keys:
      "industry_standards": a detailed list of essential skills, courses and knowledge (including implicit ones) required,
      "missing_skills": a list of skills, courses, or knowledge areas that are missing or under-represented relative to these standards.
    """
    response = call_gpt4o(prompt)
    try:
        return json.loads(response)
    except Exception as e:
        print(f"❌ Error parsing industry validation: {e}")
        return {"industry_standards": [], "missing_skills": []}

def analyze_user_profile(text):
    """
    Master function to run full user profile analysis.
    Calls extraction functions in sequence and compiles results.
    """
    # **1️⃣ Extract Skills**
    extracted_skills = extract_skills(text, career_path="General", impact_statements=[])

    # **2️⃣ Extract Impact Statements**
    impact_statements = extract_impact_statements(text, career_path="General", extracted_skills=extracted_skills)

    # **3️⃣ Apply Proficiency Boosts from Impact**
    extracted_skills = apply_proficiency_boosts(extracted_skills, impact_statements)

    # **4️⃣ Extract Scoring Inputs**
    scoring_inputs = extract_scoring_inputs(text, extracted_skills, impact_statements)

    # **5️⃣ Apply Work Experience Adjustments**
    if "Work Experience" in scoring_inputs:
        scoring_inputs["Work Experience"] = adjust_work_experience_weights(
            scoring_inputs["Work Experience"], extracted_skills
        )

    # **6️⃣ Apply Certification & Course Boosts**
    if "Certifications" in scoring_inputs:
        extracted_skills = apply_certification_boosts(extracted_skills, scoring_inputs["Certifications"])
    if "Online Courses" in scoring_inputs:
        extracted_skills = apply_course_boosts(extracted_skills, scoring_inputs["Online Courses"])

    # New Step: Apply Skill Decay and Real-Time Industry Trend Bonus
    if "Work Experience" in scoring_inputs:
        extracted_skills = apply_skill_decay(extracted_skills, scoring_inputs["Work Experience"])
    extracted_skills = apply_industry_trend_bonus(extracted_skills)

    # **7️⃣ Adjust Weights Based on Available Data**
    adjusted_weights = adjust_weights_updated(scoring_inputs, extracted_skills)

    # **8️⃣ Calculate Final Career Readiness Score**
    final_score = calculate_final_score(extracted_skills)

    # **9️⃣ Validate Extracted Skills Against Industry Standards**
    # Safely attempt to parse user goals from the input text; default to "General" if parsing fails.
    try:
        user_data = json.loads(text)
        career_goals = user_data.get("Career Goals", "General")
        learning_goals = user_data.get("Learning Goals", "General")
    except json.decoder.JSONDecodeError:
        print("⚠️ Input text is not valid JSON. Defaulting Career and Learning Goals to 'General'.")
        career_goals = "General"
        learning_goals = "General"

    industry_validation = validate_skills_against_industry(extracted_skills, career_goals, learning_goals)

    # **🔹 Return Final Analysis**
    result = {
        "Extracted Skills": extracted_skills,
        "Impact Statements": impact_statements,
        "Scoring Inputs": scoring_inputs,
        "Adjusted Weights": adjusted_weights,
        "Final Score": final_score,
        "Industry Validation": industry_validation
    }

    return result



# Run Analysis
result = analyze_user_profile(example_text)

# Save to JSON
with open("ai_skill_analysis.json", "w") as f:
    json.dump(result, f, indent=4)

print("\n✅ Analysis complete! Results saved to 'ai_skill_analysis.json'")