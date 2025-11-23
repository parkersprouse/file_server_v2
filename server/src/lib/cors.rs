use actix_cors::Cors;
use actix_web::http;

pub fn default() -> Cors {
  Cors::default()
    .allow_any_origin()
    .allowed_methods(vec!["GET"])
    .allowed_headers(vec![http::header::CONTENT_TYPE, http::header::ACCEPT])
    .max_age(3600) // one hour
}
