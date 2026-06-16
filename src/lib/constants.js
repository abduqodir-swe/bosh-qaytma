// Domain constants for the Bo'sh Qaytma platform.
// Cargo, transport, status are mapped to friendly icon names from `@/lib/icons`
// (FontAwesome under the hood). Components use the Icon component to render them.

export const CITIES = [
  "Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon",
  "Farg'ona", "Qo'qon", "Qarshi", "Termiz", "Nukus",
  "Urganch", "Navoiy", "Jizzax", "Sirdaryo", "Guliston",
  "Chirchiq", "Angren", "Olmaliq", "Bekobod", "Yangiyo'l"
];

// Map: enum → { label, icon, color } for use with <Icon name="..." />
export const CARGO_TYPES = {
  qurilish_materiallari: { label: "Qurilish materiallari", icon: "hammer",       color: "bg-orange-100 text-orange-700 border-orange-200" },
  oziq_ovqat:           { label: "Oziq-ovqat",             icon: "appleWhole",    color: "bg-green-100 text-green-700 border-green-200" },
  mebel:                { label: "Mebel",                  icon: "couch",         color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  elektronika:          { label: "Elektronika",            icon: "mobileSolid",   color: "bg-blue-100 text-blue-700 border-blue-200" },
  kimyo:                { label: "Kimyoviy mahsulotlar",   icon: "flask",         color: "bg-purple-100 text-purple-700 border-purple-200" },
  qishloq_xojaligi:     { label: "Q/X mahsulotlari",       icon: "wheat",         color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  tekstil:              { label: "Tekstil",                icon: "shirt",         color: "bg-pink-100 text-pink-700 border-pink-200" },
  avtomobil_qismlari:   { label: "Avto qismlar",           icon: "car",           color: "bg-slate-100 text-slate-700 border-slate-200" },
  boshqa:               { label: "Boshqa",                 icon: "box",           color: "bg-gray-100 text-gray-700 border-gray-200" },
};

export const TRANSPORT_TYPES = {
  tentli:     { label: "Tentli",       icon: "truck",         hint: "Yopiq tentli yuk mashinasi" },
  ref:        { label: "Refrijerator", icon: "snowflake",     hint: "Sovutgichli transport" },
  bort:       { label: "Bort",         icon: "truckPickup",   hint: "Ochiq bortli" },
  konteyner:  { label: "Konteyner",    icon: "container",     hint: "Konteyner tashish" },
  evakuator:  { label: "Evakuator",    icon: "car",           hint: "Avto evakuator" },
  izoterm:    { label: "Izoterm",      icon: "temperatureHalf", hint: "Issiqlik saqlovchi" },
  har_qanday: { label: "Har qanday",   icon: "check",         hint: "Istalgan transport" },
};

export const STATUS_CONFIG = {
  active:      { label: "Faol",      icon: "circleCheck",  color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed:      { label: "Yopilgan",  icon: "circleXmark",  color: "bg-red-100 text-red-700 border-red-200" },
  in_progress: { label: "Jarayonda", icon: "spinner",      color: "bg-blue-100 text-blue-700 border-blue-200" },
};

export const BOOST_META = {
  highlight: { label: "AJRALIB TURISH",  icon: "palette",   color: "from-fuchsia-50 to-pink-50 border-fuchsia-200", selected: "from-fuchsia-100 to-pink-100 border-fuchsia-500", badge: "bg-fuchsia-500 text-white" },
  vip:       { label: "TANLANGAN YUK",   icon: "star",      color: "from-amber-50 to-yellow-50 border-amber-200",     selected: "from-amber-100 to-yellow-100 border-amber-500",   badge: "bg-amber-500 text-white" },
  pin:       { label: "TEPADA TURISH",   icon: "mapPin",    color: "from-sky-50 to-blue-50 border-sky-200",            selected: "from-sky-100 to-blue-100 border-sky-500",         badge: "bg-sky-500 text-white" },
  urgent:    { label: "SHOSHILINCH",     icon: "fire",      color: "from-red-50 to-orange-50 border-red-200",          selected: "from-red-100 to-orange-100 border-red-500",      badge: "bg-red-500 text-white" },
  zaril:     { label: "ZARIL YUK",       icon: "boltLightning", color: "from-orange-50 to-yellow-50 border-orange-200", selected: "from-orange-100 to-yellow-100 border-orange-500", badge: "bg-orange-500 text-white" },
};
