use crate::{
  enums::disposition_kind::DispositionKind,
  lib::error::{AppError, AppResult},
  structs::entry_details::EntryDetails,
};
use actix_files::NamedFile;
use actix_web::http::header::{ContentDisposition, DispositionType};
use std::path::Path;

pub async fn read<P>(path: P, disposition_kind: DispositionKind) -> AppResult<NamedFile>
where
  P: AsRef<Path>,
{
  let disposition = match disposition_kind {
    DispositionKind::Attachment => DispositionType::Attachment,
    DispositionKind::Inline => DispositionType::Inline,
    // No explicit preference: render inline when the sniffed type is one the
    // client can preview, download everything else.
    DispositionKind::Auto => {
      let file_format = EntryDetails::determine_file_format(path.as_ref());
      let file_type = EntryDetails::file_type(file_format);
      match EntryDetails::INLINE_TYPES.contains(&file_type) {
        true => DispositionType::Inline,
        false => DispositionType::Attachment,
      }
    },
  };

  let file = NamedFile::open_async(&path)
    .await
    .map_err(|err| AppError::Internal(format!("Failed to open file: {err}")))?
    .use_etag(true)
    .use_last_modified(true)
    .set_content_disposition(ContentDisposition {
      disposition,
      parameters: vec![],
    });

  Ok(file)
}
