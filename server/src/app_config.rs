use config::Config;

#[derive(Debug, Clone)]
pub struct AppConfig {
  pub port: u16,
  pub root_dir_path: String,
}

impl AppConfig {
  pub fn init() -> AppConfig {
    let settings = Config::builder()
      // Add in `./config.toml`
      .add_source(config::File::with_name("config"))
      // Add in settings from the environment (with a prefix of APP)
      // e.g. `APP_DEBUG=1 ./target/app` would set the `debug` key
      // .add_source(config::Environment::with_prefix("APP"))
      .build()
      .unwrap();

    AppConfig {
      port: settings.get_int("port").unwrap_or(9000) as u16,
      root_dir_path: settings.get("root_dir_path").unwrap_or_else(|_|
        panic!("\"root_dir_path\" in config.toml must be set")),
    }
  }
}


/*
use std::{env::var as ENV, str::FromStr};

#[derive(Debug, Clone)]
pub struct Config {
  pub port: u16,
  pub root_dir_path: String,
}

impl Config {
  pub fn init() -> Config {
    Config {
      port: parse_integer::<u16>("PORT"),
      root_dir_path: format!(
        "/{}",
        ENV("ROOT_DIR_PATH")
          .expect("ROOT_DIR_PATH must be set")
          .trim_matches('/')
      ),
    }
  }
}

fn parse_integer<S: FromStr>(name: &str) -> S {
  ENV(name)
    .unwrap_or_else(|_| panic!("{} must be set", name))
    .parse::<S>()
    .unwrap_or_else(|_| panic!("{} must be an integer", name))
}
*/
