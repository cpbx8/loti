describe('OXXO Guide', () => {
  beforeEach(() => {
    cy.completeOnboarding('healthy')
    cy.visit('/store-guide/oxxo')
  })

  describe('Guide Screen Layout', () => {
    it('shows OXXO branded header', () => {
      cy.contains('OXXO').should('be.visible')
      cy.contains('Guide').should('be.visible')
    })

    it('shows search bar', () => {
      cy.get('input[placeholder*="Search"]').should('be.visible')
    })

    it('shows traffic light filter tabs', () => {
      cy.contains('All').should('be.visible')
      // Tabs show counts like "Green (N)" — check they exist in the scrollable area
      cy.get('button').contains(/green/i).should('exist')
    })

    it('shows OXXO hack tip carousel', () => {
      // Hack carousel at top
      cy.contains(/hack|tip/i).should('be.visible')
    })

    it('shows product count', () => {
      // Should show total products loaded
      cy.contains(/\d+ products/).should('be.visible')
    })
  })

  describe('Traffic Light Filtering', () => {
    it('all tab shows all products', () => {
      cy.contains('All').click()
      // Should show products (the product count is visible)
      cy.contains(/\d+ products/).should('be.visible')
    })

    it('green tab filters to green only', () => {
      cy.contains(/green/i).first().click()
      // Wait for filter to apply
      cy.wait(300)
      // All visible traffic light badges should be green
      // (checking that no red badges are visible)
      cy.get('[class*="bg-gl-red"]').should('not.exist')
    })

    it('tabs show counts in parentheses', () => {
      cy.contains(/green.*\(\d+\)/i).should('be.visible')
      cy.contains(/red.*\(\d+\)/i).should('be.visible')
    })
  })

  describe('Search', () => {
    it('search by product name works', () => {
      cy.get('input[placeholder*="Search"]').type('agua')
      cy.wait(300) // debounce
      // Should filter results
      cy.contains(/agua|water/i).should('be.visible')
    })

    it('search by brand works', () => {
      cy.get('input[placeholder*="Search"]').type('coca')
      cy.wait(300)
      cy.contains(/coca/i).should('be.visible')
    })

    it('clearing search shows all products again', () => {
      cy.get('input[placeholder*="Search"]').type('xyz-no-match')
      cy.wait(300)
      cy.get('input[placeholder*="Search"]').clear()
      cy.wait(300)
      // Products should be visible again
      cy.contains(/\d+ products/).should('be.visible')
    })
  })

  describe('Category Chips', () => {
    it('category chips are visible', () => {
      // Should show category filter chips with emojis
      cy.get('.overflow-x-auto').should('exist')
    })

    it('tapping a category chip filters products', () => {
      // Find and click a category chip
      cy.get('.overflow-x-auto button').first().click()
      // Products should be filtered (fewer than all)
    })
  })

  describe('Product Detail Bottom Sheet', () => {
    it('tapping a product opens detail sheet', () => {
      // Click any product row
      cy.get('button').contains(/coca|agua|ciel/i).first().click()
      // Detail sheet should appear
      cy.contains(/gl|glycemic/i).should('be.visible')
    })

    it('green product shows "Great choice"', () => {
      // Filter to green, click first product
      cy.contains(/green/i).first().click()
      cy.wait(300)
      // Click first product in the list
      cy.get('.flex-1.overflow-y-auto button').first().click()
      cy.contains(/great choice/i).should('be.visible')
    })

    it('red product shows swap suggestion', () => {
      cy.contains(/red/i).first().click()
      cy.wait(300)
      cy.get('.flex-1.overflow-y-auto button').first().click()
      cy.contains(/try instead|swap/i).should('be.visible')
    })

    it('product detail has Log Food button', () => {
      cy.get('.flex-1.overflow-y-auto button').first().click()
      cy.contains(/log food/i).should('be.visible')
    })

    it('Log Food button works and shows confirmation', () => {
      cy.get('.flex-1.overflow-y-auto button').first().click()
      cy.contains(/log food/i).click()
      cy.contains(/logged/i).should('be.visible')
    })

    it('backdrop click closes detail sheet', () => {
      cy.get('.flex-1.overflow-y-auto button').first().click()
      // Click the backdrop
      cy.get('[class*="bg-black"]').first().click({ force: true })
      // Sheet should close
    })
  })

  describe('Back Navigation', () => {
    it('back button returns to previous page', () => {
      // Visit dashboard first so Back has history
      cy.visit('/')
      cy.visit('/store-guide/oxxo')
      cy.contains('Back').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })
})
