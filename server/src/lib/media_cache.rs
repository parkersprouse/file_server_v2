use moka::future::Cache;
use std::time::Duration;

/// Upper bound on the number of cached media-duration entries. Beyond this,
/// moka evicts the least-recently-used entries to keep memory bounded.
const MAX_ENTRIES: u64 = 8192;

/// Media metadata cache (duration) to avoid repeated ffprobe calls, with a TTL
/// and a bounded, LRU-evicting capacity.
#[derive(Clone)]
pub struct MediaMetadataCache {
  cache: Cache<String, (u64, String)>,
}

impl MediaMetadataCache {
  /// Create a new media metadata cache with specified TTL (in seconds)
  pub fn new(ttl_seconds: u64) -> Self {
    Self {
      cache: Cache::builder()
        .max_capacity(MAX_ENTRIES)
        .time_to_live(Duration::from_secs(ttl_seconds))
        .build(),
    }
  }

  /// Get cached media metadata if it exists and hasn't expired
  pub async fn get(&self, path: &str) -> Option<(u64, String)> {
    self.cache.get(path).await
  }

  /// Store media metadata in the cache
  pub async fn set(&self, path: String, duration_raw: u64, duration_formatted: String) {
    self.cache.insert(path, (duration_raw, duration_formatted)).await;
  }
}
