// spec: specs/students.plan.md
// seed: tests/seed-authenticated.spec.ts

import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'
import { env } from '../../support/env'

test.describe('Adding a student', () => {
  test('Invalid email, phone and negative rate are rejected', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.login(env.username, env.password)
    await expect(page).toHaveURL(/\/dashboard$/)

    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const name = `E2E-Invalid-${unique}`

    // 1. Fill name, grade, guardian, then invalid email, phone and negative rate, and submit
    await page.goto('/students/new')
    await page.getByTestId('student-fullName').fill(name)
    await page.getByTestId('student-grade').selectOption('Grade 3')
    await page.getByTestId('student-guardianName').fill('E2E Guardian')
    await page.getByTestId('student-email').fill('not-an-email')
    await page.getByTestId('student-primaryContact').fill('abc')
    await page.getByTestId('student-perClassRate').fill('-5')
    await page.getByTestId('student-submit').click()
    await expect(page.getByTestId('error-email')).toHaveText('Must be a valid email')
    await expect(page.getByTestId('error-primaryContact')).toHaveText('Must be a valid phone number')
    await expect(page.getByTestId('error-perClassRate')).toHaveText('Cannot be negative')
    await expect(page).toHaveURL(/\/students\/new$/)

    // 2. Correct the three fields and submit
    await page.getByTestId('student-email').fill(`e2e-${unique}@example.invalid`)
    await page.getByTestId('student-primaryContact').fill('555-010-0104')
    await page.getByTestId('student-perClassRate').fill('10')
    await page.getByTestId('student-submit').click()
    await expect(page).toHaveURL(/\/students\/\d+$/)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  })
})
