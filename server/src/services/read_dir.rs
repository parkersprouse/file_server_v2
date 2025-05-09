use crate::AppState;
use crate::structs::{
  entry_details::EntryDetails,
  entry_type::EntryType,
  query_params::QueryParams,
  sort_dir::SortDir,
  sort_key::SortKey,
};
use actix_web::{
  web::Data,
  HttpRequest,
};
use chrono::DateTime;
use std::{
  cmp::Ordering,
  fs,
  io::Error,
  path::Path,
};

fn sort_output(output: Vec<EntryDetails>, query_params: QueryParams) -> Vec<EntryDetails> {
  // If output is empty, exit early
  if output.is_empty() { return output; }

  let dir = SortDir::validate(&query_params.dir);
  let key = SortKey::validate(&query_params.key);

  let mut clone = output.clone();

  // Check if the attribute we're attempting to sort by can be parsed as a datetime
  let time_based: bool = SortKey::is_time_based(clone.first().unwrap(), key);

  // First sort by requested attribute
  clone.sort_by(|a, b| {
    if time_based {
      let a_dt = DateTime::parse_from_rfc3339(&a[key]).unwrap();
      let b_dt = DateTime::parse_from_rfc3339(&b[key]).unwrap();
      if SortDir::is_desc(dir) { b_dt.cmp(&a_dt) }
      else { a_dt.cmp(&b_dt) }
    } else if SortDir::is_desc(dir) {
      b[key].to_lowercase().cmp(&a[key].to_lowercase())
    } else {
      a[key].to_lowercase().cmp(&b[key].to_lowercase())
    }
  });

  // Then make sure directories appear on top
  clone.sort_by(|a, b| {
    // If we're comparing a directory against a file, the directory moves up
    if a.entry_type.eq(EntryType::DIR) && b.entry_type.ne(EntryType::DIR) { return Ordering::Less; }
    // If we're comparing a file against a directory, the file moves down
    if a.entry_type.ne(EntryType::DIR) && b.entry_type.eq(EntryType::DIR) { return Ordering::Greater; }
    // Otherwise, change nothing
    Ordering::Equal
  });

  clone
}

pub async fn read<P>(path: P, req: &HttpRequest, data: &Data<AppState>) -> Result<Vec<EntryDetails>, Error>
  where P: AsRef<Path>
{
  let query_params = QueryParams::new(req);
  let mut output = Vec::<EntryDetails>::new();

  let entries: fs::ReadDir = fs::read_dir(path)?;
  for entry_result in entries {
    let entry: fs::DirEntry = entry_result?;
    // skip "invalid" entry types - i.e. anything not a directory or file
    if EntryType::valid(&entry) {
      output.push(EntryDetails::new(&entry, data));
    }
  }

  Ok(sort_output(output, query_params))
}
