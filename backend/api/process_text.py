from fastapi import APIRouter, HTTPException
import re
import string

router = APIRouter()

def preprocess_text(input_text: str):
    # Lowercase conversion
    text = input_text.lower()
    # Remove punctuation using regex
    text = re.sub(rf"[{re.escape(string.punctuation)}]", "", text)
    # Split text into tokens based on whitespace
    tokens = text.split()
    return tokens

@router.post("/api/process-text")
def process_text(data: dict):
    if "text" not in data:
        raise HTTPException(status_code=400, detail="No text provided")
    tokens = preprocess_text(data["text"])
    if not tokens:
        raise HTTPException(status_code=400, detail="Input data is too short after preprocessing.")
    return {"tokens": tokens}
