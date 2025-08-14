use crate::services::resource_handler;
use actix_cors::Cors;
use actix_web::{
  App, HttpRequest, HttpServer, http,
  middleware::Logger,
  web::{Data, get},
};
use app_config::AppConfig;
use std::io;

mod app_config;
mod enums {
  pub mod disposition_kind;
}
mod services {
  pub mod read_dir;
  pub mod read_file;
  pub mod resource_handler;
}
mod structs {
  pub mod entry_details;
  pub mod entry_type;
  pub mod query_params;
  pub mod sort_dir;
  pub mod sort_key;
}
mod util;

pub struct AppState {
  pub config: AppConfig,
}

#[actix_web::main]
async fn main() -> io::Result<()> {
  let config: AppConfig = AppConfig::init();
  let app_state: Data<AppState> = Data::new(AppState { config: config.clone() });

  env_logger::Builder::new()
    .filter(None, app_state.config.log_level)
    .init();

  HttpServer::new(move || {
    App::new()
      .app_data(app_state.to_owned())
      .wrap(Logger::default())
      .wrap(
        Cors::default()
          .allow_any_origin()
          .allowed_methods(vec!["GET"])
          .allowed_headers(vec![http::header::CONTENT_TYPE, http::header::ACCEPT])
          .max_age(3600), // one hour
      )
      .route(
        "/{path:.*}",
        get().to(async |req: HttpRequest, data: Data<AppState>| resource_handler::handle(req, data).await),
      )
      .route(
        "/{path:.*}/",
        get().to(async |req: HttpRequest, data: Data<AppState>| resource_handler::handle(req, data).await),
      )
  })
  .bind(("0.0.0.0", config.port))?
  .run()
  .await
}
