use crate::{
  AppState,
  lib::error::{AppError, AppResult},
  structs::{
    entry_details::{EntryDetails, RawEntry},
    entry_type::EntryType,
  },
};
use actix_web::web::{self, Data, Query};
use regex_lite::Regex;
use serde::Deserialize;
use std::{fs, path::Path, path::PathBuf};

/// Hard cap on returned matches, so a broad pattern over a large tree can't
/// produce an unbounded response (or unbounded ffprobe work in phase 2).
const MAX_RESULTS: usize = 500;
/// Recursion depth cap for the directory walk.
const MAX_DEPTH: usize = 32;
/// Cap on the number of directories visited by a single search, bounding how
/// long one request can occupy a blocking worker thread.
const MAX_DIRS: usize = 10_000;
/// Longest search pattern considered; anything beyond this is truncated before
/// being compiled into a regex.
const MAX_PATTERN_CHARS: usize = 256;

#[derive(Clone, Copy, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SearchScope {
  /// Search the whole tree from the configured root, wherever the request path points.
  Everywhere,
  /// Search the requested directory and everything beneath it.
  Recursive,
  /// Search only the requested directory's immediate children.
  Current,
}

#[derive(Clone, Copy, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SearchMatch {
  All,
  Files,
  Dirs,
}

#[derive(Clone, Deserialize)]
pub struct SearchParams {
  pub search: String,
  #[serde(default = "SearchParams::default_scope")]
  pub scope: SearchScope,
  #[serde(rename = "match", default = "SearchParams::default_match")]
  pub match_kind: SearchMatch,
  /// Matching is case-insensitive unless this is set.
  #[serde(rename = "case", default)]
  pub case_sensitive: bool,
  /// Subsequence ("fuzzy") matching: the pattern's characters must appear in
  /// the entry name in order, but not necessarily adjacently.
  #[serde(default)]
  pub fuzzy: bool,
}

impl SearchParams {
  fn default_scope() -> SearchScope {
    SearchScope::Recursive
  }

  fn default_match() -> SearchMatch {
    SearchMatch::All
  }
}

/// Parse a request's query string into search parameters. Returns `None` when
/// the query isn't a search (no/empty `search` param, or unparseable values),
/// in which case the request falls through to a plain directory listing.
pub fn parse_params(query: Option<&str>) -> Option<SearchParams> {
  let params = Query::<SearchParams>::from_query(query?).ok()?.into_inner();
  if params.search.trim().is_empty() {
    return None;
  }
  Some(params)
}

pub async fn search(path: &Path, params: SearchParams, data: &Data<AppState>) -> AppResult<Vec<EntryDetails>> {
  let base_dir: PathBuf = match params.scope {
    SearchScope::Everywhere => PathBuf::from(&data.config.root_dir_path),
    _ => path.to_path_buf(),
  };

  let matcher = build_matcher(&params)?;
  let root_dir_path = data.config.root_dir_path.clone();

  // Phase 1: walk the tree off the async executor — `read_dir`, the per-entry
  // `metadata`, and the thumbnail `stat` are all blocking syscalls.
  let raw_entries = web::block(move || collect_matches(&base_dir, &root_dir_path, &matcher, &params))
    .await
    .map_err(|err| AppError::Internal(format!("Search task failed: {err}")))??;

  // Phase 2: resolve each match's file format and media duration,
  // concurrently and bounded (see `resolve_all` — shared with `read_dir`).
  Ok(EntryDetails::resolve_all(raw_entries, data).await)
}

/// Compile the search pattern into a single regex applied to entry names:
/// - fuzzy: subsequence match (characters in order, gaps allowed);
/// - contains `*` / `?` wildcards: glob-style match against the whole name
///   (`file*.png` matches `file.png`, `file_name.png`, ...);
/// - otherwise: plain substring match.
fn build_matcher(params: &SearchParams) -> AppResult<Regex> {
  let term: String = params.search.trim().chars().take(MAX_PATTERN_CHARS).collect();

  let mut pattern = String::new();
  if !params.case_sensitive {
    pattern.push_str("(?i)");
  }

  if params.fuzzy {
    // Wildcards are meaningless under subsequence matching (which already
    // allows arbitrary gaps), so drop them rather than matching them literally.
    let chars: Vec<String> = term
      .chars()
      .filter(|c| !matches!(c, '*' | '?'))
      .map(|c| regex_lite::escape(&c.to_string()))
      .collect();
    pattern.push_str(&chars.join(".*"));
  } else if term.contains(['*', '?']) {
    pattern.push('^');
    for c in term.chars() {
      match c {
        '*' => pattern.push_str(".*"),
        '?' => pattern.push('.'),
        c => pattern.push_str(&regex_lite::escape(&c.to_string())),
      }
    }
    pattern.push('$');
  } else {
    pattern.push_str(&regex_lite::escape(&term));
  }

  Regex::new(&pattern).map_err(|err| AppError::Internal(format!("Failed to compile search pattern: {err}")))
}

/// Iteratively walk `base_dir` collecting entries whose names match. Applies
/// the same entry validity rules as directory listings (symlinks and the root
/// `.thumbnails` folder are skipped — so symlink cycles/escapes can't occur),
/// and stops at MAX_RESULTS matches / MAX_DIRS visited / MAX_DEPTH deep.
fn collect_matches(
  base_dir: &Path,
  root_dir_path: &str,
  matcher: &Regex,
  params: &SearchParams,
) -> AppResult<Vec<RawEntry>> {
  let recursive = params.scope != SearchScope::Current;

  let mut output: Vec<RawEntry> = Vec::new();
  let mut pending: Vec<(PathBuf, usize)> = vec![(base_dir.to_path_buf(), 0)];
  let mut dirs_visited: usize = 0;

  while let Some((dir, depth)) = pending.pop() {
    if dirs_visited >= MAX_DIRS {
      break;
    }
    dirs_visited += 1;

    let entries = match fs::read_dir(&dir) {
      Ok(entries) => entries,
      // The base directory was just validated, so failing to read it is a real
      // error; an unreadable subdirectory (e.g. permissions) is skipped.
      Err(err) if depth == 0 => {
        return Err(AppError::Internal(format!("Failed to read directory: {err}")));
      },
      Err(_) => continue,
    };

    for entry_result in entries {
      let Ok(entry) = entry_result else { continue };
      // `DirEntry::metadata` does not follow symlinks, so a symlinked entry
      // fails the `valid` check below and is neither matched nor descended into.
      let Ok(metadata) = entry.metadata() else { continue };
      if !EntryType::valid(&entry, root_dir_path, &metadata) {
        continue;
      }

      let is_dir = metadata.is_dir();
      if is_dir && recursive && depth < MAX_DEPTH {
        pending.push((entry.path(), depth + 1));
      }

      let wanted = match params.match_kind {
        SearchMatch::All => true,
        SearchMatch::Files => !is_dir,
        SearchMatch::Dirs => is_dir,
      };
      if !wanted {
        continue;
      }

      let name = entry.file_name().to_string_lossy().into_owned();
      if !matcher.is_match(&name) {
        continue;
      }

      output.push(RawEntry::new(&entry, metadata, root_dir_path));
      if output.len() >= MAX_RESULTS {
        return Ok(output);
      }
    }
  }

  Ok(output)
}
