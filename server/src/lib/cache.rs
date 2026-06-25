use crate::structs::entry_details::EntryDetails;
use moka::future::Cache;
use std::sync::Arc;
use std::time::Duration;

/// Upper bound on the number of cached directory listings. Beyond this, moka
/// evicts the least-recently-used entries, so memory can't grow without bound.
const MAX_ENTRIES: u64 = 1024;

/// Directory listing cache with a TTL and a bounded, LRU-evicting capacity.
///
/// Values are stored behind an `Arc` so a cache hit hands back a cheap
/// `Arc::clone` rather than deep-copying the whole `Vec<EntryDetails>`.
#[derive(Clone)]
pub struct DirectoryCache {
  cache: Cache<String, Arc<Vec<EntryDetails>>>,
}

impl DirectoryCache {
  /// Create a new directory cache with specified TTL (in seconds)
  pub fn new(ttl_seconds: u64) -> Self {
    Self {
      cache: Cache::builder()
        .max_capacity(MAX_ENTRIES)
        .time_to_live(Duration::from_secs(ttl_seconds))
        .build(),
    }
  }

  /// Get a cached directory listing if it exists and hasn't expired
  pub async fn get(&self, path: &str) -> Option<Arc<Vec<EntryDetails>>> {
    self.cache.get(path).await
  }

  /// Store a directory listing in the cache
  pub async fn set(&self, path: String, data: Arc<Vec<EntryDetails>>) {
    self.cache.insert(path, data).await;
  }
}
