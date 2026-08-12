#!/usr/bin/env bash
# ============================================================================
# seed_sample_data.sh — Seeds NeighborNest MySQL databases with coherent
# sample data so the frontend has rich content to render.
#
# Populates (per the product guidelines — 5–8 people, 1–2 Anchors, 6-week
# journeys):
#   - auth     : 61 demo accounts across 6 Indian cities (12 Anchors, 48
#                Newcomers, 1 Admin) — password: Demo@1234
#   - user     : profiles, onboarding answers, approved + pending anchor apps
#   - matching : per-city compatibility scores + pending/completed proposals
#   - nest     : 10 nests (ACTIVE, VIBE_CHECK, GRADUATED) across Hyderabad,
#                Mumbai, Bengaluru, Delhi, Pune & Chennai — each with 5–8
#                members, 1–2 Anchors, a 6-week lifecycle, meetings,
#                expenses/splits and vibe-check submissions
#
# Idempotent: re-running refreshes the demo rows (keyed by demo email / nest
# name) without touching any other data.
#
# Requires:
#   - The backend stack running (the probe registers a throwaway account via
#     the gateway to obtain a real BCrypt hash).
#   - The local MySQL on 127.0.0.1:3306 with backend/.env (MYSQL_ROOT_PASSWORD)
#     and the six databases created (see setup_local_mysql.sql).
#
# Usage:  bash backend/scripts/seed_sample_data.sh
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

# ── Credentials from backend/.env ──
set -a; source .env; set +a

PASSWORD="Demo@1234"
PHOTO="https://randomuser.me/api/portraits"

# Database labels — all six databases live on the one local MySQL; these names
# are passed as the (now-ignored) first argument to MYSQL()/ONE() purely to
# keep each call self-documenting.
AUTH_C=neighbornest_auth
USER_C=user_db
MATCH_C=matching_db
NEST_C=nest_db
CHAT_C=chat_db
NOTIF_C=notification_db

# ── helpers ──
# MYSQL_CLI — local MySQL client (all six databases live on the one local
# MySQL instance at 127.0.0.1:3306; the $1 container argument is ignored).
MYSQL_CLI="${MYSQL_CLI:-/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe}"
# MYSQL <ignored> <sql> — run SQL, hide the password warning. Any SQL error
# is printed AND aborts the script, so a partial seed can never go unnoticed.
MYSQL() {
  local OUT
  OUT=$("$MYSQL_CLI" -h127.0.0.1 -P3306 -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 -e "$2" 2>&1 | grep -v "Warning" || true)
  if printf '%s' "$OUT" | grep -q "ERROR"; then
    printf '%s\n' "$OUT" >&2
    echo "Seeding aborted due to a SQL error." >&2
    exit 1
  fi
  printf '%s\n' "$OUT"
}
ONE() { # ONE <ignored> <sql> — single scalar value
  # NOTE: `|| true` is load-bearing here — a failed lookup (e.g. SQL syntax
  # error, transient hiccup) must NOT kill the seed via set -e/pipefail.
  # Real data errors still surface loudly through MYSQL().
  "$MYSQL_CLI" -h127.0.0.1 -P3306 -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 -N -e "$2" 2>/dev/null | head -1 || true
}
sqlq() { # sqlq <string> — escape single quotes for safe interpolation into SQL
  printf '%s' "${1//\'/\'\'}"
}

echo "==> Seeding NeighborNest sample data (password: $PASSWORD)"

# ── 1. Obtain a valid BCrypt hash for the demo password ──
#    (register one throwaway account via the API; the auth-service hashes it)
PROBE=$(ONE "$AUTH_C" "SELECT password_hash FROM neighbornest_auth.users WHERE email='seedprobe.tmp@neighbornest.dev';")
if [ -z "$PROBE" ]; then
  curl -s -o /dev/null -X POST http://localhost:8080/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"fullName":"Seed Probe","email":"seedprobe.tmp@neighbornest.dev","password":"'"$PASSWORD"'"}'
  PROBE=$(ONE "$AUTH_C" "SELECT password_hash FROM neighbornest_auth.users WHERE email='seedprobe.tmp@neighbornest.dev';")
fi
if [ -z "$PROBE" ]; then
  echo "ERROR: could not obtain a BCrypt hash — is the gateway (8080) + auth-service up?"; exit 1
fi
# remove the throwaway account
MYSQL "$AUTH_C" "DELETE FROM neighbornest_auth.users WHERE email='seedprobe.tmp@neighbornest.dev';"

