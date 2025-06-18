// News service for fetching education, career, jobs, and visa related news
export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
}

class NewsService {
  private readonly baseUrl = 'https://newsapi.org/v2';
  private apiKey: string | null = null;
  
  // Cache management
  private cache: { [key: string]: { data: NewsArticle[], timestamp: number } } = {};
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (reasonable refresh rate)
  private readonly MAX_ARTICLES = 100; // Get maximum articles per request
  
  // Hardcoded API key fallback - ADD YOUR API KEY HERE if environment variables don't work
  private readonly FALLBACK_API_KEY = ''; // Replace '' with your actual NewsAPI key

  constructor() {
    // Priority order: 1. Environment variable, 2. Hardcoded fallback, 3. localStorage
    this.apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY || this.FALLBACK_API_KEY || null;
    
    // If still no API key, try localStorage (client-side only)
    if (typeof window !== 'undefined' && !this.apiKey) {
      this.apiKey = localStorage.getItem('newsApiKey');
    }
  }

  // Method to set API key manually
  setApiKey(key: string) {
    this.apiKey = key;
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('newsApiKey', key);
    }
  }

  // Method to check if API key is available
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
  
  // Keywords for filtering education, career, job, and visa related news
  private readonly keywords = [
    'education',
    'career',
    'jobs',
    'employment',
    'hiring',
    'visa',
    'immigration',
    'study abroad',
    'scholarship',
    'university',
    'college',
    'skills',
    'training',
    'certification',
    'remote work',
    'internship',
    'job market',
    'career development',
    'professional development',
    'online learning',
    'e-learning',
    'edtech',
    'career opportunities',
    'bootcamp',
    'coding',
    'programming',
    'data science',
    'artificial intelligence',
    'machine learning',
    'software development',
    'web development',
    'cybersecurity',
    'cloud computing',
    'digital marketing',
    'freelancing',
    'startups',
    'tech industry',
    'work from home',
    'professional skills'
  ];

  /**
   * Check if cache is valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache[cacheKey];
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.CACHE_DURATION;
  }

  /**
   * Get cached data or fetch new data
   */
  private async getCachedOrFetch(cacheKey: string, fetchFn: () => Promise<NewsArticle[]>): Promise<NewsArticle[]> {
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      console.log(`Using cached news data (${cacheKey})`);
      return this.cache[cacheKey].data;
    }

    // Fetch new data
    console.log(`Fetching fresh news data (${cacheKey})`);
    const data = await fetchFn();
    
    // Cache the result
    this.cache[cacheKey] = {
      data,
      timestamp: Date.now()
    };

    return data;
  }

  /**
   * Fetch ALL education and career related news (no limit)
   */
  async fetchAllEducationNews(): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      console.warn('News API key not found');
      return [];
    }

    return this.getCachedOrFetch('all_education_news', async () => {
      try {
        const allArticles: NewsArticle[] = [];
        
        // Make multiple requests to get more comprehensive coverage
        const keywordGroups = [
          ['education', 'university', 'college', 'scholarship', 'study abroad'],
          ['career', 'jobs', 'employment', 'hiring', 'job market'],
          ['programming', 'coding', 'software development', 'tech jobs'],
          ['remote work', 'freelancing', 'professional development'],
          ['visa', 'immigration', 'work permit', 'international students'],
          ['bootcamp', 'certification', 'online learning', 'skills training']
        ];

        // Fetch from multiple keyword groups to get diverse, comprehensive news
        for (const keywords of keywordGroups) {
          const query = keywords.join(' OR ');
          const url = `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=${this.MAX_ARTICLES}&apiKey=${this.apiKey}`;

          try {
            const response = await fetch(url);
            
            if (!response.ok) {
              console.warn(`News API request failed: ${response.status}`);
              continue;
            }

            const data: NewsResponse = await response.json();
            
            // Filter and add relevant articles
            const relevantArticles = data.articles
              .filter(article => this.isRelevantArticle(article))
              .filter(article => article.title && article.url); // Ensure required fields exist

            allArticles.push(...relevantArticles);
          } catch (error) {
            console.warn('Error in keyword group fetch:', error);
            continue;
          }
        }

        // Remove duplicates based on URL
        const uniqueArticles = allArticles.filter((article, index, self) => 
          index === self.findIndex(a => a.url === article.url)
        );

        // Sort by publication date (newest first)
        uniqueArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        console.log(`Fetched ${uniqueArticles.length} unique education/career articles`);
        return uniqueArticles;

      } catch (error) {
        console.error('Error fetching education news:', error);
        return [];
      }
    });
  }

  /**
   * Get formatted news titles for the ticker (legacy support)
   */
  async fetchEducationNews(limit?: number): Promise<string[]> {
    const articles = await this.fetchAllEducationNews();
    const titles = articles.map(article => this.cleanTitle(article.title));
    
    return limit ? titles.slice(0, limit) : titles;
  }

  /**
   * Get full news articles with URLs for clickable news
   */
  async getNewsArticles(): Promise<NewsArticle[]> {
    return this.fetchAllEducationNews();
  }

  /**
   * Check if article is relevant to education/career topics
   */
  private isRelevantArticle(article: NewsArticle): boolean {
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    return this.keywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  /**
   * Format article title for display
   */
  private formatArticleTitle(article: NewsArticle): string {
    let title = article.title;
    
    // Remove source name from title if it appears at the end
    if (article.source?.name) {
      const sourceName = article.source.name;
      if (title.endsWith(` - ${sourceName}`)) {
        title = title.replace(` - ${sourceName}`, '');
      }
    }

    // Ensure title isn't too long
    if (title.length > 120) {
      title = title.substring(0, 117) + '...';
    }

    return title;
  }

  /**
   * Clean news title by removing source name
   */
  private cleanTitle(title: string): string {
    // Remove common source patterns like " - Source Name", " | Source Name", " (Source Name)"
    return title
      .replace(/\s*[-|]\s*[^-|]*$/, '') // Remove " - Source" or " | Source" at end
      .replace(/\s*\([^)]*\)$/, '') // Remove "(Source)" at end
      .replace(/\s*\.\.\.$/, '') // Remove trailing "..."
      .trim();
  }

  /**
   * Fetch news by specific category
   */
  async fetchNewsByCategory(category: 'education' | 'careers' | 'jobs' | 'visas', pageSize: number = 5): Promise<string[]> {
    try {
      if (!this.apiKey) {
        console.warn('No API key available for news service');
        return []; // Return empty array instead of fallback news
      }

      const categoryKeywords = {
        education: ['education', 'university', 'college', 'learning', 'scholarship', 'study'],
        careers: ['career', 'professional development', 'skills', 'training', 'certification'],
        jobs: ['jobs', 'hiring', 'employment', 'job market', 'remote work', 'internship'],
        visas: ['visa', 'immigration', 'study abroad', 'work permit', 'international students']
      };

      const keywords = categoryKeywords[category].join(' OR ');
      const url = `${this.baseUrl}/everything?q=${encodeURIComponent(keywords)}&language=en&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${this.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }

      const data: NewsResponse = await response.json();
      
      return data.articles
        .filter(article => this.isRelevantArticle(article))
        .map(article => this.formatArticleTitle(article))
        .slice(0, pageSize);

    } catch (error) {
      console.error(`Error fetching ${category} news:`, error);
      return []; // Return empty array instead of fallback news
    }
  }
}

export const newsService = new NewsService();
