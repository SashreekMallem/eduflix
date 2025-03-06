import requests
import json
import math
import datetime

# YouTube API Key (Replace with your own API Key)
YOUTUBE_API_KEY = "AIzaSyAzVQKKRHG1g6DhdBQ23nksJsSWsLfNGlc"

# Function to search YouTube for videos
def search_youtube(query, max_results=50):
    search_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&type=video&maxResults={max_results}&key={YOUTUBE_API_KEY}"
    response = requests.get(search_url)
    data = response.json()
    
    video_ids = set()  # Using a set to ensure uniqueness
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
            video_id = video["id"]
            title = video["snippet"]["title"]
            views = int(video["statistics"].get("viewCount", 0))
            likes = int(video["statistics"].get("likeCount", 0))
            comments = int(video["statistics"].get("commentCount", 0))
            upload_date = video["snippet"]["publishedAt"]

            # Store unique videos based on video ID
            videos_data[video_id] = (title, "YouTube", views, likes, comments, upload_date)
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

# Fetch and Rank Videos Based on Queries
search_queries = ["Python programming", "Python for beginners", "Advanced Python", "Python OOP tutorial", "Python data structures"]
all_videos = {}

for query in search_queries:
    youtube_video_ids = search_youtube(query)
    youtube_videos = fetch_youtube_data(youtube_video_ids)
    
    # Store only unique videos using video title as a key
    for video in youtube_videos:
        title = video[0]
        if title not in all_videos:
            all_videos[title] = video

# Convert to list for ranking
unique_videos = list(all_videos.values())

# Normalize Engagement Data
if unique_videos:
    min_views = min(video[2] for video in unique_videos)
    max_views = max(video[2] for video in unique_videos)
    min_likes = min(video[3] for video in unique_videos)
    max_likes = max(video[3] for video in unique_videos)
    min_comments = min(video[4] for video in unique_videos)
    max_comments = max(video[4] for video in unique_videos)
    
    ranked_videos = []
    for video in unique_videos:
        title, platform, views, likes, comments, upload_date = video
        norm_views = normalize(views, min_views, max_views)
        norm_likes = normalize(likes, min_likes, max_likes)
        norm_comments = normalize(comments, min_comments, max_comments)
        recency = recency_factor(upload_date)
        
        final_score = (0.4 * norm_views) + (0.3 * norm_likes) + (0.2 * norm_comments) + (0.1 * recency)
        ranked_videos.append((title, platform, views, likes, comments, upload_date, final_score))
    
    ranked_videos.sort(key=lambda x: x[6], reverse=True)  # Sort by final score

    # Store Ranked Data in Text File
    with open("youtube_ranked_data.txt", "w", encoding="utf-8") as file:
        for video in ranked_videos:
            file.write(f"Title: {video[0]}\nPlatform: {video[1]}\nViews: {video[2]}\nLikes: {video[3]}\nComments: {video[4]}\nUpload Date: {video[5]}\nFinal Score: {video[6]:.4f}\n\n")

print("YouTube Data fetched, ranked, and stored successfully in youtube_ranked_data.txt!")