# ── 2. Demo users (email|full name|role|photo|city|neighborhood|occupation|personality|work|schedule|goal|budget|years) ──
SEED_USERS=(
  # Hyderabad
  "priya.hyd@neighbornest.dev|Priya Sharma|ANCHOR|women/44.jpg|Hyderabad|Banjara Hills|Software Engineer|EXTROVERT|FULL_TIME|EVENING|FRIENDSHIP|HIGH|9"
  "arjun.hyd@neighbornest.dev|Arjun Reddy|ANCHOR|men/32.jpg|Hyderabad|Gachibowli|Startup Founder|AMBIVERT|FULL_TIME|FLEXIBLE|COMMUNITY|HIGH|12"
  "rahul.hyd@neighbornest.dev|Rahul Verma|NEWCOMER|men/75.jpg|Hyderabad|Madhapur|Data Analyst|INTROVERT|FULL_TIME|MORNING|FRIENDSHIP|MEDIUM|1"
  "sneha.hyd@neighbornest.dev|Sneha Kulkarni|NEWCOMER|women/68.jpg|Hyderabad|Jubilee Hills|Product Designer|AMBIVERT|FREELANCE|FLEXIBLE|NETWORKING|MEDIUM|2"
  "vikram.hyd@neighbornest.dev|Vikram Rao|NEWCOMER|men/86.jpg|Hyderabad|Kukatpally|Mechanical Engineer|EXTROVERT|FULL_TIME|EVENING|COMMUNITY|MEDIUM|0"
  "ananya.hyd@neighbornest.dev|Ananya Iyer|NEWCOMER|women/12.jpg|Hyderabad|Hitec City|Marketing Manager|AMBIVERT|FULL_TIME|EVENING|NETWORKING|HIGH|1"
  "karthik.hyd@neighbornest.dev|Karthik Nair|NEWCOMER|men/45.jpg|Hyderabad|Ameerpet|Graduate Student|INTROVERT|STUDENT|NIGHT_OWL|HOUSING_MATE|LOW|3"
  "divya.hyd@neighbornest.dev|Divya Menon|NEWCOMER|women/56.jpg|Hyderabad|Begumpet|HR Specialist|EXTROVERT|PART_TIME|FLEXIBLE|FRIENDSHIP|MEDIUM|2"
  "ravi.hyd@neighbornest.dev|Ravi Teja|NEWCOMER|men/23.jpg|Hyderabad|Kondapur|Sales Executive|AMBIVERT|FULL_TIME|MORNING|NETWORKING|LOW|1"
  "meera.hyd@neighbornest.dev|Meera Joshi|NEWCOMER|women/33.jpg|Hyderabad|Secunderabad|Nurse|INTROVERT|FULL_TIME|FLEXIBLE|COMMUNITY|MEDIUM|5"
  # Mumbai
  "anita.mum@neighbornest.dev|Anita Desai|ANCHOR|women/29.jpg|Mumbai|Bandra West|Architect|AMBIVERT|FREELANCE|FLEXIBLE|COMMUNITY|HIGH|15"
  "rohan.mum@neighbornest.dev|Rohan Khanna|ANCHOR|men/41.jpg|Mumbai|Andheri West|Journalist|EXTROVERT|FULL_TIME|EVENING|FRIENDSHIP|MEDIUM|10"
  "isha.mum@neighbornest.dev|Isha Mehta|NEWCOMER|women/65.jpg|Mumbai|Powai|Management Consultant|INTROVERT|FULL_TIME|MORNING|NETWORKING|HIGH|1"
  "aditya.mum@neighbornest.dev|Aditya Kulkarni|NEWCOMER|men/52.jpg|Mumbai|Lower Parel|Investment Banker|AMBIVERT|FULL_TIME|EVENING|NETWORKING|HIGH|2"
  "nisha.mum@neighbornest.dev|Nisha Agarwal|NEWCOMER|women/78.jpg|Mumbai|Juhu|Photographer|EXTROVERT|FREELANCE|FLEXIBLE|FRIENDSHIP|MEDIUM|0"
  "siddharth.mum@neighbornest.dev|Siddharth Malhotra|NEWCOMER|men/15.jpg|Mumbai|Worli|Chef|AMBIVERT|PART_TIME|NIGHT_OWL|FRIENDSHIP|LOW|1"
  "kavya.mum@neighbornest.dev|Kavya Reddy|NEWCOMER|women/90.jpg|Mumbai|Chembur|Doctor|INTROVERT|FULL_TIME|MORNING|MENTORSHIP|HIGH|2"
  "tara.mum@neighbornest.dev|Tara Bhatt|NEWCOMER|women/21.jpg|Mumbai|Malad|Graduate Student|INTROVERT|STUDENT|FLEXIBLE|HOUSING_MATE|LOW|3"
  "vivaan.mum@neighbornest.dev|Vivaan Shah|NEWCOMER|men/59.jpg|Mumbai|Colaba|Corporate Lawyer|EXTROVERT|FULL_TIME|EVENING|COMMUNITY|HIGH|1"
  "krishna.mum@neighbornest.dev|Krishna Iyer|NEWCOMER|men/38.jpg|Mumbai|Dadar|Music Producer|INTROVERT|FREELANCE|NIGHT_OWL|FRIENDSHIP|MEDIUM|0"
  # Bengaluru
  "deepa.blr@neighbornest.dev|Deepa Krishnan|ANCHOR|women/47.jpg|Bengaluru|Indiranagar|UX Research Lead|AMBIVERT|FULL_TIME|FLEXIBLE|COMMUNITY|HIGH|11"
  "manoj.blr@neighbornest.dev|Manoj Pillai|ANCHOR|men/71.jpg|Bengaluru|Koramangala|Engineering Manager|INTROVERT|FULL_TIME|MORNING|MENTORSHIP|HIGH|8"
  "shruti.blr@neighbornest.dev|Shruti Hegde|NEWCOMER|women/36.jpg|Bengaluru|HSR Layout|Data Scientist|INTROVERT|FULL_TIME|MORNING|NETWORKING|HIGH|1"
  "nitin.blr@neighbornest.dev|Nitin Gupta|NEWCOMER|men/83.jpg|Bengaluru|Whitefield|Cloud Engineer|AMBIVERT|FULL_TIME|FLEXIBLE|NETWORKING|HIGH|2"
  "pallavi.blr@neighbornest.dev|Pallavi Rao|NEWCOMER|women/8.jpg|Bengaluru|Jayanagar|Food Blogger|EXTROVERT|FREELANCE|EVENING|FRIENDSHIP|MEDIUM|0"
  "akash.blr@neighbornest.dev|Akash Shetty|NEWCOMER|men/97.jpg|Bengaluru|Marathahalli|Backend Developer|INTROVERT|FULL_TIME|NIGHT_OWL|FRIENDSHIP|MEDIUM|1"
  "ritu.blr@neighbornest.dev|Ritu Kapoor|NEWCOMER|women/28.jpg|Bengaluru|Bellandur|Product Manager|AMBIVERT|FULL_TIME|EVENING|NETWORKING|HIGH|2"
  "ganesh.blr@neighbornest.dev|Ganesh Murthy|NEWCOMER|men/64.jpg|Bengaluru|BTM Layout|Architect|EXTROVERT|FULL_TIME|FLEXIBLE|COMMUNITY|MEDIUM|3"
  "kiran.blr@neighbornest.dev|Kiran Bhat|NEWCOMER|men/37.jpg|Bengaluru|Electronic City|QA Engineer|AMBIVERT|FULL_TIME|MORNING|FRIENDSHIP|LOW|1"
  "aishwarya.blr@neighbornest.dev|Aishwarya Rao|NEWCOMER|women/61.jpg|Bengaluru|Malleshwaram|Data Engineer|EXTROVERT|FULL_TIME|EVENING|NETWORKING|MEDIUM|1"
  # Delhi
  "neha.del@neighbornest.dev|Neha Kapoor|ANCHOR|women/51.jpg|Delhi|Hauz Khas|Magazine Editor|AMBIVERT|FREELANCE|FLEXIBLE|COMMUNITY|HIGH|13"
  "amit.del@neighbornest.dev|Amit Saxena|ANCHOR|men/77.jpg|Delhi|Defence Colony|Chartered Accountant|INTROVERT|FULL_TIME|MORNING|MENTORSHIP|HIGH|9"
  "pooja.del@neighbornest.dev|Pooja Singh|NEWCOMER|women/72.jpg|Delhi|Dwarka|School Teacher|AMBIVERT|FULL_TIME|EVENING|FRIENDSHIP|MEDIUM|2"
  "rajat.del@neighbornest.dev|Rajat Bansal|NEWCOMER|men/22.jpg|Delhi|Saket|Strategy Consultant|EXTROVERT|FULL_TIME|EVENING|NETWORKING|HIGH|1"
  "simran.del@neighbornest.dev|Simran Kaur|NEWCOMER|women/13.jpg|Delhi|Punjabi Bagh|UI Designer|INTROVERT|FREELANCE|FLEXIBLE|FRIENDSHIP|MEDIUM|0"
  "gaurav.del@neighbornest.dev|Gaurav Tyagi|NEWCOMER|men/93.jpg|Delhi|Rohini|Civil Engineer|AMBIVERT|FULL_TIME|MORNING|HOUSING_MATE|LOW|1"
  "anika.del@neighbornest.dev|Anika Malhotra|NEWCOMER|women/57.jpg|Delhi|Vasant Kunj|Management Consultant|EXTROVERT|FULL_TIME|EVENING|COMMUNITY|HIGH|2"
  "kunal.del@neighbornest.dev|Kunal Arora|NEWCOMER|men/34.jpg|Delhi|Gurugram|Sales Manager|EXTROVERT|FULL_TIME|FLEXIBLE|NETWORKING|HIGH|2"
  "ritika.del@neighbornest.dev|Ritika Jain|NEWCOMER|women/49.jpg|Delhi|Lajpat Nagar|Content Creator|AMBIVERT|FREELANCE|EVENING|FRIENDSHIP|MEDIUM|1"
  "yash.del@neighbornest.dev|Yash Chopra|NEWCOMER|men/54.jpg|Delhi|Noida|Software Engineer|INTROVERT|FULL_TIME|MORNING|FRIENDSHIP|LOW|0"
  # Pune
  "suhas.pun@neighbornest.dev|Suhas Joshi|ANCHOR|men/31.jpg|Pune|Koregaon Park|University Professor|INTROVERT|FULL_TIME|MORNING|MENTORSHIP|MEDIUM|14"
  "vaishali.pun@neighbornest.dev|Vaishali Patil|ANCHOR|women/69.jpg|Pune|Kothrud|Pediatrician|AMBIVERT|FULL_TIME|EVENING|COMMUNITY|HIGH|10"
  "rohit.pun@neighbornest.dev|Rohit Deshmukh|NEWCOMER|men/50.jpg|Pune|Hinjewadi|DevOps Engineer|AMBIVERT|FULL_TIME|FLEXIBLE|NETWORKING|MEDIUM|1"
  "prajakta.pun@neighbornest.dev|Prajakta More|NEWCOMER|women/34.jpg|Pune|Aundh|Graphic Designer|INTROVERT|FREELANCE|FLEXIBLE|FRIENDSHIP|LOW|0"
  "om.pun@neighbornest.dev|Om Kulkarni|NEWCOMER|men/17.jpg|Pune|Viman Nagar|Graduate Student|INTROVERT|STUDENT|NIGHT_OWL|HOUSING_MATE|LOW|2"
  "tanvi.pun@neighbornest.dev|Tanvi Gokhale|NEWCOMER|women/24.jpg|Pune|Hadapsar|Business Analyst|AMBIVERT|FULL_TIME|MORNING|NETWORKING|MEDIUM|1"
  "sanket.pun@neighbornest.dev|Sanket Pawar|NEWCOMER|men/88.jpg|Pune|Baner|Sales Manager|EXTROVERT|FULL_TIME|EVENING|FRIENDSHIP|MEDIUM|3"
  "riya.pun@neighbornest.dev|Riya Kulkarni|NEWCOMER|women/18.jpg|Pune|Wakad|HR Executive|EXTROVERT|FULL_TIME|FLEXIBLE|COMMUNITY|MEDIUM|2"
  "pranav.pun@neighbornest.dev|Pranav Shinde|NEWCOMER|men/62.jpg|Pune|Pimple Saudagar|CA Aspirant|INTROVERT|STUDENT|MORNING|MENTORSHIP|LOW|1"
  "sara.pun@neighbornest.dev|Sara Fernandes|NEWCOMER|women/5.jpg|Pune|Camp|Copywriter|AMBIVERT|PART_TIME|EVENING|FRIENDSHIP|LOW|0"
  # Chennai
  "lakshmi.chn@neighbornest.dev|Lakshmi Narayanan|ANCHOR|women/41.jpg|Chennai|Adyar|University Professor|INTROVERT|FULL_TIME|MORNING|MENTORSHIP|MEDIUM|16"
  "vijay.chn@neighbornest.dev|Vijay Raghavan|ANCHOR|men/68.jpg|Chennai|Mylapore|Architect|AMBIVERT|FULL_TIME|EVENING|COMMUNITY|HIGH|11"
  "priya.chn@neighbornest.dev|Priya Raman|NEWCOMER|women/55.jpg|Chennai|T. Nagar|HR Manager|AMBIVERT|FULL_TIME|FLEXIBLE|FRIENDSHIP|MEDIUM|1"
  "bala.chn@neighbornest.dev|Bala Subramanian|NEWCOMER|men/26.jpg|Chennai|Anna Nagar|Software Developer|INTROVERT|FULL_TIME|NIGHT_OWL|NETWORKING|HIGH|2"
  "meenakshi.chn@neighbornest.dev|Meenakshi Sundaram|NEWCOMER|women/38.jpg|Chennai|Velachery|School Teacher|EXTROVERT|PART_TIME|EVENING|COMMUNITY|LOW|0"
  "arun.chn@neighbornest.dev|Arun Prasad|NEWCOMER|men/84.jpg|Chennai|OMR|Data Engineer|INTROVERT|FULL_TIME|FLEXIBLE|FRIENDSHIP|MEDIUM|1"
  "harini.chn@neighbornest.dev|Harini Devi|NEWCOMER|women/26.jpg|Chennai|Guindy|Product Designer|EXTROVERT|FREELANCE|FLEXIBLE|NETWORKING|MEDIUM|2"
  "surya.chn@neighbornest.dev|Surya Prakash|NEWCOMER|men/43.jpg|Chennai|Kodambakkam|Cinematographer|EXTROVERT|FREELANCE|EVENING|NETWORKING|MEDIUM|2"
  "deepika.chn@neighbornest.dev|Deepika Ravi|NEWCOMER|women/80.jpg|Chennai|Tambaram|Bank Officer|AMBIVERT|FULL_TIME|FLEXIBLE|COMMUNITY|MEDIUM|1"
  "varun.chn@neighbornest.dev|Varun Krishnan|NEWCOMER|men/9.jpg|Chennai|Nungambakkam|Product Analyst|INTROVERT|FULL_TIME|MORNING|FRIENDSHIP|MEDIUM|0"
  # Admin
  "admin@neighbornest.dev|Nest Admin|ADMIN|men/11.jpg|Hyderabad|Downtown|Product Manager|AMBIVERT|FULL_TIME|MORNING|COMMUNITY|HIGH|10"
)

