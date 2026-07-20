use crate::{
  AppState,
  lib::error::{AppError, AppResult},
  structs::entry_details::EntryDetails,
};
use actix_web::web::{self, Data};
use std::{path::Path, sync::Arc};

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

  // Phase 2: resolve each entry's file format (header sniff) and media
  // duration (ffprobe), concurrently and bounded (see `resolve_all`).
  let output = EntryDetails::resolve_all(raw_entries, data).await;

  // Cache the result behind an Arc so future hits are a cheap clone
  let output = Arc::new(output);
  data.directory_cache.set(cache_key, Arc::clone(&output)).await;

  Ok(output)
}
