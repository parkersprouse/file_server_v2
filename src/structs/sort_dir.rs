pub struct SortDir {}

impl SortDir {
  pub const ASC: &'static str = "asc";
  pub const DESC: &'static str = "desc";

  const VALID_PARAMS: [&str; 2] = [
    Self::ASC,
    Self::DESC,
  ];

  pub fn validate(dir: &str) -> &str {
    if Self::VALID_PARAMS.contains(&dir) { return dir; }
    Self::ASC
  }

  pub fn is_desc(dir: &str) -> bool {
    dir.eq(Self::DESC)
  }
}
