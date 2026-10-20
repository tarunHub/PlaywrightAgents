// spec: specs/students.plan.md
// seed: tests/seed-authenticated.spec.ts

import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'
import { env } from '../../support/env'

test.describe('Adding a student', () => {
  test('Add a student with all optional fields and find it in the list', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.login(env.username, env.password)
    await expect(page).toHaveURL(/\/dashboard$/)

    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const name = `E2E-Full-${unique}`
    const email = `e2e-${unique}@example.invalid`

    // 1. Open `/students/new` and fill every field, keep SMS opt-in unchecked, click `student-submit`
    await page.goto('/students/new')
    await page.getByTestId('student-fullName').fill(name)
    await page.getByTestId('student-dateOfBirth').fill('2015-05-05')
    await page.getByTestId('student-grade').selectOption('Grade 4')
    await page.getByTestId('student-school').fill('E2E School')
    await page.getByTestId('student-subjectsText').fill('Maths')
    await page.getByTestId('student-address').fill('E2E Street')
    await page.getByTestId('student-guardianName').fill('E2E Guardian')
    await page.getByTestId('student-email').fill(email)
    await page.getByTestId('student-primaryContact').fill('555-010-0101')
    await page.getByTestId('student-alternateContact').fill('555-010-0102')
    await expect(page.getByTestId('student-sms-opt-in')).not.toBeChecked()
    await page.getByTestId('student-emergencyContactName').fill('E2E Emergency')
    await page.getByTestId('student-emergencyContactPhone').fill('555-010-0103')
    await page.getByTestId('student-classGroupId').selectOption({ label: 'Batch1' })
    await page.getByTestId('student-perClassRate').fill('12.50')
    await page.getByTestId('student-notes').fill('E2E notes')
    await page.getByTestId('student-submit').click()

    await expect(page).toHaveURL(/\/students\/\d+$/)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    const code = (await page.getByTestId('student-code').textContent())?.trim() ?? ''
    expect(code).toMatch(/^SS\d+$/)
    const field = (label: string) =>
      page.getByRole('term').filter({ hasText: new RegExp(`^${label}$`) }).locator('..')
    await expect(field('Date of birth')).toContainText('May 5, 2015')
    await expect(field('Grade')).toContainText('Grade 4')
    await expect(field('School')).toContainText('E2E School')
    await expect(field('Subjects')).toContainText('Maths')
    await expect(field('Address')).toContainText('E2E Street')
    await expect(field('Guardian')).toContainText('E2E Guardian')
    await expect(field('Email')).toContainText(email)
    await expect(field('Primary contact')).toContainText('555-010-0101')
    await expect(field('SMS reminders')).toContainText('No')
    await expect(field('Alternate contact')).toContainText('555-010-0102')
    await expect(field('Emergency contact')).toContainText('E2E Emergency')
    await expect(field('Emergency phone')).toContainText('555-010-0103')
    await expect(field('Class group')).toContainText('Batch1')
    await expect(field('Per-class rate')).toContainText('$12.50')
    await expect(field('Status')).toContainText('Active')
    await expect(page.getByText('E2E notes', { exact: true })).toBeVisible()

    // 2. Open `/students`, type the unique name in `table-search`
    await page.goto('/students')
    await page.getByTestId('table-search').fill(name)
    const row = page.getByTestId(`student-row-${code}`)
    await expect(row).toBeVisible()
    await expect(row).toContainText(name)
    await expect(row).toContainText('Grade 4')
    await expect(row).toContainText('Batch1')
    await expect(row).toContainText('E2E Guardian')
    await expect(row).toContainText('555-010-0101')
    await expect(row).toContainText(email)
    await expect(row).toContainText('$12.50')
    await expect(row).toContainText('Active')
  })
})
