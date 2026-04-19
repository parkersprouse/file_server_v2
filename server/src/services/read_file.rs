use crate::{
  enums::disposition_kind::DispositionKind,
  lib::error::{AppError, AppResult},
  structs::{entry_details::EntryDetails, entry_type::EntryType},
};
use actix_files::NamedFile;
use actix_web::http::header::{ContentDisposition, DispositionType};
use log::error as log_error;
use std::{
  fs,
  path::{Path, PathBuf},
};

pub async fn read<P>(path: P, disposition_kind: DispositionKind) -> AppResult<NamedFile>
where
  P: AsRef<Path>,
{
  match disposition_kind {
    DispositionKind::Attachment => {
      let file = NamedFile::open_async(&path)
        .await
        .map_err(|err| AppError::Internal(format!("Failed to open file for attachment: {err}")))?
        .use_etag(true)
        .use_last_modified(true)
        .read_mode_threshold(0)
        .set_content_disposition(ContentDisposition {
          disposition: DispositionType::Attachment,
          parameters: vec![],
        });
      Ok(file)
    },
    DispositionKind::Inline => {
      let file = NamedFile::open_async(&path)
        .await
        .map_err(|err| AppError::Internal(format!("Failed to open file for inline: {err}")))?
        .use_etag(true)
        .use_last_modified(true)
        .read_mode_threshold(0)
        .set_content_disposition(ContentDisposition {
          disposition: DispositionType::Inline,
          parameters: vec![],
        });
      Ok(file)
    },
    DispositionKind::Auto => {
      let mut disposition = DispositionType::Attachment;

      if let Ok(file_meta) = fs::metadata(&path) {
        let mut path_buf = PathBuf::new();
        path_buf.push(&path);

        let file_format = EntryDetails::determine_file_format(EntryType::stringify(&file_meta.file_type()), &path_buf);
        let file_type = EntryDetails::file_type(file_format);

        if EntryDetails::INLINE_TYPES.contains(&file_type.as_str()) {
          disposition = DispositionType::Inline;
        }
      } else {
        log_error!("Failed to read file metadata for disposition detection, defaulting to attachment");
      }

      let file: NamedFile = NamedFile::open_async(&path)
        .await
        .map_err(|err| AppError::Internal(format!("Failed to open file: {err}")))?
        .use_etag(true)
        .use_last_modified(true)
        .set_content_disposition(ContentDisposition {
          disposition,
          parameters: vec![],
        });

      Ok(file)
    },
  }
}
