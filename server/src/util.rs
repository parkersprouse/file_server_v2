use crate::AppState;
use actix_web::{HttpRequest, HttpResponse, web::Data};
use std::{fs, io::Error as IOError, path::PathBuf};

pub fn invalid_pathname(pathname: &str) -> bool {
  format!("/{pathname}/").contains("/../")
}

pub fn validate_path(req: &HttpRequest, data: &Data<AppState>) -> Result<PathBuf, HttpResponse> {
  let pathname: &str = req.match_info().query("path").trim_matches('/');
  if invalid_pathname(pathname) {
    return Err(HttpResponse::NotFound().finish());
  }
  let path: PathBuf = format!("{}/{pathname}", data.config.root_dir_path).into();

  let exists: Result<bool, IOError> = fs::exists(&path);
  if exists.is_err() {
    return Err(HttpResponse::InternalServerError().finish());
  }
  if !(exists.unwrap()) {
    return Err(HttpResponse::NotFound().finish());
  }

  Ok(path)
}
