use actix_web::guard::GuardContext;
use log::info;

static VALID_ADDRS: [&str; 2] = ["127.0.0.1", "192.168."];

pub fn verify(ctx: &GuardContext) -> bool {
  match ctx.head().peer_addr {
    Some(addr) => {
      match VALID_ADDRS.iter().any(|entry| addr.to_string().starts_with(entry)) {
        true => true,
        false => {
          info!("[blocking request from] {addr}");
          false
        }
      }
    },
    None => false,
  }
}
