use crate::{
  AppState,
  lib::error::{AppError, AppResult},
  structs::{entry_details::EntryDetails, entry_type::EntryType},
};
use actix_web::web::Data;
use std::{fs, path::Path};

pub async fn read<P>(path: P, data: &Data<AppState>) -> AppResult<Vec<EntryDetails>>
where
  P: AsRef<Path>,
{
  let path_ref = path.as_ref();
  let cache_key = path_ref.to_string_lossy().into_owned();

  // Check cache first
  if let Some(cached_result) = data.directory_cache.get(&cache_key).await {
    return Ok(cached_result);
  }

  let mut output: Vec<EntryDetails> = Vec::<EntryDetails>::new();

  let entries: fs::ReadDir =
    fs::read_dir(path).map_err(|err| AppError::Internal(format!("Failed to read directory: {err}")))?;

  for entry_result in entries {
    let entry: fs::DirEntry =
      entry_result.map_err(|err| AppError::Internal(format!("Failed to read directory entry: {err}")))?;

    // skip "invalid" entry types - i.e. anything not a directory or file
    if EntryType::valid(&entry, data) {
      output.push(EntryDetails::new(&entry, data).await);
    }
  }

  // Cache the result
  data.directory_cache.set(cache_key, output.clone()).await;

  Ok(output)
}
