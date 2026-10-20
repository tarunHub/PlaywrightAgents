// spec: specs/students.plan.md
// seed: tests/seed-authenticated.spec.ts

import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'
import { env } from '../../support/env'

test.describe('Adding a student', () => {
  test('Whitespace-only full name is rejected', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.login(env.username, env.password)
    await expect(page).toHaveURL(/\/dashboard$/)

    // 1. Open `/students/new`, enter three spaces as name, choose a grade, enter guardian and submit
    await page.goto('/students/new')
    await page.getByTestId('student-fullName').fill('   ')
    await page.getByTestId('student-grade').selectOption('Grade 3')
    await page.getByTestId('student-guardianName').fill('E2E Guardian')
    await page.getByTestId('student-submit').click()
    await expect(page.getByTestId('error-fullName')).toHaveText('Full name is required')
    await expect(page).toHaveURL(/\/students\/new$/)
  })
})
