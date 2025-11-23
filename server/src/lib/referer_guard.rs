use actix_web::guard::GuardContext;
use log::info;

pub fn check_referer(ctx: &GuardContext) -> bool {
  match ctx.head().headers.get("referer") {
    Some(value) => match value.to_str() {
      Ok(referer) => {
        if referer.contains("//localhost:") || referer.contains("//192.168.") {
          return true;
        }
        info!("[blocking request from] {referer}");
        false
      },
      Err(_) => false,
    },
    None => false,
  }
}
