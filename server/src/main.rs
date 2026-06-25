use crate::{
  lib::{cache, cors, gatekeeper, media_cache},
  services::resource_handler,
};
use actix_web::{
  App, HttpRequest, HttpResponse, HttpServer, middleware,
  web::{self, Data, get},
};
use app_config::AppConfig;
use std::io;

mod app_config;
mod enums {
  pub mod disposition_kind;
}
mod lib {
  pub mod cache;
  pub mod cors;
  pub mod error;
  pub mod gatekeeper;
  pub mod media_cache;
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
  pub directory_cache: cache::DirectoryCache,
  pub media_cache: media_cache::MediaMetadataCache,
}

async fn index_route(req: HttpRequest, data: Data<AppState>) -> HttpResponse {
  // Enforce the source-IP gate in the handler (rather than as a route guard) so
  // a blocked request gets an explicit 403 instead of a misleading 404.
  if !gatekeeper::verify(&req) {
    return HttpResponse::Forbidden().finish();
  }
  resource_handler::handle(req, data).await
}

#[actix_web::main]
async fn main() -> io::Result<()> {
  let config: AppConfig = AppConfig::init();
  let app_state: Data<AppState> = Data::new(AppState {
    config: config.clone(),
    directory_cache: cache::DirectoryCache::new(300), // 5 minute TTL
    media_cache: media_cache::MediaMetadataCache::new(3600), // 1 hour TTL for media metadata
  });

  env_logger::Builder::new()
    .filter(None, app_state.config.log_level)
    .init();

  HttpServer::new(move || {
    App::new()
      .app_data(app_state.to_owned())
      .wrap(middleware::Compress::default())
      .wrap(middleware::Logger::default())
      .wrap(middleware::NormalizePath::trim())
      // Stop browsers from MIME-sniffing responses (e.g. a `.txt` containing
      // HTML) into an executable content type.
      .wrap(middleware::DefaultHeaders::new().add(("X-Content-Type-Options", "nosniff")))
      .wrap(cors::default())
      .service(web::scope("/{path:.*}").route("", get().to(index_route)))
  })
  .bind(("0.0.0.0", config.port))?
  .run()
  .await
}
