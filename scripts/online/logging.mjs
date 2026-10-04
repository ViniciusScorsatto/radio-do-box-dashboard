// Only structured, bounded diagnostics. Never copy a library error message containing URLs or props.
export function safeDiagnostic(error, stage) {
  const message = String(error?.message || "");
  const reason = /404|not found|ENOENT/i.test(message)
    ? "asset_or_file_missing"
    : /download|fetch|network|ECONN/i.test(message)
      ? "network_or_asset_failure"
      : /chrome|chromium|browser|launch/i.test(message)
        ? "browser_failure"
        : /codec|ffmpeg|encode/i.test(message)
          ? "encoding_failure"
          : /timeout|timed out/i.test(message)
            ? "timeout"
            : /cancel/i.test(message)
              ? "cancelled"
              : "operation_failed";
  return {
    stage,
    reason,
    errorType: /^[A-Za-z]{1,40}$/.test(error?.name) ? error.name : "Error",
    ...(typeof error?.code === "string" && /^[A-Z_0-9]{1,60}$/.test(error.code)
      ? { errorCode: error.code }
      : {}),
  };
}
