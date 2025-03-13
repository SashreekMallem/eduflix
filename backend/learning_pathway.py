import json
import sys
import re
from openai import OpenAI

# Add the directory containing main.py to the system path
sys.path.append('/Users/ms/eduflix/backend/MetaGPT')

from main import get_db_connection  # Import database connection function

client = OpenAI()

def fetch_user_data(user_id):
    """
    Fetches user career goals, learning goals, and missing skills from the database.
    Returns empty lists if no data is found.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT career_goals, learning_goals, knowledge_gaps
                FROM user_profiles
                WHERE user_id = %s
            """, (user_id,))
            result = cursor.fetchone()
        
        conn.close()
        
        if result:
            return result[0] or [], result[1] or [], result[2] or []
        return [], [], []

    except Exception as e:
        print(f"❌ Error fetching user data: {e}")
        return [], [], []


def fetch_analysis_results(user_id):
    """
    Fetches AI-generated analysis results for the user.
    Returns an empty dictionary if no results exist.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT extracted_skills, final_score, impact_statements, 
                       scoring_inputs, industry_validation, debug_messages
                FROM analysis_results
                WHERE user_id = %s
            """, (user_id,))
            result = cursor.fetchone()
        
        conn.close()
        
        if result:
            return {
                "extracted_skills": result[0] or {},
                "final_score": result[1] or 0.0,
                "impact_statements": result[2] or [],
                "scoring_inputs": result[3] or {},
                "industry_validation": result[4] or {},
                "debug_messages": result[5] or []
            }
        return {}

    except Exception as e:
        print(f"❌ Error fetching analysis results: {e}")
        return {}


def clean_json_response(response_text):
    """
    Cleans the GPT response to ensure it is valid JSON.
    """
    try:
        # Remove any markdown formatting (```json ... ```)
        response_text = re.sub(r'^```json\s*', '', response_text.strip(), flags=re.MULTILINE)
        response_text = re.sub(r'\s*```$', '', response_text.strip(), flags=re.MULTILINE)
        
        # Find the first and last curly braces to extract valid JSON content
        start_index = response_text.find('{')
        end_index = response_text.rfind('}') + 1
        if (start_index == -1 or end_index == -1):
            raise json.JSONDecodeError("No valid JSON object found", response_text, 0)
        
        json_content = response_text[start_index:end_index]
        return json.loads(json_content)
    
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parsing Error: {e}")
        return {"error": "Invalid JSON from GPT-4 response."}


def fetch_existing_pathway(user_id):
    """
    Fetches the existing learning pathway from the analysis_results table.
    Returns None if no pathway exists.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT verified_learning_pathway
                FROM analysis_results
                WHERE user_id = %s
            """, (user_id,))
            result = cursor.fetchone()
        conn.close()
        
        if result and result[0]:
            # If the value is already a dictionary, return it immediately.
            if isinstance(result[0], dict):
                return result[0]
            # Otherwise, if it's a string, parse it.
            elif isinstance(result[0], str):
                return json.loads(result[0])
            else:
                return result[0]
        return None

    except Exception as e:
        print(f"❌ Error fetching existing pathway: {e}")
        return None

