use quick_xml::events::Event;
use quick_xml::reader::Reader;

pub fn parse(ext: &str, content: &str) -> String {
  match ext {
    "url" => parse_url_file(content),
    "webloc" => parse_webloc_file(content),
    _ => "".to_string()
  }
}

pub fn parse_url_file(_content: &str) -> String {
  "".to_string()
}

pub fn parse_webloc_file(content: &str) -> String {
  let mut reader: Reader<&[u8]> = Reader::from_str(content);
  reader.config_mut().trim_text(true);

  // let mut txt = Vec::new();
  let mut buf = Vec::new();
  let mut previous_key = "";
  let mut current_key = "";
  let mut previous_value: String = "".to_string();
  let mut url = Vec::new();

  // The `Reader` does not implement `Iterator` because it outputs borrowed data (`Cow`s)
  loop {
    // NOTE: this is the generic case when we don't know about the input BufRead.
    // when the input is a &str or a &[u8], we don't actually need to use another
    // buffer, we could directly call `reader.read_event()`
    match reader.read_event_into(&mut buf) {
      Err(e) => panic!("Error at position {}: {:?}", reader.error_position(), e),
      // exits the loop when reaching end of file
      Ok(Event::Eof) => break,

      Ok(Event::Start(e)) => {
        println!("{:?}", String::from_utf8(e.name().as_ref().to_vec()));
        match e.name().as_ref() {
          b"key" => {
            previous_key = "";
            current_key = "key";
          },
          b"string" => {
            previous_key = "key";
            current_key = "string";
          },
          _ => (),
        }
      }
      Ok(Event::Text(e)) => {
        if current_key == "key" {
          previous_value = e.decode().unwrap().into_owned();
        }
        else if previous_key == "key" && previous_value == "URL" && current_key == "string" {
          url.push(e.decode().unwrap().into_owned());
        }
      },

      // There are several other `Event`s we do not consider here
      _ => (),
    }
    // if we don't keep a borrow elsewhere, we can clear the buffer to keep memory usage low
    buf.clear();
  }

  url.concat()
}
