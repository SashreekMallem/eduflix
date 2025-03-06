import requests
import json
import math
import datetime
from youtube_transcript_api import YouTubeTranscriptApi
from openai import OpenAI
import os  # New import for filesystem operations
import re  # Add import for regex if not already present
import spacy  # New import for spacy
from nltk.tokenize import word_tokenize  # New import for nltk
from nltk.corpus import stopwords  # New import for nltk

# Load spacy model (ensure 'en_core_web_sm' is installed)
nlp = spacy.load("en_core_web_sm")

# YouTube API Key (Replace with your own API Key)
YOUTUBE_API_KEY = "AIzaSyBktWr9NEB_mp6JHaHIuY_gYJpsgfbh_Vs"

# Initialize OpenAI client
client = OpenAI()

# Function to search YouTube for videos
def search_youtube(query, max_results=50):
    search_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&type=video&maxResults={max_results}&key={YOUTUBE_API_KEY}"
    response = requests.get(search_url)
    print("🔍 YouTube API Response Status:", response.status_code)
    try:
        data = response.json()
    except Exception as e:
        print("❌ Error parsing JSON for query:", query, e)
        data = {}
    print("📃 Response JSON:", data)
    video_ids = set()
    if "items" in data:
        for item in data["items"]:
            video_ids.add(item["id"]["videoId"])
    return list(video_ids)

# Function to fetch video engagement data
def fetch_youtube_data(video_ids):
    video_id_string = ",".join(video_ids)
    url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id={video_id_string}&key={YOUTUBE_API_KEY}"
    response = requests.get(url)
    data = response.json()
    
    videos_data = {}
    if "items" in data:
        for video in data["items"]:
            vid = video["id"]
            title = video["snippet"]["title"]
            views = int(video["statistics"].get("viewCount", 0))
            likes = int(video["statistics"].get("likeCount", 0))
            comments = int(video["statistics"].get("commentCount", 0))
            upload_date = video["snippet"]["publishedAt"]

            # Store unique videos based on video id; include vid in tuple
            videos_data[vid] = (vid, title, "YouTube", views, likes, comments, upload_date)
    return list(videos_data.values())

# Function to normalize data (Min-Max Scaling)
def normalize(value, min_value, max_value):
    if max_value == min_value:
        return 0  # Prevent division by zero
    return (value - min_value) / (max_value - min_value)

# Function to calculate recency factor
def recency_factor(upload_date):
    lambda_decay = 0.01  # Decay constant
    upload_datetime = datetime.datetime.strptime(upload_date, "%Y-%m-%dT%H:%M:%SZ")
    days_since_upload = (datetime.datetime.utcnow() - upload_datetime).days
    return math.exp(-lambda_decay * days_since_upload)

# New function to fetch captions/subtitles for a given YouTube video
def fetch_video_captions(video_id):
    """
    Fetches YouTube captions reliably using `youtube_transcript_api`.
    If an error occurs (possibly due to deprecation of the sync parameter),
    logs the error and returns an empty string.
    """
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        captions_text = " ".join(entry["text"] for entry in transcript)
        return captions_text
    except Exception as e:
        # Log detailed error message for troubleshooting
        print(f"❌ Error fetching captions for video {video_id}: {e}")
        # Optionally, check for specific deprecation-related message:
        if "sync" in str(e).lower():
            print("🛠️ It appears the sync parameter is causing issues due to deprecation. Captions auto-syncing may be unavailable.")
        return ""

# New function to fetch YouTube comments
def fetch_video_comments(video_id, max_results=20):
    url = f"https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={video_id}&maxResults={max_results}&key={YOUTUBE_API_KEY}"
    response = requests.get(url)
    data = response.json()
    
    comments = []
    if "items" in data:
        for item in data["items"]:
            comment = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
            comments.append(comment)
    return comments

