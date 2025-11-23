use actix_web::guard::GuardContext;
use log::info;

pub fn verify(ctx: &GuardContext) -> bool {
  match ctx.head().peer_addr {
    Some(value) => {
      let addr = value.to_string();
      if addr.starts_with("192.168.") {
        return true;
      }
      info!("[blocking request from] {addr}");
      false
    },
    None => false,
  }
}
