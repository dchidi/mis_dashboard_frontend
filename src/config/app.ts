const configuredAppBasePath = import.meta.env.BASE_URL.replace(/\/+$/, "");

export const APP_BASENAME = configuredAppBasePath || "/";

export const stripAppBasename = (pathname: string) => {
  if (APP_BASENAME === "/") {
    return pathname;
  }

  if (pathname === APP_BASENAME) {
    return "/";
  }

  return pathname.startsWith(`${APP_BASENAME}/`)
    ? pathname.slice(APP_BASENAME.length)
    : pathname;
};
