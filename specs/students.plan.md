# Students Test Plan

## Application Overview

Smart Start Student Portal Students area: list at `/students`, create form at `/students/new`, detail at `/students/:id`, edit form at `/students/:id/edit`. The list is a table (default filter: Status = Active, so inactive students are HIDDEN until the status filter is changed) with a debounced (~0.5-0.8s) free-text search (placeholder "Search name, ID, guardian, email"; matches name, student ID, guardian, email; case-insensitive; surrounding spaces ignored), status / grade / class-group filters, a Columns toggle and Export CSV. Students get an auto ID (SS001, SS002, ...; IDs are never reused). Client-side validation on the form: Full name, Grade and Guardian name are required; Parent email must be a valid email; Primary/Alternate/Emergency phone must be valid phone numbers; Per-class rate cannot be negative. There is NO "Deactivate" button: a student is deactivated by editing the Status select to Inactive; the detail page then shows an "Activate" button (reactivation exists, toast "Student activated"). The detail page "Delete" button opens an alert dialog; for a student with NO attendance/fee/feedback history the record is permanently deleted, and for students with history the app presumably deactivates instead (not exercised, because it needs real history data).

**Rules for every scenario**
- Data safety: the database holds the centre's real students. Every scenario creates its OWN student named `E2E-<scenario>-<Date.now()>-<random>` (use a helper such as `uniqueStudentName(prefix)` in `StudentsPage` or `support/`) as setup, and edits / searches / deactivates ONLY that student. Never edit, deactivate, delete or assert on pre-existing students.
- Scenarios must be independent and parallel-safe: assert on the scenario's own unique name (or its generated student ID, read from `student-code` on the detail page), never on total row counts, existing records or dashboard counters.
- Use obviously fake contact data only: email `e2e-<unique>@example.invalid`, phone `555-010-01xx`, guardian `E2E Guardian`. Leave "Send SMS reminders to the primary contact" (`student-sms-opt-in`) UNCHECKED (the default) in every scenario so no real SMS can ever be sent. Never use the phone numbers or emails of real students.
- Do not click "Delete" on any student except in the explicit cancel-only scenario 5.1 on the scenario's own `E2E-` student; never confirm the dialog. Students are left behind (inactive or active) with the `E2E-` prefix for manual cleanup.
- Sign in via `tests/seed-authenticated.spec.ts` style setup (admin credentials from `env` in `support/env.ts`, never hard-coded).
- Locators: prefer `getByTestId`. Search is debounced, so rely on web-first assertions (`expect(row).toBeVisible()` / `toHaveCount(0)`), never `waitForTimeout`.
- Suggested page object `pages/StudentsPage.ts` (only `pages/LoginPage.ts` exists today). Suggested members: `gotoList()`, `gotoNew()`, `search(text)`, `filterStatus(label)`, `rowByCode(code)`, `rowByName(name)` (row locator filtered by text, since rows are keyed by student ID e.g. `student-row-SS019`), `fillForm({fullName, grade, guardianName, email?, primaryContact?, perClassRate?, status?, ...})`, `submit()`, `createStudent(overrides)` returning `{name, id, code}` (id parsed from URL `/students/(\d+)`), `openEdit(id)`, `expectFieldError(field, text)`, `uniqueStudentName(prefix)`.
- Testids seen. List page: `add-student` (link to /students/new), `export-students`, `students-table`, `table-search`, `filter-status` (values '', ACTIVE, INACTIVE; default ACTIVE), `filter-grade`, `filter-group`, `column-visibility`, `student-row-<CODE>` (e.g. `student-row-SS019`), `empty-state` ("No students found" / "Try changing the filters or add a new student."). Form page (create and edit): `student-fullName`, `student-dateOfBirth`, `student-grade`, `student-school`, `student-subjectsText`, `student-address`, `student-guardianName`, `student-email`, `student-primaryContact`, `student-alternateContact`, `student-sms-opt-in`, `student-emergencyContactName`, `student-emergencyContactPhone`, `student-enrollmentDate` (defaults to today), `student-classGroupId`, `student-perClassRate` (default 0, min 0, step 0.01), `student-status` (values ACTIVE / INACTIVE), `student-notes`, `student-submit` ("Create student" on /new, "Save changes" on edit), Cancel is a link with no testid (use role link "Cancel"; on edit it goes to `/students/:id`). Field errors: `error-fullName`, `error-grade`, `error-guardianName`, `error-email`, `error-primaryContact`, `error-perClassRate` (pattern `error-<fieldName>`). Detail page: `student-code`, `edit-student`, `activate-student` (only when Inactive), `delete-student`, `tab-attendance`, `tab-fees`, `tab-feedback`; delete dialog is `role=alertdialog` with `delete-explanation` and `confirm-button`; the student's name is the page heading and the Active/Inactive badge is plain text next to the code (no testid). Success toast is a status region (e.g. "Student activated").
- Observed behaviour worth knowing: after Create the app navigates to `/students/<id>`, with no toast observed; the detail page can briefly show stale data right after saving an edit, so always use web-first assertions.

