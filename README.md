# Hotel Quote Parser


AI-powered hotel event quote parser. Extract financial data from hotel quotes instantly using OpenAI GPT-5.

![Hotel Quote Parser](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![AI Powered](https://img.shields.io/badge/AI-GPT--4o-purple?style=flat-square)


## Features

- **AI-Powered Extraction** - Uses GPT-5 to parse complex hotel quotes
- **Multi-Format Support** - PDF, HTML, images, Word docs, and plain text
- **Batch Processing** - Upload and parse multiple files at once
- **Interactive Loading** - Play Snake while waiting for AI parsing
- **Export Options** - Download parsed data as CSV or JSON
- **Smart Display** - Auto-hides zero-dollar categories
- **Quote History** - Search and view all previously parsed quotes
- **AI Reasoning** - View step-by-step calculation logic
- **Large File Support** - Files stored in Supabase Storage (50MB limit)

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key (GPT-5 access)

### Installation

1. Clone the repository
```bash
git clone https://github.com/Divyesh-Thirukonda/hotel-quote-parser.git
cd hotel-quote-parser
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

4. Set up Supabase database

Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor to create:
- `quotes` table with proper schema
- Storage bucket for file uploads
- Row Level Security policies
- Required indexes

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## What Gets Extracted

The AI parses and extracts:

- **Total Quote** - Overall cost for the entire booking
- **Guestroom Total** - All room costs (including taxes/fees)
- **Meeting Room Total** - Conference room rental costs
- **Food & Beverage Total** - Catering and F&B costs
- **Other Fees** - Parking, resort fees, AV, etc.
- **Hotel Name**
- **Check-in/Check-out Dates**
- **Number of Rooms & Guests**
- **AI Reasoning** - Step-by-step calculation logic

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Storage)
- **AI**: OpenAI GPT-5
- **File Processing**: pdf-parse, mammoth, canvas

## Database Schema

All parsed data is stored in a single `extracted_data` JSONB column for flexibility:

```sql
CREATE TABLE quotes (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP,
    original_content TEXT,
    content_type VARCHAR(50),
    extracted_data JSONB,  -- All parsed data here
    parsing_status VARCHAR(50),
    error_message TEXT,
    file_name VARCHAR(255),
    file_size INTEGER
);
```

This design allows:
- Easy schema evolution (add new AI-extracted fields without migrations)
- Single source of truth
- Flexible querying with JSONB operators

## Usage

### Single File Upload

1. Drag & drop a file or click to browse
2. Wait for AI processing (play Snake!)
3. View extracted financial data
4. Export as CSV or JSON

### Batch Upload

1. Select multiple files at once
2. View progress as each file processes
3. Results show in collapsible cards
4. Export each quote individually

### Quote History

- Search by hotel name or total
- Click any quote to expand details
- View AI reasoning for calculations
- Export historical quotes

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Required variables in `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `OPENAI_API_KEY` | OpenAI API key with GPT-5 access |

## License

MIT

## Contributing

Pull requests welcome! Please ensure:
1. TypeScript types are correct
2. Code follows existing patterns
3. Test with various quote formats
