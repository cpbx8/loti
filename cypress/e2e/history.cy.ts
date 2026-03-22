describe('History Screen', () => {
  beforeEach(() => {
    cy.completeOnboarding('healthy')
  })

  describe('Empty State', () => {
    it('shows empty state when no scan history', () => {
      cy.visit('/history')
      cy.contains(/history|no scans|start scanning/i).should('be.visible')
    })
  })

  describe('With Data', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        const today = new Date()
        const yesterday = new Date()
        yesterday.setDate(today.getDate() - 1)

        const entries = [
          { id: 'h1', food_name: 'Black Beans', traffic_light: 'green', glycemic_load: 5, created_at: today.toISOString(), serving_count: 1, input_method: 'text', calories_kcal: 132, protein_g: 8.9, carbs_g: 23.7, fat_g: 0.5, serving_size_g: 100, fiber_g: 8.7 },
          { id: 'h2', food_name: 'White Rice', traffic_light: 'red', glycemic_load: 26, created_at: today.toISOString(), serving_count: 1, input_method: 'photo_scan', calories_kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, serving_size_g: 100, fiber_g: 0.4 },
          { id: 'h3', food_name: 'Tortilla', traffic_light: 'yellow', glycemic_load: 15, created_at: yesterday.toISOString(), serving_count: 1, input_method: 'barcode', calories_kcal: 150, protein_g: 4, carbs_g: 26, fat_g: 3.5, serving_size_g: 50, fiber_g: 1.5 },
        ]
        win.localStorage.setItem('loti_food_log', JSON.stringify(entries))
      })
      cy.visit('/history')
    })

    it('shows weekly GI breakdown', () => {
      cy.contains(/this week|weekly/i).should('be.visible')
    })

    it('shows traffic light counts', () => {
      // Should show green/yellow/red counts
      cy.contains(/green|yellow|red/i).should('be.visible')
    })

    it('shows daily breakdown', () => {
      cy.contains(/today|yesterday/i).should('be.visible')
    })

    it('back button returns to dashboard', () => {
      cy.contains('Back').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })
})
