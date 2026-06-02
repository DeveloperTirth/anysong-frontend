import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = 'https://anysong-backend.onrender.com';

function App() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState({});

  const audioRef = useRef(null);
  const progressSliderRef = useRef(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    // Sync volume initially
    audio.volume = volume;

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSongs(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song) => {
    if (!audioRef.current) return;

    if (currentSong && currentSong.id === song.id) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => console.error('Play failed:', err));
      }
    } else {
      audioRef.current.pause();
      setCurrentSong(song);
      setCurrentTime(0);
      setDuration(0);
      
      // Point the source to our proxy streaming endpoint
      audioRef.current.src = `${API_BASE}/api/stream?id=${song.id}`;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Streaming start failed:', err));
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const clickPercent = e.target.value / 100;
    audioRef.current.currentTime = clickPercent * duration;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleDownload = async (song) => {
    if (downloadingIds[song.id]) return;

    setDownloadingIds(prev => ({ ...prev, [song.id]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/download?id=${song.id}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // The backend sets the Content-Disposition header with the correct title,
      // but we add a fallback name here just in case.
      a.download = `${song.title.replace(/[^a-zA-Z0-9]/g, '_')}.m4a`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download song. Please try again.');
    } finally {
      setDownloadingIds(prev => ({ ...prev, [song.id]: false }));
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <svg className="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h1>Anysong</h1>
        </div>
        <p>Instant high-quality music streaming & downloads on demand.</p>
      </header>

      {/* Search Section */}
      <form className="search-wrapper" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          placeholder="Search for any song, artist, or album..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner"></div>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </>
          )}
        </button>
      </form>

      {/* Results Section */}
      {loading ? (
        <div className="songs-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="skeleton-card">
              <div className="skeleton-thumb"></div>
              <div className="skeleton-title"></div>
              <div className="skeleton-artist"></div>
            </div>
          ))}
        </div>
      ) : songs.length > 0 ? (
        <div className="songs-grid">
          {songs.map((song) => {
            const isSongCurrent = currentSong && currentSong.id === song.id;
            const isSongPlaying = isSongCurrent && isPlaying;
            const isSongDownloading = downloadingIds[song.id] || false;

            return (
              <div
                key={song.id}
                className={`song-card ${isSongCurrent ? 'playing' : ''}`}
              >
                <div className="thumbnail-wrapper">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="thumbnail-image"
                    loading="lazy"
                  />
                  <div className="duration-badge">{song.duration}</div>
                  <div className="play-overlay" onClick={() => handlePlaySong(song)}>
                    <button className="play-overlay-btn">
                      {isSongPlaying ? (
                        <svg viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="song-info">
                  <h3 className="song-title" title={song.title}>
                    {song.title}
                  </h3>
                  <p className="song-uploader">{song.uploader}</p>

                  <div className="song-metadata">
                    <span className="song-views">{song.views} views</span>
                    <button
                      className="card-action-btn"
                      onClick={() => handleDownload(song)}
                      disabled={isSongDownloading}
                      title="Download Song"
                    >
                      {isSongDownloading ? (
                        <div className="download-loading-spinner"></div>
                      ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : hasSearched ? (
        <div className="empty-state">
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>No songs found</h3>
          <p>Try searching for a different title, spelling, or artist.</p>
        </div>
      ) : (
        <div className="empty-state">
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3>Discover great music</h3>
          <p>Search for any song in the world to stream it instantly or download high quality files.</p>
        </div>
      )}

      {/* Sticky Custom Bottom Player */}
      {currentSong && (
        <div className="bottom-player-bar">
          {/* Progress bar */}
          <div className="progress-bar-container">
            <span className="progress-time">{formatTime(currentTime)}</span>
            <div className="progress-slider-wrapper">
              <div
                className="progress-slider-fill"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="progress-slider-handle"></div>
              </div>
              <input
                type="range"
                className="real-slider"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
              />
            </div>
            <span className="progress-time">{formatTime(duration)}</span>
          </div>

          <div className="player-main-content">
            {/* Song info (Left) */}
            <div className="player-track-info">
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                className="player-thumb"
              />
              <div className="player-details">
                <span className="player-title" title={currentSong.title}>
                  {currentSong.title}
                </span>
                <span className="player-artist">{currentSong.uploader}</span>
              </div>
            </div>

            {/* Core Controls (Middle) */}
            <div className="player-controls-wrapper">
              <div className="player-control-buttons">
                <button
                  className="play-pause-btn"
                  onClick={() => handlePlaySong(currentSong)}
                >
                  {isPlaying ? (
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Additional Actions (Right) */}
            <div className="player-right-wrapper">
              {/* Volume */}
              <div className="volume-container">
                <button className="player-icon-btn" onClick={toggleMute}>
                  {isMuted || volume === 0 ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z" />
                    </svg>
                  )}
                </button>
                <div className="volume-slider-wrapper">
                  <div
                    className="volume-slider-fill"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  ></div>
                  <input
                    type="range"
                    className="volume-slider"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                  />
                </div>
              </div>

              {/* Direct Download */}
              <button
                className="player-download-btn"
                onClick={() => handleDownload(currentSong)}
                disabled={downloadingIds[currentSong.id] || false}
              >
                {downloadingIds[currentSong.id] ? (
                  <>
                    <div className="download-loading-spinner"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
