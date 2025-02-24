import os
import spacy
from transformers import pipeline

# Load spaCy English model for NER and noun chunking
nlp = spacy.load("en_core_web_sm")

# Retrieve token from environment; ensure you set HF_TOKEN if required
hf_token = os.environ.get("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")

# Load RoBERTa fill-mask pipeline, passing token if available
roberta_pipeline = pipeline("fill-mask", model="roberta-base")

def extract_skills(text: str) -> list:
    # Use spaCy to extract candidate phrases (noun chunks)
    doc = nlp(text)
    spacy_candidates = {chunk.text.strip() for chunk in doc.noun_chunks if len(chunk.text.strip()) > 2}
    
    # Refine candidates using RoBERTa contextual predictions.
    # For each candidate, we insert a mask in a template sentence.
    refined_candidates = set()
    # Use the proper mask token (<mask> for RoBERTa)
    template = "I have experience with <mask>."
    predictions = roberta_pipeline(template)
    # Gather the predicted token strings from RoBERTa
    roberta_preds = {pred["token_str"].strip().lower() for pred in predictions}
    
    # Add candidate if it appears in the RoBERTa predictions
    for candidate in spacy_candidates:
        if candidate.lower() in roberta_preds:
            refined_candidates.add(candidate)
    
    # Combine both sets to allow flexibility
    combined = spacy_candidates.union(refined_candidates)
    return list(combined)

# For testing
if __name__ == "__main__":
    sample_text = (
        "Developing an advanced AI-powered system designed to transform highway safety by automating traffic monitoring and violation enforcement. The project integrates state-of-the-art computer vision, IoT, and real-time data analytics to create a scalable, efficient, and autonomous solution for modern traffic challenges."
"Key Highlights:"
"Precision Monitoring: Utilizes cutting-edge AI for real-time detection and recognition of vehicles and traffic violations."
"Data-Driven Insights: Incorporates mapping technologies to identify high-risk zones and optimize enforcement strategies."
"Scalability: Engineered for seamless deployment across diverse geographies and environments, ensuring adaptability and efficiency."
"User-Centric Design: Focuses on creating an intuitive interface for law enforcement agencies, ensuring ease of use and effective management of traffic data."
"Environmental Impact: Promotes sustainable traffic management practices by reducing manual intervention and enhancing operational efficiency."
"Technologies & Tools:"
"AI and machine learning for detection and analysis."
"IoT-enabled hardware for dynamic, real-time operations."
"Mapping APIs and cloud-based architecture for data integration."
"User-friendly dashboards and analytics tools for law enforcement."
    )
    skills = extract_skills(sample_text)
    print("Extracted Skills:", skills)
