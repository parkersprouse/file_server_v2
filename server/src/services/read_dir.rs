use crate::{
  AppState,
  structs::{
    entry_details::EntryDetails,
    entry_type::EntryType,
    query_params::QueryParams,
    sort_dir::SortDir,
    sort_key::SortKey,
  },
};
use actix_web::{HttpRequest, web::Data};
use chrono::DateTime;
use regex_lite::Regex;
use std::{cmp::Ordering, fs, io::Error, path::Path};

fn sort_output(output: Vec<EntryDetails>, query_params: QueryParams, data: &Data<AppState>) -> Vec<EntryDetails> {
  // If output is empty, exit early
  if output.is_empty() {
    return output;
  }

  let sticky_pat: &Regex = &data.config.nonalpha_pattern;
  let dir = SortDir::validate(&query_params.dir);
  let key = SortKey::validate(&query_params.key);

  let mut folders: Vec<EntryDetails> = output.clone()
    .into_iter()
    .filter(|entry: &EntryDetails| entry.is_dir())
    .collect();

  let mut files: Vec<EntryDetails> = output.clone()
    .into_iter()
    .filter(|entry: &EntryDetails| entry.is_file())
    .collect();

  // Sort folders separately from files so that we can keep them collected on top
  folders.sort_by(|a: &EntryDetails, b: &EntryDetails| {
    match key {
      "created_at" => {
        sort_by_datetime(a, b, key)
      },
      "duration" => {
        sort_by_name(a, b)
      },
      "last_modified_at" => {
        sort_by_datetime(a, b, key)
      },
      "name" => {
        sort_by_name(a, b)
      },
      _ => {
        sort_by_name(a, b)
      }
    }
  });

  folders.sort_by(|a: &EntryDetails, b: &EntryDetails| {
    sort_by_sticky(a, b, sticky_pat)
  });

  files.sort_by(|a: &EntryDetails, b: &EntryDetails| {
    match key {
      "created_at" => {
        sort_by_datetime(a, b, key)
      },
      "duration" => {
        sort_by_duration(a, b)
      },
      "last_modified_at" => {
        sort_by_datetime(a, b, key)
      },
      "name" => {
        sort_by_name(a, b)
      },
      _ => {
        sort_by_name(a, b)
      }
    }
  });

  files.sort_by(|a: &EntryDetails, b: &EntryDetails| {
    sort_by_sticky(a, b, sticky_pat)
  });

  if SortDir::is_desc(dir) {
    folders.reverse();
    files.reverse();
  }

  folders.append(&mut files);
  folders
}

fn sort_by_datetime(a: &EntryDetails, b: &EntryDetails, key: &str) -> Ordering {
  let a_val = &a[key];
  let b_val = &b[key];
  if !a_val.is_empty() && !b_val.is_empty() {
    let a_dt = DateTime::parse_from_rfc3339(a_val).unwrap();
    let b_dt = DateTime::parse_from_rfc3339(b_val).unwrap();
    a_dt.cmp(&b_dt)
  } else {
    Ordering::Equal
  }
}

fn sort_by_duration(a: &EntryDetails, b: &EntryDetails) -> Ordering {
  a.raw_duration.cmp(&b.raw_duration)
}

fn sort_by_name(a: &EntryDetails, b: &EntryDetails) -> Ordering {
  a.name.to_lowercase().cmp(&b.name.to_lowercase())
}

fn sort_by_sticky(a: &EntryDetails, b: &EntryDetails, pat: &Regex) -> Ordering {
  if pat.is_match(a.name.as_str()) && !pat.is_match(b.name.as_str()) {
    return Ordering::Less;
  } else if !pat.is_match(a.name.as_str()) && pat.is_match(b.name.as_str()) {
    return Ordering::Greater;
  }
  Ordering::Equal
}

pub async fn read<P>(path: P, req: &HttpRequest, data: &Data<AppState>) -> Result<Vec<EntryDetails>, Error>
where
  P: AsRef<Path>,
{
  let query_params: QueryParams = QueryParams::new(req);
  let mut output: Vec<EntryDetails> = Vec::<EntryDetails>::new();

  let entries: fs::ReadDir = fs::read_dir(path)?;
  for entry_result in entries {
    let entry: fs::DirEntry = entry_result?;
    // skip "invalid" entry types - i.e. anything not a directory or file
    if EntryType::valid(&entry, data) {
      output.push(EntryDetails::new(&entry, data).await);
    }
  }

  Ok(sort_output(output, query_params, &data))
}
