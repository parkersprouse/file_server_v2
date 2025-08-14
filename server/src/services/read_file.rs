use crate::{
  enums::disposition_kind::DispositionKind,
  structs::{entry_details::EntryDetails, entry_type::EntryType},
};
use actix_files::NamedFile;
use actix_web::http::header::{ContentDisposition, DispositionType};
use std::{
  fs,
  io::Error,
  path::{Path, PathBuf},
};

pub async fn read<P>(path: P, disposition_kind: DispositionKind) -> Result<NamedFile, Error>
where
  P: AsRef<Path>,
{
  match disposition_kind {
    DispositionKind::Attachment => {
      let file: NamedFile = NamedFile::open_async(&path)
        .await?
        .use_etag(true)
        .use_last_modified(true)
        .set_content_disposition(ContentDisposition {
          disposition: DispositionType::Attachment,
          parameters: vec![],
        });
      Ok(file)
    },
    DispositionKind::Inline => {
      let file: NamedFile = NamedFile::open_async(&path)
        .await?
        .use_etag(true)
        .use_last_modified(true)
        .set_content_disposition(ContentDisposition {
          disposition: DispositionType::Inline,
          parameters: vec![],
        });
      Ok(file)
    },
    DispositionKind::Auto => {
      let mut disposition = DispositionType::Attachment;

      let Ok(file_meta) = fs::metadata(&path) else {
        let file: NamedFile = NamedFile::open_async(&path)
          .await?
          .use_etag(true)
          .use_last_modified(true)
          .set_content_disposition(ContentDisposition {
            disposition,
            parameters: vec![],
          });

        return Ok(file);
      };

      let mut path_buf = PathBuf::new();
      path_buf.push(&path);

      let file_type = EntryDetails::file_type(EntryType::stringify(&file_meta.file_type()).into(), &path_buf);

      if ["audio", "document", "image", "spreadsheet", "text", "video"].contains(&file_type.as_str()) {
        disposition = DispositionType::Inline;
      }

      let file: NamedFile = NamedFile::open_async(&path)
        .await?
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
