use crate::AppState;
use actix_web::{
  web::Data,
  HttpRequest,
  HttpResponse,
};
use std::{
  fs,
  path::PathBuf,
};

pub fn invalid_pathname(pathname: &str) -> bool {
  format!("/{}/", pathname).contains("/../")
}

pub fn validate_path(req: &HttpRequest, data: &Data<AppState>) -> Result<PathBuf, HttpResponse> {
  let pathname: &str = req.match_info().query("path").trim_matches('/');
  if invalid_pathname(pathname) { return Err(HttpResponse::NotFound().finish()); }
  let path = format!("{}/{}", data.config.root_dir_path, pathname).into();

  let exists = fs::exists(&path);
  if exists.is_err() { return Err(HttpResponse::InternalServerError().finish()); }
  if !(exists.unwrap()) { return Err(HttpResponse::NotFound().finish()); }

  Ok(path)
}
