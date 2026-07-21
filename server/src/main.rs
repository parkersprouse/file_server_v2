use crate::{
  lib::{cache, cors, gatekeeper, metadata_cache},
  services::resource_handler,
};
use actix_web::{
  App, HttpRequest, HttpResponse, HttpServer,
  http::header::{self, HeaderValue},
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
  pub mod cache;
  pub mod cors;
  pub mod error;
  pub mod gatekeeper;
  pub mod metadata_cache;
  pub mod parse_url_file;
}
mod services {
  pub mod read_dir;
  pub mod read_file;
  pub mod resource_handler;
  pub mod search;
}
mod structs {
  pub mod entry_details;
  pub mod entry_type;
}
mod util;

pub struct AppState {
  pub config: AppConfig,
  pub directory_cache: cache::DirectoryCache,
  pub metadata_cache: metadata_cache::EntryMetadataCache,
}

async fn index_route(req: HttpRequest, data: Data<AppState>) -> HttpResponse {
  // Enforce the source-IP gate in the handler (rather than as a route guard) so
  // a blocked request gets an explicit 403 instead of a misleading 404.
  if !gatekeeper::verify(&req, &data.config.allowed_cidrs) {
    return HttpResponse::Forbidden().finish();
  }
  // Reject unrecognized Host headers to blunt DNS-rebinding attacks.
  if !cors::host_allowed(&req, &data.config.allowed_hosts) {
    return HttpResponse::Forbidden().finish();
  }

  let mut response = resource_handler::handle(req, data).await;
  // Responses are conditionally compressed based on `Accept-Encoding`, so it must
  // be part of the cache key. Append rather than insert: the CORS middleware adds
  // its own `Vary` on the way out, and multiple `Vary` headers are combined by
  // caches.
  response
    .headers_mut()
    .append(header::VARY, HeaderValue::from_static("Accept-Encoding"));
  response
}

#[actix_web::main]
async fn main() -> io::Result<()> {
  let config: AppConfig = AppConfig::init();
  let app_state: Data<AppState> = Data::new(AppState {
    config: config.clone(),
    directory_cache: cache::DirectoryCache::new(300), // 5 minute TTL
    // 24 hour TTL: entries are validated against each file's (mtime, size)
    // stamp, so a long-lived entry can only be served while the file it
    // describes is unchanged. The TTL is a memory bound, not the correctness
    // mechanism.
    metadata_cache: metadata_cache::EntryMetadataCache::new(86_400),
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
      // HTML) into an executable content type, and block script execution in any
      // file rendered directly (e.g. a malicious HTML/SVG document) — this is
      // what protects document previews now that the iframe is not sandboxed.
      .wrap(
        middleware::DefaultHeaders::new()
          .add(("X-Content-Type-Options", "nosniff"))
          .add(("Content-Security-Policy", "script-src 'none'; frame-ancestors 'none'")),
      )
      .wrap(cors::build(app_state.config.allowed_origins.clone()))
      // Handle HEAD alongside GET so clients (and caches) can probe a resource's
      // headers without a body; actix-files strips the body from file responses
      // for HEAD automatically.
      .service(
        web::scope("/{path:.*}")
          .route("", get().to(index_route))
          .route("", web::head().to(index_route)),
      )
  })
  .bind((config.address.as_str(), config.port))?
  .run()
  .await
}
