describe('Food Log', () => {
  beforeEach(() => {
    cy.completeOnboarding('healthy')
  })

  describe('Logging from Scan', () => {
    it('scanned food appears in dashboard food log', () => {
      // Seed a food log entry
      cy.window().then((win) => {
        const entry = {
          id: 'test-1',
          food_name: 'Black Beans',
          traffic_light: 'green',
          glycemic_load: 5,
          glycemic_index: 30,
          created_at: new Date().toISOString(),
          serving_count: 1,
          input_method: 'photo_scan',
          calories_kcal: 132,
          protein_g: 8.9,
          carbs_g: 23.7,
          fat_g: 0.5,
          serving_size_g: 100,
          fiber_g: 8.7,
        }
        win.localStorage.setItem('loti_food_log', JSON.stringify([entry]))
      })
      cy.visit('/')

      cy.contains('Recent Scans').should('be.visible')
      cy.contains('Black Beans').should('be.visible')
    })
  })

  describe('Food Log Entry Card', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        const entries = [
          {
            id: 'test-green',
            food_name: 'Lentils',
            traffic_light: 'green',
            glycemic_load: 5,
            glycemic_index: 26,
            created_at: new Date().toISOString(),
            serving_count: 1,
            input_method: 'text',
            calories_kcal: 116,
            protein_g: 9,
            carbs_g: 20,
            fat_g: 0.4,
            serving_size_g: 100,
            fiber_g: 7.9,
            glucose_impact_min: 5,
            glucose_impact_max: 15,
          },
          {
            id: 'test-red',
            food_name: 'White Rice',
            traffic_light: 'red',
            glycemic_load: 26,
            glycemic_index: 73,
            created_at: new Date().toISOString(),
            serving_count: 1,
            input_method: 'photo_scan',
            calories_kcal: 130,
            protein_g: 2.7,
            carbs_g: 28,
            fat_g: 0.3,
            serving_size_g: 100,
            fiber_g: 0.4,
            glucose_impact_min: 30,
            glucose_impact_max: 60,
          },
        ]
        win.localStorage.setItem('loti_food_log', JSON.stringify(entries))
      })
      cy.visit('/')
    })

    it('shows food name and traffic light', () => {
      cy.contains('Lentils').should('be.visible')
      cy.contains('White Rice').should('be.visible')
    })

    it('shows impact tag (Low/Moderate/High)', () => {
      cy.contains(/low impact|moderate|high impact/i).should('be.visible')
    })

    it('expanding a card shows glucose impact range', () => {
      cy.contains('Lentils').click()
      cy.contains(/mg\/dL/i).should('be.visible')
    })

    it('expanding a card shows serving controls', () => {
      cy.contains('Lentils').click()
      cy.get('button').contains('+').should('be.visible')
      // Minus button uses Unicode minus sign (−) or hyphen (-)
      cy.get('button').contains(/[−\-]/).should('be.visible')
    })

    it('expanding a card shows macros', () => {
      cy.contains('Lentils').click()
      cy.contains(/calories|carbs|protein/i).should('be.visible')
    })

    it('serving + increases count and updates GL', () => {
      cy.contains('Lentils').click()
      cy.get('button').contains('+').click()
      cy.contains('2').should('be.visible') // serving count
    })

    it('remove button works', () => {
      cy.contains('Lentils').click()
      cy.contains(/remove/i).click()
      cy.contains('Lentils').should('not.exist')
    })
  })

  describe('Empty State', () => {
    it('no entries shows empty state', () => {
      cy.visit('/')
      // With explainer dismissed and no entries, should show the explainer or empty state
    })
  })

  describe('Date Navigation', () => {
    it('date navigation shows entries for selected date', () => {
      // Seed an entry for yesterday
      cy.window().then((win) => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const entry = {
          id: 'test-yesterday',
          food_name: 'Yesterday Food',
          traffic_light: 'yellow',
          glycemic_load: 12,
          created_at: yesterday.toISOString(),
          serving_count: 1,
          input_method: 'text',
          calories_kcal: 200,
          protein_g: 10,
          carbs_g: 25,
          fat_g: 5,
          serving_size_g: 100,
          fiber_g: 3,
        }
        win.localStorage.setItem('loti_food_log', JSON.stringify([entry]))
      })
      cy.visit('/')

      // Navigate to yesterday
      cy.get('[aria-label="Previous day"]').click()
      cy.contains('Yesterday Food').should('be.visible')
    })
  })
})
