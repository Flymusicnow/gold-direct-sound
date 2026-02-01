
# Fix: Visa Video Thumbnails på Desktop och Mobil

## Problem

Thumbnail-uppdateringar syns inte eftersom:
1. **VideoCard-komponenten** visar bara `<video>` element istället för thumbnail-bilder
2. **VideoPost interface** saknar `thumbnail_url` i flera filer
3. **StudioVideos video-kort** visar direkt video-spelaren utan thumbnail-preview

## Lösning

### Del 1: Uppdatera VideoCard.tsx (Public Artist Page)

**Ändra VideoPost interface (rad 14-21):**
```typescript
interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  is_supporter_only: boolean;
  required_tier: string | null;
  thumbnail_url?: string | null;  // LÄGG TILL
}
```

**Ändra video-rendering (rad 155-168) - visa thumbnail istället för video när ej spelar:**
```typescript
{/* Thumbnail or Video */}
{video.thumbnail_url && !isPlaying ? (
  <img
    src={video.thumbnail_url}
    alt={video.caption || 'Video thumbnail'}
    className={`w-full aspect-video object-cover ${video.is_supporter_only && !hasAccess ? 'blur-sm' : ''}`}
  />
) : (
  <video
    ref={videoRef}
    src={video.video_url}
    className={`w-full aspect-video object-cover ${video.is_supporter_only && !hasAccess ? 'blur-sm' : ''}`}
    playsInline
    webkit-playsinline="true"
    muted={!isPlaying}
    loop
    preload="metadata"
    onPlay={() => setIsPlaying(true)}
    onPause={handleVideoPause}
    onEnded={handleVideoEnded}
  />
)}
```

### Del 2: Uppdatera ArtistVideosSection.tsx

**Ändra VideoPost interface (rad 11-18):**
```typescript
interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  is_supporter_only: boolean;
  required_tier: string | null;
  thumbnail_url: string | null;  // LÄGG TILL
}
```

### Del 3: Uppdatera StudioVideos.tsx - Video Cards

**Ändra video-kortet i "Your Videos" sektion (rad 862-922) för att visa thumbnail:**

Ersätt den direkta `<video>` taggen med en thumbnail-preview:
```typescript
<Card className="overflow-hidden border-primary/20">
  {/* Thumbnail or Video Preview */}
  <div className="relative aspect-video bg-black">
    {video.thumbnail_url ? (
      <img
        src={video.thumbnail_url}
        alt={video.caption || 'Video thumbnail'}
        className="w-full h-full object-cover"
      />
    ) : (
      <video
        src={video.video_url}
        className="w-full h-full object-cover"
        preload="metadata"
      />
    )}
    {/* Play overlay */}
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
      <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
        <Video className="w-6 h-6 text-background fill-background ml-0.5" />
      </div>
    </div>
  </div>
  {/* Rest of card content... */}
</Card>
```

## Sammanfattning

| Fil | Ändring |
|-----|---------|
| `VideoCard.tsx` | Lägg till `thumbnail_url` i interface, visa bild istället för video när ej spelar |
| `ArtistVideosSection.tsx` | Lägg till `thumbnail_url` i VideoPost interface |
| `StudioVideos.tsx` | Visa thumbnail-bild i video-korten i "Your Videos" |

## Teknisk Implementation

### VideoCard.tsx - Komplett rendering-logik

```typescript
return (
  <div className="space-y-3">
    <div
      className="cursor-pointer group relative rounded-2xl overflow-hidden touch-manipulation interactive-card"
      onClick={handleVideoClick}
    >
      {/* Show thumbnail when available and not playing, otherwise show video */}
      {video.thumbnail_url && !isPlaying ? (
        <img
          src={video.thumbnail_url}
          alt={video.caption || 'Video thumbnail'}
          className={`w-full aspect-video object-cover ${video.is_supporter_only && !hasAccess ? 'blur-sm' : ''}`}
        />
      ) : (
        <video
          ref={videoRef}
          src={video.video_url}
          className={`w-full aspect-video object-cover ${video.is_supporter_only && !hasAccess ? 'blur-sm' : ''}`}
          playsInline
          webkit-playsinline="true"
          muted={!isPlaying}
          loop
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={handleVideoPause}
          onEnded={handleVideoEnded}
        />
      )}

      {/* Play button overlay - visible when showing thumbnail or video paused */}
      {!isPlaying && hasAccess && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <button
            type="button"
            onClick={handlePlayClick}
            onTouchEnd={handleTouchEnd}
            className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 active:scale-95 transition-transform touch-manipulation"
            aria-label="Play video"
          >
            <Play className="w-8 h-8 text-background fill-background ml-1" />
          </button>
        </div>
      )}
      
      {/* ... rest of overlays ... */}
    </div>
  </div>
);
```

### StudioVideos.tsx - Uppdaterat video-kort

```typescript
{videoPosts.map((video) => (
  <div key={video.id} className="relative">
    <Card className="overflow-hidden border-primary/20">
      {/* Thumbnail or Video Preview */}
      <div className="relative aspect-video bg-black group">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.caption || 'Video thumbnail'}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={video.video_url}
            className="w-full h-full object-cover"
            preload="metadata"
          />
        )}
        {/* Hover play overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => window.open(video.video_url, '_blank')}
        >
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
            <Video className="w-6 h-6 text-background" />
          </div>
        </div>
      </div>
      
      {/* Card content - caption, buttons etc */}
      <div className="p-4 space-y-3">
        {/* ... existing content ... */}
      </div>
    </Card>
    
    {/* Live View Counter Badge */}
    <div className={`absolute top-3 right-3 ...`}>
      {/* ... existing counter ... */}
    </div>
  </div>
))}
```

## Resultat efter implementation

- ✅ Thumbnails visas i Video Studio (StudioVideos)
- ✅ Thumbnails visas på artist-profilen (ArtistVideosSection → VideoCard)
- ✅ Fungerar på både desktop och mobil
- ✅ Play-overlay för tydlig interaktion
- ✅ Fallback till video-metadata om ingen thumbnail finns
