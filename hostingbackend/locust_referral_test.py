import time
import random
from locust import HttpUser, task, between

def get_random_string(length=8):
    """Generates a random string for unique usernames/emails."""
    letters = "abcdefghijklmnopqrstuvwxyz0123456789"
    return "".join(random.choice(letters) for i in range(length))

class ReferralSystemTest(HttpUser):
    wait_time = between(1, 3)
    host = "http://backend:8000" # This will be overridden by the --host flag in docker-compose

    @task
    def execute_3_level_referral_flow(self):
        """
        Simulates the entire 3-level referral flow in a single task to ensure sequence.
        - User1 registers and buys a plan.
        - User2 uses User1's code, registers, and buys a plan.
        - User3 uses User2's code, registers, and buys a plan.
        """
        print("--- Starting 3-Level Referral Test Flow ---")

        # --- Step 1: User1 registers and buys a plan ---
        user1_data = self.register_user(user_level=1)
        if not user1_data:
            print("🛑 Halting test: Failed to register User1.")
            return

        self.buy_plan(
            user_level=1,
            auth_token=user1_data["token"],
            plan_id="plan_499" # Assuming a plan ID for the ₹499 plan
        )

        # --- Step 2: User2 registers using User1's code and buys a plan ---
        user2_data = self.register_user(
            user_level=2,
            referral_code=user1_data["referral_code"]
        )
        if not user2_data:
            print("🛑 Halting test: Failed to register User2.")
            return

        self.buy_plan(
            user_level=2,
            auth_token=user2_data["token"],
            plan_id="plan_499"
        )

        # --- Step 3: User3 registers using User2's code and buys a plan ---
        user3_data = self.register_user(
            user_level=3,
            referral_code=user2_data["referral_code"]
        )
        if not user3_data:
            print("🛑 Halting test: Failed to register User3.")
            return

        self.buy_plan(
            user_level=3,
            auth_token=user3_data["token"],
            plan_id="plan_499"
        )

        print("\n--- Verification Step ---")
        print("Checking commissions after all purchases...")
        time.sleep(2) # Give the backend a moment to process commissions

        # Verify User1's commissions (should have L1 from User2, L2 from User3)
        self.check_user_details(1, user1_data["token"])

        # Verify User2's commissions (should have L1 from User3)
        self.check_user_details(2, user2_data["token"])

        # Verify User3's commissions (should have none)
        self.check_user_details(3, user3_data["token"])

        print("\n✅ --- Test Flow Completed ---")


    def register_user(self, user_level, referral_code=None):
        """Helper function to register a user."""
        unique_id = get_random_string()
        email = f"testuser_{unique_id}@example.com"
        payload = {
            "email": email,
            "password": "strongpassword123",
            "name": f"Test User {unique_id}"
        }
        if referral_code:
            payload["referral_code"] = referral_code

        print(f"Registering User{user_level} with email {email}...")
        with self.client.post("/api/v1/auth/register", json=payload, catch_response=True, name="/api/v1/auth/register") as response:
            if response.status_code == 201 or response.status_code == 200:
                print(f"✅ User{user_level} registered successfully.")
                response_data = response.json()
                # NOTE: Adjust these keys based on your actual API response
                user_info = {
                    "token": response_data.get("access_token"),
                    "referral_code": response_data.get("user", {}).get("referral_code")
                }
                if not user_info["token"] or not user_info["referral_code"]:
                    print(f"🔥 Error: 'access_token' or 'referral_code' not found in response for User{user_level}.")
                    response.failure("Missing token/referral_code in response")
                    return None
                return user_info
            else:
                print(f"🔥 Failed to register User{user_level}. Status: {response.status_code}, Response: {response.text}")
                response.failure(f"Failed to register User{user_level}")
                return None

    def buy_plan(self, user_level, auth_token, plan_id):
        """Helper function for a user to buy a plan."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {"plan_id": plan_id}

        print(f"User{user_level} is buying plan '{plan_id}'...")
        with self.client.post("/api/v1/plans/buy", json=payload, headers=headers, catch_response=True, name="/api/v1/plans/buy") as response:
            if response.status_code == 200:
                print(f"✅ User{user_level} purchased plan successfully.")
                response.success()
            else:
                print(f"🔥 User{user_level} failed to buy plan. Status: {response.status_code}, Response: {response.text}")
                response.failure(f"User{user_level} failed to buy plan")

    def check_user_details(self, user_level, auth_token):
        """Helper function to fetch and print user details for verification."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        print(f"Fetching details for User{user_level} for verification...")
        # NOTE: This endpoint is an assumption. Change it to your actual user profile/details endpoint.
        with self.client.get("/api/v1/users/me", headers=headers, catch_response=True, name="/api/v1/users/me") as response:
            if response.status_code == 200:
                print(f"✅ Details for User{user_level}: {response.json()}")
                response.success()
            else:
                print(f"🔥 Could not fetch details for User{user_level}. Status: {response.status_code}")
                response.failure(f"Failed to fetch details for User{user_level}")