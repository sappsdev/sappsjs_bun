import type { LanguageStrings } from './types';

/**
 * Detect language from request headers
 * @param req - Bun Request
 * @param defaultLanguage - Default language if none is detected
 * @returns Languaje code (ej: 'en', 'es')
 */
export function detectLanguage(req: Request, defaultLanguage: string = 'en'): string {
	return req.headers.get('accept-language')?.split(',')?.[0]?.split('-')?.[0] ?? defaultLanguage;
}

/**
 * Translate a key to the specified language
 * @param lang - Lenguaje (ej: 'en', 'es')
 * @param key - Key translation (ej: 'hello_world')
 * @param langStrings - Translation object
 * @returns Translated string or the key if not found
 */
export function t(lang: string, key: string, langStrings: LanguageStrings): string {
	return langStrings[lang]?.[key] ?? key;
}
