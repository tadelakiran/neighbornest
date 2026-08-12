#!/usr/bin/env python3
"""
Seed NeighborNest with random demo data through the public API.

Drives the real end-to-end flow so the frontend has live content to render:

    1. Register ``--users`` demo accounts        (auth-service  /api/auth/*)
    2. Create profiles + submit onboarding       (user-service  /api/users/*)
    3. Create one Nest with an anchor            (nest-service  /api/nests)
    4. Schedule meetings, add expenses, submit
       vibe checks with random values            (nest-service  /api/nests/*)

Requires the full stack (or at least auth, user, nest services + gateway) to be
running. Point it at the API Gateway with ``--base-url`` (default :8080).

Usage:
    python backend/scripts/seed_demo_data.py [--base-url http://localhost:8080]
                                             [--seed 42] [--users 6]

Notes:
    - Retries the first call (services need a moment to register with Eureka).
    - Re-runnable: existing emails are re-used (login) instead of failing.
    - Vibe-check submissions are stored but the Nest stays ACTIVE; flipping a
      Nest to VIBE_CHECK status is a lifecycle action not exposed via the API.
"""

import argparse
import json
import random
import sys
import time
import urllib.error
import urllib.request

PASSWORD = "Demo@1234"  # satisfies the auth-service password policy
FIRST_NAMES = ["Priya", "Arjun", "Aisha", "Rohan", "Sneha", "Liam", "Divya", "Kenji", "Ananya", "Vikram"]
LAST_NAMES = ["Sharma", "Reddy", "Patel", "Khanna", "Iyer", "Verma", "Costa", "Nair", "Kulkarni", "Rao"]
CITIES = ["Hyderabad", "Mumbai", "Bengaluru", "Delhi", "Pune", "Chennai"]
NEIGHBORHOODS = ["Banjara Hills", "Gachibowli", "Indiranagar", "Hauz Khas", "Koregaon Park", "Adyar", "Bandra West", "Madhapur"]
OCCUPATIONS = ["Software Engineer", "Data Analyst", "Teacher", "Designer", "Consultant", "Graduate Student", "Product Manager"]
ACTIVITIES = ["Coffee", "Walk", "Trivia", "Dinner", "Board Games", "Hiking"]
VENUES = ["Cafe Niloufer", "Lakeside Park", "The Trivia Den", "Marine Drive", "Harbor Boardwalk"]
QUESTION_KEYS = [
    "values_family", "values_adventure", "values_growth", "values_community",
    "interests_hiking", "interests_board_games", "interests_coffee", "interests_music",
]


def request(base, method, path, body=None, token=None, timeout=15):
    """Performs an HTTP request and returns (status, parsed json or None)."""
    url = base.rstrip("/") + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            payload = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            payload = None
        return err.code, payload


def retry_request(base, method, path, body=None, token=None, attempts=45, delay=2):
    """Calls ``request`` with retry/backoff for the initial eureka warm-up."""
    for i in range(attempts):
        status, payload = request(base, method, path, body, token)
        if status is not None and status < 500:
            return status, payload
        sys.stderr.write(f"  [retry {i + 1}/{attempts}] {method} {path} -> {status}\n")
        time.sleep(delay)
    raise RuntimeError(f"Could not reach {method} {path} after {attempts} attempts")


class DemoUser:
    def __init__(self, idx, full_name, email):
        self.idx = idx
        self.full_name = full_name
        self.email = email
        self.token = None
        self.profile_id = None


def register_or_login(base, user):
    """Creates the account, or logs in when the email already exists."""
    status, _ = retry_request(base, "POST", "/api/auth/register",
                              {"fullName": user.full_name, "email": user.email, "password": PASSWORD})
    if status == 409:  # already registered — log in instead
        status, _ = request(base, "POST", "/api/auth/login",
                            {"email": user.email, "password": PASSWORD})
        if status != 200:
            raise RuntimeError(f"login failed for {user.email}: {status}")
    status, payload = request(base, "POST", "/api/auth/login",
                              {"email": user.email, "password": PASSWORD})
    if status != 200:
        raise RuntimeError(f"login failed for {user.email}: {status} -> {payload}")
    user.token = payload["access_token"]


def create_profile(base, user, rand):
    status, payload = retry_request(
        base, "POST", "/api/users/profile",
        {
            "fullName": user.full_name,
            "city": rand.choice(CITIES),
            "neighborhood": rand.choice(NEIGHBORHOODS),
            "yearsInCity": rand.randint(0, 12),
            "occupation": rand.choice(OCCUPATIONS),
        },
        token=user.token,
    )
    if status != 201:
        raise RuntimeError(f"profile create failed for {user.email}: {status} -> {payload}")
    user.profile_id = payload["id"]

    status, payload = request(
        base, "POST", "/api/users/onboarding",
        {"answers": [
            {"questionKey": key, "answerValue": str(rand.randint(1, 5)), "weight": rand.randint(1, 5)}
            for key in QUESTION_KEYS
        ]},
        token=user.token,
    )
    if status != 200:
        raise RuntimeError(f"onboarding failed for {user.email}: {status} -> {payload}")


