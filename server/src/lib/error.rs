use actix_web::{HttpResponse, ResponseError};
use log::{debug, error, warn};
use std::fmt;
use std::io;

/// Custom error type for the application
#[derive(Debug)]
pub enum AppError {
  /// File system I/O error
  IoError(io::Error),
  /// Path validation failed
  InvalidPath(String),
  /// Resource not found
  NotFound(String),
  /// Internal server error
  Internal(String),
}

impl fmt::Display for AppError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      AppError::IoError(err) => write!(f, "I/O error: {}", err),
      AppError::InvalidPath(msg) => write!(f, "Invalid path: {}", msg),
      AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
      AppError::Internal(msg) => write!(f, "Internal error: {}", msg),
    }
  }
}

impl ResponseError for AppError {
  fn error_response(&self) -> HttpResponse {
    match self {
      AppError::InvalidPath(_) => {
        // Client error / possible probing — not a server fault. Keep it visible
        // but off the error stream, and don't disclose the offending path.
        warn!("{}", self);
        HttpResponse::NotFound().finish()
      },
      AppError::NotFound(_) => {
        // Very high volume under scanning; keep it out of the default logs.
        debug!("{}", self);
        HttpResponse::NotFound().finish()
      },
      AppError::IoError(err) => {
        error!("IO Error: {}", err);
        HttpResponse::InternalServerError().finish()
      },
      AppError::Internal(msg) => {
        error!("Internal Error: {}", msg);
        HttpResponse::InternalServerError().finish()
      },
    }
  }
}

impl From<io::Error> for AppError {
  fn from(err: io::Error) -> Self {
    AppError::IoError(err)
  }
}

/// Result type alias for application operations
pub type AppResult<T> = Result<T, AppError>;
