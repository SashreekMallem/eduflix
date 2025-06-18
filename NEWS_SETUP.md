# Live News Integration Setup

## Getting Free News API Key

### Option 1: NewsAPI (Recommended)
1. Go to [NewsAPI.org](https://newsapi.org/)
2. Click "Get API Key" 
3. Sign up for free account
4. Copy your API key
5. Add to `.env.local`: `NEXT_PUBLIC_NEWS_API_KEY=your_actual_key_here`

**Free Tier**: 1,000 requests/day (perfect for our needs)

### Option 2: Alternative Free APIs

#### GNews API
- Website: [gnews.io](https://gnews.io/)
- Free tier: 100 requests/day
- Easy to implement

#### News Data API  
- Website: [newsdata.io](https://newsdata.io/)
- Free tier: 200 requests/day
- Good filtering options

#### Currents API
- Website: [currentsapi.services](https://currentsapi.services/)
- Free tier: 600 requests/day

## Features Implemented

✅ **Smart Filtering**: Automatically filters for education, career, jobs, and visa related news
✅ **Fallback System**: Shows default EduFlix news if API is unavailable
✅ **Auto Refresh**: Updates news every 10 minutes
✅ **Error Handling**: Graceful fallback when API fails
✅ **Relevant Keywords**: Filters using 20+ education/career keywords

## Keywords Tracked
- Education, career, jobs, employment, hiring
- Visa, immigration, study abroad
- Scholarship, university, college
- Skills, training, certification
- Remote work, internship, job market
- Career development, professional development
- Online learning, e-learning, edtech

## Usage

The news service will automatically:
1. Fetch live news on page load
2. Filter for relevant content
3. Display in the footer news ticker
4. Refresh every 10 minutes
5. Fall back to default news if API unavailable

## For Production Deployment

When deploying to Vercel/Netlify/etc:
1. Add `NEXT_PUBLIC_NEWS_API_KEY` as environment variable
2. The app will automatically use live news
3. Without API key, it gracefully falls back to default news
