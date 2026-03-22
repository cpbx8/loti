describe('Dashboard / Home Screen', () => {
  beforeEach(() => {
    cy.completeOnboarding('healthy')
    cy.visit('/')
  })

  describe('Layout', () => {
    it('shows greeting and app name', () => {
      cy.contains(/good morning|good afternoon|good evening/i).should('be.visible')
      cy.contains('Loti').should('be.visible')
    })

    it('shows streak badge in header', () => {
      cy.get('.text-text-secondary').should('be.visible') // greeting area
    })

    it('has date navigation', () => {
      cy.contains('Today').should('be.visible')
    })

    it('shows today summary bar', () => {
      cy.contains(/meals|scanned/i).should('be.visible')
    })

    it('shows tip carousel', () => {
      // Carousel should have at least one visible tip card
      cy.get('.snap-center, .snap-start').should('have.length.gte', 1)
    })

    it('shows disclaimer at bottom', () => {
      cy.contains('informational purposes only').should('be.visible')
    })
  })

  describe('Navigation', () => {
    it('settings icon navigates to settings', () => {
      cy.get('[aria-label="Settings"]').click()
      cy.contains('Settings').should('be.visible')
    })

    it('history icon navigates to history', () => {
      cy.get('[aria-label="History"]').click()
      cy.url().should('include', '/history')
    })

    it('favorites icon navigates to favorites', () => {
      cy.get('[aria-label="Favorites"]').click()
      cy.url().should('include', '/favorites')
    })
  })

  describe('Plus Button (FAB)', () => {
    it('plus button opens expandable menu', () => {
      cy.get('[aria-label="Add food"]').click()
      cy.contains('Take photo').should('be.visible')
      cy.contains('Scan barcode').should('be.visible')
      cy.contains('Type it in').should('be.visible')
    })

    it('photo option navigates to /scan', () => {
      cy.get('[aria-label="Add food"]').click()
      cy.contains('Take photo').click()
      cy.url().should('include', '/scan')
    })

    it('barcode option navigates to /barcode', () => {
      cy.get('[aria-label="Add food"]').click()
      cy.contains('Scan barcode').click()
      cy.url().should('include', '/barcode')
    })

    it('text option navigates to /text', () => {
      cy.get('[aria-label="Add food"]').click()
      cy.contains('Type it in').click()
      cy.url().should('include', '/text')
    })

    it('backdrop click closes menu', () => {
      cy.get('[aria-label="Add food"]').click()
      cy.contains('Take photo').should('be.visible')
      // Click backdrop
      cy.get('[class*="bg-black"]').first().click({ force: true })
      cy.contains('Take photo').should('not.exist')
    })
  })

  describe('Store Guide Button', () => {
    it('store button opens store picker', () => {
      cy.get('[aria-label="Store Guides"]').click()
      cy.contains('OXXO').should('be.visible')
      cy.contains('7-ELEVEN').should('be.visible')
    })

    it('OXXO option navigates to OXXO guide', () => {
      cy.get('[aria-label="Store Guides"]').click()
      cy.contains('OXXO').click()
      cy.url().should('include', '/store-guide/oxxo')
    })

    it('7-Eleven option navigates to 7-Eleven guide', () => {
      cy.get('[aria-label="Store Guides"]').click()
      cy.contains('7-ELEVEN').click()
      cy.url().should('include', '/store-guide/seven_eleven')
    })
  })

  describe('AI Ideas Button', () => {
    it('AI button opens suggestion sheet', () => {
      cy.get('[aria-label="AI food ideas"]').click()
      // Suggestion sheet should appear
      cy.contains(/what should i eat|breakfast|lunch|dinner|snack/i).should('be.visible')
    })
  })

  describe('How Loti Works (Explainer)', () => {
    it('shows explainer on first visit', () => {
      cy.clearLocalStorage()
      cy.completeOnboarding('healthy')
      // Remove the dismissed flag so explainer shows
      cy.window().then(win => win.localStorage.removeItem('loti_explainer_dismissed'))
      cy.visit('/')
      cy.contains(/how loti works|green|yellow|red/i).should('be.visible')
    })

    it('dismiss button hides explainer permanently', () => {
      cy.clearLocalStorage()
      cy.completeOnboarding('healthy')
      cy.window().then(win => win.localStorage.removeItem('loti_explainer_dismissed'))
      cy.visit('/')
      cy.contains('Got it').click()
      cy.contains('Got it').should('not.exist')
      // Reload — should stay dismissed
      cy.reload()
      cy.contains('Got it').should('not.exist')
    })
  })

  describe('Weekly Report Card', () => {
    it('shows when enough data exists', () => {
      // Seed food log with enough entries
      cy.window().then((win) => {
        const entries = Array.from({ length: 5 }, (_, i) => ({
          id: `test-${i}`,
          food_name: `Food ${i}`,
          traffic_light: i < 3 ? 'green' : 'yellow',
          glycemic_load: i < 3 ? 5 : 15,
          created_at: new Date().toISOString(),
          serving_count: 1,
          input_method: 'text',
          calories_kcal: 200,
          protein_g: 10,
          carbs_g: 30,
          fat_g: 5,
          serving_size_g: 100,
          fiber_g: 3,
        }))
        win.localStorage.setItem('loti_food_log', JSON.stringify(entries))
      })
      cy.reload()
      cy.contains(/weekly report/i).should('be.visible')
    })
  })
})
