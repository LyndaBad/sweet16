// Curated Pexels photographs, used under https://www.pexels.com/license/.
// Inspiration references, not a portfolio of Decorator Extraordinaire work.
const photo=(id,slug,label)=>({src:`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`,source:`https://www.pexels.com/photo/${slug}-${id}/`,label});
export const inspiration={
 proposals:[photo(36836187,'romantic-proposal-setup-with-heart-shaped-roses','Rose-heart proposal'),photo(10282444,'candle-lights-on-the-table','Soft candlelight'),photo(10810990,'table-decoration-with-candles-for-romantic-dinner','Intimate dinner')],
 birthdays:[photo(16470652,'birthday-decoration-of-hotel-room','Birthday surprise'),photo(32191357,'colorful-birthday-cake-on-decorated-table','Garden birthday table'),photo(10810990,'table-decoration-with-candles-for-romantic-dinner','Evening celebration')],
 weddings:[photo(30815990,'elegant-wedding-arch-with-floral-arrangements','Ivory floral backdrop'),photo(2606405,'white-table-mat','Elegant reception details'),photo(31474722,'elegant-wedding-arch-decor-in-outdoor-venue','Garden entrance')],
 traditional:[photo(33330921,'elegant-nigerian-wedding-couple-in-traditional-attire','Nigerian celebration inspiration'),photo(17297879,'bride-in-wedding-dress-and-tiara','Ghanaian celebration inspiration'),photo(30815990,'elegant-wedding-arch-with-floral-arrangements','Contemporary reception styling')]
};
