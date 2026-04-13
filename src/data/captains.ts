/**
 * Captain first-name pool for VADN Dhule uncontrolled aerodrome scenarios.
 *
 * Only first names are used — the startup call format is:
 * "PIC Captain {CAPTAIN}" e.g. "PIC Captain Rajesh"
 *
 * Mix of Indian and Western names reflecting real Indian GA training environment.
 */

const CAPTAIN_NAMES: readonly string[] = [
    // Indian names
    'Rajesh',
    'Anil',
    'Priya',
    'Vikram',
    'Sunita',
    'Amit',
    'Deepak',
    'Kavitha',
    'Rajan',
    'Suresh',
    'Neha',
    'Arjun',
    // Western names
    'James',
    'Sarah',
    'David',
    'Robert',
    'Emma',
    'Michael',
    'Lisa',
    'John',
    'Mark',
    'Karen',
] as const;

/**
 * Returns a random captain first name from the pool.
 * Called once per scenario resolution so each session feels different.
 */
export const pickRandomCaptain = (): string => {
    const randomIndex = Math.floor(Math.random() * CAPTAIN_NAMES.length);
    return CAPTAIN_NAMES[randomIndex];
};
