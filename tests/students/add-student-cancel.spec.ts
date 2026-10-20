// spec: specs/students.plan.md
// seed: tests/seed-authenticated.spec.ts

import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'
import { env } from '../../support/env'

test.describe('Adding a student', () => {
  test('Cancel on the create form creates nothing', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.login(env.username, env.password)
    await expect(page).toHaveURL(/\/dashboard$/)

    const name = `E2E-Cancel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // 1. Open `/students/new`, fill name, grade and guardian, then click the Cancel link
    await page.goto('/students/new')
    await page.getByTestId('student-fullName').fill(name)
    await page.getByTestId('student-grade').selectOption('Grade 3')
    await page.getByTestId('student-guardianName').fill('E2E Guardian')
    await page.getByRole('link', { name: 'Cancel' }).click()
    await expect(page).toHaveURL(/\/students$/)

    // 2. On `/students` set `filter-status` to All statuses and search for the unique name
    await page.getByTestId('filter-status').selectOption('')
    await page.getByTestId('table-search').fill(name)
    await expect(page.getByTestId('empty-state')).toBeVisible()
    await expect(page.getByTestId('empty-state')).toContainText('No students found')
    await expect(page.getByTestId('students-table').getByText(name)).toHaveCount(0)
  })
})
