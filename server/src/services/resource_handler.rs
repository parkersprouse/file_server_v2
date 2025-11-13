use crate::{
  AppState,
  enums::disposition_kind::DispositionKind,
  services::{read_dir, read_file},
  structs::entry_details::EntryDetails,
  util,
};
use actix_web::{
  HttpRequest, HttpResponse,
  web::Data,
};
use std::{fs, io, path::PathBuf};

pub async fn handle(req: HttpRequest, data: Data<AppState>) -> HttpResponse {
  let path_result: Result<PathBuf, HttpResponse> = util::validate_path(&req, &data);
  if path_result.is_err() {
    return path_result.err().unwrap();
  }
  let path: PathBuf = path_result.unwrap();

  let metadata_result = fs::metadata(&path);
  if metadata_result.is_err() {
    return HttpResponse::InternalServerError().finish();
  }
  let metadata: fs::Metadata = metadata_result.unwrap();

  // If the path we're requesting points to a directory
  if metadata.is_dir() {
    let result: Result<Vec<EntryDetails>, io::Error> = read_dir::read(&path, &req, &data).await;
    if result.is_err() {
      return HttpResponse::InternalServerError().finish();
    }
    return HttpResponse::Ok().json(result.unwrap());
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
