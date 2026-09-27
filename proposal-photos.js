// Client-selected proposal references, retouched for presentation.
// These are inspiration photographs, not a claim of portfolio authorship.
const photo=(id,title,description,credit='')=>({src:`/assets/proposals/${id}.png`,label:title,description,credit});
export const proposalPhotos=[
 photo('7373','Classic red romance','A red rose heart focal frame with a rich romantic palette and warm enclosed candlelight.'),
 photo('7374','Ivory at home','A white floral heart, airy ivory palette and clear glass accents in an intimate indoor setting.'),
 photo('7371','Ivory skyline','A sculptural ivory floral heart with city-view inspiration and elegant glass candle accents.'),
 photo('7375','Blush by the sea','A soft pink floral heart and a romantic blush palette inspired by a coastal gazebo.'),
 photo('7377','Sunset rose reveal','A deep red floral heart with sunset colours and a dramatic, symmetrical approach.'),
 photo('7378','Rooftop romance','A city rooftop atmosphere with rich red floral accents and warm lighting.'),
 photo('7379','Garden heart','An ivory floral heart and elevated white floral accents with intimate garden ambience.'),
 photo('7376','The grand question','A dramatic red floral focal installation and celebratory evening lighting. Do not include pyrotechnics.'),
 photo('7372','Ivory by the ocean','An ivory floral heart with ocean-inspired ambience and elegant white flowers. Do not include pyrotechnics.','Gift Neon Club'),
 photo('7370','Roses above the city','A lavish red-rose focal arrangement with elevated flowers, glass candle cylinders and a city-view atmosphere. Do not include pyrotechnics or a harp.','designsby_lilit')
];
export const proposalPackagePhotos={moment:[6,0,1],candles:[0,1,4],garden:[6,3,2],rooftop:[5,4,9],dinner:[1,0,3],signature:[4,2,0],luxe:[9,1,8],extra:[7,8,5]};
