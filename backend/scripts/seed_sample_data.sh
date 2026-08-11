#!/usr/bin/env bash
# ============================================================================
# seed_sample_data.sh — Seeds NeighborNest MySQL databases with coherent
# sample data so the frontend has rich content to render.
#
# Populates:
#   - auth     : 6 demo members (2 Anchors) + 1 Admin  — password: Demo@1234
#   - user     : profiles, onboarding answers, approved + pending anchor apps
#   - matching : compatibility scores + a pending proposal + a completed one
#   - nest     : 3 nests (ACTIVE, VIBE_CHECK, GRADUATED) with members,
#                meetings, expenses/splits and vibe-check submissions
#
# Idempotent: re-running refreshes the demo rows (keyed by demo email / nest
# name) without touching any other data. Requires the Docker MySQL containers
# from docker-compose.yml and backend/.env with MYSQL_ROOT_PASSWORD.
#
# Usage:  bash backend/scripts/seed_sample_data.sh
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

# ── Credentials from backend/.env ──
set -a; source .env; set +a

AUTH_C=neighbornest-mysql-auth
USER_C=neighbornest-mysql-user
MATCH_C=neighbornest-mysql-matching
NEST_C=neighbornest-mysql-nest

PASSWORD="Demo@1234"
PHOTO="https://randomuser.me/api/portraits"

