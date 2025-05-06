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
