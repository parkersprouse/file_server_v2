use file_format::FileFormat;
use moka::future::Cache;
use std::{fs, time::Duration, time::SystemTime};

/// Upper bound on the number of cached per-file metadata entries. Beyond this,
/// moka evicts the least-recently-used entries to keep memory bounded. This
/// holds one small entry per *file* (not per directory), so it is sized well
/// above the directory-listing cache.
const MAX_ENTRIES: u64 = 32_768;

/// Identifies a specific version of a file's contents. Entries are validated
/// against this rather than expiring purely on time: if a file is replaced or
/// edited, its stamp changes and the cached metadata is treated as a miss.
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct ContentStamp {
  modified: SystemTime,
  size: u64,
}

impl ContentStamp {
  /// Build a stamp from metadata that has already been read (during the
  /// directory enumeration), so this costs no extra syscall.
  ///
  /// Returns `None` when the filesystem can't report a modification time —
  /// without one there is no way to tell a stale entry from a fresh one, so
  /// such a file is simply never cached.
  pub fn of(metadata: &fs::Metadata) -> Option<Self> {
    Some(Self {
      modified: metadata.modified().ok()?,
      size: metadata.len(),
    })
  }
}

/// The expensive-to-derive half of an entry: the sniffed file format (reads the
/// file's header bytes) and the media duration (spawns `ffprobe`).
#[derive(Clone)]
pub struct CachedMetadata {
  stamp: ContentStamp,
  pub file_format: Option<FileFormat>,
  /// `None` means "no usable answer yet" — either the probe failed or ffprobe
  /// is absent. Stored as `None` rather than a zero duration so the probe is
  /// retried instead of a transient failure being pinned for the whole TTL.
  /// A file that legitimately has no duration (i.e. isn't audio/video) caches
  /// as `Some((0, ""))`, which is derived from the format and never probes.
  pub duration: Option<(u64, String)>,
}

/// Per-file metadata cache that spares repeat header sniffs and `ffprobe`
/// invocations across directory listings and searches.
///
/// Keyed by path but *validated* by [`ContentStamp`], which is what lets the
/// TTL be long: a stale entry can only survive if the file it describes is
/// byte-for-byte unchanged in size and mtime. The TTL is therefore just a
/// memory bound and a backstop for the cases a stamp can't catch, not the
/// correctness mechanism.
#[derive(Clone)]
pub struct EntryMetadataCache {
  cache: Cache<String, CachedMetadata>,
}

impl EntryMetadataCache {
  /// Create a new metadata cache with the specified TTL (in seconds).
  pub fn new(ttl_seconds: u64) -> Self {
    Self {
      cache: Cache::builder()
        .max_capacity(MAX_ENTRIES)
        .time_to_live(Duration::from_secs(ttl_seconds))
        .build(),
    }
  }

  /// Fetch the cached metadata for `path`, but only if it was recorded against
  /// the same content stamp. A file that has changed since it was cached reads
  /// as a miss.
  pub async fn get(&self, path: &str, stamp: ContentStamp) -> Option<CachedMetadata> {
    self.cache.get(path).await.filter(|entry| entry.stamp == stamp)
  }

  /// Record metadata for `path` against the content stamp it was derived from.
  pub async fn set(
    &self,
    path: String,
    stamp: ContentStamp,
    file_format: Option<FileFormat>,
    duration: Option<(u64, String)>,
  ) {
    self
      .cache
      .insert(
        path,
        CachedMetadata {
          stamp,
          file_format,
          duration,
        },
      )
      .await;
  }
}