declare -A PID          # email -> user_profiles.id
declare -A CITY_IDS     # city -> space-separated profile ids (same-city matching)

for row in "${SEED_USERS[@]}"; do
  IFS='|' read -r email name role photo city hood occ pers work sched goal budget years <<< "$row"
  EXISTS=$(ONE "$AUTH_C" "SELECT COUNT(*) FROM neighbornest_auth.users WHERE email='$email';")
  if [ "$EXISTS" = "0" ]; then
    MYSQL "$AUTH_C" "INSERT INTO neighbornest_auth.users
      (auth_provider,email,full_name,password_hash,role,city,neighborhood,profile_photo_url,is_email_verified,is_onboarded,created_at,updated_at)
      VALUES ('LOCAL','$email','$name','$PROBE','$role','$city','$hood','$PHOTO/$photo',1,1,NOW(),NOW());"
  else
    MYSQL "$AUTH_C" "UPDATE neighbornest_auth.users
      SET role='$role', full_name='$name', city='$city', neighborhood='$hood',
          profile_photo_url='$PHOTO/$photo', is_onboarded=1, updated_at=NOW()
      WHERE email='$email';"
  fi
  echo "  • user $email ($role · $city)"
done

# ── 3. Resolve auth ids, then create profiles + onboarding answers ──
for row in "${SEED_USERS[@]}"; do
  IFS='|' read -r email name role photo city hood occ pers work sched goal budget years <<< "$row"
  AID=$(ONE "$AUTH_C" "SELECT id FROM neighbornest_auth.users WHERE email='$email';")

  EXISTS=$(ONE "$USER_C" "SELECT COUNT(*) FROM user_db.user_profiles WHERE auth_user_id=$AID;")
  if [ "$EXISTS" = "0" ]; then
    MYSQL "$USER_C" "INSERT INTO user_db.user_profiles
      (auth_user_id,full_name,city,neighborhood,years_in_city,occupation,work_type,personality_type,schedule_preference,social_goal,budget_level,role,is_onboarded,profile_photo_url,created_at,updated_at)
      VALUES ($AID,'$name','$city','$hood',$years,'$occ','$work','$pers','$sched','$goal','$budget','$role',1,'$PHOTO/$photo',NOW(),NOW());"
  else
    MYSQL "$USER_C" "UPDATE user_db.user_profiles
      SET role='$role', full_name='$name', occupation='$occ', work_type='$work', personality_type='$pers',
          schedule_preference='$sched', social_goal='$goal', budget_level='$budget',
          years_in_city=$years, is_onboarded=1, profile_photo_url='$PHOTO/$photo', updated_at=NOW()
      WHERE auth_user_id=$AID;"
  fi
  PID[$email]=$(ONE "$USER_C" "SELECT id FROM user_db.user_profiles WHERE auth_user_id=$AID;")
  # append without leading space (${var:+...} only expands when already non-empty)
  CITY_IDS[$city]="${CITY_IDS[$city]:+${CITY_IDS[$city]} }${PID[$email]}"
done

# csv_of <space-separated ids> — joins into a comma-separated list
csv_of() {
  echo "${1// /,}"
}

# ── 4. Onboarding answers (values_* + interests_*) — varied by personality ──
seed_answers() { # seed_answers <profile_id> <personality> — batched: 1 delete + 1 multi-row insert
  local pid=$1 pers=$2
  case "$pers" in
    EXTROVERT) local keys="values_family:3|values_adventure:5|values_growth:4|values_community:5|interests_hiking:2|interests_live_music:2|interests_coffee:2|interests_board_games:2" ;;
    INTROVERT) local keys="values_family:4|values_adventure:2|values_growth:4|values_community:4|interests_books:2|interests_gaming:2|interests_coffee:2|interests_art_museums:2" ;;
    *)         local keys="values_family:4|values_adventure:4|values_growth:3|values_community:5|interests_cooking:2|interests_photography:2|interests_hiking:2|interests_live_music:2" ;;
  esac
  MYSQL "$USER_C" "DELETE FROM user_db.onboarding_answers WHERE user_profile_id=$pid;"
  local rows="" pair key w
  for pair in ${keys//|/ }; do
    key="${pair%%:*}"; w="${pair##*:}"
    rows="$rows,($pid,'$key','$w',$w,NOW())"
  done
  MYSQL "$USER_C" "INSERT INTO user_db.onboarding_answers (user_profile_id,question_key,answer_value,weight,created_at) VALUES ${rows#,};"
}
for row in "${SEED_USERS[@]}"; do
  IFS='|' read -r email name role photo city hood occ pers work sched goal budget years <<< "$row"
  seed_answers "${PID[$email]}" "$pers"
done

