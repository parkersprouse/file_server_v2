use crate::{lib::{cors, gatekeeper}, services::resource_handler};
use actix_web::{
  App, HttpRequest, HttpResponse, HttpServer, guard,
  middleware,
  web::{self, Data, get},
};
use app_config::AppConfig;
use std::io;

mod app_config;
mod enums {
  pub mod disposition_kind;
}
mod lib {
  pub mod cors;
  pub mod gatekeeper;
}
mod services {
  pub mod read_dir;
  pub mod read_file;
  pub mod resource_handler;
}
mod structs {
  pub mod entry_details;
  pub mod entry_type;
}
mod util;

pub struct AppState {
  pub config: AppConfig,
}

async fn index_route(req: HttpRequest, data: Data<AppState>) -> HttpResponse {
  resource_handler::handle(req, data).await
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
      .wrap(middleware::Logger::default())
      .wrap(middleware::NormalizePath::trim())
      .wrap(cors::default())
      .service(
        web::scope("/{path:.*}")
          .guard(guard::fn_guard(gatekeeper::verify))
          .route("", get().to(index_route))
      )
  })
  .bind(("0.0.0.0", config.port))?
  .run()
  .await
}
