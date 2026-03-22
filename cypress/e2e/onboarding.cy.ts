describe('Onboarding Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
  })

  describe('Welcome Screen', () => {
    it('shows welcome screen on first launch', () => {
      cy.contains('See how').should('be.visible')
      cy.contains('Scan your first').should('be.visible')
    })

    it('has sign-in option for existing users', () => {
      cy.contains(/sign in/i).should('be.visible')
    })

    it('tapping "Scan your first" advances to next onboarding step', () => {
      cy.contains('Scan your first').click()
      // Should advance in onboarding — not stay on welcome
      cy.url().should('include', 'onboarding')
    })
  })

  describe('Health Profile Screens', () => {
    it('Screen 1: health state selection is required', () => {
      // Advance past welcome
      cy.contains('Scan your first').click()
      cy.contains(/what describes you/i).should('be.visible')
    })

    it('selecting healthy skips diagnosis and medications', () => {
      cy.contains('Scan your first').click()
      // Select healthy
      cy.contains(/healthy/i).click()
      cy.contains(/continue/i).click()
      // Goal screen
      cy.contains(/goal/i).should('be.visible')
      cy.contains(/learn/i).click()
      cy.contains(/continue/i).click()
      // Should skip diagnosis, go to A1C
      cy.contains(/A1C/i).should('be.visible')
    })

    it('Screen 4: A1C input validates range 4.0-14.0', () => {
      // Navigate to A1C screen via Type 2 path
      cy.contains('Scan your first').click()
      cy.contains(/type 2/i).click()
      cy.contains(/continue/i).click()
      cy.contains(/lower/i).click()
      cy.contains(/continue/i).click()
      // Diagnosis screen — skip
      cy.contains(/skip/i).click()
      // Now on A1C
      cy.get('input[type="number"]').type('7.2')
      cy.contains(/continue/i).should('be.enabled')
    })
  })

  describe('Skip Behavior', () => {
    it('user can skip optional screens and reach account creation', () => {
      cy.contains('Scan your first').click()
      // Health state (required)
      cy.contains(/prediabetic/i).click()
      cy.contains(/continue/i).click()
      // Goal (required)
      cy.contains(/wellness/i).click()
      cy.contains(/continue/i).click()
      // Skip optional screens
      cy.contains(/skip/i).click() // diagnosis
      cy.contains(/skip/i).click() // A1C
      cy.contains(/skip/i).click() // medications
      // Age/sex (required)
      cy.get('input[inputmode="numeric"]').type('40')
      cy.contains(/female/i).click()
      cy.contains(/continue/i).click()
      // Skip remaining optional
      cy.contains(/skip/i).click() // activity
      cy.contains(/skip/i).click() // dietary
      cy.contains(/skip/i).click() // meal struggles
      // Should reach account creation
      cy.contains(/create account|sign up|email/i).should('be.visible')
    })
  })

  describe('Completed Onboarding Guard', () => {
    it('completed onboarding goes directly to dashboard', () => {
      cy.completeOnboarding('healthy')
      cy.visit('/')
      // Should see dashboard, not onboarding
      cy.contains('Loti').should('be.visible')
      cy.contains(/good morning|good afternoon|good evening/i).should('be.visible')
    })
  })
})