# ── 5. Anchor applications (approved for Anchors, pending for two newcomers) ──
seed_anchor_app() { # seed_anchor_app <profile_id> <status> <years> <neighborhoods> <languages> <experience>
  local pid=$1 status=$2 years=$3 hoods=$4 langs=$5 exp=$6
  local EXISTS REVIEWED="NULL" NOTE="NULL"
  EXISTS=$(ONE "$USER_C" "SELECT COUNT(*) FROM user_db.anchor_applications WHERE user_profile_id=$pid;")
  if [ "$status" = "APPROVED" ]; then REVIEWED="NOW() - INTERVAL 1 DAY"; NOTE="'Strong local knowledge and clear hosting experience.'"; fi
  if [ "$EXISTS" = "0" ]; then
    MYSQL "$USER_C" "INSERT INTO user_db.anchor_applications
      (user_profile_id,years_in_city,neighborhoods_known,languages_spoken,experience,availability,status,applied_at,reviewed_at,review_note)
      VALUES ($pid,$years,'$hoods','$langs','$exp','Evenings and weekends','$status',NOW() - INTERVAL 2 DAY,$REVIEWED,$NOTE);"
  else
    MYSQL "$USER_C" "UPDATE user_db.anchor_applications
      SET status='$status', years_in_city=$years, neighborhoods_known='$hoods', languages_spoken='$langs',
          experience='$exp', reviewed_at=$REVIEWED, review_note=$NOTE
      WHERE user_profile_id=$pid;"
  fi
}
seed_anchor_app "${PID[priya.hyd@neighbornest.dev]}"  "APPROVED" 9 "Banjara Hills, Jubilee Hills, Madhapur" "English, Hindi, Telugu" "Runs a weekend trekking community with 200 members and hosts monthly potlucks."
seed_anchor_app "${PID[arjun.hyd@neighbornest.dev]}"  "APPROVED" 12 "Gachibowli, Kondapur, Hitec City" "English, Hindi, Telugu" "Startup founder who mentors newcomers on settling into Hyderabad."
seed_anchor_app "${PID[anita.mum@neighbornest.dev]}"  "APPROVED" 15 "Bandra West, Juhu, Andheri" "English, Hindi, Marathi" "Architect and long-time Bandra local; hosts walking tours of the suburbs."
seed_anchor_app "${PID[rohan.mum@neighbornest.dev]}"  "APPROVED" 10 "Andheri, Powai, Lower Parel" "English, Hindi, Marathi" "Journalist who knows every hidden cafe and live-music spot in the city."
seed_anchor_app "${PID[deepa.blr@neighbornest.dev]}"  "APPROVED" 11 "Indiranagar, Koramangala, HSR" "English, Hindi, Kannada" "UX lead who hosts design meetups and weekend cafe crawls."
seed_anchor_app "${PID[manoj.blr@neighbornest.dev]}"  "APPROVED" 8 "Koramangala, Jayanagar, BTM" "English, Kannada, Malayalam" "Engineering manager and community volunteer for new starters."
seed_anchor_app "${PID[neha.del@neighbornest.dev]}"   "APPROVED" 13 "Hauz Khas, Saket, Vasant Kunj" "English, Hindi" "Editor who runs a book club and knows the old city like the back of her hand."
seed_anchor_app "${PID[amit.del@neighbornest.dev]}"   "APPROVED" 9 "Defence Colony, Rohini, Punjabi Bagh" "English, Hindi, Punjabi" "CA who volunteers with newcomer orientation programmes."
seed_anchor_app "${PID[suhas.pun@neighbornest.dev]}"  "APPROVED" 14 "Koregaon Park, Aundh, Kothrud" "English, Hindi, Marathi" "Professor who organises heritage walks and weekend treks."
seed_anchor_app "${PID[vaishali.pun@neighbornest.dev]}" "APPROVED" 10 "Kothrud, Baner, Hinjewadi" "English, Hindi, Marathi" "Pediatrician active in neighbourhood community programmes."
seed_anchor_app "${PID[lakshmi.chn@neighbornest.dev]}" "APPROVED" 16 "Adyar, Mylapore, T. Nagar" "English, Tamil" "Professor who hosts classical music evenings and temple walks."
seed_anchor_app "${PID[vijay.chn@neighbornest.dev]}"  "APPROVED" 11 "Mylapore, Anna Nagar, Velachery" "English, Tamil, Telugu" "Architect with deep knowledge of Chennai neighbourhoods."
seed_anchor_app "${PID[rahul.hyd@neighbornest.dev]}"  "PENDING"  1 "Madhapur, Hitec City" "English, Hindi" "Data analyst eager to host tech-neighbour meetups."
seed_anchor_app "${PID[isha.mum@neighbornest.dev]}"   "PENDING"  1 "Powai, Bandra" "English, Hindi" "Consultant who would love to welcome other newcomers."
seed_anchor_app "${PID[shruti.blr@neighbornest.dev]}" "PENDING"  1 "HSR, Koramangala" "English, Kannada" "Data scientist keen on hosting data+coffee sessions."

