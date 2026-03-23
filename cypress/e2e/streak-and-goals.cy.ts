describe('Streaks & Glucose Goals', () => {
  beforeEach(() => {
    cy.completeOnboarding('healthy')
  })

  describe('Streak Badge', () => {
    it('shows streak badge when user has consecutive logging days', () => {
      // Seed entries for today and yesterday
      cy.window().then((win) => {
        const today = new Date()
        const yesterday = new Date()
        yesterday.setDate(today.getDate() - 1)

        const entries = [
          {
            id: 'today-1',
            food_name: 'Today Food',
            traffic_light: 'green',
            glycemic_load: 5,
            created_at: today.toISOString(),
            serving_count: 1,
            input_method: 'text',
            calories_kcal: 100,
            protein_g: 5,
            carbs_g: 15,
            fat_g: 2,
            serving_size_g: 100,
            fiber_g: 3,
          },
          {
            id: 'yesterday-1',
            food_name: 'Yesterday Food',
            traffic_light: 'yellow',
            glycemic_load: 12,
            created_at: yesterday.toISOString(),
            serving_count: 1,
            input_method: 'text',
            calories_kcal: 200,
            protein_g: 8,
            carbs_g: 25,
            fat_g: 5,
            serving_size_g: 100,
            fiber_g: 4,
          },
        ]
        win.localStorage.setItem('loti_food_log', JSON.stringify(entries))
      })
      cy.visit('/')

      // Streak badge should show 2 days
      cy.contains(/2 day/i).should('be.visible')
    })

    it('no entries shows start message', () => {
      cy.visit('/')
      cy.contains(/start your streak|comienza tu racha/i).should('be.visible')
    })

    it('shows milestone celebration at 7-day streak', () => {
      cy.window().then((win) => {
        const entries: any[] = []
        for (let i = 0; i < 7; i++) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          entries.push({
            id: `streak-${i}`,
            food_name: `Day ${i} Food`,
            traffic_light: 'green',
            glycemic_load: 5,
            created_at: d.toISOString(),
            serving_count: 1,
            input_method: 'text',
            calories_kcal: 100,
            protein_g: 5,
            carbs_g: 15,
            fat_g: 2,
            serving_size_g: 100,
            fiber_g: 3,
          })
        }
        win.localStorage.setItem('loti_food_log', JSON.stringify(entries))
      })
      cy.visit('/')
      cy.contains(/1 week|1 semana/i).should('be.visible')
    })
  })

  describe('Today Summary Bar', () => {
    it('shows green percentage goal', () => {
      cy.window().then((win) => {
        const entries = [
          { id: 't1', food_name: 'Green 1', traffic_light: 'green', glycemic_load: 5, created_at: new Date().toISOString(), serving_count: 1, input_method: 'text', calories_kcal: 100, protein_g: 5, carbs_g: 15, fat_g: 2, serving_size_g: 100, fiber_g: 3 },
          { id: 't2', food_name: 'Green 2', traffic_light: 'green', glycemic_load: 4, created_at: new Date().toISOString(), serving_count: 1, input_method: 'text', calories_kcal: 100, protein_g: 5, carbs_g: 15, fat_g: 2, serving_size_g: 100, fiber_g: 3 },
          { id: 't3', food_name: 'Red 1', traffic_light: 'red', glycemic_load: 25, created_at: new Date().toISOString(), serving_count: 1, input_method: 'text', calories_kcal: 300, protein_g: 3, carbs_g: 45, fat_g: 8, serving_size_g: 100, fiber_g: 1 },
        ]
        win.localStorage.setItem('loti_food_log', JSON.stringify(entries))
      })
      cy.visit('/')

      // Should show green percentage (2/3 = 67%)
      cy.contains(/67%|2\/3/i).should('be.visible')
    })
  })
})
