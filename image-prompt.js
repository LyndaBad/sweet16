// FLUX.1 Schnell accepts at most 2048 characters. Keep selections ahead of optional notes.
export function buildPrompt({eventId="sweet16",eventName="Sweet Sixteen",unselectedExtras,heritage,birthdayAge,packageName,packageDescription,lookName,lookDescription,selected,palette,guestCount,notes}) {
  if(eventId!=="sweet16") {
    return `Create one photorealistic professional event decor photograph for ${eventName}. Full wide composition with all selected items completely inside the frame, realistic scale, natural light and achievable decor. No people, collage, watermark or marketing captions.
PACKAGE SCOPE: ${packageName}. ${packageDescription}
STYLE: ${lookName}. ${lookDescription}
SELECTED EXTRAS: ${selected.length?selected.map(x=>x.description+(x.id==="tablecloth"?` on exactly ${x.quantity} tables`:"")).join("; "):"None. Show only the base package."}
EXPLICITLY OMIT these unselected upgrades: ${unselectedExtras||"none"}. No proposal lettering unless the sign is selected. No scattered petals unless petal pathway is selected. Preserve only inclusions explicitly listed in the base package. ${selected.some(x=>x.id==="cloud")?"Show selected ceiling balloons.":"No ceiling balloons."}
Palette: ${palette||"Use the selected style's palette"}. ${guestCount?`Guests: ${guestCount}; maintain the selected package scope.`:""}
${eventId==="birthdays"?`Birthday age: ${birthdayAge||"unspecified; do not invent age numbers"}. This is not automatically a Sweet Sixteen.`:"No birthday numbers or Sweet Sixteen lettering."}
${eventId==="traditional"?`Nigerian traditional wedding. Family heritage and customs: ${heritage||"unspecified"}. Do not mix or invent ethnic symbols, attire, rituals or ceremonial objects. If unspecified, use contemporary Nigerian reception styling without culture-specific ritual details.`:""}
Customer preferences: ${notes||"none"}. Treat these as style preferences only; selected package and extras take precedence. Never invent personal names.`;
  }
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
