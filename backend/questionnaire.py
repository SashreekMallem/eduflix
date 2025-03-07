import json
import re
import random
from openai import OpenAI

# ✅ Initialize OpenAI Client
client = OpenAI()

def load_analysis_data():
    """Loads skill analysis data along with user career and learning goals from JSON."""
    try:
        with open("ai_skill_analysis.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ Error: Analysis file 'ai_skill_analysis.json' not found!")
        return {}

def save_analysis_data(analysis_data):
    """Saves the updated analysis data to the JSON file."""
    with open("updated_ai_skill_analysis.json", "w") as f:
        json.dump(analysis_data, f, indent=4)

def get_relevant_skills(analysis_data):
    """
    Filters skills based on the user's career and learning goals.
    'Career Goals' indicate what the user wants to become (essential skills),
    while 'Learning Goals' specify the areas the user wants to learn.
    This function returns a list of skill names prioritized as:
       1. Skills matching both career and learning goals.
       2. Skills matching either goal.
    """
    career_goals = analysis_data.get("Career Goals", [])
    learning_goals = analysis_data.get("Learning Goals", [])
    all_skills = [skill["name"] for cat in analysis_data.get("Extracted Skills", {}).values() for skill in cat]

    if not career_goals and not learning_goals:
        print("⚠️ Warning: No career or learning goals provided. Using all extracted skills.")
        return all_skills

    prioritized = []
    fallback = []

    # Lowercase goals for matching
    career_goals = [goal.lower() for goal in career_goals]
    learning_goals = [goal.lower() for goal in learning_goals]

    for cat, skills in analysis_data.get("Extracted Skills", {}).items():
        for skill in skills:
            skill_name = skill["name"].strip().lower()
            in_career = any(goal in skill_name for goal in career_goals)
            in_learning = any(goal in skill_name for goal in learning_goals)
            if in_career and in_learning:
                # Highest priority if skill appears in both
                prioritized.append(skill["name"])
            elif in_career or in_learning:
                fallback.append(skill["name"])

    # Remove duplicates and keep prioritized first
    combined = list(dict.fromkeys(prioritized + fallback))
    if not combined:
        print("⚠️ Warning: No skills match the provided goals. Using all extracted skills.")
        return all_skills
    return combined

def call_gpt4o(prompt):
    """Calls GPT-4o to generate questions and evaluate responses dynamically."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "You are an expert in skill verification and assessment."},
                      {"role": "user", "content": prompt}],
            temperature=0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Error calling GPT-4o: {e}")
        return None

def generate_dynamic_question(skill):
    """Asks GPT-4o to generate a real-time question with an adaptive question type for the given skill."""
    prompt = f"""
    Generate a question to test proficiency in {skill}. 
    Choose the best question format (MCQ, Matching, Fill-in-the-blank, Open-ended) based on what evaluates the skill most effectively.

    Provide a JSON response:
    {{
        "question_type": "mcq/matching/fill-in-the-blank/open-ended",
        "question": "...",
        "options": ["...", "...", "...", "..."],   # Only for MCQs and matching
        "correct_answer": "...",  # String for MCQs/fill-in-the-blank, list for matching
        "explanation": "..."
    }}
    """
    response = call_gpt4o(prompt)

    try:
        return json.loads(re.sub(r"```json\n|\n```", "", response))  # Clean JSON formatting
    except json.JSONDecodeError:
        print("❌ GPT-4o returned an invalid question format.")
        return None

def evaluate_response_with_gpt(user_answer, skill):
    """Calls GPT-4o to verify if the user’s response correctly demonstrates proficiency in a skill."""
    prompt = f"""
    You are an expert interviewer assessing proficiency in {skill}. 
    Evaluate the following response and provide:

    1️⃣ **Correctness** (Correct, Partially Correct, Incorrect)
    2️⃣ **Depth of Knowledge** (Beginner, Intermediate, Advanced, Expert)
    3️⃣ **Suggested proficiency change** (dynamically based on answer quality, ranging from -100 to +100)
    4️⃣ **Suggested follow-up question to further test the user**
    5️⃣ **Always return score as a numerical value**

    **User Response:**  
    "{user_answer}"

    Provide a JSON response:
    {{
        "correctness": "...",
        "depth": "...",
        "proficiency_change": NUMBER,
        "next_question": "..."
    }}
    """
    evaluation = call_gpt4o(prompt)

    try:
        return json.loads(re.sub(r"```json\n|\n```", "", evaluation))  # Clean JSON formatting
    except json.JSONDecodeError:
        print("❌ GPT-4o returned an invalid response.")
        return None

def update_proficiency(extracted_skills, skill, evaluation, analysis_data):
    """Dynamically adjusts proficiency scores based on GPT-4o evaluation."""
    skill_lower = skill.lower()
    
    for category, skills in extracted_skills.items():
        for sk in skills:
            if sk["name"].lower() == skill_lower:
                current_proficiency = sk.get("proficiency", 0)

                # ✅ Ensure `delta` is a float
                try:
                    delta = float(evaluation.get("proficiency_change", 0))
                except (ValueError, TypeError):
                    print(f"⚠️ Warning: GPT-4o returned an invalid proficiency change for {skill}. Defaulting to 0.")
                    delta = 0  # Default to no change if conversion fails

                new_proficiency = max(0, min(current_proficiency + delta, 100))  # Keep score within 0-100
                
                print(f"🔄 Adjusting '{sk['name']}' proficiency: {current_proficiency} → {new_proficiency}")
                sk["proficiency"] = new_proficiency
                
                # ✅ Immediately save changes
                save_analysis_data(analysis_data)
                return new_proficiency  

    return None

def main():
    """Runs the interactive question-answer loop using the analysis data."""
    analysis_data = load_analysis_data()
    if not analysis_data:
        print("❌ Error: No analysis data found.")
        return

    extracted_skills = analysis_data.get("Extracted Skills", {})
    relevant_skills = get_relevant_skills(analysis_data)

    while relevant_skills:
        skill_name = random.choice(relevant_skills)

        print(f"\n🔹 Generating a question for {skill_name}...")
        question_data = generate_dynamic_question(skill_name)

        if not question_data:
            continue  # Skip if GPT-4o fails to generate a valid question

        print("\nQ:", question_data["question"])

        if question_data["question_type"] == "mcq":
            for i, option in enumerate(question_data["options"], 1):
                print(f"{i}. {option}")

            user_choice = input("Enter the correct option number: ").strip()
            if question_data["options"][int(user_choice) - 1] == question_data["correct_answer"]:
                print("✅ Correct Answer!")
                evaluation = {"correctness": "Correct", "depth": "Intermediate", "proficiency_change": 5}
            else:
                print(f"❌ Incorrect! The correct answer was: {question_data['correct_answer']}")
                evaluation = {"correctness": "Incorrect", "depth": "Beginner", "proficiency_change": -10}

        else:  # Open-ended question
            user_answer = input("Your answer: ")
            evaluation = evaluate_response_with_gpt(user_answer, skill_name)

        if evaluation:
            update_proficiency(extracted_skills, skill_name, evaluation, analysis_data)

        cont = input("\nContinue? (y/n): ").strip().lower()
        if cont != "y":
            break

    print("\n✅ Interview Process Complete!")

if __name__ == "__main__":
    main()
