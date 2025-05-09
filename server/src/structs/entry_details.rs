use crate::AppState;
use crate::structs::entry_type::EntryType;
use actix_web::web::Data;
use chrono::{DateTime, Utc};
use infer;
use serde::Serialize;
use std::{
  fs,
  io::Read,
  ops::Index,
  path::PathBuf,
  process::Command,
};

#[derive(Clone, Serialize)]
pub struct EntryDetails {
  pub created_at: String,
  pub duration: String,
  pub entry_type: String,
  pub file_type: String,
  pub last_modified_at: String,
  pub name: String,
  pub path: String,
}

#[allow(dead_code)]
impl EntryDetails {
  pub fn new(
    entry: &fs::DirEntry,
    data: &Data<AppState>,
  ) -> Self {
    let full_path: PathBuf = entry.path();
    let metadata: fs::Metadata = entry.metadata().unwrap();
    let path: String = Self::clean_path(&full_path, data);
    let entry_type: String = EntryType::stringify(&metadata.file_type()).into();
    let file_type: String = Self::file_type(&entry_type, &full_path);
    Self {
      created_at: DateTime::<Utc>::from(metadata.created().unwrap()).to_rfc3339(),
      duration: Self::determine_duration(&file_type, &path),
      entry_type,
      file_type,
      last_modified_at: DateTime::<Utc>::from(metadata.modified().unwrap()).to_rfc3339(),
      name: entry.file_name().into_string().unwrap(),
      path,
    }
  }

  pub fn clean_path(path: &PathBuf, data: &Data<AppState>) -> String {
    format!(
      "/{}",
      path
        .to_str()
        .unwrap()
        .replace(&data.config.root_dir_path, "")
        .trim_matches('/')
    )
  }

  pub fn determine_duration(file_type: &str, path: &str) -> String {
    if file_type.ne("video") { return "".to_owned(); }
    let result = Command::new("./metadata").arg(path).output();
    if result.is_err() { return "".to_owned(); }

    let mut output = String::new();
    let _ = result.unwrap().stdout.as_slice().read_to_string(&mut output);
    let mut lines = output.split_terminator("\n");

    let duration_line = lines.find(|line| line.to_lowercase().starts_with("duration"));
    if duration_line.is_none() { return "".to_owned(); }

    let duration = duration_line.unwrap().split_whitespace().last();
    if duration.is_none() { return "".to_owned(); }

    duration.unwrap().to_owned()
  }

  pub fn file_type(entry_type: &str, path: &PathBuf) -> String {
    if entry_type.eq(EntryType::DIR) { return "".into(); }
    println!("{:?}", path);

    let result = infer::get_from_path(path);
    if result.is_err() {
      println!("{:?}", result.err());
      return "file".into();
    }

    let option = result.unwrap();
    if option.is_none() { return "file".into(); }
    println!("{:?}", option);

    let full_type = option.unwrap();
    println!("{:?}", full_type);
    match full_type.matcher_type() {
      infer::MatcherType::App => { "application".into() },
      infer::MatcherType::Archive => { "archive".into() },
      infer::MatcherType::Audio => { "audio".into() },
      infer::MatcherType::Book => { "ebook".into() },
      infer::MatcherType::Doc => { "document".into() },
      infer::MatcherType::Font => { "font".into() },
      infer::MatcherType::Image => { "image".into() },
      infer::MatcherType::Text => { "text".into() },
      infer::MatcherType::Video => { "video".into() },
      infer::MatcherType::Custom => { "file".into() },
    }
  }
}

impl Index<&'_ str> for EntryDetails {
  type Output = str;
  fn index(&self, field: &str) -> &str {
    match field {
      "created_at" => &self.created_at,
      "duration" => "TODO",
      "entry_type" => &self.entry_type,
      "file_type" => &self.file_type,
      "last_modified_at" => &self.last_modified_at,
      "name" => &self.name,
      "path" => &self.path,
      _ => panic!("unknown field: {}", field),
    }
  }
}