## Test Scenarios

### 1. 1. Adding a student

**Seed:** `tests/seed-authenticated.spec.ts`

#### 1.1. 1.1 Add a student with the required fields only

**File:** `tests/students/add-student.spec.ts`

**Steps:**
  1. Open `/students` and click `add-student`
    - expect: The URL changes to `/students/new` and the heading 'Add student' is visible
    - expect: `student-enrollmentDate` defaults to today, `student-status` defaults to Active, `student-perClassRate` defaults to 0, `student-sms-opt-in` is unchecked
  2. Fill `student-fullName` with a unique `E2E-Add-<timestamp>` name, select any grade in `student-grade` (e.g. Grade 3), fill `student-guardianName` with 'E2E Guardian', leave everything else default and click `student-submit`
    - expect: The URL changes to `/students/<id>`
    - expect: The heading shows the unique name, `student-code` shows an SS-prefixed ID and the status shows Active
    - expect: Grade shows the chosen grade, Guardian shows 'E2E Guardian', SMS reminders shows 'No', Per-class rate shows $0.00

#### 1.2. 1.2 Add a student with all optional fields and find it in the list

**File:** `tests/students/add-student-all-fields.spec.ts`

**Steps:**
  1. Open `/students/new` and fill every field: unique `E2E-Full-<timestamp>` name, date of birth 2015-05-05, a grade, school 'E2E School', subjects 'Maths', address 'E2E Street', guardian 'E2E Guardian', email `e2e-<unique>@example.invalid`, primary contact 555-010-0101, alternate 555-010-0102, emergency name and phone 555-010-0103, a class group, per-class rate 12.50, notes 'E2E notes'. Keep SMS opt-in UNCHECKED. Click `student-submit`
    - expect: The detail page opens and every entered value is displayed (rate as $12.50, email, contacts, class group, notes)
  2. Open `/students`, type the unique name in `table-search`
    - expect: The row containing the unique name becomes visible with grade, group, guardian, contact, email, rate $12.50 and status Active

#### 1.3. 1.3 Required-field validation on an empty form

**File:** `tests/students/add-student-required-validation.spec.ts`

**Steps:**
  1. Open `/students/new` and click `student-submit` without entering anything
    - expect: `error-fullName` shows 'Full name is required'
    - expect: `error-grade` shows 'Grade is required'
    - expect: `error-guardianName` shows 'Guardian name is required'
    - expect: The URL stays on `/students/new` and no student is created
  2. Fill the three required fields with valid values (unique `E2E-Req-<timestamp>` name) and submit
    - expect: The three errors disappear and the student is created (detail page shown)

#### 1.4. 1.4 Whitespace-only full name is rejected

**File:** `tests/students/add-student-whitespace-name.spec.ts`

**Steps:**
  1. Open `/students/new`, enter three spaces in `student-fullName`, choose a grade, enter 'E2E Guardian' as guardian and click `student-submit`
    - expect: `error-fullName` shows 'Full name is required'
    - expect: The URL stays on `/students/new`

