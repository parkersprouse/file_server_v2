use crate::structs::{sort_dir::SortDir, sort_key::SortKey};
use actix_web::{HttpRequest, web::Query};
use std::collections::HashMap;

pub struct QueryParams {
  pub dir: String,
  pub key: String,
}

impl QueryParams {
  const DIR: &'static str = "dir"; // sort direction
  const KEY: &'static str = "key"; // sort attribute

  pub fn new(req: &HttpRequest) -> Self {
    let extraction = Query::<HashMap<String, String>>::from_query(req.query_string());

    let mut dir: String = SortDir::ASC.into();
    let mut key: String = SortKey::NAME.into();

    if let Ok(params) = extraction {
      dir = params.get(Self::DIR).map_or_else(|| SortDir::ASC, |v| v).to_owned();
      key = params.get(Self::KEY).map_or_else(|| SortKey::NAME, |v| v).to_owned();
    }

    Self {
      dir: dir.to_lowercase(),
      key: key.to_lowercase(),
    }
  }
}
