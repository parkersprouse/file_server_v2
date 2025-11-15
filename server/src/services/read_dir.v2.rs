use crate::AppState;
use crate::structs::{
  entry_details::EntryDetails, entry_type::EntryType, query_params::QueryParams, sort_dir::SortDir, sort_key::SortKey,
};
use actix_web::{HttpRequest, web::Data};
use chrono::DateTime;
use std::{cmp::Ordering, fs, io::Error, path::Path};

fn sort_output(output: Vec<EntryDetails>, query_params: QueryParams, data: &Data<AppState>) -> Vec<EntryDetails> {
  // If output is empty, exit early
  if output.is_empty() {
    return output;
  }

  let pat = &data.config.nonalpha_pattern;
  let dir = SortDir::validate(&query_params.dir);
  let key = SortKey::validate(&query_params.key);
  let mut clone = output.clone();

  clone.sort_by(|a: &EntryDetails, b: &EntryDetails| {
    match key {
      "created_at" => {

      },
      "duration" => {

      },
      "last_modified_at" => {

      },
      "name" => {

      },
    }
  });

  clone
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





/*

fn sort_output(output: Vec<EntryDetails>, query_params: QueryParams, data: &Data<AppState>) -> Vec<EntryDetails> {
  // If output is empty, exit early
  if output.is_empty() {
    return output;
  }

  let pat = &data.config.nonalpha_pattern;

  let dir = SortDir::validate(&query_params.dir);
  let key = SortKey::validate(&query_params.key);

  let mut clone = output.clone();

  // Check if the attribute we're attempting to sort by can be parsed as a datetime
  let datetime: bool = SortKey::is_time_based(clone.first().unwrap(), key);

  // First sort by requested attribute
  clone.sort_by(|a: &EntryDetails, b: &EntryDetails| {
    if datetime {
      let a_val = &a[key];
      let b_val = &b[key];
      if !a_val.is_empty() && !b_val.is_empty() {
        let a_dt = DateTime::parse_from_rfc3339(a_val).unwrap();
        let b_dt = DateTime::parse_from_rfc3339(b_val).unwrap();
        if SortDir::is_desc(dir) { b_dt.cmp(&a_dt) } else { a_dt.cmp(&b_dt) }
      } else {
        Ordering::Equal
      }
    } else if key.eq(SortKey::DURATION) {
      // if a.duration.is_empty() || b.duration.is_empty() {
      //   return Ordering::Less;
      // }

      if SortDir::is_desc(dir) { b.raw_duration.cmp(&a.raw_duration) } else { a.raw_duration.cmp(&b.raw_duration) }
    } else if SortDir::is_desc(dir) {
      b[key].to_lowercase().cmp(&a[key].to_lowercase())
    } else {
      a[key].to_lowercase().cmp(&b[key].to_lowercase())
    }
  });

  // Then make sure entries with non-alphanumeric chars appear on top
  clone.sort_by(|a: &EntryDetails, b: &EntryDetails| {
    if pat.is_match(a.name.as_str()) && !pat.is_match(b.name.as_str()) {
      return Ordering::Less;
    } else if !pat.is_match(a.name.as_str()) && pat.is_match(b.name.as_str()) {
      return Ordering::Greater;
    }
    Ordering::Equal
  });

  // Finally, make sure directories appear on top
  clone.sort_by(|a: &EntryDetails, b: &EntryDetails| {
    // If we're comparing a directory against a file, the directory moves up
    if a.entry_type.eq(EntryType::DIR) && b.entry_type.ne(EntryType::DIR) {
      return Ordering::Less;
    }
    // If we're comparing a file against a directory, the file moves down
    if a.entry_type.ne(EntryType::DIR) && b.entry_type.eq(EntryType::DIR) {
      return Ordering::Greater;
    }
    // Otherwise, change nothing
    Ordering::Equal
  });

  clone
}

*/
