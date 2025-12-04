from locust import HttpUser, task, between
import uuid

class RegisterUserFlow(HttpUser):
    """
    Load test for:
      - User registration
      - Referral chains: L1 -> L2 -> L3
    """

    wait_time = between(0.1, 0.3)

    @task
    def register_chain(self):
        EMAIL_PREFIX = uuid.uuid4().hex[:6]

        # ----------------------
        # L1 registration
        # ----------------------
        r1 = self._register_user(
            email=f"{EMAIL_PREFIX}_l1@test.com"
        )

        if not r1 or "user" not in r1:
            return

        l1_ref_code = r1["user"].get("referral_code")

        # ----------------------
        # L2 registration using L1 referral
        # ----------------------
        r2 = self._register_user(
            email=f"{EMAIL_PREFIX}_l2@test.com",
            referral=l1_ref_code
        )

        if not r2 or "user" not in r2:
            return

        l2_ref_code = r2["user"].get("referral_code")

        # ----------------------
        # L3 registration using L2 referral
        # ----------------------
        self._register_user(
            email=f"{EMAIL_PREFIX}_l3@test.com",
            referral=l2_ref_code
        )

    # =====================================================
    # Helper function used by register_chain task
    # =====================================================
    def _register_user(self, email, referral=None):

        payload = {
            "email": email,
            "password": "Password123!",
            "full_name": f"Chain Test {email}",
            "phone": f"9{uuid.uuid4().int % 1000000000}",
            "company": "LoadTest Inc",
            "role": "customer",
            "agreement": True
        }

        if referral:
            payload["referral_code"] = referral

        with self.client.post(
            "/api/v1/auth/register",
            json=payload,
            name="POST /auth/register",
            catch_response=True,
            timeout=60
        ) as response:

            if response.status_code != 200:
                response.failure(f"HTTP {response.status_code}: {response.text}")
                return {}

            try:
                return response.json()
            except Exception as e:
                response.failure(f"JSON parse failure: {e}")
                return {}
