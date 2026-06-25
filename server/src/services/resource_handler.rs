use crate::{
  AppState,
  enums::disposition_kind::DispositionKind,
  lib::error::{AppError, AppResult},
  services::{read_dir, read_file},
  util,
};
use actix_web::{HttpRequest, HttpResponse, ResponseError, web::Data};
use log::warn;

pub async fn handle(req: HttpRequest, data: Data<AppState>) -> HttpResponse {
  match handle_impl(req, data).await {
    Ok(response) => response,
    Err(err) => err.error_response(),
  }
}

async fn handle_impl(req: HttpRequest, data: Data<AppState>) -> AppResult<HttpResponse> {
  // `validate_path` performs the single `stat` and hands back the metadata.
  let (path, metadata) = util::validate_path(&req, &data)?;

  // If the path we're requesting points to a directory
  if metadata.is_dir() {
    return read_dir::read(&path, &data)
      .await
      .map(|result| HttpResponse::Ok().json(result.as_ref()));
  }

  // Or if it points to a file
  if metadata.is_file() {
    let disposition: DispositionKind = match req.uri().query() {
      Some("download") => DispositionKind::Attachment,
      Some("inline") => DispositionKind::Inline,
      _ => DispositionKind::Auto,
    };

    return read_file::read(&path, disposition, &metadata)
      .await
      .map(|result| result.into_response(&req))
      .map_err(|err| AppError::Internal(format!("Failed to read file: {err}")));
  }

  // Otherwise, 404
  warn!("Requested path is neither a file nor directory: {:?}", path);
  Err(AppError::NotFound(
    "Resource is neither a file nor directory".to_string(),
  ))
}
