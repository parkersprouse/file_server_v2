use crate::AppState;
use actix_web::web::Data;
use std::{
  ops::Index,
  path::PathBuf,
};

use serde::Serialize;

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
    created_at: String,
    duration: Option<i16>,
    filetype: String,
    last_modified_at: String,
    name: String,
    path: String,
  ) -> Self {
    Self {
      created_at,
      duration,
      filetype,
      last_modified_at,
      name,
      path,
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
