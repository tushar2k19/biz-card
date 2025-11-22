# Project Tasks

## Pending
- [ ] Implement a robust fix for the OCR serverless flow so local usage succeeds without Claude credit issues.
- [ ] Add client-visible error messaging and tests covering serverless fallbacks.
- [ ] Add Anthropic usage metadata passthrough (input/output tokens) to API response for cost tracking.

## In Progress
- [ ] Harden fallback logic and monitoring before next credit outage.

## Done
- [x] Reproduced the OCR failure locally via `curl http://localhost:8888/api/scan-card` and captured Anthropic's `credit balance is too low` response in `/tmp/netlify-dev.log`.
- [x] Built and deployed the Netlify site via `netlify deploy --prod` (URL: `https://sunny-florentine-468f39.netlify.app`).
- [x] Investigated mobile uploads and confirmed Anthropic's 5 MB limit plus Tesseract WASM failure in the Netlify logs.
- [x] Added local image compression + improved API error handling before calling `/api/scan-card`, ensuring uploads are auto-reduced to <3 MB without user intervention.
- [x] Prepared OCR cost analysis and a local test command for `sample1.jpeg`.

