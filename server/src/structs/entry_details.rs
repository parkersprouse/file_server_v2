use crate::AppState;
use crate::structs::entry_type::EntryType;
use actix_web::web::Data;
use chrono::{DateTime, Utc};
use serde::Serialize;
use std::{
  fs,
  ops::Index,
  path::PathBuf,
};

#[derive(Clone, Serialize)]
pub struct EntryDetails {
  pub created_at: String,
  pub duration: Option<i16>,
  pub filetype: String,
  pub last_modified_at: String,
  pub name: String,
  pub path: String,
}

#[allow(dead_code)]
impl EntryDetails {
  pub fn new(
    entry: &fs::DirEntry,
    data: &Data<AppState>,
  ) -> Self {
    let metadata: fs::Metadata = entry.metadata().unwrap();
    Self {
      created_at: DateTime::<Utc>::from(metadata.created().unwrap()).to_rfc3339(),
      duration: None,
      filetype: EntryType::stringify(&metadata.file_type()).into(),
      last_modified_at: DateTime::<Utc>::from(metadata.modified().unwrap()).to_rfc3339(),
      name: entry.file_name().into_string().unwrap(),
      path: Self::clean_path(entry.path(), data),
    }
  }

  pub fn clean_path(path: PathBuf, data: &Data<AppState>) -> String {
    format!(
      "/{}",
      path
        .to_str()
        .unwrap()
        .replace(&data.config.root_dir_path, "")
        .trim_matches('/')
    )
  }
}

impl Index<&'_ str> for EntryDetails {
  type Output = str;
  fn index(&self, field: &str) -> &str {
    match field {
      "created_at" => &self.created_at,
      "duration" => "TODO",
      "filetype" => &self.filetype,
      "last_modified_at" => &self.last_modified_at,
      "name" => &self.name,
      "path" => &self.path,
      _ => panic!("unknown field: {}", field),
    }
  }
}
