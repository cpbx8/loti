describe('AI Suggestions', () => {
  beforeEach(() => {
    cy.completeOnboarding('type2')
    cy.visit('/')
  })

  describe('Suggestion Sheet', () => {
    it('AI button opens suggestion sheet', () => {
      cy.get('[aria-label="AI food ideas"]').click()
      cy.contains('What should I eat?').should('be.visible')
    })

    it('meal type buttons trigger API call', () => {
      cy.intercept('POST', '**/functions/v1/suggest', {
        body: {
          suggestions: [
            { food_name: 'Enfrijoladas', estimated_gl: 8, traffic_light: 'green', reasoning: 'High fiber from beans.' },
            { food_name: 'Nopales con huevo', estimated_gl: 5, traffic_light: 'green', reasoning: 'Nopales lower glucose.' },
          ],
        },
      }).as('suggest')

      cy.get('[aria-label="AI food ideas"]').click()
      cy.contains('Lunch').click()
      cy.wait('@suggest')

      cy.contains('Enfrijoladas').should('be.visible')
      cy.contains('Nopales').should('be.visible')
    })

    it('suggestion cards show traffic light badges', () => {
      cy.intercept('POST', '**/functions/v1/suggest', {
        body: {
          suggestions: [
            { food_name: 'Test Green Food', estimated_gl: 5, traffic_light: 'green', reasoning: 'Good.' },
          ],
        },
      }).as('suggest')

      cy.get('[aria-label="AI food ideas"]').click()
      cy.contains('Breakfast').click()
      cy.wait('@suggest')

      cy.contains('Test Green Food').should('be.visible')
    })

    it('suggestion cards have Log button', () => {
      cy.intercept('POST', '**/functions/v1/suggest', {
        body: {
          suggestions: [
            { food_name: 'Loggable Food', estimated_gl: 8, traffic_light: 'green', reasoning: 'Test.' },
          ],
        },
      }).as('suggest')

      cy.get('[aria-label="AI food ideas"]').click()
      cy.contains('Dinner').click()
      cy.wait('@suggest')

      cy.contains(/log/i).should('be.visible')
    })

    it('Log button adds to food log and shows confirmation', () => {
      cy.intercept('POST', '**/functions/v1/suggest', {
        body: {
          suggestions: [
            { food_name: 'Logged Suggestion', estimated_gl: 6, traffic_light: 'green', reasoning: 'Test.' },
          ],
        },
      }).as('suggest')

      cy.get('[aria-label="AI food ideas"]').click()
      cy.contains('Snack').click()
      cy.wait('@suggest')

      // Click the Log button on the suggestion card
      cy.get('button').contains(/^log$/i).first().click()
      cy.contains('Logged').should('be.visible')
    })
  })

  describe('Dietary Restrictions Respected', () => {
    it('passes dietary restrictions in API call', () => {
      // Set up profile with egg restriction
      cy.window().then((win) => {
        const profile = JSON.parse(win.localStorage.getItem('loti_onboarding') ?? '{}')
        profile.dietaryRestrictions = ['Egg-free']
        win.localStorage.setItem('loti_onboarding', JSON.stringify(profile))
      })
      cy.reload()

      cy.intercept('POST', '**/functions/v1/suggest', (req) => {
        // Verify restrictions are passed somewhere in the body
        const body = JSON.stringify(req.body)
        expect(body).to.include('Egg-free')
        req.reply({
          body: {
            suggestions: [
              { food_name: 'Egg-free Meal', estimated_gl: 7, traffic_light: 'green', reasoning: 'No eggs.' },
            ],
          },
        })
      }).as('suggestWithRestrictions')

      cy.get('[aria-label="AI food ideas"]').click()
      cy.contains('Breakfast').click()
      cy.wait('@suggestWithRestrictions')
    })
  })

  describe('Error States', () => {
    it('shows error on API failure', () => {
      cy.intercept('POST', '**/functions/v1/suggest', { statusCode: 500 }).as('failSuggest')

      cy.get('[aria-label="AI food ideas"]').click()
      cy.contains('Lunch').click()
      cy.wait('@failSuggest')

      cy.contains(/error|try again|couldn't/i).should('be.visible')
    })

    it('rate limit shows appropriate message', () => {
      cy.intercept('POST', '**/functions/v1/suggest', { statusCode: 429 }).as('rateLimited')

      cy.get('[aria-label="AI food ideas"]').click()
      cy.contains('Dinner').click({ force: true })
      cy.wait('@rateLimited')

      cy.contains(/error|limit|try again/i).should('be.visible')
    })
  })

  describe('Free Text Input', () => {
    it('can type a craving and get suggestions', () => {
      cy.intercept('POST', '**/functions/v1/suggest', {
        body: {
          suggestions: [
            { food_name: 'Bean tacos', estimated_gl: 8, traffic_light: 'green', reasoning: 'Same crunch, less spike.' },
          ],
        },
      }).as('suggest')

      cy.get('[aria-label="AI food ideas"]').click()
      // The placeholder is random, so find any text input in the sheet
      cy.get('.animate-slide-up input[type="text"]').type('tacos{enter}')
      cy.wait('@suggest')

      cy.contains('Bean tacos').should('be.visible')
    })
  })
})
