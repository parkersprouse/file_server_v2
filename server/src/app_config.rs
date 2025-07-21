use config::Config;
use log::LevelFilter;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct AppConfig {
  pub log_level: LevelFilter,
  pub port: u16,
  pub root_dir_path: String,
}

impl AppConfig {
  pub fn init() -> AppConfig {
    let settings = Config::builder()
      // Read config values from `./config.toml`
      .add_source(config::File::with_name("config"))
      // Or as environment variables that start with `WEB_FILE_BROWSER`
      .add_source(config::Environment::with_prefix("WEB_FILE_BROWSER").ignore_empty(true))
      .build()
      .unwrap();

    AppConfig {
      log_level: AppConfig::parse_app_log_level(&settings.get_string("log_level").unwrap_or("info".into())),
      port: settings.get_int("port").unwrap_or(9000) as u16,
      root_dir_path: settings.get("root_dir").unwrap_or_else(|_| {
        panic!("Must set either \"root_dir\" in config.toml, or \"WEB_FILE_BROWSER_ROOT_DIR\" environment variable")
      }),
    }
  }

  fn parse_app_log_level(level: &str) -> LevelFilter {
    // Levels ordered least -> most verbose
    let app_levels: HashMap<&str, LevelFilter> = HashMap::from([
      ("off", LevelFilter::Off),
      ("error", LevelFilter::Error),
      ("warn", LevelFilter::Warn),
      ("info", LevelFilter::Info),
      ("debug", LevelFilter::Debug),
      ("trace", LevelFilter::Trace),
    ]);

    match app_levels.clone().into_keys().collect::<Vec<&str>>().contains(&level) {
      true => *app_levels.get(level).unwrap_or(&LevelFilter::Info),
      false => LevelFilter::Info,
    }
  }
}
