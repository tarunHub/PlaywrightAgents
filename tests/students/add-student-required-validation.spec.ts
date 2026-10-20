// spec: specs/students.plan.md
// seed: tests/seed-authenticated.spec.ts

import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'
import { env } from '../../support/env'

test.describe('Adding a student', () => {
  test('Required-field validation on an empty form', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.login(env.username, env.password)
    await expect(page).toHaveURL(/\/dashboard$/)

    const name = `E2E-Req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // 1. Open `/students/new` and click `student-submit` without entering anything
    await page.goto('/students/new')
    await page.getByTestId('student-submit').click()
    await expect(page.getByTestId('error-fullName')).toHaveText('Full name is required')
    await expect(page.getByTestId('error-grade')).toHaveText('Grade is required')
    await expect(page.getByTestId('error-guardianName')).toHaveText('Guardian name is required')
    await expect(page).toHaveURL(/\/students\/new$/)

    // 2. Fill the three required fields with valid values and submit
    await page.getByTestId('student-fullName').fill(name)
    await page.getByTestId('student-grade').selectOption('Grade 3')
    await page.getByTestId('student-guardianName').fill('E2E Guardian')
    await page.getByTestId('student-submit').click()

    await expect(page).toHaveURL(/\/students\/\d+$/)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    await expect(page.getByTestId('error-fullName')).toHaveCount(0)
    await expect(page.getByTestId('error-grade')).toHaveCount(0)
    await expect(page.getByTestId('error-guardianName')).toHaveCount(0)
  })
})
