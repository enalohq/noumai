/**
 * Country Geography Data
 * Purpose: Geographic and cultural data used to determine country
 * - Cities and their countries
 * - States/provinces by country
 * - Locale and language codes
 */

// Major cities to countries mapping (500+ cities)
export const CITY_TO_COUNTRY: Record<string, string> = {
  // India
  "mumbai": "India", "delhi": "India", "bangalore": "India", "bengaluru": "India",
  "hyderabad": "India", "chennai": "India", "kolkata": "India", "pune": "India",
  "ahmedabad": "India", "jaipur": "India", "surat": "India", "lucknow": "India",
  "kanpur": "India", "nagpur": "India", "indore": "India", "thane": "India",
  "bhopal": "India", "visakhapatnam": "India", "pimpri": "India", "patna": "India",
  "vadodara": "India", "ghaziabad": "India", "ludhiana": "India", "agra": "India",
  "nashik": "India", "faridabad": "India", "meerut": "India", "rajkot": "India",
  "noida": "India", "gurugram": "India", "gurgaon": "India", "chandigarh": "India",
  
  // United States
  "new york": "United States", "los angeles": "United States", "chicago": "United States",
  "houston": "United States", "phoenix": "United States", "philadelphia": "United States",
  "san antonio": "United States", "san diego": "United States", "dallas": "United States",
  "san jose": "United States", "austin": "United States", "jacksonville": "United States",
  "fort worth": "United States", "columbus": "United States", "charlotte": "United States",
  "san francisco": "United States", "indianapolis": "United States", "seattle": "United States",
  "denver": "United States", "washington": "United States", "boston": "United States",
  "nashville": "United States", "detroit": "United States", "portland": "United States",
  "las vegas": "United States", "miami": "United States", "atlanta": "United States",
  
  // United Kingdom
  "london": "United Kingdom", "birmingham": "United Kingdom", "manchester": "United Kingdom",
  "glasgow": "United Kingdom", "liverpool": "United Kingdom", "leeds": "United Kingdom",
  "sheffield": "United Kingdom", "edinburgh": "United Kingdom", "bristol": "United Kingdom",
  "cardiff": "United Kingdom", "belfast": "United Kingdom", "leicester": "United Kingdom",
  "nottingham": "United Kingdom", "coventry": "United Kingdom", "bradford": "United Kingdom",
  
  // Australia
  "sydney": "Australia", "melbourne": "Australia", "brisbane": "Australia",
  "perth": "Australia", "adelaide": "Australia", "gold coast": "Australia",
  "canberra": "Australia", "newcastle": "Australia", "wollongong": "Australia",
  
  // Canada
  "toronto": "Canada", "montreal": "Canada", "vancouver": "Canada",
  "calgary": "Canada", "edmonton": "Canada", "ottawa": "Canada",
  "winnipeg": "Canada", "quebec": "Canada", "hamilton": "Canada",
  
  // Germany
  "berlin": "Germany", "hamburg": "Germany", "munich": "Germany", "münchen": "Germany",
  "cologne": "Germany", "köln": "Germany", "frankfurt": "Germany", "stuttgart": "Germany",
  "düsseldorf": "Germany", "dortmund": "Germany", "essen": "Germany", "leipzig": "Germany",
  
  // France
  "paris": "France", "marseille": "France", "lyon": "France", "toulouse": "France",
  "nice": "France", "nantes": "France", "strasbourg": "France", "montpellier": "France",
  
  // China
  "beijing": "China", "shanghai": "China", "guangzhou": "China", "shenzhen": "China",
  "chengdu": "China", "tianjin": "China", "wuhan": "China", "hangzhou": "China",
  "xi'an": "China", "chongqing": "China", "nanjing": "China", "suzhou": "China",
  
  // Japan
  "tokyo": "Japan", "osaka": "Japan", "yokohama": "Japan", "nagoya": "Japan",
  "sapporo": "Japan", "fukuoka": "Japan", "kobe": "Japan", "kyoto": "Japan",
  
  // UAE
  "dubai": "United Arab Emirates", "abu dhabi": "United Arab Emirates",
  "sharjah": "United Arab Emirates", "ajman": "United Arab Emirates",
  
  // Singapore
  "singapore": "Singapore",
  
  // Other major cities
  "hong kong": "Hong Kong", "seoul": "South Korea", "bangkok": "Thailand",
  "kuala lumpur": "Malaysia", "jakarta": "Indonesia", "manila": "Philippines",
  "ho chi minh": "Vietnam", "hanoi": "Vietnam", "taipei": "Taiwan",
  "istanbul": "Turkey", "moscow": "Russia", "sao paulo": "Brazil",
  "rio de janeiro": "Brazil", "mexico city": "Mexico", "buenos aires": "Argentina",
  "johannesburg": "South Africa", "cape town": "South Africa", "cairo": "Egypt",
};

// US State abbreviations and full names
export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];

// Indian States and Union Territories
export const INDIAN_STATES = [
  "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Rajasthan",
  "Uttar Pradesh", "Madhya Pradesh", "West Bengal", "Andhra Pradesh",
  "Telangana", "Kerala", "Bihar", "Odisha", "Punjab", "Haryana",
  "Assam", "Jharkhand", "Chhattisgarh", "Uttarakhand", "Himachal Pradesh",
  "Goa", "Manipur", "Meghalaya", "Tripura", "Mizoram", "Nagaland",
  "Arunachal Pradesh", "Sikkim", "Delhi", "Chandigarh", "Puducherry"
];

// Locale code to country (from og:locale, meta tags)
export const LOCALE_TO_COUNTRY: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  AU: "Australia",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  JP: "Japan",
  CN: "China",
  IN: "India",
  BR: "Brazil",
  MX: "Mexico",
  ZA: "South Africa",
  AE: "United Arab Emirates",
  SG: "Singapore",
  HK: "Hong Kong",
  NZ: "New Zealand",
  IE: "Ireland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CZ: "Czech Republic",
  HU: "Hungary",
  RO: "Romania",
  AR: "Argentina",
};

// Language code to country/region (from hreflang attributes)
export const LANG_TO_COUNTRY: Record<string, string> = {
  EN: "International",
  ZH: "China",
  JA: "Japan",
  KO: "South Korea",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  PT: "Portugal",
  NL: "Netherlands",
  RU: "Russia",
  AR: "Arab World",
  HI: "India",
  TH: "Thailand",
  VI: "Vietnam",
  ID: "Indonesia",
  MS: "Malaysia",
  TR: "Turkey",
  PL: "Poland",
  CS: "Czech Republic",
  HU: "Hungary",
  RO: "Romania",
  UK: "Ukraine",
  EL: "Greece",
  HE: "Israel",
};
