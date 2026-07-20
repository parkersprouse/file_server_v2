use crate::{
  AppState,
  lib::{
    error::{AppError, AppResult},
    parse_url_file::parse,
  },
  structs::entry_type::EntryType,
};
use actix_web::web::{self, Data};
use chrono::{DateTime, Utc};
use file_format::{FileFormat, Kind};
use futures::stream::{self, StreamExt};
use log::{error, warn};

use serde::Serialize;
use std::{
  fs,
  path::{Path, PathBuf},
};

/// Maximum number of entries whose format/duration are resolved concurrently
/// by [`EntryDetails::resolve_all`]. This bounds in-flight `web::block` work
/// (and therefore ffprobe subprocesses) so a media-heavy directory can't
/// overwhelm the blocking thread pool.
const ENTRY_CONCURRENCY: usize = 8;

#[derive(Clone, Serialize)]
pub struct EntryDetails {
  pub created_at: String,
  pub created_at_epoch: i64,
  pub duration: String,
  pub duration_order: u8,
  pub duration_raw: u64,
  pub entry_type: &'static str,
  pub external_url: Option<String>,
  pub file_size: u64,
  pub file_type: &'static str,
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
  entry_type: &'static str,
  as_url: String,
  thumbnail: Option<String>,
}

impl RawEntry {
  /// Build the cheap per-entry data for a single directory entry. Performs the
  /// thumbnail `stat` syscall, so it is intended to run inside `web::block`
  /// (alongside the enumeration that produced `entry`).
  pub fn new(entry: &fs::DirEntry, metadata: fs::Metadata, root_dir_path: &str) -> Self {
    let full_path: PathBuf = entry.path();
    let as_url: String = EntryDetails::path_to_url(&full_path, root_dir_path);
    let thumbnail: Option<String> = EntryDetails::get_thumbnail(&as_url, root_dir_path);

    Self {
      // Filenames on Unix are arbitrary bytes and need not be valid UTF-8;
      // lossily convert rather than panicking on a non-UTF-8 name.
      name: entry.file_name().to_string_lossy().into_owned(),
      entry_type: EntryType::stringify(&metadata.file_type()),
      metadata,
      full_path,
      as_url,
      thumbnail,
    }
  }
}

impl EntryDetails {
  pub const INLINE_TYPES: [&str; 6] = ["audio", "document", "image", "spreadsheet", "text", "video"];
  pub const EXT_URL_EXTS: [&str; 2] = ["url", "webloc"];

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

      output.push(RawEntry::new(&entry, metadata, root_dir_path));
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
    let name_lowercase = name.to_lowercase();

    let file_format: Option<FileFormat> = if entry_type == EntryType::DIR {
      None
    } else {
      let sniff_path = full_path.clone();
      web::block(move || Self::determine_file_format(&sniff_path))
        .await
        .unwrap_or(Some(FileFormat::PlainText))
    };
    let file_type = Self::file_type(file_format);

    let duration_tuple = Self::determine_duration(&full_path, file_type, data).await;
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
      external_url: Self::external_url(full_path).await,
      file_size: metadata.len(),
      file_type,
      full_type: Self::full_type(file_format),
      last_modified_at: last_modified_at.1,
      last_modified_at_epoch: last_modified_at.0,
      name_lowercase,
      name,
      path: as_url,
      thumbnail,
    }
  }

  /// Resolve every raw entry's file format (header sniff) and media duration
  /// (ffprobe) concurrently, bounded to [`ENTRY_CONCURRENCY`] in flight rather
  /// than sequentially blocking on each entry in turn. Shared by directory
  /// listings and search results so the concurrency policy lives in one place.
  pub async fn resolve_all(raw_entries: Vec<RawEntry>, data: &Data<AppState>) -> Vec<Self> {
    stream::iter(raw_entries)
      .map(|raw| Self::from_raw(raw, data))
      .buffered(ENTRY_CONCURRENCY)
      .collect()
      .await
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

  /// Sniff a file's format from its header bytes. Callers are expected to
  /// have ruled out directories (which have no format) themselves.
  pub fn determine_file_format(path: &Path) -> Option<FileFormat> {
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

  pub async fn external_url(path: PathBuf) -> Option<String> {
    let ext = path.extension()?.to_str()?.to_lowercase();
    if !Self::EXT_URL_EXTS.contains(&ext.as_str()) {
      return None;
    }

    // Read off the executor. A shortcut that can't be read — or isn't valid
    // UTF-8, like a binary-plist `.webloc` — simply has no external URL; it
    // must never fail (or panic) the listing that's being built.
    let content = web::block(move || fs::read_to_string(path)).await.ok()?.ok()?;
    parse(&ext, &content)
  }

  // Kind reference: https://github.com/mmalecot/file-format#file-kinds
  pub fn file_type(file_format: Option<FileFormat>) -> &'static str {
    let Some(format) = file_format else {
      return "";
    };

    match format.kind() {
      Kind::Archive => "archive",
      Kind::Audio => "audio",
      Kind::Compressed => "compressed",
      Kind::Database => "database",
      Kind::Diagram => "diagram",
      Kind::Disk => "vdisk",
      Kind::Document => "document",
      Kind::Ebook => "ebook",
      Kind::Executable => "executable",
      Kind::Font => "font",
      Kind::Formula => "formula",
      Kind::Geospatial => "geospatial",
      Kind::Image => "image",
      Kind::Metadata => "metadata",
      Kind::Model => "model",
      Kind::Other => match format.media_type().starts_with("text/") {
        true => "text",
        false => "file",
      },
      Kind::Package => "package",
      Kind::Playlist => "playlist",
      Kind::Presentation => "presentation",
      Kind::Rom => "rom",
      Kind::Spreadsheet => "spreadsheet",
      Kind::Subtitle => "subtitle",
      Kind::Video => "video",
      _ => "unknown",
    }
  }

  // `String` rather than `&'static str`: `FileFormat::media_type` ties its
  // (actually static) literals to `&self`, so the borrow can't outlive `format`.
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
    // Decode lossily rather than with `to_str()`: a single non-UTF-8 component
    // (possible on external/removable drives) would otherwise make the whole
    // path `None` and collapse to "/", mislabeling every entry in the subtree
    // and breaking their links. `to_string_lossy` degrades just the offending
    // name (a U+FFFD; its own link may not resolve) while keeping the path
    // structure intact, and is an exact no-op for valid UTF-8.
    //
    // URL paths always use '/'. On Windows the native separator is '\', so
    // normalize the platform separator to '/' — otherwise a nested entry would
    // serialize as e.g. `/videos\clip.mp4`, which the client (splitting on '/')
    // reads as a single root-level segment. This is a no-op on Unix, where '/'
    // is already the separator and a literal '\' is a valid filename character
    // that must be left untouched.
    let relative = relative.to_string_lossy().replace(std::path::MAIN_SEPARATOR, "/");
    format!("/{}", relative.trim_matches('/'))
  }
}
