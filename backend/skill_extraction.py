from openai import OpenAI
import os
import json
import re
import numpy as np

client = OpenAI()

# ✅ Call GPT-4o using the new OpenAI SDK
def call_gpt4o(prompt):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are an expert in skill extraction and proficiency assessment."},
                  {"role": "user", "content": prompt}],
        temperature=0
    )
    content = response.choices[0].message.content.strip()

    # ✅ Handle Empty Response
    if not content or content == "{}":
        print("❌ GPT-4o returned an empty or invalid response!")
        return "{}"  # Return an empty JSON object

    # ✅ Remove unnecessary formatting
    content = re.sub(r"```json\n|\n```", "", content).strip()

    return content


# Extract key skills from text
import json

def extract_skills(text, career_path, impact_statements):
    prompt = f"""
    You are an expert in **skill extraction, proficiency assessment, and industry validation**.  
    Extract **all** key skills from the given text and categorize them properly.

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
      - **Industry standards validation** → Ensure extracted skills align with `{career_path}` standards.

    ---
    
    ### **🔹 Additional Enhancements**
    - **Normalize Skills**: Remove duplicates (e.g., "Python" appearing under multiple categories).
    - **Impact Weighting**:
      - If a skill has a **high-impact statement (>20% improvement)**, **increase proficiency by +15%**.
      - If **moderate impact (10-20%)**, **increase proficiency by +10%**.
      - If **low impact (<10%)**, **increase proficiency by +5%**.

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



def normalize_skills(extracted_skills):
    """
    Removes duplicate skills, ensures uniform categorization, and consolidates redundant skills.
    """
    normalized_skills = set()
    cleaned_skills = {}

    for category, skills in extracted_skills.items():
        cleaned_skills[category] = []
        
        for skill in skills:
            skill_name = skill['name'].strip().lower()
            
            if skill_name not in normalized_skills:
                normalized_skills.add(skill_name)
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
    - **Assess the impact level**:
      - **High Impact**: > 20% improvement (or major cost savings, revenue gain) → **Boost +15%**
      - **Medium Impact**: 10-20% improvement → **Boost +10%**
      - **Low Impact**: < 10% improvement → **Boost +5%**
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
                "boost": 15
            }},
            {{
                "statement": "Increased forecasting accuracy by 30%, reducing stockouts.",
                "impact_area": "Predictive Analytics",
                "impact_level": "High",
                "affected_skills": ["Data Analysis", "Forecasting"],
                "boost": 15
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


def apply_proficiency_boosts(extracted_skills, impact_statements):
    """
    Adjusts skill proficiency levels based on impact statements.
    - Each skill linked to an impact statement gets a boost.
    - Boost levels: Low (+5%), Medium (+10%), High (+15%).
    - Caps proficiency at 100%.
    """

    # Create a dictionary mapping skill names to their original proficiency levels
    skill_dict = {}
    for category, skills in extracted_skills.items():
        for skill in skills:
            skill_name = skill["name"].strip().lower()
            skill_dict[skill_name] = skill  # Store reference to modify later

    # Apply boosts from impact statements
    for impact in impact_statements.get("Impact Statements", []):
        boost_percentage = 0
        if impact["impact_level"] == "High":
            boost_percentage = 15
        elif impact["impact_level"] == "Medium":
            boost_percentage = 10
        elif impact["impact_level"] == "Low":
            boost_percentage = 5

        for affected_skill in impact.get("affected_skills", []):
            skill_name = affected_skill.strip().lower()
            if skill_name in skill_dict:
                skill_obj = skill_dict[skill_name]
                new_proficiency = skill_obj["proficiency"] + (skill_obj["proficiency"] * (boost_percentage / 100))
                skill_obj["proficiency"] = min(round(new_proficiency), 100)  # Cap at 100%

    return extracted_skills

def apply_certification_boosts(extracted_skills, certifications):
    """
    Dynamically assigns a proficiency score based on certification credibility, reputation, and level.
    - Uses GPT-4o to determine:
      1. **Credibility** (High, Medium, Low)
      2. **Reputation Score** (0-100%)
      3. **Certification Level** (Basic, Intermediate, Advanced)
    - Boosts related skill proficiencies based on certification reputation.
    """

    for cert in certifications:
        cert_name = cert["name"]

        # ✅ 1️⃣ Get Certification Reputation, Credibility & Level Using GPT-4o
        prompt = f"""
        You are an expert in industry certifications. Analyze the certification "{cert_name}" and return the following details:

        1️⃣ **Credibility** (High, Medium, Low) → How respected is this certification?
        2️⃣ **Reputation Score (0-100%)** → How widely recognized is it in its industry?
        3️⃣ **Certification Level** (Basic, Intermediate, Advanced) → The depth of knowledge it certifies.

        **Return JSON format:**
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
            cert["reputation_score"] = float(cert_analysis_json.get("reputation_score", 50))  # Default to 50%
            cert["certification_level"] = cert_analysis_json.get("certification_level", "Unknown")

        except (json.JSONDecodeError, TypeError, ValueError):
            print(f"❌ Error: Failed to parse GPT-4o response for certification: {cert_name}")
            cert["credibility"] = "Unknown"
            cert["reputation_score"] = 50.0  # Default midpoint score
            cert["certification_level"] = "Unknown"

        # ✅ 2️⃣ Assign Proficiency Score Based on Reputation
        cert["proficiency"] = round(cert["reputation_score"], 2)  # Directly use reputation as proficiency

        # ✅ 3️⃣ Apply Boost to Related Skills
        for category, skills in extracted_skills.items():
            for skill in skills:
                if cert_name.lower() in skill["name"].lower():
                    skill["proficiency"] = round(min(skill["proficiency"] + cert["proficiency"] * 0.1, 100), 2)

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


