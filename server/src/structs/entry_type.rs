use std::fs;

pub struct EntryType {}

impl EntryType {
  pub const DIR: &'static str = "dir";
  pub const FILE: &'static str = "file";

  pub fn stringify(entry_type: &fs::FileType) -> &'static str {
    if entry_type.is_dir() { return Self::DIR; }
    Self::FILE
  }

  pub fn valid(entry: &fs::DirEntry) -> bool {
    match entry.metadata() {
      Ok(metadata) => {
        metadata.is_dir() || metadata.is_file()
      }
      Err(_) => {
        false
      }
    }
  }
}