# ── 6. Compatibility scores — pairwise within each city (deterministic) ──
seed_scores() { # seed_scores "profile_id profile_id ..." — batched: one multi-row insert per city
  local ids=($1)
  local n=${#ids[@]} a b vals lif int ovr rows=""
  for ((a=0; a<n; a++)); do
    for ((b=a+1; b<n; b++)); do
      vals=$(( 55 + (a*7 + b*13 + 3) % 36 ))
      lif=$(( 50 + (a*11 + b*3 + 7) % 33 ))
      int=$(( 45 + (a*5 + b*17 + 11) % 40 ))
      ovr=$(( (vals + lif + int) / 3 ))
      rows="$rows,(${ids[a]},${ids[b]},$vals,$lif,$int,$ovr,NOW())"
    done
  done
  MYSQL "$MATCH_C" "INSERT INTO matching_db.compatibility_scores (user_id_1,user_id_2,values_score,lifestyle_score,interest_score,overall_score,calculated_at)
    VALUES ${rows#,};"
}
for city in Hyderabad Mumbai Bengaluru Delhi Pune Chennai; do
  MYSQL "$MATCH_C" "DELETE FROM matching_db.compatibility_scores
    WHERE user_id_1 IN ($(csv_of "${CITY_IDS[$city]}")) AND user_id_2 IN ($(csv_of "${CITY_IDS[$city]}"));"
  seed_scores "${CITY_IDS[$city]}"
done

# ── 7. Nest DB — reset demo nests then insert fresh ──
DEMO_NEST_NAMES=(
  # current demo nests
  "Hyderabad Huddlers" "Cyber City Circle" "Mumbai Masti" "Powai Posse"
  "Bengaluru Buzzters" "Garden City Gang" "Dilli Dosti" "Pune Peeps"
  "Chennai Circle" "Marina Mates"
  # legacy nests from the previous SF-only seed
  "The Mission Crew" "Golden Gate Circle" "Harborview Grads" "Liam's Squad"
)

# ── 7b. Clean up legacy demo accounts from the previous SF-only seed ──
# (demo1..6@neighbornest.dev no longer exist in the new dataset; remove their
# auth rows, profiles, answers, anchor apps, scores and nest memberships)
OLD_EMAILS=("demo1@neighbornest.dev" "demo2@neighbornest.dev" "demo3@neighbornest.dev" "demo4@neighbornest.dev" "demo5@neighbornest.dev" "demo6@neighbornest.dev" "demo1.42@neighbornest.dev" "demo2.42@neighbornest.dev" "demo3.42@neighbornest.dev" "demo4.42@neighbornest.dev" "demo5.42@neighbornest.dev")
OLD_EMAILS_IN=""
for e in "${OLD_EMAILS[@]}"; do OLD_EMAILS_IN="$OLD_EMAILS_IN,'$e'"; done
OLD_EMAILS_IN="${OLD_EMAILS_IN#,}"
OLD_AUTH_IDS=$(ONE "$AUTH_C" "SELECT GROUP_CONCAT(id) FROM neighbornest_auth.users WHERE email IN ($OLD_EMAILS_IN);")
if [ -n "$OLD_AUTH_IDS" ]; then
  OLD_PROFILE_IDS=$(ONE "$USER_C" "SELECT GROUP_CONCAT(id) FROM user_db.user_profiles WHERE auth_user_id IN ($OLD_AUTH_IDS);")
  if [ -n "$OLD_PROFILE_IDS" ]; then
    MYSQL "$USER_C" "DELETE FROM user_db.onboarding_answers WHERE user_profile_id IN ($OLD_PROFILE_IDS);
      DELETE FROM user_db.anchor_applications WHERE user_profile_id IN ($OLD_PROFILE_IDS);
      DELETE FROM user_db.user_profiles WHERE id IN ($OLD_PROFILE_IDS);"
    MYSQL "$MATCH_C" "DELETE FROM matching_db.compatibility_scores WHERE user_id_1 IN ($OLD_PROFILE_IDS) OR user_id_2 IN ($OLD_PROFILE_IDS);
      DELETE FROM matching_db.match_proposal_members WHERE user_id IN ($OLD_PROFILE_IDS);"
    MYSQL "$NEST_C" "DELETE FROM nest_db.expense_splits WHERE user_id IN ($OLD_PROFILE_IDS);
      DELETE FROM nest_db.expenses WHERE payer_id IN ($OLD_PROFILE_IDS);
      DELETE FROM nest_db.vibe_checks WHERE user_id IN ($OLD_PROFILE_IDS);
      DELETE FROM nest_db.nest_members WHERE user_id IN ($OLD_PROFILE_IDS);"
  fi
  MYSQL "$AUTH_C" "DELETE FROM neighbornest_auth.users WHERE id IN ($OLD_AUTH_IDS);"
  echo "  • removed legacy SF demo accounts (demo1..6 + demo*.42@neighbornest.dev)"
fi
for name in "${DEMO_NEST_NAMES[@]}"; do
  NQ="$(sqlq "$name")"   # apostrophe-safe for SQL
  NEST_ID=$(ONE "$NEST_C" "SELECT id FROM nest_db.nests WHERE name='$NQ';")
  if [ -n "$NEST_ID" ]; then
    # drop matching proposals linked to this nest first (separate MySQL DBs)
    MYSQL "$MATCH_C" "DELETE FROM matching_db.match_proposal_members WHERE match_proposal_id IN (SELECT id FROM matching_db.match_proposals WHERE nest_id=$NEST_ID);
      DELETE FROM matching_db.match_proposals WHERE nest_id=$NEST_ID;"
  fi
  MYSQL "$NEST_C" "DELETE FROM nest_db.expense_splits WHERE expense_id IN (SELECT id FROM nest_db.expenses WHERE nest_id IN (SELECT id FROM nest_db.nests WHERE name='$NQ'));
    DELETE FROM nest_db.expenses WHERE nest_id IN (SELECT id FROM nest_db.nests WHERE name='$NQ');
    DELETE FROM nest_db.meetings WHERE nest_id IN (SELECT id FROM nest_db.nests WHERE name='$NQ');
    DELETE FROM nest_db.vibe_checks WHERE nest_id IN (SELECT id FROM nest_db.nests WHERE name='$NQ');
    DELETE FROM nest_db.nest_members WHERE nest_id IN (SELECT id FROM nest_db.nests WHERE name='$NQ');
    DELETE FROM nest_db.nests WHERE name='$NQ';"
done

# seed_nest <name> <city> <status> <start> <end> <anchor emails> <member emails>
#            <meetings SQL VALUES, @NID@ placeholder> <expenses SQL, @NID@> [<vibe SQL VALUES>]
seed_nest() {
  local name=$1 city=$2 status=$3 start=$4 end=$5
  local NQ="$(sqlq "$name")"   # apostrophe-safe for SQL
  local anchor_emails=$6 member_emails=$7 meetings=$8 expenses=$9 vibes=${10:-}
  MYSQL "$NEST_C" "INSERT INTO nest_db.nests (name,city,status,start_date,end_date,created_at,updated_at)
    VALUES ('$NQ','$city','$status','$start','$end',NOW(),NOW());"
  local NID
  NID=$(ONE "$NEST_C" "SELECT id FROM nest_db.nests WHERE name='$NQ';")
  local member_rows="" e
  for e in $anchor_emails; do member_rows="$member_rows,($NID,${PID[$e]},'ANCHOR','ACCEPTED',0,NOW() - INTERVAL 20 DAY)"; done
  for e in $member_emails; do member_rows="$member_rows,($NID,${PID[$e]},'MEMBER','ACCEPTED',0,NOW() - INTERVAL 20 DAY)"; done
  member_rows="${member_rows#,}"
  MYSQL "$NEST_C" "INSERT INTO nest_db.nest_members (nest_id,user_id,role_in_nest,status,graduated,joined_at) VALUES $member_rows;"
  if [ -n "$meetings" ]; then
    MYSQL "$NEST_C" "INSERT INTO nest_db.meetings (nest_id,venue_name,venue_address,activity_type,description,scheduled_at,status) VALUES ${meetings//@NID@/$NID};"
  fi
  if [ -n "$expenses" ]; then
    MYSQL "$NEST_C" "${expenses//@NID@/$NID}"
  fi
  if [ -n "$vibes" ]; then
    MYSQL "$NEST_C" "INSERT INTO nest_db.vibe_checks (nest_id,user_id,connection_score,comfort_score,feedback,submitted_at) VALUES ${vibes//@NID@/$NID};"
  fi
  local anchor_count member_count total
  anchor_count=$(echo $anchor_emails | wc -w)
  member_count=$(echo $member_emails | wc -w)
  total=$((anchor_count + member_count))
  echo "  • nest '$name' ($city · $status · $total people · $anchor_count anchor(s))"
  return 0
}

# Nest 1 — Hyderabad · ACTIVE (6-week journey)
seed_nest "Hyderabad Huddlers" "Hyderabad" "ACTIVE" "2026-07-20" "2026-08-31" \
  "priya.hyd@neighbornest.dev" \
  "rahul.hyd@neighbornest.dev sneha.hyd@neighbornest.dev vikram.hyd@neighbornest.dev ananya.hyd@neighbornest.dev divya.hyd@neighbornest.dev meera.hyd@neighbornest.dev" \
  "(@NID@,'Cafe Niloufer','Road No. 1, Banjara Hills','Coffee','Welcome coffee — meet your Nest!',NOW() - INTERVAL 10 DAY,'COMPLETED'),
   (@NID@,'Shilparamam','Madhapur','Walk','Arts & crafts village walk.',NOW() + INTERVAL 4 DAY,'SCHEDULED'),
   (@NID@,'Tank Bund','Hyderabad','Dinner','Sunset dinner by the lake.',NOW() + INTERVAL 11 DAY,'SCHEDULED')" \
  "INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
    (@NID@,${PID[priya.hyd@neighbornest.dev]},45.00,'Group dinner — Tank Bund','EQUAL',NOW() - INTERVAL 8 DAY);
   INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
    SELECT e.id, m.user_id, ROUND(e.amount / (SELECT COUNT(*) FROM nest_db.nest_members WHERE nest_id=e.nest_id), 2), 0
    FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=@NID@ AND e.description='Group dinner — Tank Bund';"

# Nest 2 — Hyderabad · VIBE_CHECK
seed_nest "Cyber City Circle" "Hyderabad" "VIBE_CHECK" "2026-07-13" "2026-08-24" \
  "arjun.hyd@neighbornest.dev" \
  "karthik.hyd@neighbornest.dev ravi.hyd@neighbornest.dev meera.hyd@neighbornest.dev divya.hyd@neighbornest.dev ananya.hyd@neighbornest.dev" \
  "(@NID@,'Gachibowli Lake','Gachibowli','Walk','Sunrise walk around the lake.',NOW() - INTERVAL 6 DAY,'COMPLETED'),
   (@NID@,'Chai Point','Kondapur','Coffee','Chai and board games.',NOW() + INTERVAL 3 DAY,'SCHEDULED')" \
  "INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
    (@NID@,${PID[arjun.hyd@neighbornest.dev]},30.00,'Board game night snacks','EQUAL',NOW() - INTERVAL 4 DAY);
   INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
    SELECT e.id, m.user_id, 5.00, 0 FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=@NID@;" \
  "(@NID@,${PID[arjun.hyd@neighbornest.dev]},9,8,'The group is clicking nicely.',NOW() - INTERVAL 1 DAY),
   (@NID@,${PID[karthik.hyd@neighbornest.dev]},8,7,'Loved the lake walk.',NOW() - INTERVAL 1 DAY),
   (@NID@,${PID[ravi.hyd@neighbornest.dev]},7,8,'Would love more weekend plans.',NOW() - INTERVAL 1 DAY),
   (@NID@,${PID[meera.hyd@neighbornest.dev]},9,9,'Feels like home already.',NOW() - INTERVAL 1 DAY),
   (@NID@,${PID[divya.hyd@neighbornest.dev]},8,8,'Great energy in the group.',NOW() - INTERVAL 1 DAY),
   (@NID@,${PID[ananya.hyd@neighbornest.dev]},8,7,'More hiking please!',NOW() - INTERVAL 1 DAY)"

# Nest 3 — Mumbai · ACTIVE
seed_nest "Mumbai Masti" "Mumbai" "ACTIVE" "2026-07-20" "2026-08-31" \
  "anita.mum@neighbornest.dev" \
  "isha.mum@neighbornest.dev aditya.mum@neighbornest.dev nisha.mum@neighbornest.dev kavya.mum@neighbornest.dev tara.mum@neighbornest.dev vivaan.mum@neighbornest.dev" \
  "(@NID@,'Carter Road Promenade','Bandra West','Walk','Sunset promenade walk.',NOW() - INTERVAL 9 DAY,'COMPLETED'),
   (@NID@,'Kala Ghoda Cafe','Fort','Brunch','Weekend brunch and sketch session.',NOW() + INTERVAL 5 DAY,'SCHEDULED'),
   (@NID@,'Marine Drive','Marine Lines','Dinner','Night-out dinner at Marine Drive.',NOW() + INTERVAL 12 DAY,'SCHEDULED')" \
  "INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
    (@NID@,${PID[anita.mum@neighbornest.dev]},60.00,'Marine Drive dinner','EQUAL',NOW() - INTERVAL 3 DAY);
   INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
    SELECT e.id, m.user_id, ROUND(e.amount / (SELECT COUNT(*) FROM nest_db.nest_members WHERE nest_id=e.nest_id), 2), 0
    FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=@NID@;"

# Nest 4 — Mumbai · ACTIVE
seed_nest "Powai Posse" "Mumbai" "ACTIVE" "2026-07-27" "2026-09-07" \
  "rohan.mum@neighbornest.dev" \
  "siddharth.mum@neighbornest.dev isha.mum@neighbornest.dev nisha.mum@neighbornest.dev kavya.mum@neighbornest.dev aditya.mum@neighbornest.dev" \
  "(@NID@,'Powai Lake','Powai','Walk','Morning jog followed by chai.',NOW() - INTERVAL 7 DAY,'COMPLETED'),
   (@NID@,'The Woodside Inn','Colaba','Trivia','Trivia night — team colors on!',NOW() + INTERVAL 6 DAY,'SCHEDULED')" \
  "INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
    (@NID@,${PID[rohan.mum@neighbornest.dev]},25.00,'Carpool fuel','EQUAL',NOW() - INTERVAL 5 DAY);
   INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
    SELECT e.id, m.user_id, ROUND(e.amount / (SELECT COUNT(*) FROM nest_db.nest_members WHERE nest_id=e.nest_id), 2), 0
    FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=@NID@;"

# Nest 5 — Bengaluru · ACTIVE
seed_nest "Bengaluru Buzzters" "Bengaluru" "ACTIVE" "2026-07-20" "2026-08-31" \
  "deepa.blr@neighbornest.dev" \
  "shruti.blr@neighbornest.dev nitin.blr@neighbornest.dev pallavi.blr@neighbornest.dev ritu.blr@neighbornest.dev ganesh.blr@neighbornest.dev kiran.blr@neighbornest.dev" \
  "(@NID@,'Cubbon Park','Cubbon Park','Walk','Sunday morning park walk.',NOW() - INTERVAL 8 DAY,'COMPLETED'),
   (@NID@,'Third Wave Coffee','Church Street','Coffee','Coffee tasting session.',NOW() + INTERVAL 4 DAY,'SCHEDULED'),
   (@NID@,'Commercial Street','Commercial Street','Dinner','Street-food crawl dinner.',NOW() + INTERVAL 13 DAY,'SCHEDULED')" \
  "INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
    (@NID@,${PID[deepa.blr@neighbornest.dev]},48.00,'Street food crawl','EQUAL',NOW() - INTERVAL 2 DAY);
   INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
    SELECT e.id, m.user_id, ROUND(e.amount / (SELECT COUNT(*) FROM nest_db.nest_members WHERE nest_id=e.nest_id), 2), 0
    FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=@NID@;"

# Nest 6 — Bengaluru · VIBE_CHECK
seed_nest "Garden City Gang" "Bengaluru" "VIBE_CHECK" "2026-07-13" "2026-08-24" \
  "manoj.blr@neighbornest.dev" \
  "akash.blr@neighbornest.dev shruti.blr@neighbornest.dev nitin.blr@neighbornest.dev pallavi.blr@neighbornest.dev kiran.blr@neighbornest.dev" \
  "(@NID@,'Lal Bagh','Lal Bagh','Walk','Botanical garden walk.',NOW() - INTERVAL 5 DAY,'COMPLETED'),
   (@NID@,'Toit Brewpub','Indiranagar','Dinner','Craft beer + dinner.',NOW() + INTERVAL 3 DAY,'SCHEDULED')" \
  "INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
    (@NID@,${PID[manoj.blr@neighbornest.dev]},35.00,'Movie night snacks','EQUAL',NOW() - INTERVAL 4 DAY);
   INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
    SELECT e.id, m.user_id, ROUND(e.amount / (SELECT COUNT(*) FROM nest_db.nest_members WHERE nest_id=e.nest_id), 2), 0
    FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=@NID@;" \
  "(@NID@,${PID[manoj.blr@neighbornest.dev]},8,8,'Solid group, great mix.',NOW() - INTERVAL 1 DAY),
   (@NID@,${PID[akash.blr@neighbornest.dev]},7,8,'The park walk was lovely.',NOW() - INTERVAL 1 DAY),
   (@NID@,${PID[shruti.blr@neighbornest.dev]},8,7,'Great conversations.',NOW() - INTERVAL 1 DAY),
   (@NID@,${PID[nitin.blr@neighbornest.dev]},9,8,'Best group I have joined.',NOW() - INTERVAL 1 DAY),
   (@NID@,${PID[pallavi.blr@neighbornest.dev]},8,9,'Food crawl next, please!',NOW() - INTERVAL 1 DAY),
   (@NID@,${PID[kiran.blr@neighbornest.dev]},7,7,'All good from my side.',NOW() - INTERVAL 1 DAY)"

# Nest 7 — Delhi · ACTIVE (2 Anchors)
seed_nest "Dilli Dosti" "Delhi" "ACTIVE" "2026-07-20" "2026-08-31" \
  "neha.del@neighbornest.dev amit.del@neighbornest.dev" \
  "pooja.del@neighbornest.dev rajat.del@neighbornest.dev simran.del@neighbornest.dev gaurav.del@neighbornest.dev anika.del@neighbornest.dev" \
  "(@NID@,'Hauz Khas Village','Hauz Khas','Walk','Lake walk through the village.',NOW() - INTERVAL 9 DAY,'COMPLETED'),
   (@NID@,'India Gate Lawns','India Gate','Walk','Evening picnic by India Gate.',NOW() + INTERVAL 5 DAY,'SCHEDULED')" \
  "INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
    (@NID@,${PID[neha.del@neighbornest.dev]},40.00,'Picnic supplies','EQUAL',NOW() - INTERVAL 3 DAY);
   INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
    SELECT e.id, m.user_id, ROUND(e.amount / (SELECT COUNT(*) FROM nest_db.nest_members WHERE nest_id=e.nest_id), 2), 0
    FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=@NID@;"

# Nest 8 — Pune · ACTIVE (2 Anchors)
seed_nest "Pune Peeps" "Pune" "ACTIVE" "2026-07-20" "2026-08-31" \
  "suhas.pun@neighbornest.dev vaishali.pun@neighbornest.dev" \
  "rohit.pun@neighbornest.dev prajakta.pun@neighbornest.dev om.pun@neighbornest.dev tanvi.pun@neighbornest.dev sanket.pun@neighbornest.dev" \
  "(@NID@,'Koregaon Park','Koregaon Park','Walk','Saturday morning park walk.',NOW() - INTERVAL 8 DAY,'COMPLETED'),
   (@NID@,'German Bakery','Koregaon Park','Brunch','Brunch and ice-breakers.',NOW() + INTERVAL 4 DAY,'SCHEDULED')" \
  "INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
    (@NID@,${PID[suhas.pun@neighbornest.dev]},32.00,'Brunch split','EQUAL',NOW() - INTERVAL 4 DAY);
   INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
    SELECT e.id, m.user_id, ROUND(e.amount / (SELECT COUNT(*) FROM nest_db.nest_members WHERE nest_id=e.nest_id), 2), 0
    FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=@NID@;"

# Nest 9 — Chennai · GRADUATED (completed journey)
seed_nest "Chennai Circle" "Chennai" "GRADUATED" "2026-05-01" "2026-06-12" \
  "lakshmi.chn@neighbornest.dev" \
  "priya.chn@neighbornest.dev bala.chn@neighbornest.dev meenakshi.chn@neighbornest.dev arun.chn@neighbornest.dev" \
  "(@NID@,'Marina Beach','Marina','Walk','Sunrise walk along the beach.',NOW() - INTERVAL 60 DAY,'COMPLETED'),
   (@NID@,'Semmozhi Poonga','Teynampet','Walk','Graduation picnic — thank you everyone!',NOW() - INTERVAL 55 DAY,'COMPLETED')" \
  "INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
    (@NID@,${PID[lakshmi.chn@neighbornest.dev]},80.00,'Graduation dinner','EQUAL',NOW() - INTERVAL 56 DAY);
   INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
    SELECT e.id, m.user_id, 16.00, 1 FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=@NID@;"

# Nest 10 — Chennai · ACTIVE
seed_nest "Marina Mates" "Chennai" "ACTIVE" "2026-07-20" "2026-08-31" \
  "vijay.chn@neighbornest.dev" \
  "priya.chn@neighbornest.dev bala.chn@neighbornest.dev harini.chn@neighbornest.dev meenakshi.chn@neighbornest.dev arun.chn@neighbornest.dev" \
  "(@NID@,'Elliot Beach','Besant Nagar','Walk','Sunset beach walk and ice cream.',NOW() - INTERVAL 7 DAY,'COMPLETED'),
   (@NID@,'Murugan Idli Shop','Besant Nagar','Dinner','South Indian dinner night.',NOW() + INTERVAL 5 DAY,'SCHEDULED')" \
  "INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
    (@NID@,${PID[vijay.chn@neighbornest.dev]},22.00,'Ice cream run','EQUAL',NOW() - INTERVAL 6 DAY);
   INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
    SELECT e.id, m.user_id, ROUND(e.amount / (SELECT COUNT(*) FROM nest_db.nest_members WHERE nest_id=e.nest_id), 2), 0
    FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=@NID@;"

# ── 8. Matching — pending proposals (anchor + members) & completed one ──
# Idempotent: drop any earlier PENDING proposals (not tied to a nest) first.
MYSQL "$MATCH_C" "DELETE FROM matching_db.match_proposal_members WHERE match_proposal_id IN (SELECT id FROM matching_db.match_proposals WHERE nest_id IS NULL);
  DELETE FROM matching_db.match_proposals WHERE nest_id IS NULL;"
EXPIRY=$(date -u -d '+48 hours' +'%Y-%m-%d %H:%M:%S')
# Pending proposal 1 — Hyderabad (Rahul, Sneha, Vikram get the invitation)
MYSQL "$MATCH_C" "INSERT INTO matching_db.match_proposals (status,expires_at,proposed_at) VALUES ('PENDING','$EXPIRY',NOW());
  INSERT INTO matching_db.match_proposal_members (match_proposal_id,user_id,role_in_nest,response,responded_at) VALUES
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY'),${PID[priya.hyd@neighbornest.dev]},'ANCHOR','ACCEPTED',NOW()),
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY'),${PID[rahul.hyd@neighbornest.dev]},'MEMBER','PENDING',NULL),
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY'),${PID[sneha.hyd@neighbornest.dev]},'MEMBER','PENDING',NULL),
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY'),${PID[vikram.hyd@neighbornest.dev]},'MEMBER','PENDING',NULL);"
# Pending proposal 2 — Mumbai (Isha, Nisha, Siddharth get the invitation)
EXPIRY2=$(date -u -d '+72 hours' +'%Y-%m-%d %H:%M:%S')
MYSQL "$MATCH_C" "INSERT INTO matching_db.match_proposals (status,expires_at,proposed_at) VALUES ('PENDING','$EXPIRY2',NOW());
  INSERT INTO matching_db.match_proposal_members (match_proposal_id,user_id,role_in_nest,response,responded_at) VALUES
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY2'),${PID[rohan.mum@neighbornest.dev]},'ANCHOR','ACCEPTED',NOW()),
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY2'),${PID[isha.mum@neighbornest.dev]},'MEMBER','PENDING',NULL),
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY2'),${PID[nisha.mum@neighbornest.dev]},'MEMBER','PENDING',NULL),
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY2'),${PID[siddharth.mum@neighbornest.dev]},'MEMBER','PENDING',NULL);"
# Completed proposal → the Hyderabad Huddlers nest (idempotent: drop first)
HYD_NEST=$(ONE "$NEST_C" "SELECT id FROM nest_db.nests WHERE name='Hyderabad Huddlers';")
MYSQL "$MATCH_C" "DELETE FROM matching_db.match_proposal_members WHERE match_proposal_id IN (SELECT id FROM matching_db.match_proposals WHERE nest_id=$HYD_NEST);
  DELETE FROM matching_db.match_proposals WHERE nest_id=$HYD_NEST;
  INSERT INTO matching_db.match_proposals (status,expires_at,proposed_at,accepted_at,nest_id) VALUES ('COMPLETED',NOW() - INTERVAL 20 DAY,NOW() - INTERVAL 22 DAY,NOW() - INTERVAL 20 DAY,$HYD_NEST);
  INSERT INTO matching_db.match_proposal_members (match_proposal_id,user_id,role_in_nest,response,responded_at) VALUES
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$HYD_NEST),${PID[priya.hyd@neighbornest.dev]},'ANCHOR','ACCEPTED',NOW() - INTERVAL 20 DAY),
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$HYD_NEST),${PID[rahul.hyd@neighbornest.dev]},'MEMBER','ACCEPTED',NOW() - INTERVAL 20 DAY),
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$HYD_NEST),${PID[sneha.hyd@neighbornest.dev]},'MEMBER','ACCEPTED',NOW() - INTERVAL 20 DAY),
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$HYD_NEST),${PID[vikram.hyd@neighbornest.dev]},'MEMBER','ACCEPTED',NOW() - INTERVAL 20 DAY),
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$HYD_NEST),${PID[ananya.hyd@neighbornest.dev]},'MEMBER','ACCEPTED',NOW() - INTERVAL 20 DAY),
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$HYD_NEST),${PID[divya.hyd@neighbornest.dev]},'MEMBER','ACCEPTED',NOW() - INTERVAL 20 DAY),
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$HYD_NEST),${PID[meera.hyd@neighbornest.dev]},'MEMBER','ACCEPTED',NOW() - INTERVAL 20 DAY);"

