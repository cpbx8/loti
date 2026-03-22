import { ONBOARDING_PROFILES } from './seed'

declare global {
  namespace Cypress {
    interface Chainable {
      /** Set onboarding complete with a given profile */
      completeOnboarding(profile?: keyof typeof ONBOARDING_PROFILES | Record<string, unknown>): Chainable<void>
      /** Mock a barcode scan detection event */
      mockBarcodeScan(barcode: string): Chainable<void>
      /** Mock a photo scan API response */
      mockPhotoScan(response: Record<string, unknown>): Chainable<void>
      /** Mock AI suggestion API response */
      mockSuggest(response: Record<string, unknown>): Chainable<void>
    }
  }
}

Cypress.Commands.add('completeOnboarding', (profile?: string | Record<string, unknown>) => {
  const data = typeof profile === 'string'
    ? ONBOARDING_PROFILES[profile as keyof typeof ONBOARDING_PROFILES]
    : profile ?? ONBOARDING_PROFILES.healthy

  cy.window().then((win) => {
    win.localStorage.setItem('loti_onboarding', JSON.stringify(data))
    win.localStorage.setItem('loti_onboarding_complete', 'true')
    win.localStorage.setItem('loti_explainer_dismissed', 'true')
  })
})

Cypress.Commands.add('mockBarcodeScan', (barcode: string) => {
  cy.window().then((win) => {
    win.dispatchEvent(new CustomEvent('test:barcode-detected', { detail: barcode }))
  })
})

Cypress.Commands.add('mockPhotoScan', (response: Record<string, unknown>) => {
  cy.intercept('POST', '**/functions/v1/scan', {
    statusCode: 200,
    body: response,
  }).as('photoScan')
})

Cypress.Commands.add('mockSuggest', (response: Record<string, unknown>) => {
  cy.intercept('POST', '**/functions/v1/suggest', {
    statusCode: 200,
    body: response,
  }).as('suggest')
})

export {}