def create_nest(base, users, rand):
    name = f"{rand.choice(FIRST_NAMES)}'s {rand.choice(['Crew', 'Squad', 'Table', 'Circle', 'Pod'])}"
    status, payload = retry_request(
        base, "POST", "/api/nests",
        {
            "name": name,
            "city": rand.choice(CITIES),
            "memberUserIds": [u.profile_id for u in users],
            "anchorUserIds": [users[0].profile_id],
        },
        token=users[0].token,
    )
    if status not in (200, 201):
        raise RuntimeError(f"nest create failed: {status} -> {payload}")
    return payload


def schedule_meetings(base, nest, users, rand):
    count = rand.randint(2, 4)
    for i in range(count):
        scheduled = time.time() + (i + 1) * 3 * 86_400 + rand.randint(0, 86_400)
        iso = time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(scheduled))
        status, payload = request(
            base, "POST", f"/api/nests/{nest['id']}/meetings",
            {
                "scheduledAt": iso,
                "venueName": rand.choice(VENUES),
                "venueAddress": f"{rand.randint(100, 999)} {rand.choice(['Maple', 'Elm', 'Oak', 'Pine'])} Street",
                "activityType": rand.choice(ACTIVITIES),
                "description": "Demo meetup seeded by seed_demo_data.py",
            },
            token=rand.choice(users).token,
        )
        if status != 201:
            raise RuntimeError(f"meeting create failed: {status} -> {payload}")
    status, payload = request(base, "GET", f"/api/nests/{nest['id']}/meetings", token=users[0].token)
    return len(payload) if payload else 0


def add_expenses(base, nest, users, rand):
    count = rand.randint(2, 3)
    for _ in range(count):
        amount = round(rand.uniform(10, 90), 2)
        payer = rand.choice(users)
        splits = []
        if rand.random() < 0.6:
            split_type, splits = "EQUAL", []
        else:
            split_type = "CUSTOM"
            remaining = amount
            for member in users[:-1]:
                share = round(remaining * rand.uniform(0.1, 0.9), 2)
                splits.append({"userId": member.profile_id, "amountOwed": share})
                remaining = round(remaining - share, 2)
            splits.append({"userId": users[-1].profile_id, "amountOwed": round(remaining, 2)})
        status, payload = request(
            base, "POST", f"/api/nests/{nest['id']}/expenses",
            {
                "amount": amount,
                "description": rand.choice([
                    "Group dinner", "Weekend groceries", "Movie night snacks",
                    "Carpool fuel", "Board game set", "Picnic supplies",
                ]),
                "splitType": split_type,
                "splits": splits,
            },
            token=payer.token,
        )
        if status != 201:
            raise RuntimeError(f"expense create failed: {status} -> {payload}")
    status, payload = request(base, "GET", f"/api/nests/{nest['id']}/expenses", token=users[0].token)
    return len(payload) if payload else 0


def submit_vibe_checks(base, nest, users, rand):
    for user in users:
        status, _ = request(
            base, "POST", f"/api/nests/{nest['id']}/vibe-check",
            {
                "connectionScore": rand.randint(6, 10),
                "comfortScore": rand.randint(6, 10),
                "feedback": rand.choice([
                    None, "The group feels welcoming already.",
                    "Hiking together was the best part.",
                    "Would love more weekend meetups.",
                ]),
            },
            token=user.token,
        )
    status, payload = request(base, "GET", f"/api/nests/{nest['id']}/vibe-check/status", token=users[0].token)
    return payload.get("submissionCount", 0) if payload else 0


def main():
    parser = argparse.ArgumentParser(description="Seed NeighborNest with random demo data")
    parser.add_argument("--base-url", default="http://localhost:8080", help="API Gateway base URL")
    parser.add_argument("--seed", type=int, default=42, help="Random seed (deterministic data)")
    parser.add_argument("--users", type=int, default=5, help="Number of demo users (1 anchor + members)")
    args = parser.parse_args()

    if args.users < 2:
        sys.exit("Need at least 2 users (1 anchor + 1 member)")
    rand = random.Random(args.seed)

    print(f"Seeding {args.users} demo users against {args.base_url} (seed={args.seed}) ...")
    users = []
    for i in range(args.users):
        full_name = f"{rand.choice(FIRST_NAMES)} {rand.choice(LAST_NAMES)}"
        email = f"demo{i + 1}.{args.seed}@neighbornest.dev"
        user = DemoUser(i, full_name, email)
        register_or_login(args.base_url, user)
        create_profile(args.base_url, user, rand)
        users.append(user)
        print(f"  ✔ {full_name} <{email}> -> profile #{user.profile_id}")

    nest = create_nest(args.base_url, users, rand)
    print(f"  ✔ Nest '{nest['name']}' #{nest['id']} created ({len(nest['members'])} members)")

    meetings = schedule_meetings(args.base_url, nest, users, rand)
    expenses = add_expenses(args.base_url, nest, users, rand)
    vibe_count = submit_vibe_checks(args.base_url, nest, users, rand)

    print("\nSeed complete:")
    print(f"  Nest id:    {nest['id']}   name: {nest['name']}")
    print(f"  Meetings:   {meetings}   Expenses: {expenses}   Vibe submissions: {vibe_count}/{len(users)}")
    print(f"  Login with any demo user:  password={PASSWORD}")
    print(f"  e.g. demo1.{args.seed}@neighbornest.dev")


if __name__ == "__main__":
    main()
