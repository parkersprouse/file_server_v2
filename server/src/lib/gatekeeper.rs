use actix_web::HttpRequest;
use ipnet::IpNet;
use log::info;

/// Returns `true` when the request's TCP peer falls within one of the allowed
/// networks.
///
/// This is a *convenience* network filter, not authentication. It only inspects
/// the immediate TCP peer — `X-Forwarded-For` is intentionally **not** trusted —
/// so behind a reverse proxy every client appears as the proxy's address. Put a
/// real auth layer in front if the server is exposed beyond a trusted network.
pub fn verify(req: &HttpRequest, allowed: &[IpNet]) -> bool {
  let Some(peer) = req.peer_addr() else {
    return false;
  };

  // Normalize IPv4-mapped IPv6 (`::ffff:a.b.c.d`) to IPv4 so dual-stack peers
  // still match IPv4 ranges.
  let ip = peer.ip().to_canonical();

  if allowed.iter().any(|net| net.contains(&ip)) {
    true
  } else {
    info!("[blocking request from] {ip}");
    false
  }
}
