use crate::services::resource_handler;
use actix_web::{
  web::{
    get,
    Data,
  },
  App,
  HttpRequest,
  HttpServer,
};
use app_config::AppConfig;
use std::io;

mod app_config;
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
  let app_state: Data<AppState> = Data::new(AppState {
    config: config.clone(),
  });

  HttpServer::new(move || {
    App::new()
      .app_data(app_state.to_owned())
      .route("/{path:.*}", get().to(async |req: HttpRequest, data: Data<AppState>| resource_handler::handle(req, data).await))
      .route("/{path:.*}/", get().to(async |req: HttpRequest, data: Data<AppState>| resource_handler::handle(req, data).await))
  })
  .bind(("0.0.0.0", config.port))?
  .run()
  .await
}
