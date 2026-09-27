# Decorator Extraordinaire — Sweet 16 AI Designer

Eight packages, three looks each, ten add-ons, and server-side OpenAI image generation.

## Setup
Host on Vercel and set OPENAI_API_KEY as a server-only production environment variable. Never commit credentials. The OpenAI account needs available API credit.

Generation uses gpt-image-2, medium quality, 1536x1024 landscape JPEG, one image per request. These settings are fixed on the server. Each generation or regeneration incurs API usage. Cloudflare is no longer called. No automatic retries or provider fallback are used.

## Verification
Run npm test. Tests cover all package/look/add-on combinations, input validation, fixed model and quality, response parsing, and safe billing/auth errors. Check actual generated concepts visually; counts and placement are not guaranteed.

The server trusts its shared catalog, not client descriptions. Base lounge seating and standard flowers stay included. Ceiling balloons require Cloud Nine. Changing selections discards stale previews. Credentials never reach the browser.
