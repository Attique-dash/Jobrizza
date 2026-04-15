# Jobrizza

A modern recruitment platform that leverages AI to streamline the hiring process for both companies and candidates.

## Features

- 🤖 AI-powered CV screening and matching
- 📊 Smart candidate ranking
- 📧 Automated interview scheduling
- 🌍 Multi-language support
- 📱 Responsive design
- 🎯 Personalized career roadmaps

## Tech Stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Apollo Client

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file with the following variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:
   - Create a new project at [Supabase](https://supabase.com)
   - Go to SQL Editor and run the SQL from `supabase-setup.sql` to create the waitlist table
   - Copy your project URL and anon key from Settings > API
   - Add them to your `.env.local` file

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
frontend/
├── public/
│   ├── images/
│   │   ├── logo.png
│   │   ├── hero-image.png
│   │   └── testimonials/
│   │       ├── hr-lead.jpg
│   │       └── areeba.jpg
├── src/
│   ├── app/
│   │   ├── company/
│   │   │   └── dashboard/
│   │   ├── auth/
│   │   └── page.tsx
│   ├── components/
│   └── lib/
```

## Required Images

Place the following images in the `public/images` directory:

1. `logo.png` - Main logo for Jobrizza (used in header and footer)
2. `hero-image.png` - Main hero section image (recommended size: 2432x1442px)
3. `hr-lead.jpg` - HR Lead testimonial profile picture
4. `areeba.jpg` - Areeba testimonial profile picture

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
