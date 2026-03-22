describe('7-Eleven Guide', () => {
  beforeEach(() => {
    cy.completeOnboarding('healthy')
    cy.visit('/store-guide/seven_eleven')
  })

  describe('Guide Screen Layout', () => {
    it('shows 7-Eleven branded header', () => {
      cy.contains('7-Eleven').should('be.visible')
      cy.contains('Guide').should('be.visible')
    })

    it('loads products from seed data', () => {
      cy.contains(/\d+ products/).should('be.visible')
    })

    it('has search bar', () => {
      cy.get('input[placeholder*="Search"]').should('be.visible')
    })

    it('has traffic light filter tabs', () => {
      cy.contains('All').should('be.visible')
    })
  })

  describe('Products', () => {
    it('shows product entries', () => {
      // Should have at least some products
      cy.get('.flex-1.overflow-y-auto').should('exist')
    })

    it('product detail opens on tap', () => {
      cy.get('.flex-1.overflow-y-auto button').first().click()
      cy.contains(/gl|glycemic/i).should('be.visible')
    })
  })
})
