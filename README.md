# Decorator Extraordinaire — Sweet 16 AI Designer

Eight packages, three looks each, ten add-ons and a server-side Cloudflare Workers AI image endpoint using FLUX.1 Schnell.

## Setup
Keep the website hosted on Vercel. Configure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN as server-only environment variables, then deploy. Scope the token to Workers AI on the selected account. Never commit credentials. Use the Cloudflare Workers Free plan for a daily free allowance that stops at the limit; do not enable a paid plan or paid fallback without owner approval.

## Verification
Run npm test. Tests cover every package/look and add-on combination within the model's 2048-character prompt limit, validation, response parsing, and safe quota/auth errors. Real visual fidelity must also be tested after connecting Cloudflare.

The server trusts its shared catalog, not client descriptions. Base lounge seating and standard flowers stay included. Ceiling balloons require Cloud Nine. Changing selections discards stale previews. Exact counts and placement in generated images still need visual review.

The OpenAI API is no longer called. Existing OpenAI environment values can be removed by the owner; they are not used. Cloudflare credentials are never sent to the browser.
