# News Reader

A modern news reader application that fetches and displays news articles from TheNewsApi. Built with React and Express, this monorepo project provides a clean interface for browsing news by category or search term.

## Features

- **Browse by Category**: Tech, General, Science, Sports, Business, Health, Entertainment, Politics, Food, and Travel
- **Search Functionality**: Search for news articles by keywords
- **Favorites**: Save your favorite articles locally for later reading
- **Responsive Design**: Mobile-friendly interface that adapts to different screen sizes
- **Pagination**: Navigate through multiple pages of articles
- **Secure API Proxy**: Server-side proxy keeps your API token secure and never exposed to the browser

## Architecture

This is a monorepo containing two main components:

- **`/server`**: Express.js proxy server that securely handles API requests to TheNewsApi
- **`/web`**: React + TypeScript frontend built with Vite

## Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn
- A valid API token from [TheNewsApi](https://www.thenewsapi.com/)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/greg-hahn/news-reader.git
cd news-reader
```

### 2. Install Dependencies

Install dependencies for both the root project and the server/web subdirectories:

```bash
npm run server:install
```

### 3. Configure Environment Variables

Create a `.env` file in the `server` directory by copying the example file:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and add your TheNewsApi token:

```
THENEWSAPI_TOKEN=your_token_here
```

**Important**: Never commit your `.env` file or expose your API token publicly.

### 4. Start the Development Servers

Run both the backend proxy and frontend development server concurrently:

```bash
npm run dev
```

This will start:
- **Backend server** at `http://localhost:5177`
- **Frontend application** at `http://localhost:5176`

Alternatively, you can run them separately:

```bash
# In one terminal
npm run server:dev

# In another terminal
npm run web:dev
```

### 5. Open the Application

Navigate to `http://localhost:5176` in your browser to use the application.

## Available Scripts

### Root Level

- `npm run server:install` - Install dependencies for both server and web
- `npm run dev` - Run both server and web in development mode concurrently
- `npm run server:dev` - Run only the server in development mode
- `npm run web:dev` - Run only the web frontend in development mode

### Server (`/server`)

- `npm run dev` - Start the Express proxy server
- `npm start` - Start the Express proxy server (production)

### Web (`/web`)

- `npm run dev` - Start the Vite development server
- `npm run build` - Build the production bundle
- `npm run preview` - Preview the production build locally

## Technology Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **CSS** - Custom styling

### Backend
- **Express.js** - Web server framework
- **Axios** - HTTP client for API requests
- **CORS** - Cross-origin resource sharing middleware
- **dotenv** - Environment variable management

## API Endpoints

The server provides the following endpoints:

- `GET /api/health` - Health check endpoint (returns status and whether token is configured)
- `GET /api/news/all` - Proxy to TheNewsApi with support for:
  - `?page=N` - Pagination
  - `?categories=tech,science` - Filter by categories
  - `?search=keyword` - Search for articles

## Security

- API tokens are stored server-side in `.env` files and never exposed to the browser
- Server logs sanitized URLs without tokens
- `.env` files are excluded from version control via `.gitignore`

## Project Structure

```
news-reader/
├── server/              # Express proxy server
│   ├── .env.example     # Environment variable template
│   ├── server.js        # Main server file
│   ├── package.json     # Server dependencies
│   └── README.md        # Server-specific documentation
├── web/                 # React frontend
│   ├── src/             # Source files
│   │   ├── App.tsx      # Main application component
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities and API client
│   │   └── styles.css   # Application styles
│   ├── index.html       # HTML entry point
│   ├── package.json     # Frontend dependencies
│   └── vite.config.ts   # Vite configuration
├── package.json         # Root package.json with workspace scripts
└── README.md            # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues or questions, please open an issue on the GitHub repository.
