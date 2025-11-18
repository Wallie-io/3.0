/**
 * Anonymous User Utilities
 * Reversible encoding between IP addresses and human-readable usernames
 */

// Word list for encoding (256 words for each octet value 0-255)
const WORDS = [
  "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel",
  "India", "Juliet", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa",
  "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "Xray",
  "Yankee", "Zulu", "Amber", "Azure", "Beige", "Black", "Blue", "Bronze",
  "Brown", "Coral", "Crimson", "Cyan", "Gold", "Gray", "Green", "Indigo",
  "Ivory", "Jade", "Lavender", "Lime", "Magenta", "Maroon", "Navy", "Olive",
  "Orange", "Pearl", "Pink", "Plum", "Purple", "Red", "Rose", "Ruby",
  "Salmon", "Silver", "Tan", "Teal", "Turquoise", "Violet", "White", "Yellow",
  "Apple", "Apricot", "Banana", "Berry", "Cherry", "Coconut", "Date", "Fig",
  "Grape", "Kiwi", "Lemon", "Lime", "Mango", "Melon", "Olive", "Orange",
  "Papaya", "Peach", "Pear", "Plum", "Prune", "Raisin", "Star", "Tangerine",
  "Anchor", "Arrow", "Axe", "Beacon", "Bell", "Blade", "Bolt", "Bow",
  "Bridge", "Cannon", "Castle", "Chain", "Crown", "Dagger", "Diamond", "Drum",
  "Eagle", "Falcon", "Feather", "Fire", "Flag", "Flame", "Flash", "Forge",
  "Fortress", "Gem", "Hammer", "Harbor", "Hawk", "Heart", "Horn", "Iron",
  "Jewel", "Key", "Knight", "Lance", "Lantern", "Lion", "Lock", "Mace",
  "Mirror", "Moon", "Mountain", "Oak", "Ocean", "Pearl", "Phoenix", "Pine",
  "Pyramid", "Quartz", "Raven", "River", "Rock", "Sapphire", "Scroll", "Sea",
  "Shadow", "Shield", "Ship", "Sky", "Spear", "Star", "Stone", "Storm",
  "Sun", "Sword", "Temple", "Thunder", "Tiger", "Tower", "Tree", "Trident",
  "Valley", "Vault", "Wave", "Wind", "Wing", "Wolf", "Arch", "Atlas",
  "Aurora", "Basalt", "Bay", "Beach", "Bear", "Birch", "Bison", "Blaze",
  "Bloom", "Boulder", "Brook", "Cedar", "Cinder", "Cliff", "Cloud", "Comet",
  "Cove", "Crag", "Creek", "Crest", "Dune", "Dust", "Ember", "Field",
  "Flint", "Flora", "Foam", "Forest", "Frost", "Glade", "Glacier", "Grove",
  "Hail", "Heath", "Hill", "Horizon", "Ice", "Isle", "Lagoon", "Lake",
  "Leaf", "Marsh", "Meadow", "Mist", "Moss", "Nebula", "Oasis", "Ore",
  "Peak", "Pebble", "Plateau", "Pond", "Prairie", "Quake", "Rain", "Rapids",
  "Reef", "Ridge", "Rift", "Root", "Sand", "Shore", "Slate", "Snow",
  "Soil", "Spring", "Steam", "Stream", "Summit", "Surf", "Swamp", "Swift",
  "Thorn", "Tide", "Timber", "Trail", "Vale", "Vine", "Volcano", "Willow",
  "Zephyr", "Agate", "Aqua", "Ash", "Atom", "Bamboo", "Basin", "Beacon",
  "Bluff", "Breeze", "Brush", "Canyon", "Cave", "Clay", "Coast", "Copper"
];

// Ensure we have exactly 256 words by repeating if needed
while (WORDS.length < 256) {
  WORDS.push(`Word${WORDS.length}`);
}

/**
 * Extract IP address from request
 */
export function getIpAddress(request: Request): string {
  // Try various headers in order of preference
  const headers = request.headers;

  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback for development
  return '127.0.0.1';
}

/**
 * Encode IP address to username
 * Example: "192.168.1.1" → "Alpha-Bravo-Charlie-Delta"
 */
export function encodeIpToUsername(ip: string): string {
  const octets = ip.split('.').map(Number);

  if (octets.length !== 4 || octets.some(n => isNaN(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }

  const words = octets.map(octet => WORDS[octet]);
  return words.join('-');
}

/**
 * Decode username back to IP address
 * Example: "Alpha-Bravo-Charlie-Delta" → "192.168.1.1"
 */
export function decodeUsernameToIp(username: string): string {
  const words = username.split('-');

  if (words.length !== 4) {
    throw new Error(`Invalid username format: ${username}`);
  }

  const octets = words.map(word => {
    const index = WORDS.indexOf(word);
    if (index === -1) {
      throw new Error(`Invalid word in username: ${word}`);
    }
    return index;
  });

  return octets.join('.');
}

/**
 * Get anonymous username for request
 * Extracts IP and converts to username
 */
export function getAnonymousUsername(request: Request): string {
  const ip = getIpAddress(request);
  return encodeIpToUsername(ip);
}
