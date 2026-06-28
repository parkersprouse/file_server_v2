use crate::{
  AppState,
  lib::error::{AppError, AppResult},
  structs::entry_type::EntryType,
};
use actix_web::web::{self, Data};
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
  pub created_at_epoch: i64,
  pub duration: String,
  pub duration_order: u8,
  pub duration_raw: u64,
  pub entry_type: String,
  pub file_size: u64,
  pub file_type: String,
  pub full_type: String,
  pub last_modified_at: String,
  pub last_modified_at_epoch: i64,
  pub name: String,
  pub name_lowercase: String,
  pub path: String,
  pub thumbnail: Option<String>,
}

/// The cheap, blocking-syscall portion of a directory entry, gathered up front
/// during the directory enumeration (see [`EntryDetails::enumerate_dir`]). The
/// expensive work — header sniffing and ffprobe — is deferred to
/// [`EntryDetails::from_raw`] so it can run concurrently off the executor.
pub struct RawEntry {
  full_path: PathBuf,
  metadata: fs::Metadata,
  name: String,
  entry_type: String,
  as_url: String,
  thumbnail: Option<String>,
}

impl EntryDetails {
  pub const INLINE_TYPES: [&str; 6] = ["audio", "document", "image", "spreadsheet", "text", "video"];

  /// Enumerate a directory, returning the cheap per-entry data for each valid
  /// child. This performs the blocking `read_dir`, `metadata`, and thumbnail
  /// `stat` syscalls and is intended to run inside `web::block`.
  pub fn enumerate_dir(dir_path: &Path, root_dir_path: &str) -> AppResult<Vec<RawEntry>> {
    let entries =
      fs::read_dir(dir_path).map_err(|err| AppError::Internal(format!("Failed to read directory: {err}")))?;

    let mut output: Vec<RawEntry> = Vec::new();
    for entry_result in entries {
      let entry = entry_result.map_err(|err| AppError::Internal(format!("Failed to read directory entry: {err}")))?;

      // Read metadata once and reuse it for validity, type, size, and times.
      // An entry whose metadata can't be read was already treated as invalid
      // by the previous `EntryType::valid` check, so skip it.
      let metadata = match entry.metadata() {
        Ok(metadata) => metadata,
        Err(_) => continue,
      };

      // skip "invalid" entry types - i.e. anything not a directory or file
      if !EntryType::valid(&entry, root_dir_path, &metadata) {
        continue;
      }

      let full_path: PathBuf = entry.path();
      let as_url: String = Self::path_to_url(&full_path, root_dir_path);
      let thumbnail: Option<String> = Self::get_thumbnail(&as_url, root_dir_path);

      output.push(RawEntry {
        // Filenames on Unix are arbitrary bytes and need not be valid UTF-8;
        // lossily convert rather than panicking on a non-UTF-8 name.
        name: entry.file_name().to_string_lossy().into_owned(),
        entry_type: EntryType::stringify(&metadata.file_type()).into(),
        metadata,
        full_path,
        as_url,
        thumbnail,
      });
    }

    Ok(output)
  }

  /// Finish building an entry from its [`RawEntry`], resolving the file format
  /// (header sniff) and media duration (ffprobe). Both blocking operations are
  /// offloaded to `web::block`, and this is invoked concurrently per entry.
  pub async fn from_raw(raw: RawEntry, data: &Data<AppState>) -> Self {
    let RawEntry {
      full_path,
      metadata,
      name,
      entry_type,
      as_url,
      thumbnail,
    } = raw;

    let file_format: Option<FileFormat> = if entry_type == EntryType::DIR {
      None
    } else {
      let sniff_type = entry_type.clone();
      let sniff_path = full_path.clone();
      web::block(move || Self::determine_file_format(&sniff_type, &sniff_path))
        .await
        .unwrap_or(Some(FileFormat::PlainText))
    };
    let file_type: String = Self::file_type(file_format);

    let duration_tuple = Self::determine_duration(&full_path, &file_type, data).await;
    let created_at = Self::determine_created_at(&metadata);
    let last_modified_at = Self::determine_modified_at(&metadata);

    let duration_order: u8 = if duration_tuple.0 == 0 { 1 } else { 0 };

    Self {
      created_at: created_at.1,
      created_at_epoch: created_at.0,
      duration: duration_tuple.1,
      duration_order,
      duration_raw: duration_tuple.0,
      entry_type,
      file_size: metadata.len(),
      file_type,
      full_type: Self::full_type(file_format),
      last_modified_at: last_modified_at.1,
      last_modified_at_epoch: last_modified_at.0,
      name_lowercase: name.to_lowercase(),
      name,
      path: as_url,
      thumbnail,
    }
  }

