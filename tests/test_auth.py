import unittest

from fastapi import HTTPException

from src.app import (
    Credentials,
    activities,
    hash_password,
    login,
    register,
    sessions,
    signup_for_activity,
    unregister_from_activity,
    users,
    verify_password,
)


class AuthenticationTests(unittest.TestCase):
    def setUp(self):
        users.clear()
        sessions.clear()
        self.activity = activities["Chess Club"]
        self.original_participants = self.activity["participants"][:]
        self.activity["participants"] = self.original_participants[:]

    def tearDown(self):
        self.activity["participants"] = self.original_participants

    def test_password_is_hashed_and_verifiable(self):
        stored = hash_password("password123")

        self.assertNotEqual(stored, "password123")
        self.assertTrue(verify_password("password123", stored))
        self.assertFalse(verify_password("wrong-password", stored))

    def test_student_can_register_and_signup_as_themselves(self):
        credentials = Credentials(email="student@mergington.edu", password="password123")
        register(credentials)

        signup_for_activity("Chess Club", users["student@mergington.edu"])

        self.assertIn("student@mergington.edu", self.activity["participants"])

    def test_student_cannot_unregister_another_student(self):
        credentials = Credentials(email="student@mergington.edu", password="password123")
        register(credentials)

        with self.assertRaises(HTTPException) as context:
            unregister_from_activity(
                "Chess Club",
                "other@mergington.edu",
                users["student@mergington.edu"],
            )

        self.assertEqual(context.exception.status_code, 403)

    def test_login_returns_a_bearer_token(self):
        credentials = Credentials(email="student@mergington.edu", password="password123")
        register(credentials)

        result = login(credentials)

        self.assertEqual(result["token_type"], "bearer")
        self.assertIn(result["access_token"], sessions)


if __name__ == "__main__":
    unittest.main()