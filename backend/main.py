from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
import os

app = FastAPI()

# Connect to PostgreSQL Database
conn = psycopg2.connect(
    dbname="eduflix_db",
    user="eduflix_user",
    password="securepassword",
    host="localhost"
)
cursor = conn.cursor()

# Pydantic model for data validation
class OnboardingData(BaseModel):
    user_id: int
    has_bachelors: bool
    has_masters: bool
    has_phd: bool
    degree_courses: list[str]
    online_courses: list[str]
    certifications: list[str]
    work_experience: dict
    learning_speed: str
    career_goals: str
    learning_preferences: list[str]

# API to collect onboarding data
@app.post("/onboarding")
def store_onboarding(data: OnboardingData):
    try:
        cursor.execute("""
            INSERT INTO user_profiles (user_id, has_bachelors, has_masters, has_phd, 
                                       degree_courses, online_courses, certifications, 
                                       work_experience, learning_speed, career_goals, learning_preferences) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (data.user_id, data.has_bachelors, data.has_masters, data.has_phd,
              data.degree_courses, data.online_courses, data.certifications,
              str(data.work_experience), data.learning_speed, data.career_goals, data.learning_preferences))
        conn.commit()
        return {"message": "User onboarding data stored successfully"}
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))