  pub fn determine_created_at(metadata: &fs::Metadata) -> (i64, String) {
    // created() returns btime (birth time); falls back to modified() on Linux
    // filesystems / container environments that don't expose btime via statx.
    let system_time = metadata.created().or_else(|_| metadata.modified());
    match system_time {
      Ok(output) => {
        let datetime = DateTime::<Utc>::from(output);
        (datetime.timestamp(), datetime.to_rfc3339())
      },
      Err(_) => (0, "n/a".to_string()),
    }
  }

  pub async fn determine_duration(path: &Path, file_type: &str, data: &Data<AppState>) -> (u64, String) {
    if !["audio", "video"].contains(&file_type) {
      return (0, "".into());
    }

    let path_str = path.to_string_lossy().into_owned();

    // Check cache first
    if let Some((duration_raw, duration_formatted)) = data.media_cache.get(&path_str).await {
      return (duration_raw, duration_formatted);
    }

    // ffprobe spawns and waits on an external subprocess, so run it off the
    // async executor.
    let probe_path = path.to_path_buf();
    let total_secs = match web::block(move || ffprobe::ffprobe(&probe_path)).await {
      Ok(Ok(info)) => match info.format.get_duration() {
        Some(value) => value.as_secs(),
        None => return (0, "".into()),
      },
      Ok(Err(err)) => {
        error!("{}", err);
        return (0, "".into());
      },
      Err(err) => {
        error!("ffprobe task failed: {err}");
        return (0, "".into());
      },
    };

    let duration_formatted = Self::parse_ffmpeg_duration(total_secs);

    // Cache the result
    data
      .media_cache
      .set(path_str, total_secs, duration_formatted.clone())
      .await;

    (total_secs, duration_formatted)
  }

  pub fn determine_file_format(entry_type: &str, path: &Path) -> Option<FileFormat> {
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

  pub fn determine_modified_at(metadata: &fs::Metadata) -> (i64, String) {
    match metadata.modified() {
      Ok(output) => {
        let datetime = DateTime::<Utc>::from(output);
        (datetime.timestamp(), datetime.to_rfc3339())
      },
      Err(_) => (0, "n/a".to_string()),
    }
  }

  pub fn file_type(file_format: Option<FileFormat>) -> String {
    let Some(format) = file_format else {
      return "".into();
    };

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
    match file_format {
      Some(format) => format.media_type().into(),
      None => "".into(),
    }
  }

  pub fn get_thumbnail(as_url: &str, root_dir_path: &str) -> Option<String> {
    let mut thumb_url_path = PathBuf::from(["/.thumbnails", as_url].join(""));
    thumb_url_path.set_extension("png");

    let thumb_url_path = thumb_url_path.to_str()?;

    let thumb_system_path = format!("{}{}", root_dir_path, thumb_url_path);
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

  pub fn parse_ffmpeg_duration(total_secs: u64) -> String {
    let hours = total_secs / 3600;
    let minutes = (total_secs % 3600) / 60;
    let seconds = total_secs % 60;
    format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
  }

  pub fn path_to_url(path: &Path, root_dir_path: &str) -> String {
    // Strip only the leading root prefix (on path-component boundaries) rather
    // than every occurrence of the root string anywhere in the path.
    let relative = path.strip_prefix(root_dir_path).unwrap_or(path);
    format!("/{}", relative.to_str().unwrap_or("").trim_matches('/'))
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
