// Stand-in for three Sentry packages that only work in a web browser:
//   @sentry-internal/replay, @sentry-internal/replay-canvas, @sentry-internal/feedback
// @sentry/react-native re-exports them for its web build, so Metro bundles
// ~400 KB of browser code that can never run on a phone. metro.config.js points
// them here on iOS and Android. Error reporting, breadcrumbs and everything
// else Sentry does on the phone is untouched; this app never calls these.
//
// feedbackSync.js builds an integration the moment it loads, so the builder
// must exist and return something callable. The rest only need to exist.

const unavailable = (name) => () => {
  throw new Error(`${name} is a browser-only Sentry feature and is not available in the mobile app.`);
};

module.exports = {
  // @sentry-internal/replay, @sentry-internal/replay-canvas
  replayIntegration: unavailable('replayIntegration'),
  replayCanvasIntegration: unavailable('replayCanvasIntegration'),
  getReplay: () => undefined,

  // @sentry-internal/feedback
  buildFeedbackIntegration: () => unavailable('feedbackIntegration'),
  feedbackModalIntegration: unavailable('feedbackModalIntegration'),
  feedbackScreenshotIntegration: unavailable('feedbackScreenshotIntegration'),
  getFeedback: () => undefined,
  sendFeedback: unavailable('sendFeedback'),
};
