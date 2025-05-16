use crate::AppState;
use actix_files::NamedFile;
use actix_web::{
  http::header::{ContentDisposition, DispositionType},
  web::Data,
};
use std::{io::Error, path::Path};

pub async fn read<P>(path: P, _data: &Data<AppState>) -> Result<NamedFile, Error>
where
  P: AsRef<Path>,
{
  let file: NamedFile = NamedFile::open_async(path).await?
    .use_etag(true)
    .use_last_modified(true)
    .set_content_disposition(ContentDisposition {
      disposition: DispositionType::Attachment,
      parameters: vec![],
    });

  Ok(file)
}