# ── helpers ──
# MYSQL <container> <sql> — run SQL, hide the password warning. Any SQL error
# is printed AND aborts the script, so a partial seed can never go unnoticed.
MYSQL() {
  local OUT
  OUT=$(docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" "$1" mysql -uroot -e "$2" 2>&1 | grep -v "Warning" || true)
  if printf '%s' "$OUT" | grep -q "ERROR"; then
    printf '%s\n' "$OUT" >&2
    echo "Seeding aborted due to a SQL error in container $1." >&2
    exit 1
  fi
  printf '%s\n' "$OUT"
}
ONE() { # ONE <container> <sql> — single scalar value
  docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" "$1" mysql -uroot -N -e "$2" 2>/dev/null | head -1
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

# ── 2. Demo users (email|full name|role|photo|city|neighborhood) ──
SEED_USERS=(
  "demo1@neighbornest.dev|Priya Sharma|ANCHOR|women/44.jpg|San Francisco|Mission District"
  "demo2@neighbornest.dev|Marcus Lee|ANCHOR|men/32.jpg|San Francisco|Noe Valley"
  "demo3@neighbornest.dev|Aisha Patel|NEWCOMER|women/68.jpg|San Francisco|Castro"
  "demo4@neighbornest.dev|Diego Ruiz|NEWCOMER|men/75.jpg|San Francisco|SoMa"
  "demo5@neighbornest.dev|Hana Tanaka|NEWCOMER|women/12.jpg|San Francisco|Richmond"
  "demo6@neighbornest.dev|Liam Costa|NEWCOMER|men/86.jpg|San Francisco|Sunset"
  "admin@neighbornest.dev|Nest Admin|ADMIN|men/11.jpg|San Francisco|Downtown"
)
for row in "${SEED_USERS[@]}"; do
  IFS='|' read -r email name role photo city hood <<< "$row"
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
  echo "  • user $email ($role)"
done

# ── 3. Resolve auth + profile ids ──
D1=$(ONE "$AUTH_C" "SELECT id FROM neighbornest_auth.users WHERE email='demo1@neighbornest.dev';")
D2=$(ONE "$AUTH_C" "SELECT id FROM neighbornest_auth.users WHERE email='demo2@neighbornest.dev';")
D3=$(ONE "$AUTH_C" "SELECT id FROM neighbornest_auth.users WHERE email='demo3@neighbornest.dev';")
D4=$(ONE "$AUTH_C" "SELECT id FROM neighbornest_auth.users WHERE email='demo4@neighbornest.dev';")
D5=$(ONE "$AUTH_C" "SELECT id FROM neighbornest_auth.users WHERE email='demo5@neighbornest.dev';")
D6=$(ONE "$AUTH_C" "SELECT id FROM neighbornest_auth.users WHERE email='demo6@neighbornest.dev';")
AD=$(ONE "$AUTH_C" "SELECT id FROM neighbornest_auth.users WHERE email='admin@neighbornest.dev';")

# ── 4. User profiles (auth_id|role|occ|personality|work|schedule|goal|budget|years|photo) ──
# NOTE: no full_name here — it is resolved from the auth users table below.
PROFILES=(
  "$D1|ANCHOR|Software Engineer|EXTROVERT|FULL_TIME|EVENING|FRIENDSHIP|HIGH|8|women/44.jpg"
  "$D2|ANCHOR|Teacher|AMBIVERT|FULL_TIME|FLEXIBLE|COMMUNITY|MEDIUM|6|men/32.jpg"
  "$D3|NEWCOMER|Designer|INTROVERT|FREELANCE|EVENING|FRIENDSHIP|MEDIUM|2|women/68.jpg"
  "$D4|NEWCOMER|Graduate Student|AMBIVERT|STUDENT|MORNING|NETWORKING|LOW|3|men/75.jpg"
  "$D5|NEWCOMER|Nurse|EXTROVERT|FULL_TIME|FLEXIBLE|COMMUNITY|MEDIUM|5|women/12.jpg"
  "$D6|NEWCOMER|Barista|INTROVERT|PART_TIME|NIGHT_OWL|HOUSING_MATE|LOW|1|men/86.jpg"
  "$AD|ADMIN|Product Manager|AMBIVERT|FULL_TIME|MORNING|COMMUNITY|HIGH|10|men/11.jpg"
)
for p in "${PROFILES[@]}"; do
  IFS='|' read -r aid role occ pers work sched goal budget years photo <<< "$p"
  NAME=$(ONE "$AUTH_C" "SELECT full_name FROM neighbornest_auth.users WHERE id=$aid;")
  EXISTS=$(ONE "$USER_C" "SELECT COUNT(*) FROM user_db.user_profiles WHERE auth_user_id=$aid;")
  if [ "$EXISTS" = "0" ]; then
    MYSQL "$USER_C" "INSERT INTO user_db.user_profiles
      (auth_user_id,full_name,city,neighborhood,years_in_city,occupation,work_type,personality_type,schedule_preference,social_goal,budget_level,role,is_onboarded,profile_photo_url,created_at,updated_at)
      VALUES ($aid,'$NAME','San Francisco','Mission District',$years,'$occ','$work','$pers','$sched','$goal','$budget','$role',1,'$PHOTO/$photo',NOW(),NOW());"
  else
    MYSQL "$USER_C" "UPDATE user_db.user_profiles
      SET role='$role', full_name='$NAME', occupation='$occ', work_type='$work', personality_type='$pers',
          schedule_preference='$sched', social_goal='$goal', budget_level='$budget',
          years_in_city=$years, is_onboarded=1, profile_photo_url='$PHOTO/$photo', updated_at=NOW()
      WHERE auth_user_id=$aid;"
  fi
done
P1=$(ONE "$USER_C" "SELECT id FROM user_db.user_profiles WHERE auth_user_id=$D1;")
P2=$(ONE "$USER_C" "SELECT id FROM user_db.user_profiles WHERE auth_user_id=$D2;")
P3=$(ONE "$USER_C" "SELECT id FROM user_db.user_profiles WHERE auth_user_id=$D3;")
P4=$(ONE "$USER_C" "SELECT id FROM user_db.user_profiles WHERE auth_user_id=$D4;")
P5=$(ONE "$USER_C" "SELECT id FROM user_db.user_profiles WHERE auth_user_id=$D5;")
P6=$(ONE "$USER_C" "SELECT id FROM user_db.user_profiles WHERE auth_user_id=$D6;")

# ── 5. Onboarding answers (values_* + interests_*) for every demo profile ──
for pid in "$P1" "$P2" "$P3" "$P4" "$P5" "$P6"; do
  for pair in "values_family:4" "values_adventure:4" "values_growth:3" "values_community:5" "interests_hiking:2" "interests_board_games:2" "interests_coffee:2" "interests_music:2"; do
    key="${pair%%:*}"; w="${pair##*:}"
    EXISTS=$(ONE "$USER_C" "SELECT COUNT(*) FROM user_db.onboarding_answers WHERE user_profile_id=$pid AND question_key='$key';")
    if [ "$EXISTS" = "0" ]; then
      MYSQL "$USER_C" "INSERT INTO user_db.onboarding_answers (user_profile_id,question_key,answer_value,weight,created_at) VALUES ($pid,'$key','$w',$w,NOW());"
    fi
  done
done

# ── 6. Anchor applications (approved for Anchors, pending for two newcomers) ──
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
seed_anchor_app "$P1" "APPROVED" 8 "Mission District, Noe Valley, Castro" "English, Hindi" "Hosted a monthly potluck for 2 years and run a hiking meetup with 60 members."
seed_anchor_app "$P2" "APPROVED" 6 "Noe Valley, Bernal Heights, Glen Park" "English, Spanish" "Teacher at the local high school; coached the neighborhood soccer team."
seed_anchor_app "$P3" "PENDING"  2 "Castro, The Mission" "English, Gujarati" "Active in the design community; would love to host newcomers."
seed_anchor_app "$P4" "PENDING"  3 "SoMa, Dogpatch" "English, Spanish" "Grad student who knows the best study spots and cheap eats in the city."

# ── 7. Compatibility scores between the six demo members ──
scores=(
  "$P1|$P2|82|78|85|82" "$P1|$P3|74|70|72|72" "$P1|$P4|68|66|70|68" "$P1|$P5|88|85|80|85" "$P1|$P6|62|58|66|61"
  "$P2|$P3|70|72|68|70" "$P2|$P4|76|74|78|76" "$P2|$P5|66|70|64|67" "$P2|$P6|58|62|55|59"
  "$P3|$P4|80|78|82|80" "$P3|$P5|72|68|74|71" "$P3|$P6|64|60|68|63"
  "$P4|$P5|69|66|72|68" "$P4|$P6|77|80|74|78"
  "$P5|$P6|60|56|64|59"
)
for s in "${scores[@]}"; do
  IFS='|' read -r a b val lif int ovr <<< "$s"
  EXISTS=$(ONE "$MATCH_C" "SELECT COUNT(*) FROM matching_db.compatibility_scores WHERE (user_id_1=$a AND user_id_2=$b) OR (user_id_1=$b AND user_id_2=$a);")
  if [ "$EXISTS" = "0" ]; then
    MYSQL "$MATCH_C" "INSERT INTO matching_db.compatibility_scores (user_id_1,user_id_2,values_score,lifestyle_score,interest_score,overall_score,calculated_at) VALUES ($a,$b,$val,$lif,$int,$ovr,NOW());"
  fi
done

# ── 8. Nest DB — reset demo nests then insert fresh ──
for name in "The Mission Crew" "Golden Gate Circle" "Harborview Grads"; do
  # drop matching proposals linked to this nest first (matching and nest live in
  # different MySQL containers, so we must delete from each DB separately)
  NEST_ID=$(ONE "$NEST_C" "SELECT id FROM nest_db.nests WHERE name='$name';")
  if [ -n "$NEST_ID" ]; then
    MYSQL "$MATCH_C" "DELETE FROM matching_db.match_proposal_members WHERE match_proposal_id IN (SELECT id FROM matching_db.match_proposals WHERE nest_id=$NEST_ID);
      DELETE FROM matching_db.match_proposals WHERE nest_id=$NEST_ID;"
  fi
  MYSQL "$NEST_C" "DELETE FROM nest_db.expense_splits WHERE expense_id IN (SELECT id FROM nest_db.expenses WHERE nest_id IN (SELECT id FROM nest_db.nests WHERE name='$name'));
    DELETE FROM nest_db.expenses WHERE nest_id IN (SELECT id FROM nest_db.nests WHERE name='$name');
    DELETE FROM nest_db.meetings WHERE nest_id IN (SELECT id FROM nest_db.nests WHERE name='$name');
    DELETE FROM nest_db.vibe_checks WHERE nest_id IN (SELECT id FROM nest_db.nests WHERE name='$name');
    DELETE FROM nest_db.nest_members WHERE nest_id IN (SELECT id FROM nest_db.nests WHERE name='$name');
    DELETE FROM nest_db.nests WHERE name='$name';"
done

# Nest 1 — ACTIVE (the "Mission Crew" journey)
MYSQL "$NEST_C" "INSERT INTO nest_db.nests (name,city,status,start_date,end_date,created_at,updated_at)
  VALUES ('The Mission Crew','San Francisco','ACTIVE','2026-07-20','2026-08-31',NOW(),NOW());"
N1=$(ONE "$NEST_C" "SELECT id FROM nest_db.nests WHERE name='The Mission Crew';")
MYSQL "$NEST_C" "INSERT INTO nest_db.nest_members (nest_id,user_id,role_in_nest,status,graduated,joined_at) VALUES
  ($N1,$P1,'ANCHOR','ACCEPTED',0,NOW() - INTERVAL 22 DAY),
  ($N1,$P3,'MEMBER','ACCEPTED',0,NOW() - INTERVAL 22 DAY),
  ($N1,$P4,'MEMBER','ACCEPTED',0,NOW() - INTERVAL 22 DAY),
  ($N1,$P5,'MEMBER','ACCEPTED',0,NOW() - INTERVAL 22 DAY),
  ($N1,$P6,'MEMBER','ACCEPTED',0,NOW() - INTERVAL 22 DAY);
  INSERT INTO nest_db.meetings (nest_id,venue_name,venue_address,activity_type,description,scheduled_at,status) VALUES
  ($N1,'Lakeside Park','Golden Gate Park','Walk','Sunset walk along the lake.',NOW() - INTERVAL 10 DAY,'COMPLETED'),
  ($N1,'Brew & Bloom Café','411 Valencia Street','Coffee','Casual weekend coffee.',NOW() + INTERVAL 5 DAY,'SCHEDULED'),
  ($N1,'The Trivia Den','88 Kearny Street','Trivia','Team trivia — wear your team colors!',NOW() + INTERVAL 12 DAY,'SCHEDULED');
  INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
  ($N1,$P1,40.00,'Group dinner — Ramen Street','EQUAL',NOW() - INTERVAL 8 DAY),
  ($N1,$P4,24.00,'Board game night snacks','CUSTOM',NOW() - INTERVAL 15 DAY);
  INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
  SELECT e.id, m.user_id, 8.00, 0 FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=$N1 AND e.description='Group dinner — Ramen Street';
  INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
  SELECT e.id, m.user_id, 12.00, CASE WHEN m.user_id=$P1 THEN 1 ELSE 0 END
  FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id
  WHERE e.nest_id=$N1 AND e.description='Board game night snacks' AND m.user_id IN ($P1,$P3);"

# Nest 2 — VIBE_CHECK (open weekly check-in)
MYSQL "$NEST_C" "INSERT INTO nest_db.nests (name,city,status,start_date,end_date,created_at,updated_at)
  VALUES ('Golden Gate Circle','San Francisco','VIBE_CHECK','2026-07-13','2026-08-24',NOW(),NOW());"
N2=$(ONE "$NEST_C" "SELECT id FROM nest_db.nests WHERE name='Golden Gate Circle';")
MYSQL "$NEST_C" "INSERT INTO nest_db.nest_members (nest_id,user_id,role_in_nest,status,graduated,joined_at) VALUES
  ($N2,$P2,'ANCHOR','ACCEPTED',0,NOW() - INTERVAL 29 DAY),
  ($N2,$P1,'MEMBER','ACCEPTED',0,NOW() - INTERVAL 29 DAY),
  ($N2,$P3,'MEMBER','ACCEPTED',0,NOW() - INTERVAL 29 DAY),
  ($N2,$P5,'MEMBER','ACCEPTED',0,NOW() - INTERVAL 29 DAY);
  INSERT INTO nest_db.meetings (nest_id,venue_name,venue_address,activity_type,description,scheduled_at,status) VALUES
  ($N2,'Harbor Boardwalk','Embarcadero','Walk','Sunrise walk along the bay.',NOW() - INTERVAL 6 DAY,'COMPLETED'),
  ($N2,'The Trivia Den','88 Kearny Street','Trivia','Quiz night at The Den.',NOW() + INTERVAL 3 DAY,'SCHEDULED');
  INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
  ($N2,$P2,36.00,'Carpool fuel','EQUAL',NOW() - INTERVAL 4 DAY);
  INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
  SELECT e.id, m.user_id, 9.00, 0 FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=$N2;
  INSERT INTO nest_db.vibe_checks (nest_id,user_id,connection_score,comfort_score,feedback,submitted_at) VALUES
  ($N2,$P2,9,8,'Group is clicking — great energy.',NOW() - INTERVAL 1 DAY),
  ($N2,$P1,8,9,NULL,NOW() - INTERVAL 1 DAY),
  ($N2,$P3,7,8,'Loving the trivia nights.',NOW() - INTERVAL 1 DAY),
  ($N2,$P5,9,7,'Would love more weekend hikes.',NOW() - INTERVAL 1 DAY);"

# Nest 3 — GRADUATED (a completed journey)
MYSQL "$NEST_C" "INSERT INTO nest_db.nests (name,city,status,start_date,end_date,created_at,updated_at)
  VALUES ('Harborview Grads','San Francisco','GRADUATED','2026-05-01','2026-06-12',NOW(),NOW());"
N3=$(ONE "$NEST_C" "SELECT id FROM nest_db.nests WHERE name='Harborview Grads';")
MYSQL "$NEST_C" "INSERT INTO nest_db.nest_members (nest_id,user_id,role_in_nest,status,graduated,joined_at) VALUES
  ($N3,$P1,'ANCHOR','ACCEPTED',1,NOW() - INTERVAL 70 DAY),
  ($N3,$P4,'MEMBER','ACCEPTED',1,NOW() - INTERVAL 70 DAY),
  ($N3,$P6,'MEMBER','ACCEPTED',1,NOW() - INTERVAL 70 DAY);
  INSERT INTO nest_db.meetings (nest_id,venue_name,venue_address,activity_type,description,scheduled_at,status) VALUES
  ($N3,'Riverside Picnic Spot','Riverside Drive','Picnic','Graduation picnic — thank you everyone!',NOW() - INTERVAL 60 DAY,'COMPLETED');
  INSERT INTO nest_db.expenses (nest_id,payer_id,amount,description,split_type,created_at) VALUES
  ($N3,$P1,90.00,'Graduation dinner','EQUAL',NOW() - INTERVAL 58 DAY);
  INSERT INTO nest_db.expense_splits (expense_id,user_id,amount_owed,settled)
  SELECT e.id, m.user_id, 30.00, 1 FROM nest_db.expenses e JOIN nest_db.nest_members m ON m.nest_id = e.nest_id WHERE e.nest_id=$N3;"

# ── 9. Matching — pending proposal (anchor Marcus + members) & completed one ──
# Idempotent: drop any earlier PENDING proposals (not tied to a nest) first.
MYSQL "$MATCH_C" "DELETE FROM matching_db.match_proposal_members WHERE match_proposal_id IN (SELECT id FROM matching_db.match_proposals WHERE nest_id IS NULL);
  DELETE FROM matching_db.match_proposals WHERE nest_id IS NULL;"
EXPIRY=$(date -u -d '+48 hours' +'%Y-%m-%d %H:%M:%S')
MYSQL "$MATCH_C" "INSERT INTO matching_db.match_proposals (status,expires_at,proposed_at) VALUES ('PENDING','$EXPIRY',NOW());
  INSERT INTO matching_db.match_proposal_members (match_proposal_id,user_id,role_in_nest,response,responded_at) VALUES
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY'),$P2,'ANCHOR','ACCEPTED',NOW()),
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY'),$P3,'MEMBER','PENDING',NULL),
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY'),$P4,'MEMBER','PENDING',NULL),
  ((SELECT id FROM matching_db.match_proposals WHERE expires_at='$EXPIRY'),$P5,'MEMBER','PENDING',NULL);
  INSERT INTO matching_db.match_proposals (status,expires_at,proposed_at,accepted_at,nest_id) VALUES ('COMPLETED',NOW() - INTERVAL 22 DAY,NOW() - INTERVAL 24 DAY,NOW() - INTERVAL 22 DAY,$N1);
  INSERT INTO matching_db.match_proposal_members (match_proposal_id,user_id,role_in_nest,response,responded_at) VALUES
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$N1),$P1,'ANCHOR','ACCEPTED',NOW() - INTERVAL 22 DAY),
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$N1),$P3,'MEMBER','ACCEPTED',NOW() - INTERVAL 22 DAY),
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$N1),$P4,'MEMBER','ACCEPTED',NOW() - INTERVAL 22 DAY),
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$N1),$P5,'MEMBER','ACCEPTED',NOW() - INTERVAL 22 DAY),
  ((SELECT id FROM matching_db.match_proposals WHERE nest_id=$N1),$P6,'MEMBER','ACCEPTED',NOW() - INTERVAL 22 DAY);"

echo
echo "Seeding complete ✔"
echo "  Sign in with any demo account — password: $PASSWORD"
echo "    demo1@neighbornest.dev  (Anchor  — Priya Sharma, 2 active nests + 1 graduated)"
echo "    demo2@neighbornest.dev  (Anchor  — Marcus Lee)"
echo "    demo3@neighbornest.dev  (Newcomer — pending anchor application)"
echo "    demo4@neighbornest.dev  (Newcomer — pending anchor application + nest invitation)"
echo "    demo5@neighbornest.dev  (Newcomer — pending nest invitation)"
echo "    demo6@neighbornest.dev  (Newcomer)"
echo "    admin@neighbornest.dev  (Admin — can review anchor applications)"
