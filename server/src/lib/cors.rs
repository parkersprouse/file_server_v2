use actix_cors::Cors;
use actix_web::HttpRequest;
use actix_web::http::header::{self, HeaderValue};
use std::net::IpAddr;

/// Build the CORS layer.
///
/// When `allowed_origins` is configured, only those exact origins may read
/// responses cross-origin. Otherwise we fall back to allowing only same-network
/// origins (localhost / loopback / private IP) — this blocks a public website a
/// LAN user visits from reading file contents cross-origin, without requiring
/// per-deployment configuration. (Replaces the previous `allow_any_origin()`.)
pub fn build(allowed_origins: Vec<String>) -> Cors {
  let cors = Cors::default()
    .allowed_methods(vec!["GET"])
    .allowed_headers(vec![header::CONTENT_TYPE, header::ACCEPT])
    .max_age(3600); // one hour

  if allowed_origins.is_empty() {
    cors.allowed_origin_fn(|origin, _req_head| origin_is_local(origin))
  } else {
    allowed_origins
      .iter()
      .fold(cors, |cors, origin| cors.allowed_origin(origin))
  }
}

/// Reject requests whose `Host` header isn't recognised, to blunt DNS-rebinding
/// (where a public page rebinds its domain to a local IP and then reaches this
/// server as if same-origin). When `allowed_hosts` is configured, the `Host`
/// must match one exactly; otherwise it must be a local host.
pub fn host_allowed(req: &HttpRequest, allowed_hosts: &[String]) -> bool {
  // Use the actual Host header (not forwarded headers, which a client controls).
  let host = req
    .headers()
    .get(header::HOST)
    .and_then(|value| value.to_str().ok())
    .or_else(|| req.uri().authority().map(|authority| authority.as_str()));

  let Some(host) = host else {
    return false; // a request with no Host/authority is rejected
  };

  if allowed_hosts.is_empty() {
    host_is_local(host)
  } else {
    allowed_hosts.iter().any(|allowed| allowed.eq_ignore_ascii_case(host))
  }
}

/// True if an `Origin` header (`scheme://host[:port]`) points at a local host.
fn origin_is_local(origin: &HeaderValue) -> bool {
  origin
    .to_str()
    .ok()
    .and_then(|value| value.split_once("://"))
    .map(|(_scheme, host)| host_is_local(host))
    .unwrap_or(false)
}

/// True if `host` (a `host`, `host:port`, or `[ipv6]:port`) refers to the local
/// machine or the private network (localhost / loopback / RFC1918 / IPv6 ULA).
fn host_is_local(host: &str) -> bool {
  let host = if let Some(rest) = host.strip_prefix('[') {
    rest.split(']').next().unwrap_or_default() // `[ipv6]` or `[ipv6]:port`
  } else {
    host.rsplit_once(':').map_or(host, |(host, _port)| host) // `host` or `host:port`
  };

  if host.eq_ignore_ascii_case("localhost") {
    return true;
  }

  match host.parse::<IpAddr>() {
    Ok(IpAddr::V4(ip)) => ip.is_loopback() || ip.is_private(),
    Ok(IpAddr::V6(ip)) => ip.is_loopback() || ip.is_unique_local(),
    Err(_) => false,
  }
}
