use crate::{
  AppState,
  lib::error::{AppError, AppResult},
};
use actix_web::{HttpRequest, web::Data};
use std::{fs, path::PathBuf};
use urlencoding::decode;

pub fn invalid_pathname(pathname: &str) -> bool {
  format!("/{pathname}/").contains("/../")
}

pub fn validate_path(req: &HttpRequest, data: &Data<AppState>) -> AppResult<PathBuf> {
  let decoded_path = decode(req.match_info().query("path"))
    .map_err(|err| AppError::Internal(format!("Failed to decode URL: {err:?}")))?
    .into_owned();

  let pathname: &str = decoded_path.trim_matches('/');
  if invalid_pathname(pathname) {
    return Err(AppError::InvalidPath("Path traversal detected".to_string()));
  }

  let path: PathBuf = format!("{}/{pathname}", data.config.root_dir_path).into();

  if !fs::exists(&path).map_err(|err| AppError::Internal(format!("Failed to check path existence: {err}")))? {
    return Err(AppError::NotFound("Path does not exist".to_string()));
  }

  Ok(path)
}
