import {useState} from 'react';

type VideoEmbedProps = {
  poster?: string;
  title: string;
  url: string;
};

const FILE_VIDEO_RE = /\.(mp4|webm|ogg|mov)(\?|$)/i;

function toEmbedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${parsedUrl.pathname.slice(1)}`;
    }
    if (parsedUrl.hostname.includes('youtube.com')) {
      const videoId = parsedUrl.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (parsedUrl.hostname.includes('vimeo.com')) {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean).at(-1);
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }
  } catch {
    return url;
  }
  return url;
}

export default function VideoEmbed({poster, title, url}: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isLoaded) {
    return (
      <div className="video-shell">
        <button className="video-shell__trigger" onClick={() => setIsLoaded(true)} type="button">
          {poster ? (
            <img alt={`${title} poster`} className="video-shell__poster" src={poster} />
          ) : (
            <div className="video-shell__fallback"><span>Load {title}</span></div>
          )}
          <span className="video-shell__badge">Play demo</span>
        </button>
      </div>
    );
  }

  if (FILE_VIDEO_RE.test(url)) {
    return (
      <div className="video-shell">
        <div className="video-shell__frame">
          <video autoPlay controls playsInline poster={poster} preload="none" src={url} />
        </div>
      </div>
    );
  }

  return (
    <div className="video-shell">
      <div className="video-shell__frame">
        <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            src={toEmbedUrl(url)}
            title={title}
        />
      </div>
    </div>
  );
}
