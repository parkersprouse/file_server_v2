use crate::{
  AppState,
  structs::{
    entry_details::EntryDetails,
    entry_type::EntryType,
  },
};
use actix_web::web::Data;
use std::{fs, io::Error, path::Path};

pub async fn read<P>(path: P, data: &Data<AppState>) -> Result<Vec<EntryDetails>, Error>
where
  P: AsRef<Path>,
{
  let mut output: Vec<EntryDetails> = Vec::<EntryDetails>::new();

  let entries: fs::ReadDir = fs::read_dir(path)?;
  for entry_result in entries {
    let entry: fs::DirEntry = entry_result?;
    // skip "invalid" entry types - i.e. anything not a directory or file
    if EntryType::valid(&entry, data) {
      output.push(EntryDetails::new(&entry, data).await);
    }
  }

  Ok(output)
  // Ok(sort_output(output, query_params, &data))
}
