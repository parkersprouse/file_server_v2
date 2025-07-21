use actix_files::NamedFile;
use actix_web::http::header::{ContentDisposition, DispositionType};
use std::{io::Error, path::Path};

pub async fn read<P>(path: P) -> Result<NamedFile, Error>
where
  P: AsRef<Path>,
{
  let file: NamedFile = NamedFile::open_async(path)
    .await?
    .use_etag(true)
    .use_last_modified(true)
    .set_content_disposition(ContentDisposition {
      disposition: DispositionType::Inline,
      parameters: vec![],
    });

  Ok(file)
}