def adjust_work_experience_weights(work_experience, extracted_skills):
    """
    Adjusts work experience weights dynamically by:
    - Applying seniority boosts (+20% for senior/lead roles).
    - Applying **LLM-powered** company reputation boosts (+15% for top-tier companies).
    - Applying relevance boosts (+25% for high industry alignment).
    - Penalizing low/irrelevant experience (-10% or -20% penalty).
    """

    for i, experience in enumerate(work_experience):
        if not isinstance(experience, dict):
            print(f"❌ Error: work_experience[{i}] is not a dictionary: {experience}")
            continue  # Skip invalid entries
        
        base_score = 100  # Start at base 100%
        
        # Extract relevant job details
        role = experience.get("role", "").strip().lower()
        company = experience.get("company", "").strip()
        industry_relevance = experience.get("industry_relevance", "Unknown").lower()

        # **1️⃣ Seniority Boost: +20% for "Senior", "Lead", "Manager" roles**
        if any(title in role for title in ["senior", "lead", "manager", "director"]):
            base_score *= 1.20

        # **2️⃣ Top-Tier Company Boost: +15% (GPT-4o Determines Prestige)**
        if is_top_tier_company(company):
            base_score *= 1.15

        # **3️⃣ High Relevance Boost: +25% if highly aligned with extracted skills**
        if industry_relevance == "high":
            base_score *= 1.25

        # **4️⃣ Low-Relevance Penalties**
        elif industry_relevance == "low":
            base_score *= 0.90  # -10% penalty
        elif industry_relevance == "irrelevant":
            base_score *= 0.80  # -20% penalty

        # Apply adjusted score back
        experience["adjusted_score"] = round(base_score, 2)

    return work_experience


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
    - **Extract degree details**: (e.g., Bachelor's in Engineering, Master's in Business Analytics).
    - **Determine relevance**: Compare degree to `{extracted_skills}`.
    - **Assess level**: (Bachelor’s = base score, Master’s = +10% boost).
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
SASHREEK MALLEM
+1 352 658 5683 | smallem1@umbc.edu | www.linkedin.com/in/Sashreekmallem/

EDUCATION
 
Micro Masters in Supply Chain Management	Jun 2023 – Dec 2024
Massachusetts Institute of Technology (MITx)	
Focused on Supply Chain Fundamentals, Design, Analytics, Dynamics, Technology and Systems Integration.

Masters in Engineering Management	Jan 2023 – Dec 2024
University of Maryland Baltimore County	
Specialized in Financial Management, Engineering Law and Ethics, Strategic Planning, Leading Teams and Organizations.

Post-Baccalaureate Certificate in Project Management	Jan 2023 – Dec 2024
University of Maryland Baltimore County	
Advanced Training in Leadership and Communications, Project Management, Leadership in Global Virtual Teams.

Bachelor of Technology in Mechanical Engineering	Jul 2018 – Jul 2022
Chaitanya Bharathi Institute of Technology	
Focused on Principles of Entrepreneurship, Production and Operations Management, Supply Chain Management, Product Design and Process Planning, Operations Research, Engineering Economics, Renewable Energy Sources.
SKILLS
Product Management: Product Roadmap Development, User Stories, Requirement Documentation, Go-to-Market Strategies
Supply Chain Management:  Supply Chain Planning, Risk Management, Vendor Management, End-to-End Life Cycle Management, Demand Forecasting, Warehouse Management Systems (WMS), Demand-Supply Analysis
Management: Financial Analysis, Project Scheduling, Resource Planning, KPI Tracking
Process Improvement: Continuous Improvement (Kaizen), Process Optimization, Root Cause Analysis (RCA), Data Analysis
Leadership: Cross-functional Collaboration, Stakeholder Engagement, Sourcing Strategies, Cost Optimization
Software Proficiency: JIRA, SAP ERP (MM, SD), Power BI, Microsoft Office Suite (Excel, PowerPoint, Project)
Technical skills: AI frameworks & Computer Vision (YOLO, Deepstream, CUDA), Python, RESTful APIs, SQLite, predictive models, Anomaly Detection
Hardware Proficiency: Sensor Fusion, mmWave Radars, Drones
Soft Skills: Strategic Communication, Creative Problem-Solving, Adaptability, Interpersonal Skills, Attention to Detail, Data Driven Decision-Making 

PROFESSIONAL EXPERIENCE

