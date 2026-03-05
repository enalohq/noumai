/**
 * Country Data for UI Dropdowns
 * All countries with flag emojis and common aliases
 */

export interface CountryOption {
  name: string;
  flag: string;
  aliases: string[];
  code: string;
}

export const COUNTRIES: CountryOption[] = [
  { name: "United States", flag: "🇺🇸", aliases: ["USA", "US", "America", "United States of America"], code: "US" },
  { name: "India", flag: "🇮🇳", aliases: ["IN", "Bharat"], code: "IN" },
  { name: "United Kingdom", flag: "🇬🇧", aliases: ["UK", "Great Britain", "England", "Britain"], code: "GB" },
  { name: "Australia", flag: "🇦🇺", aliases: ["AU", "Oz"], code: "AU" },
  { name: "Canada", flag: "🇨🇦", aliases: ["CA"], code: "CA" },
  { name: "Germany", flag: "🇩🇪", aliases: ["DE", "Deutschland"], code: "DE" },
  { name: "France", flag: "🇫🇷", aliases: ["FR"], code: "FR" },
  { name: "Japan", flag: "🇯🇵", aliases: ["JP", "Nippon"], code: "JP" },
  { name: "China", flag: "🇨🇳", aliases: ["CN", "PRC", "People's Republic of China"], code: "CN" },
  { name: "Brazil", flag: "🇧🇷", aliases: ["BR", "Brasil"], code: "BR" },
  { name: "Mexico", flag: "🇲🇽", aliases: ["MX"], code: "MX" },
  { name: "Spain", flag: "🇪🇸", aliases: ["ES", "España"], code: "ES" },
  { name: "Italy", flag: "🇮🇹", aliases: ["IT", "Italia"], code: "IT" },
  { name: "Netherlands", flag: "🇳🇱", aliases: ["NL", "Holland"], code: "NL" },
  { name: "Switzerland", flag: "🇨🇭", aliases: ["CH", "Swiss"], code: "CH" },
  { name: "Sweden", flag: "🇸🇪", aliases: ["SE", "Sverige"], code: "SE" },
  { name: "Norway", flag: "🇳🇴", aliases: ["NO", "Norge"], code: "NO" },
  { name: "Denmark", flag: "🇩🇰", aliases: ["DK", "Danmark"], code: "DK" },
  { name: "Finland", flag: "🇫🇮", aliases: ["FI", "Suomi"], code: "FI" },
  { name: "Poland", flag: "🇵🇱", aliases: ["PL", "Polska"], code: "PL" },
  { name: "Russia", flag: "🇷🇺", aliases: ["RU", "Russian Federation"], code: "RU" },
  { name: "South Korea", flag: "🇰🇷", aliases: ["KR", "Korea", "Republic of Korea"], code: "KR" },
  { name: "Singapore", flag: "🇸🇬", aliases: ["SG"], code: "SG" },
  { name: "United Arab Emirates", flag: "🇦🇪", aliases: ["UAE", "AE"], code: "AE" },
  { name: "Saudi Arabia", flag: "🇸🇦", aliases: ["SA", "KSA"], code: "SA" },
  { name: "Qatar", flag: "🇶🇦", aliases: ["QA"], code: "QA" },
  { name: "Kuwait", flag: "🇰🇼", aliases: ["KW"], code: "KW" },
  { name: "Oman", flag: "🇴🇲", aliases: ["OM"], code: "OM" },
  { name: "Bahrain", flag: "🇧🇭", aliases: ["BH"], code: "BH" },
  { name: "Israel", flag: "🇮🇱", aliases: ["IL"], code: "IL" },
  { name: "Turkey", flag: "🇹🇷", aliases: ["TR", "Türkiye"], code: "TR" },
  { name: "Egypt", flag: "🇪🇬", aliases: ["EG"], code: "EG" },
  { name: "South Africa", flag: "🇿🇦", aliases: ["ZA", "RSA"], code: "ZA" },
  { name: "Nigeria", flag: "🇳🇬", aliases: ["NG"], code: "NG" },
  { name: "Kenya", flag: "🇰🇪", aliases: ["KE"], code: "KE" },
  { name: "Ghana", flag: "🇬🇭", aliases: ["GH"], code: "GH" },
  { name: "Ethiopia", flag: "🇪🇹", aliases: ["ET"], code: "ET" },
  { name: "Morocco", flag: "🇲🇦", aliases: ["MA"], code: "MA" },
  { name: "Algeria", flag: "🇩🇿", aliases: ["DZ"], code: "DZ" },
  { name: "Tunisia", flag: "🇹🇳", aliases: ["TN"], code: "TN" },
  { name: "Pakistan", flag: "🇵🇰", aliases: ["PK"], code: "PK" },
  { name: "Bangladesh", flag: "🇧🇩", aliases: ["BD"], code: "BD" },
  { name: "Sri Lanka", flag: "🇱🇰", aliases: ["LK"], code: "LK" },
  { name: "Nepal", flag: "🇳🇵", aliases: ["NP"], code: "NP" },
  { name: "Afghanistan", flag: "🇦🇫", aliases: ["AF"], code: "AF" },
  { name: "Iran", flag: "🇮🇷", aliases: ["IR"], code: "IR" },
  { name: "Iraq", flag: "🇮🇶", aliases: ["IQ"], code: "IQ" },
  { name: "Syria", flag: "🇸🇾", aliases: ["SY"], code: "SY" },
  { name: "Jordan", flag: "🇯🇴", aliases: ["JO"], code: "JO" },
  { name: "Lebanon", flag: "🇱🇧", aliases: ["LB"], code: "LB" },
  { name: "Vietnam", flag: "🇻🇳", aliases: ["VN"], code: "VN" },
  { name: "Thailand", flag: "🇹🇭", aliases: ["TH"], code: "TH" },
  { name: "Indonesia", flag: "🇮🇩", aliases: ["ID"], code: "ID" },
  { name: "Malaysia", flag: "🇲🇾", aliases: ["MY"], code: "MY" },
  { name: "Philippines", flag: "🇵🇭", aliases: ["PH", "Philippines"], code: "PH" },
  { name: "New Zealand", flag: "🇳🇿", aliases: ["NZ"], code: "NZ" },
  { name: "Ireland", flag: "🇮🇪", aliases: ["IE", "Éire"], code: "IE" },
  { name: "Portugal", flag: "🇵🇹", aliases: ["PT"], code: "PT" },
  { name: "Greece", flag: "🇬🇷", aliases: ["GR", "Hellas"], code: "GR" },
  { name: "Austria", flag: "🇦🇹", aliases: ["AT", "Österreich"], code: "AT" },
  { name: "Belgium", flag: "🇧🇪", aliases: ["BE", "Belgique", "België"], code: "BE" },
  { name: "Czech Republic", flag: "🇨🇿", aliases: ["CZ", "Czechia"], code: "CZ" },
  { name: "Hungary", flag: "🇭🇺", aliases: ["HU", "Magyarország"], code: "HU" },
  { name: "Romania", flag: "🇷🇴", aliases: ["RO", "România"], code: "RO" },
  { name: "Ukraine", flag: "🇺🇦", aliases: ["UA"], code: "UA" },
  { name: "Argentina", flag: "🇦🇷", aliases: ["AR"], code: "AR" },
  { name: "Chile", flag: "🇨🇱", aliases: ["CL"], code: "CL" },
  { name: "Colombia", flag: "🇨🇴", aliases: ["CO"], code: "CO" },
  { name: "Peru", flag: "🇵🇪", aliases: ["PE"], code: "PE" },
  { name: "Venezuela", flag: "🇻🇪", aliases: ["VE"], code: "VE" },
  { name: "Cuba", flag: "🇨🇺", aliases: ["CU"], code: "CU" },
  { name: "Dominican Republic", flag: "🇩🇴", aliases: ["DO"], code: "DO" },
  { name: "Puerto Rico", flag: "🇵🇷", aliases: ["PR"], code: "PR" },
  { name: "Jamaica", flag: "🇯🇲", aliases: ["JM"], code: "JM" },
  { name: "Trinidad and Tobago", flag: "🇹🇹", aliases: ["TT"], code: "TT" },
  { name: "Barbados", flag: "🇧🇧", aliases: ["BB"], code: "BB" },
  { name: "Bahamas", flag: "🇧🇸", aliases: ["BS"], code: "BS" },
  { name: "Costa Rica", flag: "🇨🇷", aliases: ["CR"], code: "CR" },
  { name: "Panama", flag: "🇵🇦", aliases: ["PA"], code: "PA" },
  { name: "Guatemala", flag: "🇬🇹", aliases: ["GT"], code: "GT" },
  { name: "Honduras", flag: "🇭🇳", aliases: ["HN"], code: "HN" },
  { name: "El Salvador", flag: "🇸🇻", aliases: ["SV"], code: "SV" },
  { name: "Nicaragua", flag: "🇳🇮", aliases: ["NI"], code: "NI" },
  { name: "Ecuador", flag: "🇪🇨", aliases: ["EC"], code: "EC" },
  { name: "Bolivia", flag: "🇧🇴", aliases: ["BO"], code: "BO" },
  { name: "Paraguay", flag: "🇵🇾", aliases: ["PY"], code: "PY" },
  { name: "Uruguay", flag: "🇺🇾", aliases: ["UY"], code: "UY" },
  { name: "Guyana", flag: "🇬🇾", aliases: ["GY"], code: "GY" },
  { name: "Suriname", flag: "🇸🇷", aliases: ["SR"], code: "SR" },
  { name: "French Guiana", flag: "🇬🇫", aliases: ["GF"], code: "GF" },
  { name: "Belize", flag: "🇧🇿", aliases: ["BZ"], code: "BZ" },
  { name: "Haiti", flag: "🇭🇹", aliases: ["HT"], code: "HT" },
  { name: "Dominica", flag: "🇩🇲", aliases: ["DM"], code: "DM" },
  { name: "Saint Lucia", flag: "🇱🇨", aliases: ["LC"], code: "LC" },
  { name: "Saint Vincent and the Grenadines", flag: "🇻🇨", aliases: ["VC"], code: "VC" },
  { name: "Grenada", flag: "🇬🇩", aliases: ["GD"], code: "GD" },
  { name: "Antigua and Barbuda", flag: "🇦🇬", aliases: ["AG"], code: "AG" },
  { name: "Saint Kitts and Nevis", flag: "🇰🇳", aliases: ["KN"], code: "KN" },
  { name: "Mongolia", flag: "🇲🇳", aliases: ["MN"], code: "MN" },
  { name: "Kazakhstan", flag: "🇰🇿", aliases: ["KZ"], code: "KZ" },
  { name: "Uzbekistan", flag: "🇺🇿", aliases: ["UZ"], code: "UZ" },
  { name: "Turkmenistan", flag: "🇹🇲", aliases: ["TM"], code: "TM" },
  { name: "Kyrgyzstan", flag: "🇰🇬", aliases: ["KG"], code: "KG" },
  { name: "Tajikistan", flag: "🇹🇯", aliases: ["TJ"], code: "TJ" },
  { name: "Azerbaijan", flag: "🇦🇿", aliases: ["AZ"], code: "AZ" },
  { name: "Georgia", flag: "🇬🇪", aliases: ["GE"], code: "GE" },
  { name: "Armenia", flag: "🇦🇲", aliases: ["AM"], code: "AM" },
  { name: "Cyprus", flag: "🇨🇾", aliases: ["CY"], code: "CY" },
  { name: "Malta", flag: "🇲🇹", aliases: ["MT"], code: "MT" },
  { name: "Iceland", flag: "🇮🇸", aliases: ["IS", "Ísland"], code: "IS" },
  { name: "Luxembourg", flag: "🇱🇺", aliases: ["LU"], code: "LU" },
  { name: "Monaco", flag: "🇲🇨", aliases: ["MC"], code: "MC" },
  { name: "Liechtenstein", flag: "🇱🇮", aliases: ["LI"], code: "LI" },
  { name: "San Marino", flag: "🇸🇲", aliases: ["SM"], code: "SM" },
  { name: "Andorra", flag: "🇦🇩", aliases: ["AD"], code: "AD" },
  { name: "Vatican City", flag: "🇻🇦", aliases: ["VA", "Holy See"], code: "VA" },
  { name: "Maldives", flag: "🇲🇻", aliases: ["MV"], code: "MV" },
  { name: "Mauritius", flag: "🇲🇺", aliases: ["MU"], code: "MU" },
  { name: "Seychelles", flag: "🇸🇨", aliases: ["SC"], code: "SC" },
  { name: "Comoros", flag: "🇰🇲", aliases: ["KM"], code: "KM" },
  { name: "Madagascar", flag: "🇲🇬", aliases: ["MG"], code: "MG" },
  { name: "Mozambique", flag: "🇲🇿", aliases: ["MZ"], code: "MZ" },
  { name: "Zimbabwe", flag: "🇿🇼", aliases: ["ZW"], code: "ZW" },
  { name: "Zambia", flag: "🇿🇲", aliases: ["ZM"], code: "ZM" },
  { name: "Malawi", flag: "🇲🇼", aliases: ["MW"], code: "MW" },
  { name: "Tanzania", flag: "🇹🇿", aliases: ["TZ"], code: "TZ" },
  { name: "Uganda", flag: "🇺🇬", aliases: ["UG"], code: "UG" },
  { name: "Rwanda", flag: "🇷🇼", aliases: ["RW"], code: "RW" },
  { name: "Burundi", flag: "🇧🇮", aliases: ["BI"], code: "BI" },
  { name: "Ethiopia", flag: "🇪🇹", aliases: ["ET"], code: "ET" },
  { name: "Somalia", flag: "🇸🇴", aliases: ["SO"], code: "SO" },
  { name: "Djibouti", flag: "🇩🇯", aliases: ["DJ"], code: "DJ" },
  { name: "Eritrea", flag: "🇪🇷", aliases: ["ER"], code: "ER" },
  { name: "Sudan", flag: "🇸🇩", aliases: ["SD"], code: "SD" },
  { name: "South Sudan", flag: "🇸🇸", aliases: ["SS"], code: "SS" },
  { name: "Chad", flag: "🇹🇩", aliases: ["TD"], code: "TD" },
  { name: "Niger", flag: "🇳🇪", aliases: ["NE"], code: "NE" },
  { name: "Mali", flag: "🇲🇱", aliases: ["ML"], code: "ML" },
  { name: "Burkina Faso", flag: "🇧🇫", aliases: ["BF"], code: "BF" },
  { name: "Benin", flag: "🇧🇯", aliases: ["BJ"], code: "BJ" },
  { name: "Togo", flag: "🇹🇬", aliases: ["TG"], code: "TG" },
  { name: "Ghana", flag: "🇬🇭", aliases: ["GH"], code: "GH" },
  { name: "Côte d'Ivoire", flag: "🇨🇮", aliases: ["CI", "Ivory Coast"], code: "CI" },
  { name: "Liberia", flag: "🇱🇷", aliases: ["LR"], code: "LR" },
  { name: "Sierra Leone", flag: "🇸🇱", aliases: ["SL"], code: "SL" },
  { name: "Guinea", flag: "🇬🇳", aliases: ["GN"], code: "GN" },
  { name: "Guinea-Bissau", flag: "🇬🇼", aliases: ["GW"], code: "GW" },
  { name: "Senegal", flag: "🇸🇳", aliases: ["SN"], code: "SN" },
  { name: "Gambia", flag: "🇬🇲", aliases: ["GM"], code: "GM" },
  { name: "Mauritania", flag: "🇲🇷", aliases: ["MR"], code: "MR" },
  { name: "Cape Verde", flag: "🇨🇻", aliases: ["CV"], code: "CV" },
  { name: "São Tomé and Príncipe", flag: "🇸🇹", aliases: ["ST"], code: "ST" },
  { name: "Equatorial Guinea", flag: "🇬🇶", aliases: ["GQ"], code: "GQ" },
  { name: "Gabon", flag: "🇬🇦", aliases: ["GA"], code: "GA" },
  { name: "Republic of the Congo", flag: "🇨🇬", aliases: ["CG", "Congo-Brazzaville"], code: "CG" },
  { name: "Democratic Republic of the Congo", flag: "🇨🇩", aliases: ["CD", "DRC", "Congo-Kinshasa"], code: "CD" },
  { name: "Central African Republic", flag: "🇨🇫", aliases: ["CF"], code: "CF" },
  { name: "Cameroon", flag: "🇨🇲", aliases: ["CM"], code: "CM" },
  { name: "Angola", flag: "🇦🇴", aliases: ["AO"], code: "AO" },
  { name: "Namibia", flag: "🇳🇦", aliases: ["NA"], code: "NA" },
  { name: "Botswana", flag: "🇧🇼", aliases: ["BW"], code: "BW" },
  { name: "Lesotho", flag: "🇱🇸", aliases: ["LS"], code: "LS" },
  { name: "Eswatini", flag: "🇸🇿", aliases: ["SZ", "Swaziland"], code: "SZ" },
  { name: "Fiji", flag: "🇫🇯", aliases: ["FJ"], code: "FJ" },
  { name: "Papua New Guinea", flag: "🇵🇬", aliases: ["PG"], code: "PG" },
  { name: "Solomon Islands", flag: "🇸🇧", aliases: ["SB"], code: "SB" },
  { name: "Vanuatu", flag: "🇻🇺", aliases: ["VU"], code: "VU" },
  { name: "Samoa", flag: "🇼🇸", aliases: ["WS"], code: "WS" },
  { name: "Tonga", flag: "🇹🇴", aliases: ["TO"], code: "TO" },
  { name: "Kiribati", flag: "🇰🇮", aliases: ["KI"], code: "KI" },
  { name: "Tuvalu", flag: "🇹🇻", aliases: ["TV"], code: "TV" },
  { name: "Nauru", flag: "🇳🇷", aliases: ["NR"], code: "NR" },
  { name: "Palau", flag: "🇵🇼", aliases: ["PW"], code: "PW" },
  { name: "Marshall Islands", flag: "🇲🇭", aliases: ["MH"], code: "MH" },
  { name: "Micronesia", flag: "🇫🇲", aliases: ["FM"], code: "FM" },
  { name: "Timor-Leste", flag: "🇹🇱", aliases: ["TL", "East Timor"], code: "TL" },
  { name: "Brunei", flag: "🇧🇳", aliases: ["BN"], code: "BN" },
  { name: "Bhutan", flag: "🇧🇹", aliases: ["BT"], code: "BT" },
  { name: "Maldives", flag: "🇲🇻", aliases: ["MV"], code: "MV" },
  { name: "Sri Lanka", flag: "🇱🇰", aliases: ["LK"], code: "LK" },
  { name: "Bangladesh", flag: "🇧🇩", aliases: ["BD"], code: "BD" },
  { name: "Myanmar", flag: "🇲🇲", aliases: ["MM", "Burma"], code: "MM" },
  { name: "Laos", flag: "🇱🇦", aliases: ["LA"], code: "LA" },
  { name: "Cambodia", flag: "🇰🇭", aliases: ["KH"], code: "KH" },
  { name: "North Korea", flag: "🇰🇵", aliases: ["KP", "DPRK"], code: "KP" },
  { name: "Taiwan", flag: "🇹🇼", aliases: ["TW", "Republic of China"], code: "TW" },
  { name: "Hong Kong", flag: "🇭🇰", aliases: ["HK"], code: "HK" },
  { name: "Macau", flag: "🇲🇴", aliases: ["MO"], code: "MO" },
  { name: "Tibet", flag: "🇹🇮", aliases: ["TI"], code: "TI" },
  { name: "Palestine", flag: "🇵🇸", aliases: ["PS"], code: "PS" },
  { name: "Western Sahara", flag: "🇪🇭", aliases: ["EH"], code: "EH" },
  { name: "Kosovo", flag: "🇽🇰", aliases: ["XK"], code: "XK" },
  { name: "Abkhazia", flag: "🇦🇧", aliases: ["AB"], code: "AB" },
  { name: "South Ossetia", flag: "🇴🇸", aliases: ["OS"], code: "OS" },
  { name: "Northern Cyprus", flag: "🇨🇾", aliases: ["CY"], code: "CY" },
  { name: "Transnistria", flag: "🇲🇩", aliases: ["MD"], code: "MD" },
  { name: "Somaliland", flag: "🇸🇴", aliases: ["SO"], code: "SO" },
  { name: "Artsakh", flag: "🇦🇿", aliases: ["AZ"], code: "AZ" },
];

/**
 * Find country by name or alias (exact match, case-insensitive)
 * For auto-selection when user types exact country name
 */
export function findCountry(query: string): CountryOption | undefined {
  const normalizedQuery = query.toLowerCase().trim();
  
  // First try exact matches (for auto-selection)
  return COUNTRIES.find(country => 
    country.name.toLowerCase() === normalizedQuery ||
    country.aliases.some(alias => alias.toLowerCase() === normalizedQuery) ||
    country.code.toLowerCase() === normalizedQuery
  );
}

/**
 * Search countries by query (name, alias, or code) - case-insensitive with partial matching
 */
export function searchCountries(query: string): CountryOption[] {
  if (!query.trim()) return COUNTRIES;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return COUNTRIES.filter(country => 
    // Case-insensitive partial match on name
    country.name.toLowerCase().includes(normalizedQuery) ||
    // Case-insensitive partial match on any alias
    country.aliases.some(alias => alias.toLowerCase().includes(normalizedQuery)) ||
    // Case-insensitive exact match on code
    country.code.toLowerCase() === normalizedQuery
  );
}

/**
 * Get country by exact name
 */
export function getCountryByName(name: string): CountryOption | undefined {
  return COUNTRIES.find(country => country.name === name);
}