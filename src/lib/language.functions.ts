import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export const getVisitorCountry = createServerFn({ method: "GET" }).handler(() => {
  const country = getRequestHeader("cf-ipcountry");
  return country && /^[a-z]{2}$/i.test(country) ? country.toUpperCase() : "";
});