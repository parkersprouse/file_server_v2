use actix_web::guard::GuardContext;
use log::info;

pub fn verify(ctx: &GuardContext) -> bool {
  match ctx.head().peer_addr {
    Some(addr) => {
      match addr.to_string().starts_with("192.168.") {
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