#### 1.5. 1.5 Invalid email, phone and negative rate are rejected

**File:** `tests/students/add-student-invalid-input.spec.ts`

**Steps:**
  1. Open `/students/new`, fill a unique `E2E-Invalid-<timestamp>` name, a grade and guardian, then set `student-email` to 'not-an-email', `student-primaryContact` to 'abc', `student-perClassRate` to -5 and click `student-submit`
    - expect: `error-email` shows 'Must be a valid email' (note: an `<input type=email>` may also trigger the native browser tooltip; if the generated test sees the native validation instead, disable it by checking `validationMessage`/using `noValidate` knowledge rather than weakening the assertion)
    - expect: `error-primaryContact` shows 'Must be a valid phone number'
    - expect: `error-perClassRate` shows 'Cannot be negative'
    - expect: The URL stays on `/students/new`
  2. Correct the three fields to `e2e-<unique>@example.invalid`, 555-010-0104 and 10 and submit
    - expect: The student is created and the detail page is shown

#### 1.6. 1.6 Cancel on the create form creates nothing

**File:** `tests/students/add-student-cancel.spec.ts`

**Steps:**
  1. Open `/students/new`, fill a unique `E2E-Cancel-<timestamp>` name, a grade and guardian, then click the Cancel link
    - expect: The user leaves the form (back to the list or previous page)
  2. On `/students` set `filter-status` to All statuses and search for the unique name
    - expect: `empty-state` ('No students found') is shown; no row contains the unique name

### 2. 2. Editing a student

**Seed:** `tests/seed-authenticated.spec.ts`

#### 2.1. 2.1 Edit name and school of an own student

**File:** `tests/students/edit-student.spec.ts`

**Steps:**
  1. Setup: create an `E2E-Edit-<timestamp>` student via the form (required fields only, fake data). On its detail page click `edit-student`
    - expect: URL is `/students/<id>/edit`, heading 'Edit <name>', `student-fullName` is prefilled with the name, `student-submit` reads 'Save changes'
  2. Change `student-fullName` to '<name>-Edited', set `student-school` to 'E2E School', set `student-perClassRate` to 15 and click `student-submit`
    - expect: The URL returns to `/students/<id>`
    - expect: The heading shows '<name>-Edited', School shows 'E2E School', Per-class rate shows $15.00 (use web-first assertions; data may refresh a moment after navigation)
  3. Open `/students` and search for '<name>-Edited'
    - expect: The row with the new name is visible; searching the old name alone still matches it as a prefix

#### 2.2. 2.2 Cancel edit discards changes

**File:** `tests/students/edit-student-cancel.spec.ts`

**Steps:**
  1. Setup: create an `E2E-EditCancel-<timestamp>` student, open its edit page, change `student-fullName` to '<name>-Changed' and `student-school` to 'Should not save'
    - expect: Fields show the typed values
  2. Click the Cancel link
    - expect: The URL is `/students/<id>` and the heading still shows the original name
    - expect: School shows '—' (unchanged)

#### 2.3. 2.3 Edit form validation blocks saving invalid data

**File:** `tests/students/edit-student-validation.spec.ts`

**Steps:**
  1. Setup: create an `E2E-EditVal-<timestamp>` student and open its edit page. Clear `student-fullName` and `student-guardianName`, set `student-email` to 'bad' and click `student-submit`
    - expect: `error-fullName`, `error-guardianName` and `error-email` are shown
    - expect: The URL stays on the edit page
  2. Navigate to `/students/<id>`
    - expect: The original name and guardian are unchanged

### 3. 3. Searching and filtering students

**Seed:** `tests/seed-authenticated.spec.ts`

#### 3.1. 3.1 Search by name finds the student

**File:** `tests/students/search-by-name.spec.ts`

