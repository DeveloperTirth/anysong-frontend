# Anysong - Frontend Application

The frontend application for **Anysong**, a premium music streaming and downloading web application. This application is built with **React** and **Vite**, featuring a responsive dark glassmorphism design system.

## Features

- **Premium Dark Aesthetic**: Designed with deep purple neon-accented glassmorphism layouts, glowing elements, and responsive styling.
- **Instant Preview Playback**: Play songs directly inside the browser before committing to a download.
- **Custom HTML5 Media Player**: Features a sticky bottom-bar audio controller equipped with:
  - Play/Pause toggle.
  - Interactive track progress seeker.
  - Smooth volume slider and instant mute/unmute buttons.
  - Active track details showing titles, artists, and thumbnails.
- **Client-Side Blob Downloads**: Performs audio downloads through backend streams, showing a live spinner on the active song card during progress, and saving files with correct metadata.
- **Skeleton Loaders**: Provides glowing skeleton loading indicators during search execution.

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Backend URL:
   Ensure the `API_BASE` variable in `src/App.jsx` points to your running backend server (defaults to `http://127.0.0.1:8000`).

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser to run the web application.

## Technologies Used

- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (Custom Glassmorphism)
- **Icons**: Custom Inline SVGs
- **State Management**: React Hooks (`useState`, `useEffect`, `useRef`)