# New function to analyze sentiment using GPT-4o
def analyze_sentiment_gpt4(comments):
    if not comments:
        return 0.5  # Default neutral sentiment

    prompt = f"Analyze the sentiment of these YouTube comments and return a single number between 0 (very negative) and 1 (very positive): {comments}"

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert in sentiment analysis."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        # Correctly extract the first numeric value even if extra text is present
        result_text = response.choices[0].message.content
        match = re.search(r'([0-9]*\.?[0-9]+)', result_text)
        if match:
            sentiment_score = float(match.group(1))
        else:
            raise ValueError("No numeric sentiment score found in response")
    except Exception as e:
        print(f"❌ GPT-4o API Failed in analyze_sentiment_gpt4: {e}")
        sentiment_score = 0.5
    return sentiment_score

# Helper function: reduce transcript content by extracting important sentences
def reduce_transcript(text, num_sentences=3):
    """
    Use spacy for sentence segmentation and nltk for scoring sentences.
    Returns a reduced transcript containing the most important sentences.
    """
    # Return early if text is short
    if len(text.split()) < 50:
        return text

    # Check and auto-download required NLTK tokenizer resource
    try:
        word_tokenize("This is a test.")
    except LookupError:
        import nltk  # Assuming nltk is already imported
        nltk.download("punkt_tab")  # auto-download as per suggestion

    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
    if not sentences:
        return text

    # Try fetching stopwords; auto-download if missing
    try:
        stop_words = set(stopwords.words("english"))
    except LookupError:
        import nltk  # Assuming nltk is already imported
        nltk.download("stopwords")
        stop_words = set(stopwords.words("english"))

    # Build frequency distribution for words in the transcript
    freq = {}
    for sentence in sentences:
        words = word_tokenize(sentence.lower())
        for word in words:
            if word.isalpha() and word not in stop_words:
                freq[word] = freq.get(word, 0) + 1

    # Score each sentence
    sent_scores = {}
    for sentence in sentences:
        words = word_tokenize(sentence.lower())
        score = sum(freq.get(word, 0) for word in words if word.isalpha())
        sent_scores[sentence] = score

    # Select top sentences based on score
    important_sentences = sorted(sent_scores, key=sent_scores.get, reverse=True)[:num_sentences]
    important_sentences = [s for s in sentences if s in important_sentences]

    # Optionally, clean sentences with regex
    import re
    cleaned_sentences = [re.sub(r'\s+', ' ', s) for s in important_sentences]
    return " ".join(cleaned_sentences)

# New function to extract topics and skill level from captions using GPT-4o
def extract_topics_and_level_gpt4o(captions):
    if not captions:
        return [], "Unknown"
    # Reduce transcript to avoid exceeding token limits
    reduced_captions = reduce_transcript(captions)
    prompt = (
        "Analyze this transcript and extract the main topics covered. "
        "Also, classify the skill level as Beginner, Intermediate, or Advanced. "
        "Return the output in JSON format as follows:\n\n"
        '{"topics": ["topic1", "topic2"], "skill_level": "Beginner"}\n\n'
        f"Transcript:\n{reduced_captions}"
    )
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert in education and topic classification."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        # Debug: Print raw response
        print("GPT-4o Response:", response.choices[0].message.content)
        # Clean up response: remove markdown formatting if present.
        raw_text = response.choices[0].message.content.strip()
        if raw_text.startswith("```"):
            raw_text = re.sub(r'^```(json)?\s*', '', raw_text)
            raw_text = re.sub(r'\s*```$', '', raw_text)
        parsed_result = json.loads(raw_text)
        topics = parsed_result.get("topics", [])
        skill_level = parsed_result.get("skill_level", "Unknown")
    except Exception as e:
        print(f"❌ GPT-4o API Failed in extract_topics_and_level_gpt4o: {e}")
        topics = []
        skill_level = "Unknown"
    return topics, skill_level


# New functions to track processed videos:
def is_video_processed(video_id):
    try:
        with open("processed_videos.txt", "r") as f:
            processed_ids = f.read().splitlines()
        return video_id in processed_ids
    except FileNotFoundError:
        return False

