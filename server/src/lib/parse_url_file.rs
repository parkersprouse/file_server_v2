use quick_xml::events::Event;
use quick_xml::reader::Reader;

/// Extract the target URL from a browser-shortcut file (`.url` / `.webloc`).
///
/// Best-effort by design: shortcut parsing runs while building directory
/// listings, so malformed or unexpected content must yield `None` — never an
/// error or a panic that could fail the whole listing.
pub fn parse(ext: &str, content: &str) -> Option<String> {
  let url = match ext {
    "url" => parse_url_file(content),
    "webloc" => parse_webloc_file(content),
    _ => None,
  }?;

  if url.is_empty() { None } else { Some(url) }
}

/// Windows internet shortcuts are INI files with a `URL=` key (conventionally
/// under an `[InternetShortcut]` section, but the key line alone is enough).
fn parse_url_file(content: &str) -> Option<String> {
  content
    .lines()
    .filter_map(|line| line.trim().strip_prefix("URL="))
    .map(|url| url.trim().to_string())
    .next()
}

/// macOS `.webloc` files (when XML rather than binary plist) are a plist
/// `<dict>` pairing `<key>URL</key>` with a `<string>` holding the target.
/// Binary plists never reach here — they fail the UTF-8 read upstream.
fn parse_webloc_file(content: &str) -> Option<String> {
  let mut reader: Reader<&[u8]> = Reader::from_str(content);
  reader.config_mut().trim_text(true);

  let mut buf = Vec::new();
  let mut in_key = false;
  let mut in_string = false;
  let mut last_key_was_url = false;

  loop {
    match reader.read_event_into(&mut buf) {
      // Malformed XML yields no URL rather than an error.
      Err(_) => return None,
      Ok(Event::Eof) => return None,

      Ok(Event::Start(e)) => match e.name().as_ref() {
        b"key" => {
          in_key = true;
          last_key_was_url = false;
        },
        b"string" => in_string = true,
        _ => (),
      },
      Ok(Event::End(e)) => match e.name().as_ref() {
        b"key" => in_key = false,
        b"string" => in_string = false,
        _ => (),
      },
      Ok(Event::Text(e)) => {
        let Ok(text) = e.decode() else { return None };
        if in_key {
          last_key_was_url = text.as_ref() == "URL";
        } else if in_string && last_key_was_url {
          return Some(text.into_owned());
        }
      },

      Ok(_) => (),
    }
    buf.clear();
  }
}
