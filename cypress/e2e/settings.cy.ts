describe('Settings Screen', () => {
  beforeEach(() => {
    cy.completeOnboarding('type2')
    cy.visit('/settings')
  })

  describe('Layout', () => {
    it('shows Settings header with back button', () => {
      cy.contains('Settings').should('be.visible')
      cy.get('[aria-label="Go back"]').should('be.visible')
    })

    it('shows Health Profile section with A1C', () => {
      cy.contains('Health Profile').should('be.visible')
      cy.contains('A1C').should('be.visible')
    })

    it('shows About You section', () => {
      cy.contains('About You').should('be.visible')
    })

    it('shows Dietary Restrictions section', () => {
      cy.contains('Dietary Restrictions').should('be.visible')
    })

    it('shows disclaimer', () => {
      cy.contains('informational purposes only').should('be.visible')
    })
  })

  describe('A1C Editing', () => {
    it('tapping A1C opens edit modal', () => {
      cy.contains('A1C').click()
      cy.contains('Update A1C').should('be.visible')
    })

    it('can update A1C value', () => {
      cy.contains('A1C').click()
      cy.get('input[type="number"]').clear().type('8.5')
      cy.contains('Save').click()
      cy.contains('8.5%').should('be.visible')
    })

    it('shows range label for entered A1C', () => {
      cy.contains('A1C').click()
      cy.get('input[type="number"]').clear().type('6.0')
      cy.contains('Prediabetic range').should('be.visible')
    })
  })

  describe('Activity Level Editing', () => {
    it('tapping activity level opens editor', () => {
      cy.contains('Activity Level').click()
      cy.contains('Sedentary').should('be.visible')
      cy.contains('Lightly active').should('be.visible')
      cy.contains('Moderately active').should('be.visible')
      cy.contains('Very active').should('be.visible')
    })

    it('can change activity level', () => {
      cy.contains('Activity Level').click()
      cy.contains('Very active').click()
      cy.contains('Very active').should('be.visible')
    })
  })

  describe('Dietary Restrictions', () => {
    it('edit button toggles editor mode', () => {
      cy.contains('Dietary Restrictions').parent().contains('Edit').click()
      // Should show all dietary options as chips
      cy.contains('Vegetarian').should('be.visible')
      cy.contains('Vegan').should('be.visible')
      cy.contains('Gluten-free').should('be.visible')
    })

    it('can add a dietary restriction', () => {
      cy.contains('Dietary Restrictions').parent().contains('Edit').click()
      cy.contains('Vegetarian').click()
      cy.contains('Done').click()
      cy.contains('Vegetarian').should('be.visible')
    })

    it('can remove a dietary restriction', () => {
      // First add one
      cy.contains('Dietary Restrictions').parent().contains('Edit').click()
      cy.contains('Keto').click()
      cy.contains('Done').click()
      cy.contains('Keto').should('be.visible')
      // Now remove it
      cy.contains('Dietary Restrictions').parent().contains('Edit').click()
      cy.contains('Keto').click()
      cy.contains('Done').click()
    })

    it('shows helper text about AI respecting restrictions', () => {
      cy.contains('AI suggestions').should('be.visible')
    })
  })

  describe('Actions', () => {
    it('redo onboarding button exists', () => {
      cy.contains('Redo Onboarding').should('be.visible')
    })

    it('clear data button exists with confirmation', () => {
      cy.contains('Clear All Data').click()
      cy.contains('Reset Everything').should('be.visible')
      cy.contains('Cancel').should('be.visible')
    })

    it('cancel dismisses confirmation modal', () => {
      cy.contains('Clear All Data').click()
      cy.contains('Cancel').click()
      cy.contains('Reset Everything').should('not.exist')
    })
  })

  describe('Persistence', () => {
    it('changes persist after navigating away and back', () => {
      // Edit A1C
      cy.contains('A1C').click()
      cy.get('input[type="number"]').clear().type('9.1')
      cy.contains('Save').click()
      // Navigate away
      cy.get('[aria-label="Go back"]').click()
      // Come back
      cy.visit('/settings')
      cy.contains('9.1%').should('be.visible')
    })
  })
})
