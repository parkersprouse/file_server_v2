use crate::{
  AppState,
  lib::error::{AppError, AppResult},
};
use actix_web::{HttpRequest, web::Data};
use std::{fs, io, path::PathBuf};
use urlencoding::decode;

pub fn invalid_pathname(pathname: &str) -> bool {
  format!("/{pathname}/").contains("/../")
}

pub fn validate_path(req: &HttpRequest, data: &Data<AppState>) -> AppResult<(PathBuf, fs::Metadata)> {
  // Decode the raw request path exactly once. actix's match-info quoter only
  // *partially* decodes (it leaves e.g. `%25` and `%2F` encoded), so decoding
  // the raw URI ourselves gives a single, predictable decode that correctly
  // handles filenames containing `%` rather than double-decoding.
  let decoded_path =
    decode(req.uri().path()).map_err(|err| AppError::Internal(format!("Failed to decode URL: {err:?}")))?;
  let pathname: &str = decoded_path.trim_matches('/');

  // Cheap first-line rejection of obvious traversal; the canonicalization below
  // is the authoritative containment check.
  if invalid_pathname(pathname) {
    return Err(AppError::InvalidPath("Path traversal detected".to_string()));
  }

  let path: PathBuf = format!("{}/{pathname}", data.config.root_dir_path).into();

  // Resolve symlinks and `.`/`..` segments, then require the real path to stay
  // within the canonical root, so a symlink inside the root can't escape it.
  // `canonicalize` also confirms the path exists.
  let canonical = match fs::canonicalize(&path) {
    Ok(canonical) => canonical,
    Err(err) if err.kind() == io::ErrorKind::NotFound => {
      return Err(AppError::NotFound("Path does not exist".to_string()));
    },
    Err(err) => return Err(AppError::Internal(format!("Failed to resolve path: {err}"))),
  };

  if !canonical.starts_with(&data.config.root_dir_canonical) {
    return Err(AppError::InvalidPath("Path escapes the root directory".to_string()));
  }

  let metadata =
    fs::metadata(&canonical).map_err(|err| AppError::Internal(format!("Failed to read metadata: {err}")))?;

  Ok((path, metadata))
}