def generate_learning_pathway(user_id):
    """
    Generates a highly personalized, data-driven learning pathway using GPT-4.
    If a verified pathway already exists in the database, it returns that pathway without calling GPT.
    """
    existing_pathway = fetch_existing_pathway(user_id)
    if existing_pathway:
        print("✅ Existing learning pathway found. Returning the existing pathway.")
        return existing_pathway  # Do not call GPT if pathway exists

    # Only reach this point if no existing pathway is found
    career_goals, learning_goals, missing_skills = fetch_user_data(user_id)
    analysis_results = fetch_analysis_results(user_id)
    
    prompt = f"""
    You are an **expert AI-driven learning architect**. Your goal is to create the **most exhaustive and industry-aligned learning pathway** for a user, ensuring they gain **everything needed** to achieve their career goal.

    ---

    ### **📌 User Profile**
    - **Career Goal:** {career_goals}
    - **Learning Goals:** {learning_goals}
    - **Knowledge Gaps:** {missing_skills}
    - **User's Skill Analysis & Industry Insights:** {json.dumps(analysis_results)}

    ---

    ### **🔹 Task Breakdown**
    1️⃣ **Step 1: Generate an Unfiltered, Exhaustive List of Topics**  
       - Expand **each** topic into **subtopics and sub-subtopics** as deep as needed.  
       - Ensure **no critical area is left out**.  
       - Cover **fundamentals, intermediate, and advanced** concepts.  
       - Include **practical, research, and theoretical** aspects.  
       - Follow industry standards used by **Google, AWS, OpenAI, NVIDIA, Tesla, FAANG, universities (MIT, Stanford, Harvard), and top research papers.**  

    2️⃣ **Step 2: Compare with User Profile**  
       - **Remove** topics the user **already knows well** (based on extracted skills, work experience, education).  
       - **Ensure** all learning goals are **explicitly covered**.  
       - **Preserve** knowledge gaps by ensuring missing skills are included.  

    3️⃣ **Step 3: Deliver Output in Strict JSON Format**  
       - Only output **topics, subtopics, and sub-subtopics**.  
       - **NO explanations, NO descriptions, NO industry benchmarks.**  
       - **NO external links, NO course recommendations, NO resources.**  
       - **Just the pure structured learning path.**  

    ---

    ### **🔹 Output Format (Strict JSON)**
    ```json
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are the world’s leading AI-driven mentor and career architect, with unparalleled expertise in designing **ultra-detailed, fully comprehensive learning roadmaps** that prepare individuals for high-level industry roles at major tech companies (like Google, AWS, OpenAI, Meta, NVIDIA, Tesla, Microsoft, etc.). "},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        pathway = clean_json_response(response.choices[0].message.content)
    except Exception as e:
        print(f"❌ GPT-4 API Call Failed: {e}")
        return {"error": "Failed to generate learning pathway."}
    
    return pathway

def verify_learning_pathway(user_id, generated_pathway):
    """
    Verifies the generated learning pathway using GPT-4.
    """
    career_goals, learning_goals, missing_skills = fetch_user_data(user_id)
    
    prompt = f"""
    You are an **AI-driven curriculum auditor** specializing in **industry-aligned learning paths**. Your task is to **verify the generated learning pathway** and **ensure** that it is **100% complete and exhaustive**.

    ---

    ### **📌 User Profile**
    - **Career Goal:** {career_goals}
    - **Learning Goals:** {learning_goals}
    - **Knowledge Gaps:** {missing_skills}
    - **AI-Generated Learning Pathway (JSON):** {json.dumps(generated_pathway)}

    ---

    ### **🔹 Task Breakdown**
    1️⃣ **Industry Alignment Check**  
       - **Compare the generated learning pathway against**:
         - **FAANG job descriptions** (Google, Amazon, Meta, Microsoft, OpenAI, Tesla, NVIDIA, etc.).
         - **Top academic curriculums** (MIT, Stanford, Harvard AI/ML programs).
         - **Latest industry reports & AI research trends**.
       - Identify if **any critical topics, subtopics, or sub-subtopics** are **missing**.

    2️⃣ **Ensure Full Coverage of Learning Goals & Knowledge Gaps**  
       - **Confirm** that all user **learning goals are fully covered**.  
       - **Check** if any **missing skills** from their profile were accidentally left out.  

    3️⃣ **Fill in Missing Topics (if any)**  
       - **DO NOT modify existing topics unless incorrect**.  
       - If anything is missing, **add new topics/subtopics/sub-subtopics** in the correct place.  
       - Maintain the same **JSON structure** as the input.  

    ---

    ### **🔹 Output Format (Strict JSON)**
    ```json
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert in curriculum auditing and industry-aligned learning paths."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )

        verified_pathway = clean_json_response(response.choices[0].message.content)
    
    except Exception as e:
        print(f"❌ GPT-4 API Call Failed: {e}")
        return {"error": "Failed to verify learning pathway."}

    return verified_pathway

def save_verified_pathway(user_id, verified_pathway):
    """
    Saves the verified learning pathway in the analysis_results table.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE analysis_results
            SET verified_learning_pathway = %s
            WHERE user_id = %s
        """, (json.dumps(verified_pathway), user_id))
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Verified learning pathway saved successfully.")
    except Exception as e:
        print(f"❌ Error saving verified learning pathway: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python learning_pathway.py <user_id>")
        sys.exit(1)
    
    user_id = int(sys.argv[1])
    generated_pathway = generate_learning_pathway(user_id)
    
    if "error" not in generated_pathway:
        verified_pathway = verify_learning_pathway(user_id, generated_pathway)
        save_verified_pathway(user_id, verified_pathway)
        output_file = f"/Users/ms/eduflix/learning_pathway_{user_id}.json"
        
        try:
            with open(output_file, "w", encoding="utf-8") as file:
                json.dump(verified_pathway, file, indent=4)
            
            print(f"✅ Learning pathway generated and saved to: {output_file}")
        
        except Exception as e:
            print(f"❌ Error writing file: {e}")
    else:
        print("❌ Failed to generate learning pathway.")
