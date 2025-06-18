This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Configuration

### News API Setup

EduFlix displays live education, career, and technology news in the footer. To enable this feature, you need a NewsAPI key.

**Option 1: Environment Variable (Recommended)**
1. Get a free API key from [NewsAPI.org](https://newsapi.org)
2. Create a `.env.local` file in the project root
3. Add your API key:
   ```
   NEXT_PUBLIC_NEWS_API_KEY=your_api_key_here
   ```

**Option 2: Hardcoded Key (Alternative)**
If environment variables don't work in your setup:
1. Open `src/lib/newsService.ts`
2. Find the line: `private readonly FALLBACK_API_KEY = '';`
3. Replace the empty string with your API key:
   ```typescript
   private readonly FALLBACK_API_KEY = 'your_api_key_here';
   ```

The news service automatically falls back to the hardcoded key if no environment variable is found.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
