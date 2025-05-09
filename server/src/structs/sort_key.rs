use std::ops::Index;

use crate::structs::entry_details::EntryDetails;
use chrono::DateTime;

pub struct SortKey {}

impl SortKey {
  pub const CREATED: &'static str = "created_at";
  pub const DURATION: &'static str = "duration";
  pub const MODIFIED: &'static str = "last_modified_at";
  pub const NAME: &'static str = "name";

  const VALID_PARAMS: [&str; 4] = [
    Self::CREATED,
    Self::DURATION,
    Self::MODIFIED,
    Self::NAME,
  ];

  pub fn validate(dir: String) -> String {
    if Self::VALID_PARAMS.contains(&dir.as_str()) { return dir; }
    Self::NAME.into()
  }

  pub fn is_time_based(entry: &EntryDetails, key: String) -> bool {
    DateTime::parse_from_rfc3339(entry.index(key.as_str())).is_ok()
  }
}
