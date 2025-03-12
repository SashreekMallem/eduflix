import sys
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Form, File, UploadFile, Query, Body
from pydantic import BaseModel
import psycopg2
import json  # Import JSON module
from typing import List, Dict, Optional, Union
import re
import logging
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
import os
from fastapi.responses import JSONResponse

# Configure logging & force reconfiguration so that our settings override uvicorn defaults
logging.basicConfig(
    level=logging.DEBUG,
    force=True  # Force reconfiguration to ensure logs are output to terminal
)
# Add a StreamHandler to ensure logs are displayed in terminal
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logging.getLogger().addHandler(console_handler)

app = FastAPI()

# Add CORS middleware
origins = [
    "http://localhost:3000",
    "http://192.168.86.192:3000",  # <--- Existing origin
    "http://192.168.86.243:3000",  # Add this origin
    # add more origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],  # Allow OPTIONS method
    allow_headers=["*"],
)

# PostgreSQL Connection
DB_NAME = "eduflix_db"
DB_USER = "eduflix_user"
DB_PASSWORD = "password123"
DB_HOST = "localhost"

# Function to establish DB connection
def get_db_connection():
    return psycopg2.connect(
        dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST
    )

# Helper function to parse JSON fields safely
def safe_json_load(s: Optional[str]):
    if s:
        try:
            return json.loads(s)
        except Exception as e:
            # Log the exception if needed
            # Instead of raising an error, return an empty list as a fallback
            return []
    return []