def mark_video_processed(video_id):
    with open("processed_videos.txt", "a") as f:
        f.write(video_id + "\n")

# Fetch and Rank Videos Based on Queries
search_queries = ["Python programming", "Python for beginners", "Advanced Python", "Python OOP tutorial", "Python data structures"]
all_videos = {}

for query in search_queries:
    youtube_video_ids = search_youtube(query)
    youtube_videos = fetch_youtube_data(youtube_video_ids)
    
    # Store only unique videos using video title as a key
    for video in youtube_videos:
        title = video[1]
        if title not in all_videos:
            all_videos[title] = video

# Convert to list for ranking
unique_videos = list(all_videos.values())
unique_videos = unique_videos[:5]  # Limit to 5 videos for testing

# Normalize Engagement Data
if unique_videos:
    min_views = min(video[3] for video in unique_videos)
    max_views = max(video[3] for video in unique_videos)
    min_likes = min(video[4] for video in unique_videos)
    max_likes = max(video[4] for video in unique_videos)
    min_comments = min(video[5] for video in unique_videos)
    max_comments = max(video[5] for video in unique_videos)
    
    ranked_videos = []
    for video in unique_videos:
        vid, title, platform, views, likes, comments, upload_date = video
        norm_views = normalize(views, min_views, max_views)
        norm_likes = normalize(likes, min_likes, max_likes)
        norm_comments = normalize(comments, min_comments, max_comments)
        recency = recency_factor(upload_date)
        
        comments_list = fetch_video_comments(vid)
        sentiment_score = analyze_sentiment_gpt4(comments_list)
        
        final_score = (
            (0.35 * norm_views) +
            (0.25 * norm_likes) +
            (0.15 * norm_comments) +
            (0.15 * recency) +
            (0.10 * sentiment_score)
        )
        ranked_videos.append((vid, title, platform, views, likes, comments, upload_date, final_score))
    
    ranked_videos.sort(key=lambda x: x[7], reverse=True)
    
    # Fix 1: Ensure /Users/ms/eduflix exists
    output_dir = "/Users/ms/eduflix"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Fix 4 (optional): Use a default location in case of problems
    # Uncomment the next line to use the home directory as fallback:
    # output_dir = os.path.expanduser("~/")
    
    output_file = os.path.join(output_dir, "youtube_ranked_data.txt")
    
    # Fix 2: Print the absolute path to confirm where it's stored
    print(f"📂 Writing output to: {output_file}")
    
    print(f"Before file writing, total unique videos: {len(unique_videos)}")
    print(f"Total ranked videos: {len(ranked_videos)}")
    if not ranked_videos:
        print("❌ No ranked videos found! Check API calls and ranking logic.")
    
    with open(output_file, "w", encoding="utf-8") as file:
        for video in ranked_videos:
            vid, title, platform, views, likes, comments, upload_date, final_score = video
            if is_video_processed(vid):
                print(f"⚠️ Skipping already processed video: {vid}")
                continue
            captions = fetch_video_captions(vid)
            topics, skill_level = extract_topics_and_level_gpt4o(captions)
            file.write(
                f"Title: {title}\nPlatform: {platform}\nViews: {views}\nLikes: {likes}\nComments: {comments}\n"
                f"Upload Date: {upload_date}\nFinal Score: {final_score:.4f}\nSentiment Score: {sentiment_score:.2f}\n"
                f"Topics: {', '.join(topics) if topics else 'None'}\nSkill Level: {skill_level}\nCaptions:\n{captions}\n\n"
            )
            mark_video_processed(vid)
    
    # Fix 3: Check if the file exists after writing
    if os.path.exists(output_file):
        print("✅ File successfully written at:", output_file)
    else:
        print("❌ File not found. There may be a permission or path issue.")

print("YouTube Data fetched, ranked, and stored successfully in /Users/ms/eduflix/youtube_ranked_data.txt!")

