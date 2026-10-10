/** localStorage key for the chosen theme; absent means "follow the system". */
export const THEME_STORAGE_KEY = "theme";

/** Fired on window when the theme changes, so every toggle re-renders. */
export const THEME_CHANGE_EVENT = "themechange";

/**
 * Runs before the first paint (inlined in the root layout) and applies the
 * saved theme, so a dark-mode user never sees a white flash.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