Johns Hopkins Hospital | Project Management Consultant 	Jan 2024 – May 2024
•	Crafted project requirements documentation, including Project charters, scope statements, requirements, and WBS, aligning objectives and deliverables for a $7.5M HVAC system upgrade.
•	Pruned project schedules using MS Project, boosting overall project efficiency by 10% through resource alignment and timeline coordination.
•	Negotiated supplier contracts, achieving a 12% reduction in material costs while ensuring timely components delivery to meet project milestones.
•	Developed detailed product roadmaps and user stories to ensure seamless alignment between technical teams and stakeholders.
•	Conducted data analysis using SQL and Power BI to provide actionable insights, enhancing performance metrics by 20%.
•	Improved budget accuracy by 15%, introducing advanced cost-tracking procedures to minimize financial discrepancies.

Tata Consultancy Services | Supply Chain Management Intern	Feb 2022 - Nov 2022
•	Performed supplier pricing, and capacity analyses using Power BI, engineering performance dashboards that improved data-driven sourcing decisions by 20% and supplier KPI tracking efficiency by 17%.
•	Implemented and calibrated SAP ERP (MM) for supply planning and material management, reducing excess stock by 18% and improving cash flow by 12%.
•	Optimized order-to-cash workflows in SAP SD, reducing delivery times by 10% and boosting on-time order fulfillment by 12%.
•	Assessed supplier capabilities and led procurement negotiations in SAP MM, cutting costs by 15% and mitigating supply chain risks.
•	Refined demand forecasting models, decreasing stockouts by 14% and improving production planning accuracy
Foray Software Pvt Ltd | Project Management Intern	Jul 2021 - Dec 2021
•	Conducted supply chain analysis using 'what-if' scenarios to predict disruptions, enabling proactive demand adjustments and mitigating material shortages.
•	Led SAP ERP-driven process improvement initiatives, boosting supply planning efficiency and enhancing resource allocation accuracy by 20%, ensuring timely project completion.
•	Executed risk evaluations, reducing overall risk by 20% through risk assessments and mitigation strategies.
•	Administered financial oversight during ERP implementation, decreasing unforeseen costs by 12% with cost tracking.
•	Designed SAP ERP test plans, amplified system reliability by 18% and aligning with supply chain requirements.
•	Refined ERP project management workflows, skyrocketed productivity by 13% and accelerating project delivery.

Bhagavati Aerobriks Indsutires Pvt Ltd | Product Management Intern	Feb 2021 – Jun 2021
•	Conceptualized key innovations in AAC product development, hiking production efficiency and product quality while advancing sustainable building materials.
•	Leveraged Statistical Process Control techniques, dropping defect rates by 15% and amplifying product yield by 12%.
•	Executed a Just-In-Time strategy, lowering inventory holding costs by 25% and surging material turnover by 30%.
•	Conducted market research and feature prioritization to align product innovations with customer needs, resulting in a 10% market share increase.
•	Introduced energy-efficient methods, cutting energy consumption by 12% and lowering the carbon footprint by 8%.
•	Collaborated with cross-functional teams to align sourcing requirements with operational goals, reducing project turnaround time by 15%.
•	Supported materials life-cycle management by making strategic buy decisions, ensuring continuous production and reducing material wastage by 8%.

PROJECTS 
Highway Speeding Enforcement System (In Progress)
Spearheading an AI-driven traffic violation detection system by leveraging drones, IoT, predictive modeling, anomaly detection, and real-time data analytics while incorporating user feedback to prioritize features and enhance road safety.
AI-Driven Surveillance System (In Progress)
Working on an AI surveillance platform using IoT and computer vision to enhance real-time monitoring and security coverage.
Food Spoilage Detection System
Designed an AI and sensor-based solution for real-time spoilage detection, integrating  machine learning workflows data visualization dashboards to improve operational insights.
Fabrication of Vehicle External Airbag System
Engineered a sensor-based external airbag system, minimizing collision impact through innovative microcontroller integration.

 CERTIFICATIONS
  PMI | Certified Associate in Project Management									 2024
 CSSC | Lean Six Sigma Green Belt 											 2024
 Google | Project Management: Professional Certificate									 2024
 Google | Agile Project Management Certificate 										 2024
 IBM | Introduction to Agile Development and Scrum									 2024
 IBM | Product Manager Professional											 2024

PUBLICATIONS
 IJARESM | Evolution Of Technology in Supply Chain Management In Agriculture					2023

"""


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

    # **7️⃣ Adjust Weights Based on Available Data**
    adjusted_weights = adjust_weights_updated(scoring_inputs, extracted_skills)

    # **9️⃣ Calculate Final Career Readiness Score**
    final_score = calculate_final_score(extracted_skills)

    # **🔹 Return Final Analysis**
    result = {
        "Extracted Skills": extracted_skills,
        "Impact Statements": impact_statements,
        "Scoring Inputs": scoring_inputs,
        "Adjusted Weights": adjusted_weights,
        "Final Score": final_score
    }

    return result



# Run Analysis
result = analyze_user_profile(example_text)

# Save to JSON
with open("ai_skill_analysis.json", "w") as f:
    json.dump(result, f, indent=4)

print("\n✅ Analysis complete! Results saved to 'ai_skill_analysis.json'")

