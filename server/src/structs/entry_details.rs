use crate::AppState;
use crate::structs::entry_type::EntryType;
use actix_web::web::Data;
use chrono::{DateTime, Utc};
use file_format::{FileFormat, Kind};
use log::warn;
use serde::Serialize;
use std::{
  fs,
  io::Read,
  ops::Index,
  path::{Path, PathBuf},
  process::Command,
};

#[derive(Clone, Serialize)]
pub struct EntryDetails {
  pub created_at: String,
  pub duration: String,
  pub entry_type: String,
  pub file_type: String,
  pub full_type: String,
  pub last_modified_at: String,
  pub name: String,
  pub path: String,
}

impl EntryDetails {
  pub const INLINE_TYPES: [&str; 6] = ["audio", "document", "image", "spreadsheet", "text", "video"];

  pub fn new(entry: &fs::DirEntry, data: &Data<AppState>) -> Self {
    let full_path: PathBuf = entry.path();
    let metadata: fs::Metadata = entry.metadata().unwrap();
    let entry_type: String = EntryType::stringify(&metadata.file_type()).into();
    let file_format: Option<FileFormat> = Self::determine_file_format(&entry_type, &full_path);
    let file_type: String = Self::file_type(file_format);
    Self {
      created_at: DateTime::<Utc>::from(metadata.created().unwrap()).to_rfc3339(),
      duration: Self::determine_duration(&full_path, &file_type),
      entry_type,
      file_type,
      full_type: Self::full_type(file_format),
      last_modified_at: DateTime::<Utc>::from(metadata.modified().unwrap()).to_rfc3339(),
      name: entry.file_name().into_string().unwrap(),
      path: Self::clean_path(&full_path, data),
    }
  }

  pub fn clean_path(path: &Path, data: &Data<AppState>) -> String {
    format!(
      "/{}",
      path
        .to_str()
        .unwrap_or("")
        .replace(&data.config.root_dir_path, "")
        .trim_matches('/')
    )
  }

  pub fn determine_duration(path: &PathBuf, file_type: &str) -> String {
    if file_type.ne("video") {
      return "".to_owned();
    }
    let result = Command::new("./metadata").arg(path).output();
    if result.is_err() {
      println!("{:?}", result.err());
      return "".to_owned();
    }

    let mut output = String::new();
    let _ = result.unwrap().stdout.as_slice().read_to_string(&mut output);
    let mut lines = output.split_terminator("\n");

    let duration_line = lines.find(|line| line.to_lowercase().starts_with("duration"));
    if duration_line.is_none() {
      return "".to_owned();
    }

    let duration = duration_line.unwrap().split_whitespace().last();
    if duration.is_none() {
      return "".to_owned();
    }

    duration
      .unwrap()
      .split(':')
      .map(|n| format!("{:02}", n.parse::<f32>().unwrap().trunc()))
      .fold(String::new(), |mut a, b| {
        a.reserve(b.len() + 1);
        a.push_str(b.as_str());
        a.push(':');
        a
      })
      .trim_end_matches(':')
      .to_owned()
  }

  pub fn determine_file_format(entry_type: &str, path: &PathBuf) -> Option<FileFormat> {
    if entry_type.eq(EntryType::DIR) {
      return None;
    }

    match FileFormat::from_file(path) {
      Ok(format) => Some(format),
      Err(err) => {
        warn!("Failed to determine file format - defaulting to plaintext\n{err}");
        Some(FileFormat::PlainText)
      },
    }
  }

  pub fn file_type(file_format: Option<FileFormat>) -> String {
    if file_format.is_none() {
      return "".into();
    }

    let format = file_format.unwrap();
    match format.kind() {
      Kind::Archive => "archive".into(), // https://github.com/mmalecot/file-format#archive
      Kind::Audio => "audio".into(),     // https://github.com/mmalecot/file-format#audio
      Kind::Compressed => "compressed".into(), // https://github.com/mmalecot/file-format#compressed
      Kind::Database => "database".into(), // https://github.com/mmalecot/file-format#database
      Kind::Diagram => "diagram".into(), // https://github.com/mmalecot/file-format#diagram
      Kind::Disk => "vdisk".into(),      // https://github.com/mmalecot/file-format#disk
      Kind::Document => "document".into(), // https://github.com/mmalecot/file-format#document
      Kind::Ebook => "ebook".into(),     // https://github.com/mmalecot/file-format#ebook
      Kind::Executable => "executable".into(), // https://github.com/mmalecot/file-format#executable
      Kind::Font => "font".into(),       // https://github.com/mmalecot/file-format#font
      Kind::Formula => "formula".into(), // https://github.com/mmalecot/file-format#formula
      Kind::Geospatial => "geospatial".into(), // https://github.com/mmalecot/file-format#geospatial
      Kind::Image => "image".into(),     // https://github.com/mmalecot/file-format#image
      Kind::Metadata => "metadata".into(), // https://github.com/mmalecot/file-format#metadata
      Kind::Model => "model".into(),     // https://github.com/mmalecot/file-format#model
      Kind::Other => {
        // https://github.com/mmalecot/file-format#other
        match format.media_type().starts_with("text/") {
          true => "text".into(),
          false => "file".into(),
        }
      },
      Kind::Package => "package".into(), // https://github.com/mmalecot/file-format#package
      Kind::Playlist => "playlist".into(), // https://github.com/mmalecot/file-format#playlist
      Kind::Presentation => "presentation".into(), // https://github.com/mmalecot/file-format#presentation
      Kind::Rom => "rom".into(),         // https://github.com/mmalecot/file-format#rom
      Kind::Spreadsheet => "spreadsheet".into(), // https://github.com/mmalecot/file-format#spreadsheet
      Kind::Subtitle => "subtitle".into(), // https://github.com/mmalecot/file-format#subtitle
      Kind::Video => "video".into(),     // https://github.com/mmalecot/file-format#video
    }
  }

  pub fn full_type(file_format: Option<FileFormat>) -> String {
    if file_format.is_none() {
      return "".into();
    }
    file_format.unwrap().media_type().into()
  }
}

impl Index<&'_ str> for EntryDetails {
  type Output = str;
  fn index(&self, field: &str) -> &str {
    match field {
      "created_at" => &self.created_at,
      "duration" => &self.duration,
      "entry_type" => &self.entry_type,
      "file_type" => &self.file_type,
      "full_type" => &self.full_type,
      "last_modified_at" => &self.last_modified_at,
      "name" => &self.name,
      "path" => &self.path,
      _ => panic!("unknown field: {field}"),
    }
  }
}
