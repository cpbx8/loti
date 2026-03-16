import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './en/common.json'
import enScan from './en/scan.json'
import enAuth from './en/auth.json'
import enDashboard from './en/dashboard.json'

import esCommon from './es/common.json'
import esScan from './es/scan.json'
import esAuth from './es/auth.json'
import esDashboard from './es/dashboard.json'

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      scan: enScan,
      auth: enAuth,
      dashboard: enDashboard,
    },
    es: {
      common: esCommon,
      scan: esScan,
      auth: esAuth,
      dashboard: esDashboard,
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
