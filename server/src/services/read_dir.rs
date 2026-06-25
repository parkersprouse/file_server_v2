use crate::{
  AppState,
  lib::error::{AppError, AppResult},
  structs::entry_details::EntryDetails,
};
use actix_web::web::{self, Data};
use futures::stream::{self, StreamExt};
use std::{path::Path, sync::Arc};

/// Maximum number of entries whose format/duration are resolved concurrently.
/// This bounds in-flight `web::block` work (and therefore ffprobe subprocesses)
/// so a media-heavy directory can't overwhelm the blocking thread pool.
const ENTRY_CONCURRENCY: usize = 8;

pub async fn read<P>(path: P, data: &Data<AppState>) -> AppResult<Arc<Vec<EntryDetails>>>
where
  P: AsRef<Path>,
{
  let path_ref = path.as_ref();
  let cache_key = path_ref.to_string_lossy().into_owned();

  // Check cache first
  if let Some(cached_result) = data.directory_cache.get(&cache_key).await {
    return Ok(cached_result);
  }

  // Phase 1: enumerate the directory off the async executor. `read_dir`, the
  // per-entry `metadata`, and the thumbnail `stat` are all blocking syscalls.
  let dir_path = path_ref.to_path_buf();
  let root_dir_path = data.config.root_dir_path.clone();
  let raw_entries = web::block(move || EntryDetails::enumerate_dir(&dir_path, &root_dir_path))
    .await
    .map_err(|err| AppError::Internal(format!("Directory scan task failed: {err}")))??;

  // Phase 2: resolve each entry's file format (header sniff) and media duration
  // (ffprobe) concurrently, bounded to ENTRY_CONCURRENCY in flight, rather than
  // sequentially blocking a worker thread on each entry in turn.
  let output: Vec<EntryDetails> = stream::iter(raw_entries)
    .map(|raw| EntryDetails::from_raw(raw, data))
    .buffered(ENTRY_CONCURRENCY)
    .collect()
    .await;

  // Cache the result behind an Arc so future hits are a cheap clone
  let output = Arc::new(output);
  data.directory_cache.set(cache_key, Arc::clone(&output)).await;

  Ok(output)
}
