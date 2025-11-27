use crate::AppState;
use actix_web::web::Data;
use std::fs;

pub struct EntryType {}

impl EntryType {
  pub const DIR: &'static str = "dir";
  pub const FILE: &'static str = "file";

  pub fn stringify(filetype: &fs::FileType) -> &'static str {
    if filetype.is_dir() {
      return Self::DIR;
    }
    Self::FILE
  }

  pub fn valid(entry: &fs::DirEntry, data: &Data<AppState>) -> bool {
    // We're only concerned about hiding the root thumbnails folder
    if entry.path().to_str().unwrap_or("").replace(&data.config.root_dir_path, "").trim_matches('/') == ".thumbnails" {
      return false;
    }
    match entry.metadata() {
      Ok(metadata) => metadata.is_dir() || metadata.is_file(),
      Err(_) => false,
    }
  }
}
