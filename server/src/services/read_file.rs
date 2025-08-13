use actix_files::NamedFile;
use actix_web::http::header::{ContentDisposition, DispositionType};
use std::{
  fs,
  io::Error,
  path::{Path, PathBuf},
};

use crate::structs::{entry_details::EntryDetails, entry_type::EntryType};

pub async fn read<P>(path: P, force_download: bool) -> Result<NamedFile, Error>
where
  P: AsRef<Path>,
{
  let file_meta_result = fs::metadata(&path);

  if force_download || file_meta_result.is_err() {
    let file: NamedFile = NamedFile::open_async(&path)
      .await?
      .use_etag(true)
      .use_last_modified(true)
      .set_content_disposition(ContentDisposition {
        disposition: DispositionType::Attachment,
        parameters: vec![],
      });

    Ok(file)
  } else {
    let file_meta = file_meta_result.unwrap();
    let mut path_buf = PathBuf::new();
    path_buf.push(&path);

    let file_type = EntryDetails::file_type(EntryType::stringify(&file_meta.file_type()).into(), &path_buf);

    let mut disposition = DispositionType::Attachment;
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
  }
}
