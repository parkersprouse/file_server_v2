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
  let decoded_path = decode(req.match_info().query("path"))
    .map_err(|err| AppError::Internal(format!("Failed to decode URL: {err:?}")))?
    .into_owned();

  let pathname: &str = decoded_path.trim_matches('/');
  if invalid_pathname(pathname) {
    return Err(AppError::InvalidPath("Path traversal detected".to_string()));
  }

  let path: PathBuf = format!("{}/{pathname}", data.config.root_dir_path).into();

  // A single `metadata` call both confirms the path exists and yields its file
  // type, replacing the separate `exists` check here and the `metadata` call
  // previously repeated in the resource handler.
  let metadata = match fs::metadata(&path) {
    Ok(metadata) => metadata,
    Err(err) if err.kind() == io::ErrorKind::NotFound => {
      return Err(AppError::NotFound("Path does not exist".to_string()));
    },
    Err(err) => return Err(AppError::Internal(format!("Failed to check path existence: {err}"))),
  };

  Ok((path, metadata))
}
