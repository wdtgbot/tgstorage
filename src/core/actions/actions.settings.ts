import type { Settings, Theme, Locale } from '~/core/store'
import { store } from '~/core/store'
import { dataCache } from '~/core/cache'

export const setSettings = (
  partialSettings: Partial<Settings>
) => {
  const storeSettings = store.getState().settings
  const settings = {
    ...storeSettings,
    ...partialSettings
  }
  store.setState({ settings })
  dataCache.setSettings(settings)
}

export const getTheme = () =>
  store.getState().settings.theme

export const setTheme = (theme: Theme) =>
  setSettings({ theme })

export const getLocale = () =>
  store.getState().settings.locale

export const setLocale = (locale: Locale) =>
  setSettings({ locale })

export const setGeneralFolder = (value: boolean) =>
  setSettings({ generalFolder: value })