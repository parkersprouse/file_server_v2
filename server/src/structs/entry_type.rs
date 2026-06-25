use std::{fs, path::Path};

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

  pub fn valid(entry: &fs::DirEntry, root_dir_path: &str, metadata: &fs::Metadata) -> bool {
    // We're only concerned about hiding the root thumbnails folder. Compare the
    // path relative to the root (prefix-only, on component boundaries) rather
    // than substring-replacing the root string anywhere in the path.
    let path = entry.path();
    if path.strip_prefix(root_dir_path) == Ok(Path::new(".thumbnails")) {
      return false;
    }
    metadata.is_dir() || metadata.is_file()
  }
}
