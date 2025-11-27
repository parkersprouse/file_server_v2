use crate::{
  AppState,
  enums::disposition_kind::DispositionKind,
  services::{read_dir, read_file},
  util,
};
use actix_web::{
  HttpRequest, HttpResponse,
  web::Data,
};
use std::fs;

pub async fn handle(req: HttpRequest, data: Data<AppState>) -> HttpResponse {
  let path = match util::validate_path(&req, &data) {
    Ok(result) => result,
    Err(err) => return err,
  };

  let Ok(metadata) = fs::metadata(&path) else {
    return HttpResponse::InternalServerError().finish();
  };

  // If the path we're requesting points to a directory
  if metadata.is_dir() {
    return match read_dir::read(&path, &data).await {
      Ok(result) => HttpResponse::Ok().json(result),
      Err(_) => HttpResponse::InternalServerError().finish(),
    }
  }

  // Or if it points to a file
  if metadata.is_file() {
    let disposition: DispositionKind = match req.uri().query() {
      Some("download") => DispositionKind::Attachment,
      Some("inline") => DispositionKind::Inline,
      _ => DispositionKind::Auto,
    };

    match read_file::read(&path, disposition).await {
      Ok(result) => return result.into_response(&req),
      Err(_) => return HttpResponse::InternalServerError().finish(),
    }
  }

  // Otherwise, 404
  HttpResponse::NotFound().finish()
}
