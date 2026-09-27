# Decorator Extraordinaire — Sweet 16 AI Designer

Eight packages, three looks per package, ten optional add-ons and a server-side OpenAI image-generation endpoint.

## Deploy
Import this dedicated repository into Vercel using the Other framework preset. No build command is required. Set OPENAI_API_KEY in the Vercel project environment variables, then deploy. Never put the key in client JavaScript or commit an .env file. The endpoint reads the key only on the server.

## Verify
Run `npm test`. Tests mock the upstream API and cover all 24 package/look combinations, add-on inclusion/exclusion, tablecloth quantities, invalid selections and safe error messages. Real generation and visual fidelity must also be checked after the production key is configured.

## Behavior
The server uses the shared catalog rather than trusting client-provided package descriptions. Cloud Nine is only requested when selected, including for the Cloud Nine Ballroom visual direction. Base lounge seating and standard florals remain part of their package; unselected upgrades do not remove those base features. Changing selections hides the old preview and discards any in-flight result for earlier selections.

The image request uses gpt-image-2, landscape WebP output and a four-minute timeout. The Vercel function allows five minutes. Generated concepts are inspiration and require review; model output is not a guarantee of exact counts or placement.

The current public endpoint has no persistent per-customer rate limiter. Configure hosting-side rate limits and an appropriate API project budget before broad customer promotion.
