# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Register and log in with a student account
- Sign up for activities as the authenticated user
- Unregister yourself from activities

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/auth/register`                                                  | Create a student account                                            |
| POST   | `/auth/login`                                                     | Log in and receive a bearer token                                   |
| GET    | `/auth/me`                                                        | Get the authenticated user's profile                                |
| POST   | `/activities/{activity_name}/signup`                              | Sign up the authenticated user                                      |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister yourself; staff can manage other users                  |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All activity, account, and session data is stored in memory, which means it will be reset when the server restarts. Passwords are stored as salted PBKDF2 hashes, never as plaintext.
