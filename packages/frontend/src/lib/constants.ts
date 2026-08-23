export const TIMEZONES = [
  'Pacific/Midway', 'Pacific/Honolulu', 'America/Juneau', 'America/Los_Angeles',
  'America/Phoenix', 'America/Denver', 'America/Chicago', 'America/New_York',
  'America/Caracas', 'America/Halifax', 'America/St_Johns', 'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires', 'Atlantic/Azores', 'Atlantic/Cape_Verde',
  'UTC', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid',
  'Europe/Rome', 'Europe/Stockholm', 'Europe/Vienna', 'Europe/Warsaw',
  'Europe/Helsinki', 'Europe/Moscow', 'Asia/Dubai', 'Asia/Karachi',
  'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Singapore',
  'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Perth', 'Australia/Darwin', 'Australia/Adelaide', 'Australia/Sydney',
  'Pacific/Auckland', 'Pacific/Fiji',
]

export const DATE_FORMATS = [
  'mm-dd-yyyy', 'dd-mm-yyyy', 'yyyy-mm-dd',
  'mm/dd/yyyy', 'dd/mm/yyyy', 'yyyy/mm/dd',
  'M d, yyyy', 'd M, yyyy', 'M d yy',
]

export const HOUR_FORMATS = ['12h', '24h']

export type CurrencyDefinition = { code: string; name: string; symbol: string }

// Active ISO 4217 currencies. Keeping this catalog client-side makes every
// organization able to choose a currency before it has configured a rate.
const CURRENCY_ROWS: [string, string, string][] = [
  ['AED','United Arab Emirates Dirham','د.إ'],['AFN','Afghan Afghani','؋'],['ALL','Albanian Lek','L'],['AMD','Armenian Dram','֏'],['ANG','Netherlands Antillean Guilder','ƒ'],
  ['AOA','Angolan Kwanza','Kz'],['ARS','Argentine Peso','$'],['AUD','Australian Dollar','A$'],['AWG','Aruban Florin','ƒ'],['AZN','Azerbaijani Manat','₼'],
  ['BAM','Bosnia-Herzegovina Convertible Mark','KM'],['BBD','Barbadian Dollar','Bds$'],['BDT','Bangladeshi Taka','৳'],['BGN','Bulgarian Lev','лв'],['BHD','Bahraini Dinar','د.ب'],
  ['BIF','Burundian Franc','FBu'],['BMD','Bermudian Dollar','BD$'],['BND','Brunei Dollar','B$'],['BOB','Bolivian Boliviano','Bs.'],['BRL','Brazilian Real','R$'],
  ['BSD','Bahamian Dollar','B$'],['BTN','Bhutanese Ngultrum','Nu.'],['BWP','Botswanan Pula','P'],['BYN','Belarusian Ruble','Br'],['BZD','Belize Dollar','BZ$'],
  ['CAD','Canadian Dollar','C$'],['CDF','Congolese Franc','FC'],['CHF','Swiss Franc','CHF'],['CLP','Chilean Peso','CLP$'],['CNY','Chinese Yuan','¥'],
  ['COP','Colombian Peso','COL$'],['CRC','Costa Rican Colón','₡'],['CUP','Cuban Peso','₱'],['CVE','Cape Verdean Escudo','Esc'],['CZK','Czech Koruna','Kč'],
  ['DJF','Djiboutian Franc','Fdj'],['DKK','Danish Krone','kr'],['DOP','Dominican Peso','RD$'],['DZD','Algerian Dinar','دج'],['EGP','Egyptian Pound','E£'],
  ['ERN','Eritrean Nakfa','Nfk'],['ETB','Ethiopian Birr','Br'],['EUR','Euro','€'],['FJD','Fijian Dollar','FJ$'],['FKP','Falkland Islands Pound','£'],
  ['GBP','British Pound','£'],['GEL','Georgian Lari','₾'],['GHS','Ghanaian Cedi','₵'],['GIP','Gibraltar Pound','£'],['GMD','Gambian Dalasi','D'],
  ['GNF','Guinean Franc','FG'],['GTQ','Guatemalan Quetzal','Q'],['GYD','Guyanese Dollar','G$'],['HKD','Hong Kong Dollar','HK$'],['HNL','Honduran Lempira','L'],
  ['HTG','Haitian Gourde','G'],['HUF','Hungarian Forint','Ft'],['IDR','Indonesian Rupiah','Rp'],['ILS','Israeli New Shekel','₪'],['INR','Indian Rupee','₹'],
  ['IQD','Iraqi Dinar','ع.د'],['IRR','Iranian Rial','﷼'],['ISK','Icelandic Króna','kr'],['JMD','Jamaican Dollar','J$'],['JOD','Jordanian Dinar','د.ا'],
  ['JPY','Japanese Yen','¥'],['KES','Kenyan Shilling','KSh'],['KGS','Kyrgyzstani Som','сом'],['KHR','Cambodian Riel','៛'],['KMF','Comorian Franc','CF'],
  ['KPW','North Korean Won','₩'],['KRW','South Korean Won','₩'],['KWD','Kuwaiti Dinar','د.ك'],['KYD','Cayman Islands Dollar','CI$'],['KZT','Kazakhstani Tenge','₸'],
  ['LAK','Lao Kip','₭'],['LBP','Lebanese Pound','ل.ل'],['LKR','Sri Lankan Rupee','Rs'],['LRD','Liberian Dollar','L$'],['LSL','Lesotho Loti','L'],
  ['LYD','Libyan Dinar','ل.د'],['MAD','Moroccan Dirham','د.م.'],['MDL','Moldovan Leu','L'],['MGA','Malagasy Ariary','Ar'],['MKD','Macedonian Denar','ден'],
  ['MMK','Myanmar Kyat','K'],['MNT','Mongolian Tögrög','₮'],['MOP','Macanese Pataca','MOP$'],['MRU','Mauritanian Ouguiya','UM'],['MUR','Mauritian Rupee','₨'],
  ['MVR','Maldivian Rufiyaa','Rf'],['MWK','Malawian Kwacha','MK'],['MXN','Mexican Peso','MX$'],['MYR','Malaysian Ringgit','RM'],['MZN','Mozambican Metical','MT'],
  ['NAD','Namibian Dollar','N$'],['NGN','Nigerian Naira','₦'],['NIO','Nicaraguan Córdoba','C$'],['NOK','Norwegian Krone','kr'],['NPR','Nepalese Rupee','रू'],
  ['NZD','New Zealand Dollar','NZ$'],['OMR','Omani Rial','ر.ع.'],['PAB','Panamanian Balboa','B/.'],['PEN','Peruvian Sol','S/'],['PGK','Papua New Guinean Kina','K'],
  ['PHP','Philippine Peso','₱'],['PKR','Pakistani Rupee','₨'],['PLN','Polish Złoty','zł'],['PYG','Paraguayan Guaraní','₲'],['QAR','Qatari Riyal','ر.ق'],
  ['RON','Romanian Leu','lei'],['RSD','Serbian Dinar','дин'],['RUB','Russian Ruble','₽'],['RWF','Rwandan Franc','FRw'],['SAR','Saudi Riyal','ر.س'],
  ['SBD','Solomon Islands Dollar','SI$'],['SCR','Seychellois Rupee','₨'],['SDG','Sudanese Pound','ج.س.'],['SEK','Swedish Krona','kr'],['SGD','Singapore Dollar','S$'],
  ['SHP','Saint Helena Pound','£'],['SLE','Sierra Leonean Leone','Le'],['SOS','Somali Shilling','Sh'],['SRD','Surinamese Dollar','SR$'],['SSP','South Sudanese Pound','SS£'],
  ['STN','São Tomé and Príncipe Dobra','Db'],['SVC','Salvadoran Colón','₡'],['SYP','Syrian Pound','£'],['SZL','Swazi Lilangeni','L'],['THB','Thai Baht','฿'],
  ['TJS','Tajikistani Somoni','ЅМ'],['TMT','Turkmenistani Manat','m'],['TND','Tunisian Dinar','د.ت'],['TOP','Tongan Paʻanga','T$'],['TRY','Turkish Lira','₺'],
  ['TTD','Trinidad and Tobago Dollar','TT$'],['TWD','New Taiwan Dollar','NT$'],['TZS','Tanzanian Shilling','TSh'],['UAH','Ukrainian Hryvnia','₴'],['UGX','Ugandan Shilling','USh'],
  ['USD','United States Dollar','$'],['UYU','Uruguayan Peso','$U'],['UZS','Uzbekistani Som','soʻm'],['VES','Venezuelan Bolívar','Bs.'],['VND','Vietnamese Đồng','₫'],
  ['VUV','Vanuatu Vatu','VT'],['WST','Samoan Tala','WS$'],['XAF','Central African CFA Franc','FCFA'],['XCD','East Caribbean Dollar','EC$'],['XCG','Caribbean Guilder','Cg'],
  ['XOF','West African CFA Franc','CFA'],['XPF','CFP Franc','₣'],['YER','Yemeni Rial','﷼'],['ZAR','South African Rand','R'],['ZMW','Zambian Kwacha','ZK'],['ZWG','Zimbabwe Gold','ZiG'],
]

