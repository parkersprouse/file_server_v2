use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Cache entry for media metadata (duration and raw duration value)
#[derive(Clone)]
struct MediaCacheEntry {
  duration_raw: u64,
  duration_formatted: String,
  expires_at: Instant,
}

impl MediaCacheEntry {
  fn is_expired(&self) -> bool {
    Instant::now() > self.expires_at
  }
}

/// Media metadata cache to avoid repeated ffprobe calls
pub struct MediaMetadataCache {
  cache: Arc<RwLock<HashMap<String, MediaCacheEntry>>>,
  ttl: Duration,
}

impl MediaMetadataCache {
  /// Create a new media metadata cache with specified TTL (in seconds)
  pub fn new(ttl_seconds: u64) -> Self {
    Self {
      cache: Arc::new(RwLock::new(HashMap::new())),
      ttl: Duration::from_secs(ttl_seconds),
    }
  }

  /// Get cached media metadata if it exists and hasn't expired
  pub async fn get(&self, path: &str) -> Option<(u64, String)> {
    let cache = self.cache.read().await;

    if let Some(entry) = cache.get(path)
      && !entry.is_expired()
    {
      return Some((entry.duration_raw, entry.duration_formatted.clone()));
    }

    drop(cache);

    // Clean up expired entry
    let mut cache = self.cache.write().await;
    cache.remove(path);

    None
  }

  /// Store media metadata in the cache
  pub async fn set(&self, path: String, duration_raw: u64, duration_formatted: String) {
    let entry = MediaCacheEntry {
      duration_raw,
      duration_formatted,
      expires_at: Instant::now() + self.ttl,
    };

    let mut cache = self.cache.write().await;
    cache.insert(path, entry);
  }

  /// Clear the entire cache
  pub async fn clear(&self) {
    let mut cache = self.cache.write().await;
    cache.clear();
  }

  /// Get cache statistics
  pub async fn stats(&self) -> (usize, usize) {
    let cache = self.cache.read().await;
    let total = cache.len();
    let valid = cache.values().filter(|e| !e.is_expired()).count();
    (valid, total)
  }
}

impl Clone for MediaMetadataCache {
  fn clone(&self) -> Self {
    Self {
      cache: Arc::clone(&self.cache),
      ttl: self.ttl,
    }
  }
}
