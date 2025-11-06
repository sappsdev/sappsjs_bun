import { langStrings } from "@/i18n/strings";
import { respond } from "sappsjs";
import { detectLanguage, t } from "sappsjs/i18n";
import type { RouteHandler } from "sappsjs/types";

export const getWelcome: RouteHandler = async (req) => {
  return respond(async () => {
    const lang = detectLanguage(req, "en");
		return t(lang, "welcome", langStrings);
  })
};
