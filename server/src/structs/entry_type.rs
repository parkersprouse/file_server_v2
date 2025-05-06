use std::fs;

pub struct EntryType {}

impl EntryType {
  pub const DIR: &'static str = "dir";
  pub const FILE: &'static str = "file";

  pub fn stringify(filetype: &fs::FileType) -> &'static str {
    if filetype.is_dir() { return Self::DIR; }
    Self::FILE
  }

  pub fn valid(metadata: &fs::Metadata) -> bool {
    metadata.is_dir() || metadata.is_file()
  }
}
