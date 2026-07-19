import { isFilterRegistered, registerFilter, unregisterFilter } from "~lib/dom/filterStack"

const FILTER_KEY = "calmThemeDesaturate"
const FILTER_VALUE = "saturate(0.6) brightness(0.97) contrast(0.95)"

export function applyDesaturate(): void {
  registerFilter(FILTER_KEY, FILTER_VALUE)
}

export function removeDesaturate(): void {
  unregisterFilter(FILTER_KEY)
}

export function isDesaturateApplied(): boolean {
  return isFilterRegistered(FILTER_KEY)
}
