// spec: specs/students.plan.md
// seed: tests/seed-authenticated.spec.ts

import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'
import { env } from '../../support/env'

function localToday() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

test.describe('Adding a student', () => {
  test('Add a student with the required fields only', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.login(env.username, env.password)
    await expect(page).toHaveURL(/\/dashboard$/)

    const name = `E2E-Add-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // 1. Open `/students` and click `add-student`
    await page.goto('/students')
    await page.getByTestId('add-student').click()
    await expect(page).toHaveURL(/\/students\/new$/)
    await expect(page.getByRole('heading', { name: 'Add student' })).toBeVisible()
    await expect(page.getByTestId('student-enrollmentDate')).toHaveValue(localToday())
    await expect(page.getByTestId('student-status')).toHaveValue('ACTIVE')
    await expect(page.getByTestId('student-perClassRate')).toHaveValue('0')
    await expect(page.getByTestId('student-sms-opt-in')).not.toBeChecked()

    // 2. Fill required fields, leave everything else default and submit
    await page.getByTestId('student-fullName').fill(name)
    await page.getByTestId('student-grade').selectOption('Grade 3')
    await page.getByTestId('student-guardianName').fill('E2E Guardian')
    await page.getByTestId('student-submit').click()

    await expect(page).toHaveURL(/\/students\/\d+$/)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    await expect(page.getByTestId('student-code')).toHaveText(/^SS\d+$/)
    const field = (label: string) =>
      page.getByRole('term').filter({ hasText: new RegExp(`^${label}$`) }).locator('..')
    await expect(field('Status')).toContainText('Active')
    await expect(field('Grade')).toContainText('Grade 3')
    await expect(field('Guardian')).toContainText('E2E Guardian')
    await expect(field('SMS reminders')).toContainText('No')
    // Plan requires $0.00; the app currently shows the grade default rate ($15.00 for Grade 3)
    await expect(field('Per-class rate')).toContainText('$0.00')
  })
})