# Add this function after initializing app and middleware
def init_db_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Create friend_invites table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS friend_invites (
            invite_id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            status VARCHAR(20) NOT NULL
        )
    """)
    # Create friends table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS friends (
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            PRIMARY KEY (user_id, friend_id)
        )
    """)
    # Create messenger_messages table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messenger_messages (
            message_id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Create user_status table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_status (
            user_id INTEGER PRIMARY KEY,
            status VARCHAR(20) NOT NULL
        )
    """)
    # Create extracted_skills table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS extracted_skills (
            skill_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            skill TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
        )
    """)
    # Convert skill column from TEXT to JSONB
    cursor.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'extracted_skills' AND column_name = 'skill'
            ) THEN
                ALTER TABLE extracted_skills
                ALTER COLUMN skill TYPE JSONB
                USING to_jsonb(skill);
            END IF;
        END$$;
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_profiles (
        user_id SERIAL PRIMARY KEY,
        full_name VARCHAR(255),
        date_of_birth DATE,
        username VARCHAR(255) UNIQUE,
        current_status VARCHAR(255),
        resume_file VARCHAR(255),
        transcript_files TEXT[],
        university VARCHAR(255),
        degree VARCHAR(255),
        field_of_study VARCHAR(255),
        relevant_courses TEXT[],
        added_degrees JSONB,
        certifications JSONB,
        online_courses JSONB,
        work_experience JSONB,
        preferred_learning_pace VARCHAR(255),
        learning_commitment VARCHAR(255),
        preferred_learning_methods TEXT[],
        learning_goals TEXT[],
        projects JSONB,
        publications JSONB,
        career_goals TEXT[],
        skills TEXT[]
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES user_profiles(user_id),
        extracted_skills JSONB,
        final_score FLOAT,
        impact_statements JSONB,
        scoring_inputs JSONB,
        industry_validation JSONB,
        debug_messages TEXT[]
    );
    """)
    conn.commit()
    cursor.close()
    conn.close()

init_db_tables()

# User Authentication Models
class AuthUser(BaseModel):
    auth_user_id: int
    username: str
    password_hash: str

class CreateAuthUser(BaseModel):
    username: str
    password_hash: str

class LoginUser(BaseModel):
    username: str
    password_hash: str

class SignUpUser(BaseModel):
    username: str
    password_hash: str

# User Onboarding Data Model
class UserProfile(BaseModel):
    user_id: int
    username: str
    full_name: str
    date_of_birth: str
    current_status: Optional[str]
    resume_file: Optional[str]
    transcript_files: Optional[List[str]]
    university: Optional[str]
    degree: str
    field_of_study: str
    relevant_courses: List[str]
    added_degrees: List[Dict[str, Union[str, List[str]]]]
    certifications: List[Dict[str, str]]
    online_courses: List[Dict[str, str]]
    work_experience: List[Dict[str, str]]
    preferred_learning_pace: Optional[str]
    learning_commitment: Optional[str]
    preferred_learning_methods: List[str]
    learning_goals: List[str]
    project_link: Optional[str]
    project_title: Optional[str]
    project_description: Optional[str]
    publications: List[Dict[str, str]]
    career_goals: List[str]
    skills: List[str]

class StudyGroup(BaseModel):
    group_id: int
    name: str
    description: Optional[str]

class Message(BaseModel):
    message_id: int
    group_id: int
    user_id: int
    text: str
    timestamp: str

class User(BaseModel):
    user_id: int
    username: str

# Updated sign-up endpoint: now always inserts a user_profiles row with the new user_id.
@app.post("/sign-up")
def sign_up(user: SignUpUser):
    user.username = user.username.lower()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        logging.debug(f"Checking if username {user.username} already exists")
        cursor.execute("SELECT auth_user_id FROM auth_users WHERE username = %s", (user.username,))
        existing_user = cursor.fetchone()
        if (existing_user):
            raise HTTPException(status_code=400, detail="Account already exists. Please log in.")
        logging.debug(f"Creating new auth user with username: {user.username}")
        cursor.execute("""
            INSERT INTO auth_users (username, password_hash) 
            VALUES (%s, %s) RETURNING auth_user_id
        """, (user.username, user.password_hash))
        auth_user_id = cursor.fetchone()[0]
        # Insert default profile record with user_id and signup username.
        cursor.execute("""
            INSERT INTO user_profiles (user_id, username)
            VALUES (%s, %s)
            ON CONFLICT (user_id) DO NOTHING
        """, (auth_user_id, user.username))
        conn.commit()
        cursor.close()
        conn.close()
        return {
            "message": "Account created. Please complete your onboarding.",
            "auth_user_id": auth_user_id,
            "redirect": "/onboarding"
        }
    except Exception as e:
        logging.exception("Error signing up user")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Updated onboarding endpoint where mandatory fields are enforced:
@app.post("/onboarding")
async def onboarding(
    user_id: int = Form(...),
    full_name: str = Form(...),
    date_of_birth: Optional[str] = Form(None),
    username: str = Form(...),
    current_status: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    transcript_files: Optional[List[UploadFile]] = File(None),
    university: Optional[str] = Form(None),
    degree: str = Form(...),
    field_of_study: str = Form(...),
    relevant_courses: str = Form("[]"),
    added_degrees: str = Form("[]"),
    certifications: str = Form(...),
    online_courses: str = Form("[]"),
    work_experience: str = Form(...),
    preferred_learning_pace: Optional[str] = Form(None),
    learning_commitment: Optional[str] = Form(None),
    preferred_learning_methods: str = Form("[]"),
    learning_goals: str = Form("[]"),
    projects: str = Form("[]"),          # New parameter for projects array
    publications: str = Form("[]"),
    career_goals: str = Form("[]"),
    skills: str = Form("[]")
):
    # Log incoming values to confirm they match the form submission
    logging.debug("Onboarding details to be inserted:")
    logging.debug({
        "user_id": user_id,
        "full_name": full_name,
        "date_of_birth": date_of_birth,
        "username": username,
        "current_status": current_status,
        "resume_file": resume_file.filename if resume_file else None,
        "transcript_files": [f.filename for f in transcript_files] if transcript_files else [],
        "university": university,
        "degree": degree,
        "field_of_study": field_of_study,
        "relevant_courses": relevant_courses,
        "added_degrees": added_degrees,
        "certifications": certifications,
        "online_courses": online_courses,
        "work_experience": work_experience,
        "preferred_learning_pace": preferred_learning_pace,
        "learning_commitment": learning_commitment,
        "preferred_learning_methods": preferred_learning_methods,
        "learning_goals": learning_goals,
        "projects": projects,
        "publications": publications,
        "career_goals": career_goals,
        "skills": skills
    })

    logging.debug("career_goals received: %s", career_goals)
    logging.debug("learning_goals received: %s", learning_goals)
    logging.debug("projects received: %s", projects)
    logging.debug("skills received: %s", skills)

    # Remove any existing record for this user
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_profiles WHERE user_id = %s", (user_id,))

    # Process file names
    resume_file_name = resume_file.filename if resume_file else None
    transcript_files_names = [f.filename for f in transcript_files] if transcript_files else []

    # Ensure these fields are not undefined
    final_preferred_learning_pace = preferred_learning_pace if preferred_learning_pace is not None else ""
    final_learning_goals = learning_goals if learning_goals else "[]"
    final_publications = json.dumps(safe_json_load(publications), ensure_ascii=False)
    final_career_goals = json.dumps(safe_json_load(career_goals), ensure_ascii=False)
    final_skills = json.dumps(safe_json_load(skills), ensure_ascii=False)
    final_projects = json.dumps(safe_json_load(projects), ensure_ascii=False)  # New projects variable

    # Convert 'null' or empty date_of_birth to None
    final_date_of_birth = None
    if date_of_birth and date_of_birth.strip().lower() not in ["null", ""]:
        final_date_of_birth = date_of_birth

    # Removed final_projects from parameters
    params = (
        user_id,
        full_name,
        final_date_of_birth,  # Use final_date_of_birth
        username,
        current_status,
        resume_file_name,
        json.dumps(transcript_files_names),
        university,
        degree,
        field_of_study,
        json.dumps(safe_json_load(relevant_courses)),
        json.dumps(safe_json_load(added_degrees)),
        json.dumps(safe_json_load(certifications)),
        json.dumps(safe_json_load(online_courses)),
        json.dumps(safe_json_load(work_experience), ensure_ascii=False),
        final_preferred_learning_pace,
        learning_commitment,
        json.dumps(safe_json_load(preferred_learning_methods), ensure_ascii=False),
        json.dumps(safe_json_load(learning_goals), ensure_ascii=False),
        final_projects,   # Use projects array value here
        final_publications,
        final_career_goals,
        final_skills               # Use the processed skills here
    )
    query = """
        INSERT INTO user_profiles 
            (user_id, full_name, date_of_birth, username, current_status, resume_file, transcript_files, university, degree, field_of_study,
             relevant_courses, added_degrees, certifications, online_courses, work_experience, preferred_learning_pace, learning_commitment,
             preferred_learning_methods, learning_goals, projects, publications, career_goals, skills)
        VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb,
            %s, %s, %s::jsonb, %s::jsonb, %s, %s::jsonb, %s::jsonb, %s::jsonb
        )
    """
    logging.debug(f"Executing onboarding query with parameters: {params}")
    cursor.execute(query, params)
    conn.commit()
    logging.debug("DB commit successful; profile updated/inserted")

    # Extract skills from the provided text
    text = f"{field_of_study} {relevant_courses} {added_degrees} {certifications} {online_courses} {work_experience} {projects}"
    skills = extract_skills(text)
    logging.debug(f"Extracted skills: {skills}")

    # Insert extracted skills into the database: only send "name" and "proficiency"
    for skill_obj in skills:
        # Filter only required fields; default proficiency to 0 if not provided.
        filtered_skill = {
            "name": skill_obj.get("name", ""),
            "proficiency": skill_obj.get("proficiency", 0)
        }
        cursor.execute("""
            INSERT INTO extracted_skills (user_id, skill)
            VALUES (%s, %s::jsonb)
        """, (user_id, json.dumps(filtered_skill)))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "User onboarding data stored successfully"}

@app.post("/onboarding")
def onboarding(data: dict = Body(...)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE user_profiles
            SET project_link = %s,
                project_title = %s,
                project_description = %s,
                career_goals = %s,
                learning_goals = %s,
                skills = %s
            WHERE user_id = %s
        """, (
            data.get("project_link"),
            data.get("project_title"),
            data.get("project_description"),
            data.get("career_goals"),
            data.get("learning_goals"),
            data.get("skills"),
            data.get("user_id")
        ))
        conn.commit()
        return {"message": "Profile updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# Login endpoint
@app.post("/login")
def login(user: LoginUser):
    # Normalize username to lowercase for consistency
    user.username = user.username.lower()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        logging.debug(f"Login attempt for username: {user.username}")
        cursor.execute("SELECT auth_user_id FROM auth_users WHERE username = %s AND password_hash = %s", (user.username, user.password_hash))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        auth_user_id = result[0]
        # Use a multi-line query with to_char conversion
        cursor.execute("""
            SELECT user_id, full_name, to_char(date_of_birth, 'YYYY-MM-DD') as date_of_birth, username, current_status, 
                   resume_file, transcript_files, university, degree, field_of_study, relevant_courses, added_degrees, 
                   certifications, online_courses, work_experience, preferred_learning_pace, learning_commitment, 
                   preferred_learning_methods, learning_goals, project_link, project_title, project_description
            FROM user_profiles WHERE user_id = %s
        """, (auth_user_id,))
        profile_result = cursor.fetchone()
        
        # Update user status to 'online'
        cursor.execute("""
            INSERT INTO user_status (user_id, status)
            VALUES (%s, 'online')
            ON CONFLICT (user_id) DO UPDATE SET status = 'online'
        """, (auth_user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()

        if profile_result:
            profile_data = {
                "user_id": profile_result[0],
                "full_name": profile_result[1],
                "date_of_birth": profile_result[2],
                "username": profile_result[3],
                "current_status": profile_result[4],
                "resume_file": profile_result[5],
                "transcript_files": profile_result[6],
                "university": profile_result[7],
                "degree": profile_result[8],
                "field_of_study": profile_result[9],
                "relevant_courses": profile_result[10],
                "added_degrees": profile_result[11],
                "certifications": profile_result[12],
                "online_courses": profile_result[13],
                "work_experience": profile_result[14],
                "preferred_learning_pace": profile_result[15],
                "learning_commitment": profile_result[16],
                "preferred_learning_methods": profile_result[17],
                "learning_goals": profile_result[18],
                "project_link": profile_result[19],
                "project_title": profile_result[20],
                "project_description": profile_result[21],
            }
            return {
                "message": "Login successful. Redirecting to home page.",
                "auth_user_id": auth_user_id,
                "profile_data": profile_data,
                "username": user.username,
                "redirect": "/home"
            }
        else:
            return {
                "message": "Login successful. Please complete your onboarding.",
                "auth_user_id": auth_user_id,
                "profile_data": None,
                "username": user.username,
                "redirect": "/onboarding"
            }
    except Exception as e:
        logging.exception("Error during login")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/onboarding-details")
def get_onboarding_details(user_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT user_id, full_name, to_char(date_of_birth, 'YYYY-MM-DD') as date_of_birth, username, current_status,
                   resume_file, transcript_files, university, degree, field_of_study, relevant_courses, added_degrees,
                   certifications, online_courses, work_experience, preferred_learning_pace, learning_commitment,
                   preferred_learning_methods, learning_goals, project_link, project_title, project_description, publications, career_goals, skills
            FROM user_profiles WHERE user_id = %s
        """, (user_id,))
        profile_result = cursor.fetchone()
        
        if not profile_result:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_data = {
            "user_id": profile_result[0],
            "full_name": profile_result[1],
            "date_of_birth": profile_result[2],
            "username": profile_result[3],
            "current_status": profile_result[4],
            "resume_file": profile_result[5],
            "transcript_files": profile_result[6],
            "university": profile_result[7],
            "degree": profile_result[8],
            "field_of_study": profile_result[9],
            "relevant_courses": profile_result[10],
            "added_degrees": profile_result[11],
            "certifications": profile_result[12],
            "online_courses": profile_result[13],
            "work_experience": profile_result[14],
            "preferred_learning_pace": profile_result[15],
            "learning_commitment": profile_result[16],
            "preferred_learning_methods": profile_result[17],
            "learning_goals": profile_result[18],
            "project_link": profile_result[19],
            "project_title": profile_result[20],
            "project_description": profile_result[21],
            "publications": profile_result[22],
            "career_goals": profile_result[23],
            "skills": profile_result[24]
        }
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return profile_data
    
    except Exception as e:
        logging.exception("Error fetching onboarding details")
        raise HTTPException(status_code=500, detail="Internal server error")

# Create a new study group
@app.post("/study-groups")
def create_study_group(name: str = Form(...), description: Optional[str] = Form(None)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO study_groups (name, description)
            VALUES (%s, %s) RETURNING group_id
        """, (name, description))
        group_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Study group created successfully", "group_id": group_id}
    except Exception as e:
        logging.exception("Error creating study group")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Join an existing study group
@app.post("/study-groups/{group_id}/join")
def join_study_group(group_id: int, user_id: int = Form(...)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO study_group_members (group_id, user_id)
            VALUES (%s, %s)
        """, (group_id, user_id))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Joined study group successfully"}
    except Exception as e:
        logging.exception("Error joining study group")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Send a message in a study group
@app.post("/study-groups/{group_id}/messages")
def send_message(group_id: int, user_id: int = Form(...), text: str = Form(...)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO messages (group_id, user_id, text, timestamp)
            VALUES (%s, %s, %s, NOW()) RETURNING message_id
        """, (group_id, user_id, text))
        message_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Message sent successfully", "message_id": message_id}
    except Exception as e:
        logging.exception("Error sending message")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Fetch messages for a study group
@app.get("/study-groups/{group_id}/messages")
def fetch_messages(group_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.message_id, m.user_id, up.username, m.text, m.timestamp
            FROM messages m
            JOIN user_profiles up ON m.user_id = up.user_id
            WHERE m.group_id = %s
            ORDER BY m.timestamp ASC
        """, (group_id,))
        messages = cursor.fetchall()
        conn.commit()
        cursor.close()
        conn.close()
        messages_list = [
            {"message_id": m[0], "user_id": m[1], "username": m[2], "text": m[3], "timestamp": m[4]} 
            for m in messages
        ]
        return {"messages": messages_list}
    except Exception as e:
        logging.exception("Error fetching messages")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Fetch all study groups
@app.get("/study-groups")
def fetch_study_groups():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT group_id, name, description
            FROM study_groups
        """)
        study_groups = cursor.fetchall()
        conn.commit()
        cursor.close()
        conn.close()
        return {"study_groups": study_groups}
    except Exception as e:
        logging.exception("Error fetching study groups")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# --- Messenger Endpoints ---
# Note: The following REST endpoints rely on client-side polling.
# To auto load messages, ensure that the client includes the required "user_id" query parameter 
# when calling GET /messenger/{friendName}/messages.
@app.get("/messenger/{friendName}/messages")
def fetch_messenger_messages(friendName: str, user_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Lookup friend's user_id from user_profiles table
        cursor.execute("SELECT user_id FROM user_profiles WHERE username = %s", (friendName.lower(),))
        friend_record = cursor.fetchone()
        if not friend_record:
            raise HTTPException(status_code=404, detail="Friend not found")
        friend_user_id = friend_record[0]
        # Fetch conversation messages between current user and friend
        cursor.execute("""
            SELECT m.message_id, m.sender_id, m.text, m.timestamp
            FROM messenger_messages m
            WHERE (m.sender_id = %s AND m.receiver_id = %s)
               OR (m.sender_id = %s AND m.receiver_id = %s)
            ORDER BY m.timestamp ASC
        """, (user_id, friend_user_id, friend_user_id, user_id))
        messages = cursor.fetchall()
        conn.commit()
        cursor.close()
        conn.close()
        messages_list = [
            {"message_id": m[0], "sender_id": m[1], "text": m[2], "timestamp": m[3]} 
            for m in messages
        ]
        return {"messages": messages_list}
    except Exception as e:
        logging.exception("Error fetching messenger messages")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/messenger/{friendName}/messages")
def send_messenger_message(friendName: str, user_id: int = Form(...), text: str = Form(...)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Lookup friend's user_id from user_profiles table
        cursor.execute("SELECT user_id FROM user_profiles WHERE username = %s", (friendName.lower(),))
        friend_record = cursor.fetchone()
        if not friend_record:
            raise HTTPException(status_code=404, detail="Friend not found")
        friend_user_id = friend_record[0]
        # Insert new messenger message with sender as current user and receiver as friend
        cursor.execute("""
            INSERT INTO messenger_messages (sender_id, receiver_id, text, timestamp)
            VALUES (%s, %s, %s, NOW()) RETURNING message_id
        """, (user_id, friend_user_id, text))
        message_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Message sent successfully", "message_id": message_id}
    except Exception as e:
        logging.exception("Error sending messenger message")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# New friend invite endpoints

# Send a friend invite
@app.post("/friends/invite")
def send_friend_invite(sender_id: int = Form(...), receiver_username: str = Form(...)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Lookup receiver's user_id
        cursor.execute("SELECT user_id FROM user_profiles WHERE username = %s", (receiver_username.lower(),))
        receiver = cursor.fetchone()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")
        receiver_id = receiver[0]
        # Check if an invite from this sender to receiver already exists and is pending
        cursor.execute("""
            SELECT invite_id FROM friend_invites 
            WHERE sender_id = %s AND receiver_id = %s AND status = 'pending'
        """, (sender_id, receiver_id))
        existing_invite = cursor.fetchone()
        if existing_invite:
            cursor.close()
            conn.close()
            return {"message": "Invite already sent", "invite_id": existing_invite[0]}
        # Insert a pending invite into friend_invites table
        cursor.execute("""
            INSERT INTO friend_invites (sender_id, receiver_id, status)
            VALUES (%s, %s, 'pending') RETURNING invite_id
        """, (sender_id, receiver_id))
        invite_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Friend invite sent", "invite_id": invite_id}
    except Exception as e:
        logging.exception("Error sending friend invite")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Accept a friend invite
@app.post("/friends/accept")
def accept_friend_invite(invite_id: int = Form(...)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Update invite status to accepted
        cursor.execute("""
            UPDATE friend_invites SET status = 'accepted'
            WHERE invite_id = %s RETURNING sender_id, receiver_id
        """, (invite_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Invite not found")
        sender_id, receiver_id = result
        # Optionally, establish mutual friendship (depending on your schema)
        cursor.execute("""
            INSERT INTO friends (user_id, friend_id) VALUES (%s, %s), (%s, %s)
            ON CONFLICT DO NOTHING
        """, (sender_id, receiver_id, receiver_id, sender_id))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Friend invite accepted"}
    except Exception as e:
        logging.exception("Error accepting friend invite")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Fetch pending friend invites for a user (received)
@app.get("/friends/invitations")
def get_friend_invitations(user_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT fi.invite_id, up.username as sender
            FROM friend_invites fi
            JOIN user_profiles up ON fi.sender_id = up.user_id
            WHERE fi.receiver_id = %s AND fi.status = 'pending'
        """, (user_id,))
        invitations = cursor.fetchall()
        conn.commit()
        cursor.close()
        conn.close()
        invites = [{"invite_id": i[0], "sender": i[1]} for i in invitations]
        return {"invitations": invites}
    except Exception as e:
        logging.exception("Error fetching friend invitations")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Fetch accepted friends for a user
@app.get("/friends")
def get_friends(user_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT up.user_id, up.username 
            FROM friends f
            JOIN user_profiles up ON f.friend_id = up.user_id
            WHERE f.user_id = %s
        """, (user_id,))
        friends_list = cursor.fetchall()
        conn.commit()
        cursor.close()
        conn.close()
        friends = [{"user_id": f[0], "username": f[1]} for f in friends_list]
        return {"friends": friends}
    except Exception as e:
        logging.exception("Error fetching friends")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# New endpoint to search users by username
@app.get("/user/search")
def search_users(query: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_id, username FROM user_profiles WHERE username ILIKE %s LIMIT 10",
            (f"%{query}%",)
        )
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        users = [{"user_id": r[0], "username": r[1]} for r in results]
        return {"users": users}
    except Exception as e:
        logging.exception("Error searching users")
        raise HTTPException(status_code=500, detail="Internal server error")

# New endpoint to fetch user suggestions excluding already connected friends
@app.get("/user/suggestions")
def user_suggestions(user_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT user_id, username FROM user_profiles 
            WHERE user_id != %s AND user_id NOT IN (
                  SELECT friend_id FROM friends WHERE user_id = %s
              )
            LIMIT 10
        """, (user_id, user_id))
        suggestions = cursor.fetchall()
        cursor.close()
        conn.close()
        return {"suggestions": [{"user_id": r[0], "username": r[1]} for r in suggestions]}
    except Exception as e:
        logging.exception("Error fetching user suggestions")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Endpoint to update user status
@app.post("/user/status")
def update_user_status(user_id: int = Form(...), status: str = Form(...)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        logging.debug(f"Updating status for user_id: {user_id} to {status}")
        cursor.execute("""
            INSERT INTO user_status (user_id, status)
            VALUES (%s, %s)
            ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status
        """, (user_id, status))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "User status updated successfully"}
    except Exception as e:
        logging.exception("Error updating user status")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Endpoint to fetch user status by username
@app.get("/user/status")
def get_user_status(username: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        logging.debug(f"Fetching status for username: {username}")
        cursor.execute("SELECT status FROM user_status us JOIN user_profiles up ON us.user_id = up.user_id WHERE up.username = %s", (username.lower(),))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result:
            logging.debug(f"Status for username {username}: {result[0]}")
            return {"status": result[0]}
        else:
            logging.debug(f"No status found for username {username}, defaulting to offline")
            return {"status": "offline"}
    except Exception as e:
        logging.exception("Error fetching user status")
        raise HTTPException(status_code=500, detail="Internal server error")

# Endpoint to update user status to online based on activity
@app.post("/user/activity")
def update_user_activity(user_id: int = Form(...)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        logging.debug(f"Updating activity status for user_id: {user_id} to online")
        cursor.execute("""
            INSERT INTO user_status (user_id, status)
            VALUES (%s, 'online')
            ON CONFLICT (user_id) DO UPDATE SET status = 'online'
        """, (user_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "User activity status updated to online"}
    except Exception as e:
        logging.exception("Error updating user activity status")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Endpoint to fetch user profile details by username
@app.get("/user/profile")
def get_user_profile(username: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_profiles WHERE username = %s", (username.lower(),))
        profile_result = cursor.fetchone()
        if not profile_result:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Use safe_json_load for JSON fields.
        added_degrees = safe_json_load(profile_result[11])
        if not added_degrees:
            # Fallback to separate education fields if no degrees added
            education = [{
                "university": profile_result[7] or "Not provided",
                "degree": profile_result[8] or "Not provided",
                "field_of_study": profile_result[9] or "Not provided",
                "relevant_courses": profile_result[10] or "Not provided"
            }]
        else:
            education = added_degrees

        # Fetch extracted skills for the user (if any)
        cursor.execute("SELECT skill FROM extracted_skills WHERE user_id = %s", (profile_result[0],))
        skills_rows = cursor.fetchall()
        extracted_skills = [row[0] for row in skills_rows]

        profile_data = {
            "user_id": profile_result[0],
            "full_name": profile_result[1],
            "date_of_birth": profile_result[2],
            "username": profile_result[3],
            "current_status": profile_result[4],
            "resume_file": profile_result[5],
            "transcript_file": profile_result[6],
            "education": education,
            "certifications": profile_result[12],
            "online_courses": profile_result[13],
            "work_experience": profile_result[14],
            "preferred_learning_pace": profile_result[15],
            "learning_commitment": profile_result[16],
            "preferred_learning_methods": profile_result[17],
            "learning_goals": profile_result[18],
            "project_link": profile_result[19],
            "project_title": profile_result[20],
            "project_description": profile_result[21],
            "publications": profile_result[22],
            "career_goals": profile_result[23],
            "skills": extracted_skills
        }
        conn.commit()
        cursor.close()
        conn.close()
        return profile_data
    except Exception as e:
        logging.exception("Error fetching user profile")
        raise HTTPException(status_code=500, detail="Internal server error")

# --- Call Endpoints ---
# Note: The /calls/voice and /calls/video endpoints are placeholders.
# They do not implement an automatic update mechanism.
# For real-time call updates, consider integrating the WebSocket endpoint ("/ws/{client_id}") 
# or a similar real-time solution.
@app.post("/calls/voice")
async def initiate_voice_call(caller: str = Form(...), callee: str = Form(...)):
    """
    Endpoint to initiate a voice call between caller and callee.
    Placeholder logic for voice call initiation.
    """
    try:
        # Placeholder: Add actual voice call initiation logic here
        logging.info(f"Voice call initiated from {caller} to {callee}")
        return {"status": "Voice call initiated", "caller": caller, "callee": callee}
    except Exception as e:
        logging.exception("Error initiating voice call")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/calls/video")
async def initiate_video_call(caller: str = Form(...), callee: str = Form(...)):
    """
    Endpoint to initiate a video call between caller and callee.
    Placeholder logic for video call initiation.
    """
    try:
        # Placeholder: Add actual video call initiation logic here
        logging.info(f"Video call initiated from {caller} to {callee}")
        return {"status": "Video call initiated", "caller": caller, "callee": callee}
    except Exception as e:
        logging.exception("Error initiating video call")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

import asyncio

# WebSocket endpoint for signaling
connected_clients = {}
# Track active calls
active_calls = set()
hangup_counts = {}  # Track number of hangup triggers per call_id

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    logging.info(f"Client {client_id} attempting to connect...")
    await websocket.accept()
    logging.info(f"Client {client_id} connected.")
    connected_clients[client_id] = websocket
    logging.debug(f"Current connected clients: {connected_clients.keys()}") # ADDED LOGGING
    try:
        while True:
            try:
                data = await websocket.receive_text()
                logging.debug(f"Received data from client {client_id}: {data}")
                try:
                    message = json.loads(data)
                    msg_type = message.get("type")
                    if msg_type == "offer":
                        recipient = str(message.get("to"))
                        if recipient in connected_clients:
                            await connected_clients[recipient].send_text(json.dumps(message))
                        else:
                            logging.warning(f"Offer recipient {recipient} not connected.")
                    elif msg_type == "answer":
                        recipient = str(message.get("to"))
                        if recipient in connected_clients:
                            await connected_clients[recipient].send_text(json.dumps(message))
                        else:
                            logging.warning(f"Answer recipient {recipient} not connected.")
                    elif msg_type == "candidate":
                        recipient = str(message.get("to"))
                        if recipient in connected_clients:
                            await connected_clients[recipient].send_text(json.dumps(message))
                        else:
                            logging.warning(f"Candidate recipient {recipient} not connected.")
                    elif msg_type == "hangup":
                        call_id = frozenset([client_id, str(message.get("to"))])
                        if call_id not in hangup_counts:
                            hangup_counts[call_id] = 0
                        if hangup_counts[call_id] < 3:
                            hangup_counts[call_id] += 1
                            if call_id in active_calls:
                                active_calls.remove(call_id)
                            recipient = str(message.get("to"))
                            if recipient in connected_clients:
                                await connected_clients[recipient].send_text(json.dumps({
                                    "type": "hangup",
                                    "from": client_id
                                }))
                            else:
                                logging.warning(f"Hangup recipient {recipient} not connected.")
                    elif message.get("type") == "call":
                        # Track the active call
                        call_id = frozenset([client_id, str(message.get("to"))])
                        active_calls.add(call_id)
                        # Notify the callee about the incoming call
                        callee = message.get("to")
                        if (callee in connected_clients):
                            try:
                                await connected_clients[callee].send_text(json.dumps(message))
                            except Exception as e:
                                logging.error(f"Failed to send call notification to {callee}: {e}")
                        else:
                            logging.warning(f"Recipient {callee} not connected.")
                    elif message.get("type") == "message":
                        # Save the message to the database
                        sender_id = message.get("from")
                        recipient_id = message.get("to")
                        text = message.get("text")
                        try:
                            conn = get_db_connection()
                            cursor = conn.cursor()
                            cursor.execute("""
                                INSERT INTO messenger_messages (sender_id, receiver_id, text, timestamp)
                                VALUES (%s, %s, %s, NOW()) RETURNING message_id
                            """, (sender_id, recipient_id, text))
                            message_id = cursor.fetchone()[0]
                            conn.commit()
                            cursor.close()
                            conn.close()
                            logging.info(f"Message saved to database with message_id: {message_id}")
                        except Exception as e:
                            logging.error(f"Failed to save message to database: {e}")

                        # Broadcast the message to the recipient
                        recipient = message.get("to")
                        if str(recipient) in connected_clients:
                            try:
                                await connected_clients[str(recipient)].send_text(json.dumps(message))
                            except Exception as e:
                                logging.error(f"Failed to send message to {recipient}: {e}")
                        else:
                            logging.warning(f"Recipient {recipient} not connected. connected_clients: {connected_clients.keys()}")
                    elif message.get("type") == "ringing":
                        # Handle ringing notification
                        recipient = message.get("to")
                        if str(recipient) in connected_clients:
                            try:
                                await connected_clients[str(recipient)].send_text(json.dumps(message))
                            except Exception as e:
                                logging.error(f"Failed to send ringing notification to {recipient}: {e}")
                        else:
                            logging.warning(f"Recipient {recipient} not connected.")
                    elif message.get("type") == "accept":
                        # Handle call accept
                        recipient = message.get("to")
                        if str(recipient) in connected_clients:
                            try:
                                await connected_clients[str(recipient)].send_text(json.dumps(message))
                            except Exception as e:
                                logging.error(f"Failed to send accept notification to {recipient}: {e}")
                        else:
                            logging.warning(f"Recipient {recipient} not connected.")
                    elif message.get("type") == "reject":
                        # Handle call reject
                        recipient = message.get("to")
                        if str(recipient) in connected_clients:
                            try:
                                await connected_clients[str(recipient)].send_text(json.dumps(message))
                            except Exception as e:
                                logging.error(f"Failed to send reject notification to {recipient}: {e}")
                        else:
                            logging.warning(f"Recipient {recipient} not connected.")
                    else:
                        logging.warning(f"Received unknown message type: {message.get('type')}")
                except json.JSONDecodeError as e:
                    logging.error(f"Failed to decode JSON: {e}")
                    await websocket.send_text("Invalid JSON format")
            except WebSocketDisconnect as e:
                logging.info(f"Client {client_id} disconnected with code {e.code}: {e.reason}")
                break
            except Exception as e:
                logging.error(f"WebSocket error: {e}")
                break
    except WebSocketDisconnect:
        print(f"Client #{client_id} disconnected")
    finally:
        # Clean up resources
        if client_id in connected_clients:
            del connected_clients[client_id]
            logging.info(f"Client {client_id} removed from connected_clients.")
        pass  # Implement cleanup logic

def extract_skills(text: str) -> List[Dict[str, str]]:
    # Ensure we return a list of dicts with a "name" key
    if not text or not text.strip():
        return []
    return [{"name": text.strip()}]

# # Load Gemma model from Hugging Face
# model_name = "google/gemma-2-2b"
# # Access the token from the environment variable
# hf_token = os.environ.get("hf_pat")
# tokenizer = AutoTokenizer.from_pretrained(model_name, use_auth_token=hf_token)
# model = AutoModelForCausalLM.from_pretrained(model_name, use_auth_token=hf_token)
# # Define a function to get AI tutor responses
# def get_ai_tutor_response(prompt: str):
#     inputs = tokenizer(prompt, return_tensors="pt")
#     output = model.generate(**inputs, max_length=512)
#     return tokenizer.decode(output[0])
# # Define FastAPI route for Gemma AI tutoring
# @app.post("/ai-tutor/")
# async def ai_tutor(prompt: str = Form(...)):
#     response = get_ai_tutor_response(prompt)
#     return {"response": response}

@app.post("/skill-extraction")
async def skill_extraction(data: dict = Body(...)):
    try:
        # Use the actual analyze_user_profile function
        result = analyze_user_profile(json.dumps(data))
        
        # Save the analysis results to the analysis_results table
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO analysis_results (user_id, extracted_skills, final_score, impact_statements, scoring_inputs, industry_validation, debug_messages)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                extracted_skills = EXCLUDED.extracted_skills,
                final_score = EXCLUDED.final_score,
                impact_statements = EXCLUDED.impact_statements,
                scoring_inputs = EXCLUDED.scoring_inputs,
                industry_validation = EXCLUDED.industry_validation,
                debug_messages = EXCLUDED.debug_messages
        """, (
            data.get("user_id"),
            json.dumps(result.get("Extracted Skills")),
            result.get("Final Score"),
            json.dumps(result.get("Impact Statements")),
            json.dumps(result.get("Scoring Inputs")),
            json.dumps(result.get("Industry Validation")),
            result.get("debugMessages")
        ))
        
        # Update the user_profiles table with the extracted skills and knowledge gaps
        cursor.execute("""
            UPDATE user_profiles
            SET skills = %s, knowledge_gaps = %s, extracted_skills = %s
            WHERE user_id = %s
        """, (
            json.dumps(result.get("Extracted Skills")),
            json.dumps(result.get("Industry Validation").get("missing_skills")),
            json.dumps(result.get("Extracted Skills")),
            data.get("user_id")
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        with open("ai_skill_analysis.json", "w") as f:
            json.dump(result, f, indent=4)
        return result
    except Exception as e:
        logging.exception("Error during skill extraction")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/update-skills")
async def update_skills(data: dict = Body(...)):
    try:
        user_id = data.get("user_id")
        extracted_skills = data.get("extracted_skills", {})
        knowledge_gaps = data.get("knowledge_gaps", [])

        # Update the user_profiles table with the extracted skills and knowledge gaps
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE user_profiles
            SET extracted_skills = %s, knowledge_gaps = %s
            WHERE user_id = %s
        """, (json.dumps(extracted_skills), json.dumps(knowledge_gaps), user_id))
        conn.commit()
        cursor.close()
        conn.close()

        return {"message": "Skills and knowledge gaps updated successfully"}
    except Exception as e:
        logging.exception("Error updating skills and knowledge gaps")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/")
def home():
    return {"message": "EduFlix Backend is Running!"}

@app.get("/linkedin/auth")
def linkedin_auth():
    # Redirect user to LinkedIn's OAuth 2.0 authorization page using a 302 redirect
    auth_url = (
        "https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={LINKEDIN_CLIENT_ID}"
        f"&redirect_uri={LINKEDIN_REDIRECT_URI}"
        f"&state=123456"  # In production, generate a unique state.
        f"&scope=r_liteprofile%20r_emailaddress"
    )
    return RedirectResponse(auth_url, status_code=302)  # Changed status code here

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="debug")

















