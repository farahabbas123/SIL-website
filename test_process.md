# Testing Process

## Frontend Testing

Frontend testing focuses on the visible and interactive parts of the website, including pages, forms, user interactions, navigation, responsiveness, and exam behaviour. The goal is to ensure that users can complete tasks correctly and that the interface behaves as expected.

### Frontend Testing Checklist

A. Page and Navigation Testing

Check that all pages load correctly without errors.

Verify that navigation links, buttons, menus, and redirects work correctly.

Ensure users can move between exam pages without losing valid information.

Test browser back/forward navigation where applicable.

Verify that protected pages cannot be accessed without the required authentication.

B. Form Validation Testing

Check that required fields cannot be submitted when empty.

Verify correct validation for email addresses, passwords, numbers, dates, and other input formats.

Test minimum and maximum input lengths.

Ensure appropriate error messages are displayed for invalid inputs.

Verify that valid information can be submitted successfully.

C. Interface Testing

Check that buttons, input fields, dropdowns, checkboxes, and other controls work correctly.

Verify that text, images, icons, and other interface elements are displayed properly.

Test the interface across different screen sizes and supported browsers.

Ensure that loading indicators and disabled states appear when required.

D. User Experience and Accessibility Testing

Verify that the website is easy to understand and navigate.

Check keyboard navigation and focus behaviour.

Ensure sufficient colour contrast and readable text.

Verify that form fields and controls have appropriate labels.

Check that important actions provide clear feedback to the user.

Test the exam interface to ensure questions, answers, timers, and navigation behave consistently.

## Backend Testing

Backend testing focuses on API routes, business logic, database operations, authentication, and supporting services. The goal is to ensure that data is processed correctly and that the system behaves securely and reliably.

### Backend Testing Checklist

A. API and Validation Testing

Test all API endpoints with valid and invalid requests.

Verify required parameters and request data are validated.

Check that appropriate HTTP status codes are returned.

Ensure unauthorised users cannot access protected endpoints.

Test incorrect, missing, duplicate, or unexpected data.

Verify that API responses contain the expected data and structure.

B. Database Testing

Verify that data is created, updated, retrieved, and deleted correctly.

Check database constraints and relationships.

Test duplicate and invalid data handling.

Ensure transactions maintain data consistency.

Verify that sensitive information is stored securely and is not unnecessarily exposed.

C. Business Logic Testing

Test the main application rules and workflows.

Verify exam rules such as question selection, answer submission, scoring, timing, and completion status.

Check that users can only perform actions allowed by their role and current application state.

Test edge cases to ensure unexpected input does not produce incorrect results.

## Restrictions and Validation Rules

Website restrictions and validation rules define what users are allowed to do and what the system must reject. These rules should be enforced consistently on both the frontend and backend.

### Examples include:

Users must be authenticated before accessing protected features.

Users should only access resources they are authorised to use.

Required information must be provided before an action can be completed.

Invalid or unsupported input must be rejected.

Users should not be able to submit an exam after it has been closed or completed.

Users should not be able to modify information they do not have permission to change.

Server-side validation must be used even when frontend validation is already implemented.

## Exception Handling

Exception handling ensures that unexpected situations are handled safely and consistently. The system should use appropriate exception classes, HTTP status codes, validation errors, and consistent error responses.

A. User and Access Restrictions

Return appropriate responses when a user is not authenticated.

Reject requests when a user does not have sufficient permissions.

Prevent users from accessing or modifying another user's data.

Provide clear but non-sensitive error messages to users.

Ensure invalid requests do not cause application crashes.

B. Security and Operational Restrictions

Never expose secrets, passwords, API keys, tokens, or other sensitive information in frontend code.

Never include sensitive information in logs or error responses.

Use HTTPS in deployed environments.

Avoid exposing internal database errors, stack traces, or implementation details to users.

Validate and sanitise user input before processing it.

Apply appropriate rate limiting or request restrictions where required.

Log important server-side errors securely so they can be investigated without exposing sensitive information.

Ensure unexpected exceptions result in a controlled error response rather than an application crash.

---
Overall, the testing process should verify that the system works correctly under normal conditions, handles invalid input safely, enforces user restrictions, protects sensitive information, and provides consistent behaviour across the frontend and backend.