# ── 9. Chat — demo direct-message conversations + Nest group chats ──
# seed_dm <email1> <email2> <"senderEmail|content|hoursAgo">...
#   finds-or-creates the unique conversation, replaces its messages and adds
#   read receipts for everyone except the newest message (so unread badges show).
seed_dm() {
  local e1=$1 e2=$2; shift 2
  local a b p1 p2
  a=${PID[$e1]}; b=${PID[$e2]}; p1=$a; p2=$b
  if [ "$p1" -gt "$p2" ]; then p1=$b; p2=$a; fi
  local EXISTS
  EXISTS=$(ONE "$CHAT_C" "SELECT COUNT(*) FROM chat_db.conversations WHERE participant1_id=$p1 AND participant2_id=$p2;")
  if [ "$EXISTS" = "0" ]; then
    MYSQL "$CHAT_C" "INSERT INTO chat_db.conversations (participant1_id,participant2_id,created_at) VALUES ($p1,$p2,NOW() - INTERVAL 5 DAY);"
  fi
  local CID
  CID=$(ONE "$CHAT_C" "SELECT id FROM chat_db.conversations WHERE participant1_id=$p1 AND participant2_id=$p2;")
  MYSQL "$CHAT_C" "DELETE FROM chat_db.read_receipts WHERE message_id IN (SELECT id FROM chat_db.messages WHERE conversation_id=$CID);
    DELETE FROM chat_db.messages WHERE conversation_id=$CID;"
  local rows="" semail msg hours sender
  for item in "$@"; do
    semail="${item%%|*}"; rest="${item#*|}"; msg="${rest%%|*}"; hours="${rest#*|}"
    sender=${PID[$semail]}
    rows="$rows,($CID,$sender,'$(sqlq "$msg")','TEXT',NOW() - INTERVAL $hours HOUR)"
  done
  MYSQL "$CHAT_C" "INSERT INTO chat_db.messages (conversation_id,sender_id,content,message_type,created_at) VALUES ${rows#,};"
  # receipts: every message except the newest is read by both participants
  MYSQL "$CHAT_C" "INSERT IGNORE INTO chat_db.read_receipts (message_id,user_id,read_at)
    SELECT m.id, u.uid, m.created_at
    FROM chat_db.messages m
    JOIN (SELECT $p1 AS uid UNION ALL SELECT $p2) u
    WHERE m.conversation_id=$CID AND m.id < (SELECT MAX(id) FROM chat_db.messages WHERE conversation_id=$CID);"
  echo "  • dm: $e1 <-> $e2"
}
# seed_group <nestName> <"senderEmail|content|hoursAgo">...
seed_group() {
  local name=$1; shift
  local NQ="$(sqlq "$name")"
  local NID
  NID=$(ONE "$NEST_C" "SELECT id FROM nest_db.nests WHERE name='$NQ';")
  if [ -z "$NID" ]; then echo "  • group chat skipped for '$name' (not found)"; return; fi
  MYSQL "$CHAT_C" "DELETE FROM chat_db.read_receipts WHERE message_id IN (SELECT id FROM chat_db.messages WHERE room_type='NEST_GROUP' AND nest_id=$NID);
    DELETE FROM chat_db.messages WHERE room_type='NEST_GROUP' AND nest_id=$NID;"
  local rows="" semail msg hours sender
  for item in "$@"; do
    semail="${item%%|*}"; rest="${item#*|}"; msg="${rest%%|*}"; hours="${rest#*|}"
    sender=${PID[$semail]}
    rows="$rows,('NEST_GROUP',$NID,$sender,'$(sqlq "$msg")','TEXT',NOW() - INTERVAL $hours HOUR)"
  done
  MYSQL "$CHAT_C" "INSERT INTO chat_db.messages (room_type,nest_id,sender_id,content,message_type,created_at)
    VALUES ${rows#,};"
  echo "  • group chat: $name"
}

seed_dm "priya.hyd@neighbornest.dev" "rahul.hyd@neighbornest.dev" \
  "priya.hyd@neighbornest.dev|Welcome to the Nest, Rahul! 👋 So glad to have you|96" \
  "rahul.hyd@neighbornest.dev|Thanks Priya — really excited to meet everyone!|90" \
  "priya.hyd@neighbornest.dev|First coffee is at Cafe Niloufer this Sunday, 5pm|70" \
  "rahul.hyd@neighbornest.dev|Count me in 🙌 I'll bring the other members too|60" \
  "priya.hyd@neighbornest.dev|Perfect. See you at 5!|20"
seed_dm "priya.hyd@neighbornest.dev" "sneha.hyd@neighbornest.dev" \
  "priya.hyd@neighbornest.dev|Sneha, loved your design ideas at the walk yesterday|50" \
  "sneha.hyd@neighbornest.dev|Aww thank you! I can sketch the Nest meetup posters too|44" \
  "priya.hyd@neighbornest.dev|That would be amazing for the Shilparamam visit|36"
seed_dm "rahul.hyd@neighbornest.dev" "vikram.hyd@neighbornest.dev" \
  "rahul.hyd@neighbornest.dev|Hey Vikram, are you joining the Shilparamam walk?|30" \
  "vikram.hyd@neighbornest.dev|Yes! Bringing my camera 📷|22" \
  "rahul.hyd@neighbornest.dev|Awesome, see you there|12"
seed_dm "anita.mum@neighbornest.dev" "isha.mum@neighbornest.dev" \
  "anita.mum@neighbornest.dev|Isha, welcome to Mumbai Masti! Coffee at Kala Ghoda on Saturday?|80" \
  "isha.mum@neighbornest.dev|Would love that. 4pm works for me ☕|72"

seed_group "Hyderabad Huddlers" \
  "priya.hyd@neighbornest.dev|Welcome to Hyderabad Huddlers! We're 7 neighbors on a 6-week journey 🎉|110" \
  "rahul.hyd@neighbornest.dev|Hi everyone! Moved to Madhapur last month — great to meet you all|100" \
  "sneha.hyd@neighbornest.dev|Rahul, Madhapur is perfect — close to Hitec City for the meetups|96" \
  "vikram.hyd@neighbornest.dev|Anyone up for the Shilparamam arts walk on Sunday?|80" \
  "ananya.hyd@neighbornest.dev|Count me in! I've heard the crafts village is lovely|70" \
  "priya.hyd@neighbornest.dev|Confirmed — meet at the main gate, 5pm sharp!|20"
seed_group "Mumbai Masti" \
  "anita.mum@neighbornest.dev|Welcome aboard Mumbai Masti! 🌊|100" \
  "isha.mum@neighbornest.dev|So excited for the Marine Drive dinners|88" \
  "rohan.mum@neighbornest.dev|Save the date — brunch at Kala Ghoda this Saturday|30"

# ── 10. Notifications — demo inboxes for the test accounts ──
# seed_notif <email> <type> <title> <message> <status> <entityType> <entityId> <hoursAgo>
seed_notif() {
  local email=$1 type=$2 title=$3 msg=$4 status=$5 etype=$6 eid=$7 hours=$8
  local uid=${PID[$email]}
  if [ "$status" = "READ" ]; then
    MYSQL "$NOTIF_C" "INSERT INTO notification_db.notifications
      (user_id,type,title,message,channel,status,related_entity_type,related_entity_id,sent_at,read_at,created_at)
      VALUES ($uid,'$type','$(sqlq "$title")','$(sqlq "$msg")','IN_APP','READ','$etype',$eid,NOW() - INTERVAL $hours HOUR,NOW() - INTERVAL $hours HOUR,NOW() - INTERVAL $hours HOUR);"
  else
    MYSQL "$NOTIF_C" "INSERT INTO notification_db.notifications
      (user_id,type,title,message,channel,status,related_entity_type,related_entity_id,sent_at,created_at)
      VALUES ($uid,'$type','$(sqlq "$title")','$(sqlq "$msg")','IN_APP','SENT','$etype',$eid,NOW() - INTERVAL $hours HOUR,NOW() - INTERVAL $hours HOUR);"
  fi
}
# clear previous demo notifications (idempotent)
ALL_PIDS=""
for row in "${SEED_USERS[@]}"; do
  IFS='|' read -r email _ <<< "$row"
  ALL_PIDS="$ALL_PIDS,${PID[$email]}"
done
ALL_PIDS="${ALL_PIDS#,}"
MYSQL "$NOTIF_C" "DELETE FROM notification_db.notifications WHERE user_id IN ($ALL_PIDS);"
# resolve demo entity ids (dynamic across seed runs)
HYD_NID=$(ONE "$NEST_C" "SELECT id FROM nest_db.nests WHERE name='Hyderabad Huddlers';")
MUM_NID=$(ONE "$NEST_C" "SELECT id FROM nest_db.nests WHERE name='Mumbai Masti';")
HYD_EXP=$(ONE "$NEST_C" "SELECT id FROM nest_db.expenses WHERE nest_id=$HYD_NID AND description LIKE 'Group dinner%' ORDER BY id LIMIT 1;")
HYD_MTG=$(ONE "$NEST_C" "SELECT id FROM nest_db.meetings WHERE nest_id=$HYD_NID AND venue_name='Cafe Niloufer' ORDER BY id LIMIT 1;")
MUM_MTG=$(ONE "$NEST_C" "SELECT id FROM nest_db.meetings WHERE nest_id=$MUM_NID AND venue_name='Kala Ghoda Cafe' ORDER BY id LIMIT 1;")

seed_notif "rahul.hyd@neighbornest.dev" "NEST_CREATED" "Welcome to Hyderabad Huddlers!" "You're in — 7 neighbors are ready for the 6-week journey with you." "READ" "NEST" "$HYD_NID" 100
seed_notif "rahul.hyd@neighbornest.dev" "MEETING_REMINDER" "Coffee at Cafe Niloufer, Sunday 5pm" "Your Nest meetup is coming up — Banjara Hills. Don't be late!" "SENT" "MEETING" "$HYD_MTG" 20
seed_notif "rahul.hyd@neighbornest.dev" "EXPENSE_SPLIT" "You owe ₹6.43 for the group dinner" "Group dinner — Tank Bund was split equally. Settle your share when you can." "SENT" "EXPENSE" "$HYD_EXP" 44
seed_notif "rahul.hyd@neighbornest.dev" "CHAT_MESSAGE" "Priya Sharma sent you a message" "\"Perfect. See you at 5!\" — replied in your direct chat." "SENT" "CHAT" "NULL" 20
seed_notif "priya.hyd@neighbornest.dev" "NEST_CREATED" "Your Nest is live — Hyderabad Huddlers" "All 7 members are in. Time to plan the first meetup!" "READ" "NEST" "$HYD_NID" 100
seed_notif "priya.hyd@neighbornest.dev" "VIBE_CHECK_DUE" "Week 4 vibe check is due" "Check in on how the group is feeling — it only takes a minute." "SENT" "NEST" "$HYD_NID" 30
seed_notif "priya.hyd@neighbornest.dev" "EXPENSE_SPLIT" "New expense added: Group dinner" "You added a ₹45 expense — 7 people owe you ₹6.43 each." "READ" "EXPENSE" "$HYD_EXP" 44
seed_notif "sneha.hyd@neighbornest.dev" "NEST_CREATED" "Welcome to Hyderabad Huddlers!" "Priya invited you to a 6-week Nest in Hyderabad." "READ" "NEST" "$HYD_NID" 100
seed_notif "sneha.hyd@neighbornest.dev" "CHAT_MESSAGE" "Priya Sharma sent you a message" "\"That would be amazing for the Shilparamam visit\" — new message in your chat." "SENT" "CHAT" "NULL" 36
seed_notif "isha.mum@neighbornest.dev" "NEST_CREATED" "Welcome to Mumbai Masti!" "Anita invited you to a 6-week Nest in Mumbai." "READ" "NEST" "$MUM_NID" 80
seed_notif "isha.mum@neighbornest.dev" "MEETING_REMINDER" "Brunch at Kala Ghoda Cafe, Saturday" "Mumbai Masti meetup — don't miss it!" "SENT" "MEETING" "$MUM_MTG" 28

echo
echo "Seeding complete ✔"
echo "  61 demo accounts · 12 Anchors · 48 Newcomers · 1 Admin · 10 Nests in 6 cities"
echo "  6 demo chat conversations · 2 Nest group chats · 11 demo notifications"
echo "  Password for every account: $PASSWORD"
echo
echo "  ★ TEST ANCHOR  — priya.hyd@neighbornest.dev  (Priya Sharma — Anchor in Hyderabad, active Nest + journey progress)"
echo "  ★ TEST USER    — rahul.hyd@neighbornest.dev   (Rahul Verma — newcomer in Hyderabad, pending Nest invitation + matches)"
echo
echo "  Also available:"
echo "    anita.mum@neighbornest.dev  (Anchor — Mumbai)      isha.mum@neighbornest.dev  (Newcomer — Mumbai, Nest invitation)"
echo "    deepa.blr@neighbornest.dev  (Anchor — Bengaluru)   shruti.blr@neighbornest.dev (Newcomer — Bengaluru)"
echo "    neha.del@neighbornest.dev   (Anchor — Delhi)       pooja.del@neighbornest.dev  (Newcomer — Delhi)"
echo "    suhas.pun@neighbornest.dev  (Anchor — Pune)        rohit.pun@neighbornest.dev  (Newcomer — Pune)"
echo "    vijay.chn@neighbornest.dev  (Anchor — Chennai)     bala.chn@neighbornest.dev   (Newcomer — Chennai)"
echo "    admin@neighbornest.dev      (Admin — review anchor applications)"