**Steps:**
  1. Setup: create an `E2E-Search-<timestamp>` student with guardian 'E2E Guardian <timestamp>'. Open `/students` and type the full unique name into `table-search`
    - expect: The row containing the unique name becomes visible (search is debounced, so await it)
  2. Replace the search text with the generated student ID (e.g. SS019) and then with the unique guardian name
    - expect: The student's row is visible each time

#### 3.2. 3.2 Search is case-insensitive and ignores surrounding spaces

**File:** `tests/students/search-case-insensitive.spec.ts`

**Steps:**
  1. Setup: create an `E2E-Case-<timestamp>` student. On `/students` search for the unique name in all lower case, then in all upper case, then with leading and trailing spaces
    - expect: The student's row is visible for each variant

#### 3.3. 3.3 Search with no results shows the empty state

**File:** `tests/students/search-no-results.spec.ts`

**Steps:**
  1. Open `/students` and type 'zzzz-no-such-student-<random>' in `table-search`
    - expect: `empty-state` is visible with 'No students found' and 'Try changing the filters or add a new student.'
    - expect: No `student-row-*` rows are shown
  2. Clear the search box
    - expect: The empty state disappears and the table shows rows again (do not assert on how many)

#### 3.4. 3.4 Search narrows to a unique student only

**File:** `tests/students/search-excludes-others.spec.ts`

**Steps:**
  1. Setup: create two students `E2E-SearchA-<ts>` and `E2E-SearchB-<ts>`. Search for the full name of A
    - expect: Student A's row is visible and student B's row is not visible

### 4. 4. Deactivating and reactivating a student

**Seed:** `tests/seed-authenticated.spec.ts`

#### 4.1. 4.1 Deactivating via Edit hides the student from the default list

**File:** `tests/students/deactivate-student.spec.ts`

**Steps:**
  1. Setup: create an `E2E-Deact-<timestamp>` student. Open `/students` and search the unique name
    - expect: The row is visible with status Active (default filter is Active)
  2. Open its edit page, set `student-status` to Inactive and click `student-submit`
    - expect: The detail page shows Inactive and an `activate-student` button; there is no deactivate button for active students
  3. Open `/students` and search for the unique name with the default Active filter
    - expect: No row is shown and `empty-state` is visible (inactive students are hidden by default)
  4. Set `filter-status` to Inactive, then to All statuses
    - expect: The row is visible with status Inactive in both cases; with Active it is not shown

#### 4.2. 4.2 Reactivating an inactive student

**File:** `tests/students/reactivate-student.spec.ts`

**Steps:**
  1. Setup: create an `E2E-React-<timestamp>` student with Status = Inactive from the create form. Open its detail page
    - expect: Status shows Inactive and `activate-student` is visible
  2. Click `activate-student`
    - expect: A 'Student activated' toast appears, status shows Active and `activate-student` disappears
  3. Open `/students`, search the unique name with the default Active filter
    - expect: The student's row is visible with status Active

#### 4.3. 4.3 Create a student directly as Inactive

**File:** `tests/students/add-inactive-student.spec.ts`

**Steps:**
  1. Open `/students/new`, fill required fields with a unique `E2E-Inactive-<timestamp>` name, set `student-status` to Inactive and submit
    - expect: Detail page shows Inactive
  2. Search the name on `/students` with the default Active filter, then with Inactive
    - expect: Not listed under Active; listed under Inactive

### 5. 5. Delete dialog (cancel only)

**Seed:** `tests/seed-authenticated.spec.ts`

#### 5.1. 5.1 Delete dialog explains permanent deletion and can be cancelled

**File:** `tests/students/delete-dialog-cancel.spec.ts`

**Steps:**
  1. Setup: create an `E2E-DelCancel-<timestamp>` student (it has no history). On its detail page click `delete-student`
    - expect: An alertdialog titled 'Delete <name>?' appears; `delete-explanation` says the record has no attendance, fee or feedback history and will be permanently deleted and that the student ID will not be reused
  2. Click Cancel in the dialog (never click `confirm-button`)
    - expect: The dialog closes and the student still exists (heading still shown, still searchable in the list)
