# Hotel Quote Parser 🏨

AI-powered hotel event quote parser. Extract financial data from hotel quotes instantly using OpenAI GPT-4o.

![Hotel Quote Parser](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![AI Powered](https://img.shields.io/badge/AI-GPT--4o-purple?style=flat-square)

## ✨ Features

- **AI-Powered Parsing** - Upload PDFs, images, or paste text to extract hotel quote data using OpenAI GPT-4o
- **Large File Support** - Direct-to-Storage uploads handle huge files (50MB+) bypassing server limits
- **Multi-Format Support** - Accepts PDF, images (PNG, JPG), Word docs, and raw text
- **Smart Extraction** - Automatically identifies hotel name, total cost, guestrooms, meeting spaces, and F&B costs
- **Quote History** - Stores parsed quotes in Supabase with full history tracking
- **Export Options** - Export parsed data as JSON or CSV

## 🚀 Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **AI/ML**: OpenAI GPT-4o with vision capabilities
- **Database**: Supabase (PostgreSQL + Storage)
- **Styling**: Tailwind CSS with custom design system
- **File Handling**: Direct client-to-Supabase Storage upload (bypassing Vercel 4.5MB limit)
- **Deployment**: Vercel: https://hotel-quote-parser-brown.vercel.app

## 🎨 Design System

- **Typography**: Inter font family with bold gradients
- **Colors**: Soft purple-pink-blue gradients
- **Animations**: Smooth transitions (0.2s cubic-bezier) and gentle glow effects
- **Components**: Glass-morphism cards with rounded borders
- **Buttons**: Super-rounded (9999px) with gradient fills

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Divyesh-Thirukonda/hotel-quote-parser.git
cd hotel-quote-parser

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenAI API key and Supabase credentials

# Run the development server
npm run dev
```

## 🗄️ Database Schema

The app uses a single `quotes` table in Supabase:

```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_name TEXT,
  total NUMERIC,
  guestrooms NUMERIC,
  meeting NUMERIC,
  food_beverage NUMERIC,
  rooms INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Additional fields for file tracking
  file_name TEXT,
  file_size INTEGER,
  content_type TEXT,
  parsing_status TEXT
);
```

### Storage Setup

1. Create a public bucket in Supabase Storage named `quotes`.
2. Add the following Row Level Security (RLS) policy to the `storage.objects` table:

```sql
-- Allow public uploads
INSERT INTO storage.objects (bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, path_tokens, version)
SELECT 'quotes', name, owner, created_at, updated_at, last_accessed_at, metadata, path_tokens, version
WHERE bucket_id = 'quotes';

-- Allow public reads
SELECT * FROM storage.objects WHERE bucket_id = 'quotes';
```

## 🎯 Usage

1. **Upload a file** - Drag & drop or browse for PDF, image, or Word document
2. **Or paste text** - Click "or paste text" to manually enter quote data
3. **Parse** - AI extracts all financial data automatically
4. **Review** - See giant gradient numbers and category breakdowns
5. **Export** - Download as JSON or CSV
6. **History** - View all past quotes in the history panel

## 🛠️ Project Structure

```
hotel-quote-parser/
├── app/
│   ├── api/
│   │   └── parse/route.ts       # OpenAI parsing endpoint
│   ├── globals.css              # Typography-first design system
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main application page
├── components/
│   ├── ParsedResults.tsx        # Results display with gradient typography
│   ├── QuoteHistory.tsx         # History sidebar with Supabase integration
│   └── QuoteUploader.tsx        # File upload & text input
├── lib/
│   └── supabaseClient.ts        # Supabase configuration
└── test-samples/                # Sample hotel quotes for testing
```

## 🧪 Testing

Sample hotel quotes are provided in the `test-samples/` directory. Upload these to test the AI parsing capabilities.

## 🚢 Deployment

Just run:

```bash
vercel
```

Make sure to add your environment variables in the Vercel dashboard.

## 📝 License

MIT

---

**Built with** OpenAI GPT-4 + Next.js + Supabase
