use crate::{
  AppState,
  structs::entry_type::EntryType,
};
use actix_web::web::Data;
use chrono::{DateTime, Utc};
use file_format::{FileFormat, Kind};
use log::{error, warn};

use serde::Serialize;
use std::{
  fs,
  ops::Index,
  path::{Path, PathBuf},
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
  pub raw_duration: u64,
  pub thumbnail: Option<String>,
}

impl EntryDetails {
  pub const INLINE_TYPES: [&str; 6] = ["audio", "document", "image", "spreadsheet", "text", "video"];

  pub async fn new(entry: &fs::DirEntry, data: &Data<AppState>) -> Self {
    let metadata: fs::Metadata = entry.metadata().unwrap();
    let entry_type: String = EntryType::stringify(&metadata.file_type()).into();
    let full_path: PathBuf = entry.path();
    let file_format: Option<FileFormat> = Self::determine_file_format(&entry_type, &full_path);
    let file_type: String = Self::file_type(file_format);
    let as_url: String = Self::path_to_url(&full_path, data);
    let duration_tuple = Self::determine_duration(&full_path, &file_type).await;

    Self {
      created_at: Self::determine_created_at(&metadata),
      duration: duration_tuple.1,
      entry_type,
      file_type,
      full_type: Self::full_type(file_format),
      last_modified_at: Self::determine_modified_at(&metadata),
      name: entry.file_name().into_string().unwrap(),
      path: as_url.clone(),
      raw_duration: duration_tuple.0,
      thumbnail: Self::get_thumbnail(as_url, data),
    }
  }

  pub fn determine_created_at(metadata: &fs::Metadata) -> String {
    match metadata.created() {
      Ok(output) => DateTime::<Utc>::from(output).to_rfc3339(),
      Err(_) => "n/a".into(),
    }
  }

  pub async fn determine_duration(path: &PathBuf, file_type: &str) -> (u64, String) {
    if !["audio", "video"].contains(&file_type) {
      return (0, "".into());
    }

    let output = match ffprobe::ffprobe(path) {
      Ok(info) => info,
      Err(err) => {
        error!("{}", err);
        return (0, "".into());
      },
    };

    match output.format.get_duration() {
      Some(value) => {
        let total_secs = value.as_secs();
        (total_secs, Self::parse_ffmpeg_duration(total_secs))
      },
      None => (0, "".into()),
    }
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

  pub fn determine_modified_at(metadata: &fs::Metadata) -> String {
    match metadata.modified() {
      Ok(output) => DateTime::<Utc>::from(output).to_rfc3339(),
      Err(_) => "n/a".into(),
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
      _ => "unknown".into(),
    }
  }

  pub fn full_type(file_format: Option<FileFormat>) -> String {
    if file_format.is_none() {
      return "".into();
    }
    file_format.unwrap().media_type().into()
  }

  pub fn get_thumbnail(as_url: String, data: &Data<AppState>) -> Option<String> {
    let mut thumb_url_path = PathBuf::from(["/.thumbnails", &as_url].join(""));
    thumb_url_path.set_extension("png");

    let Some(thumb_url_path) = thumb_url_path.to_str() else {
      return None;
    };

    let thumb_system_path = format!("{}{}", &data.config.root_dir_path, thumb_url_path);
    match PathBuf::from(thumb_system_path).try_exists() {
      Ok(exists) => {
        if exists {
          Some(thumb_url_path.to_string())
        } else {
          None
        }
      },
      Err(_) => None,
    }
  }

  pub fn is_dir(self: &EntryDetails) -> bool {
    EntryType::is_dir(self)
  }

  pub fn is_file(self: &EntryDetails) -> bool {
    EntryType::is_file(self)
  }

  pub fn parse_ffmpeg_duration(total_secs: u64) -> String {
    let hours = total_secs / 3600;
    let minutes = (total_secs % 3600) / 60;
    let seconds = total_secs % 60;
    format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
  }

  pub fn path_to_url(path: &Path, data: &Data<AppState>) -> String {
    format!(
      "/{}",
      path
        .to_str()
        .unwrap_or("")
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
