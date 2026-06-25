use config::Config;
use ipnet::IpNet;
use log::LevelFilter;
use regex_lite::Regex;
use std::collections::HashMap;
use std::net::IpAddr;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct AppConfig {
  /// Networks whose clients are allowed through the source-IP gate. Defaults to
  /// loopback + the RFC1918 private ranges + IPv6 unique-local.
  pub allowed_cidrs: Vec<IpNet>,
  /// Exact CORS origins permitted to read responses cross-origin. When empty,
  /// only same-network (local) origins are allowed.
  pub allowed_origins: Vec<String>,
  /// Exact `Host` header values accepted (DNS-rebinding guard). When empty, only
  /// local hosts (localhost / loopback / private IP) are accepted.
  pub allowed_hosts: Vec<String>,
  pub log_level: LevelFilter,
  pub nonalpha_pattern: Regex,
  pub port: u16,
  pub root_dir_path: String,
  /// The root directory resolved to an absolute, symlink-free path. Requests
  /// are validated against this so symlinks inside the tree can't escape it.
  pub root_dir_canonical: PathBuf,
}

impl AppConfig {
  pub fn init() -> AppConfig {
    let settings = Config::builder()
      // Read config values from `./config.toml` (optional — configuration can
      // be supplied entirely via environment variables instead, e.g. in Docker).
      .add_source(config::File::with_name("config").required(false))
      // Or as environment variables that start with `WEB_FILE_BROWSER`. The
      // list-valued settings are parsed as comma-separated values.
      .add_source(
        config::Environment::with_prefix("WEB_FILE_BROWSER")
          .ignore_empty(true)
          .try_parsing(true)
          .list_separator(",")
          .with_list_parse_key("allowed_cidrs")
          .with_list_parse_key("allowed_origins")
          .with_list_parse_key("allowed_hosts"),
      )
      .build()
      .expect("Failed to load configuration");

    let root_dir_path: String = settings.get("root_dir").unwrap_or_else(|_| {
      panic!("Must set either \"root_dir\" in config.toml, or \"WEB_FILE_BROWSER_ROOT_DIR\" environment variable")
    });

    // Resolve the root once at startup; requests are validated against this
    // canonical form to block symlink escapes.
    let root_dir_canonical = std::fs::canonicalize(&root_dir_path)
      .unwrap_or_else(|err| panic!("Configured root_dir \"{root_dir_path}\" could not be resolved: {err}"));

    AppConfig {
      allowed_cidrs: Self::parse_allowed_cidrs(settings.get::<Vec<String>>("allowed_cidrs").ok()),
      allowed_origins: settings.get::<Vec<String>>("allowed_origins").unwrap_or_default(),
      allowed_hosts: settings.get::<Vec<String>>("allowed_hosts").unwrap_or_default(),
      log_level: AppConfig::parse_app_log_level(&settings.get_string("log_level").unwrap_or("info".into())),
      nonalpha_pattern: Regex::new(r"^[^A-Za-z0-9]").unwrap(),
      port: settings.get_int("port").unwrap_or(9000) as u16,
      root_dir_path,
      root_dir_canonical,
    }
  }

  /// Parse the configured allowlist, falling back to the defaults when unset.
  /// Each entry may be a CIDR (`10.0.0.0/8`) or a bare IP (`203.0.113.5`).
  fn parse_allowed_cidrs(configured: Option<Vec<String>>) -> Vec<IpNet> {
    let entries = match configured {
      Some(list) if !list.is_empty() => list,
      _ => return Self::default_allowed_cidrs(),
    };

    entries
      .iter()
      .map(|entry| Self::parse_cidr(entry).unwrap_or_else(|| panic!("Invalid allowed_cidrs entry: {entry:?}")))
      .collect()
  }

  fn parse_cidr(entry: &str) -> Option<IpNet> {
    if let Ok(net) = entry.parse::<IpNet>() {
      return Some(net);
    }
    // Accept a bare IP address as a host route (/32 or /128).
    let ip = entry.parse::<IpAddr>().ok()?;
    let prefix = if ip.is_ipv4() { 32 } else { 128 };
    IpNet::new(ip, prefix).ok()
  }

  fn default_allowed_cidrs() -> Vec<IpNet> {
    // Loopback (v4 + v6), the RFC1918 private ranges, and the IPv6 unique-local
    // range. These literals are valid, so the parse can't fail.
    [
      "127.0.0.0/8",
      "10.0.0.0/8",
      "172.16.0.0/12",
      "192.168.0.0/16",
      "::1/128",
      "fc00::/7",
    ]
    .iter()
    .map(|cidr| cidr.parse().expect("valid default CIDR"))
    .collect()
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

    // Unknown/unset levels fall back to Info.
    *app_levels.get(level).unwrap_or(&LevelFilter::Info)
  }
}
