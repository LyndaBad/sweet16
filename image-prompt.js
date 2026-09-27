// FLUX.1 Schnell accepts at most 2048 characters. Keep selections ahead of optional notes.
export function buildPrompt({packageName,packageDescription,lookName,lookDescription,selected,palette,guestCount,notes}) {
  const ids=new Set(selected.map(x=>x.id));
  const cloth=selected.find(x=>x.id==="tablecloth");
  const features={
    cloud:"Cloud Nine: floating pale-pink balloons across the ceiling",
    table:"one EXTRA guest table, place settings, candles, simple centerpiece and smooth linen",
    marquee:'Marquee 16: large glowing numbers "1" and "6", clearly visible',
    sign:"personalized celebrant name sign on backdrop",
    balloon:"organic balloon garland around backdrop only",
    floral:"extra-full premium floral arrangements",
    drape:"soft venue draping and polished floor",
    spark:"two cold-spark machines at focal area",
    celebrant:"additional celebrant sofa or statement chair",
    tablecloth:`gathered pink draped cloth on exactly ${cloth?.quantity || 1} tables, other linens smooth`
  };
  const excluded={cloud:"ceiling balloons",table:"extra guest table",marquee:"marquee numbers",sign:"name sign",balloon:"balloon garlands",floral:"extra floral upgrade",drape:"extra venue draping",spark:"spark machines",celebrant:"extra lounge beyond base seating",tablecloth:"gathered tablecloths"};
  let prompt=`Photorealistic Sweet 16 decor, one coherent wide-angle finished event photograph. No people, collage, watermark or captions.
Package: ${packageName}. ${packageDescription}
Look: ${lookName}. ${lookDescription}
MUST SHOW together: ${selected.length?selected.map(x=>features[x.id]).join("; "):"base look only"}.
Exclude unselected upgrades: ${Object.entries(excluded).filter(([id])=>!ids.has(id)).map(([,label])=>label).join(", ") || "none"}.
Preserve base seating and standard florals. ${ids.has("cloud")?"Ceiling balloon installation visible.":"Clear ceiling, absolutely no hanging balloons."} Selected items override conflicting notes. Realistic proportions and achievable styling.`;
  if(palette) prompt+=` Palette: ${palette}.`;
  if(guestCount) prompt+=` Guests: ${guestCount}.`;
  if(prompt.length>2048) throw new Error("Selection prompt exceeds model limit");
  if(notes) prompt+=(" Event preferences: "+notes).slice(0,2048-prompt.length);
  return prompt;
}
