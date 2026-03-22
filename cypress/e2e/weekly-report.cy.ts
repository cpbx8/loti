describe('Weekly Report', () => {
  beforeEach(() => {
    cy.completeOnboarding('healthy')
  })

  function seedWeekOfData() {
    cy.window().then((win) => {
      const entries = []
      for (let d = 0; d < 7; d++) {
        const date = new Date()
        date.setDate(date.getDate() - d)
        for (let m = 0; m < 3; m++) {
          const isGreen = Math.random() > 0.3
          entries.push({
            id: `week-${d}-${m}`,
            food_name: isGreen ? `Green Food ${d}-${m}` : `Red Food ${d}-${m}`,
            traffic_light: isGreen ? 'green' : 'red',
            glycemic_load: isGreen ? 5 : 25,
            glycemic_index: isGreen ? 30 : 75,
            created_at: date.toISOString(),
            serving_count: 1,
            input_method: 'text',
            calories_kcal: isGreen ? 150 : 350,
            protein_g: isGreen ? 10 : 5,
            carbs_g: isGreen ? 20 : 50,
            fat_g: isGreen ? 3 : 12,
            serving_size_g: 100,
            fiber_g: isGreen ? 6 : 1,
          })
        }
      }
      win.localStorage.setItem('loti_food_log', JSON.stringify(entries))
    })
  }

  describe('Weekly Report Screen', () => {
    beforeEach(() => {
      seedWeekOfData()
      cy.visit('/weekly-report')
    })

    it('shows weekly report heading', () => {
      cy.contains(/weekly report|this week/i).should('be.visible')
    })

    it('shows green percentage with progress ring', () => {
      cy.contains(/%/).should('be.visible')
    })

    it('shows streak count', () => {
      cy.contains(/streak/i).should('be.visible')
    })

    it('shows top foods section', () => {
      cy.contains(/best choices|top foods|most logged/i).should('be.visible')
    })

    it('shows macro averages', () => {
      cy.contains(/calories|carbs|protein/i).should('be.visible')
    })

    it('back button returns to dashboard', () => {
      // Visit dashboard first so navigate(-1) has history
      cy.visit('/')
      cy.visit('/weekly-report')
      cy.get('[aria-label="Go back"]').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })

  describe('Dashboard Integration', () => {
    it('weekly report card appears on dashboard with enough data', () => {
      seedWeekOfData()
      cy.visit('/')
      cy.contains(/weekly report is ready/i).should('be.visible')
    })

    it('tapping report card navigates to /weekly-report', () => {
      seedWeekOfData()
      cy.visit('/')
      cy.contains(/weekly report is ready/i).click()
      cy.url().should('include', '/weekly-report')
    })
  })
})
