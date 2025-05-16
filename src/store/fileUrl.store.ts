import { map } from "nanostores"

/**
 * A nano store that map user ID and profile avatar image URL.
 * The keys represent the user ID, and the values 
 * represent their corresponding avatar image URL.
 */
export const profileAvatarStore= map<Record<string, string | undefined>>({})

/**
 * A nano store that map user ID and profile hero image URL.
 * The keys represent the user ID, and the values 
 * represent their corresponding hero image URL.
 */
export const profileHeroStore= map<Record<string, string | undefined>>({})

/**
 * A nano store that map location ID and planet avatar image URL.
 * The keys represent the location ID, and the values 
 * represent their corresponding avatar image URL.
 */
export const planetAvatarStore= map<Record<string, string | undefined>>({})

/**
 * A nano store that map location ID and location landscape image URL.
 * The keys represent the location ID, and the values 
 * represent their corresponding location landscape image URL.
 */
export const locationLandscapeStore= map<Record<string, string | undefined>>({})

/**
 * A nano store that map user ID and starship hero image URL.
 * The keys represent the user ID, and the values 
 * represent their corresponding hero image URL.
 */
export const starshipHeroStore= map<Record<string, string | undefined>>({})