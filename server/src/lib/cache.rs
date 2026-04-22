use crate::structs::entry_details::EntryDetails;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Cache entry that stores directory listings with expiration time
#[derive(Clone)]
struct CacheEntry {
  data: Vec<EntryDetails>,
  expires_at: Instant,
}

impl CacheEntry {
  fn is_expired(&self) -> bool {
    Instant::now() > self.expires_at
  }
}

/// Directory listing cache with TTL support
pub struct DirectoryCache {
  cache: Arc<RwLock<HashMap<String, CacheEntry>>>,
  ttl: Duration,
}

impl DirectoryCache {
  /// Create a new directory cache with specified TTL (in seconds)
  pub fn new(ttl_seconds: u64) -> Self {
    Self {
      cache: Arc::new(RwLock::new(HashMap::new())),
      ttl: Duration::from_secs(ttl_seconds),
    }
  }

  /// Get a cached directory listing if it exists and hasn't expired
  pub async fn get(&self, path: &str) -> Option<Vec<EntryDetails>> {
    let cache = self.cache.read().await;

    if let Some(entry) = cache.get(path)
      && !entry.is_expired()
    {
      return Some(entry.data.clone());
    }

    drop(cache);

    // Clean up expired entry
    let mut cache = self.cache.write().await;
    cache.remove(path);

    None
  }

  /// Store a directory listing in the cache
  pub async fn set(&self, path: String, data: Vec<EntryDetails>) {
    let entry = CacheEntry {
      data,
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

  /// Get cache statistics (mainly for debugging/monitoring)
  pub async fn stats(&self) -> (usize, usize) {
    let cache = self.cache.read().await;
    let total = cache.len();
    let valid = cache.values().filter(|e| !e.is_expired()).count();
    (valid, total)
  }
}

impl Clone for DirectoryCache {
  fn clone(&self) -> Self {
    Self {
      cache: Arc::clone(&self.cache),
      ttl: self.ttl,
    }
  }
}