export const CURRENCY_CATALOG: CurrencyDefinition[] = CURRENCY_ROWS.map(([code, name, symbol]) => ({ code, name, symbol }))
export const CURRENCIES = CURRENCY_CATALOG.map(currency => currency.code)

export const LANGUAGES = [
  { value: 'en_us', label: 'English (US)' },
  { value: 'en_gb', label: 'English (UK)' },
  { value: 'ar', label: 'Arabic' },
  { value: 'bn', label: 'Bengali' },
  { value: 'zh', label: 'Chinese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'he', label: 'Hebrew' },
  { value: 'hi', label: 'Hindi' },
  { value: 'id', label: 'Indonesian' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ms', label: 'Malay' },
  { value: 'fa', label: 'Persian' },
  { value: 'pl', label: 'Polish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ro', label: 'Romanian' },
  { value: 'ru', label: 'Russian' },
  { value: 'es', label: 'Spanish' },
  { value: 'sv', label: 'Swedish' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'th', label: 'Thai' },
  { value: 'tr', label: 'Turkish' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'ur', label: 'Urdu' },
  { value: 'vi', label: 'Vietnamese' },
]

export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh',
  'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', "Côte d'Ivoire", 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia',
  'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana',
  'Greece', 'Guatemala', 'Guinea', 'Guyana', 'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
  'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Panama', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Slovenia', 'Somalia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka',
  'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
]

export const SOCIAL_FIELDS = [
  { field: 'facebook', label: 'Facebook', icon: 'Facebook', placeholder: 'https://facebook.com/...' },
  { field: 'twitter', label: 'Twitter / X', icon: 'Twitter', placeholder: 'https://twitter.com/...' },
  { field: 'linkedin', label: 'LinkedIn', icon: 'Linkedin', placeholder: 'https://linkedin.com/company/...' },
  { field: 'instagram', label: 'Instagram', icon: 'Instagram', placeholder: 'https://instagram.com/...' },
  { field: 'youtube', label: 'YouTube', icon: 'Youtube', placeholder: 'https://youtube.com/@...' },
]
