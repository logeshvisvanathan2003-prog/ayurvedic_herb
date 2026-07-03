"""
Ayurvedic Herbal Traceability System — Backend v6
FIXES:
  1. DB auto-migration: safely adds new columns to existing users table
  2. Admin register: separate endpoint /api/auth/admin-register with secret key
  3. Farmers/Lab/Consumer BLOCKED from login until admin approves them
  4. application-status uses COALESCE so it works on old/new DB
  5. Blockchain audit on every important action
"""
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2, psycopg2.extras, jwt, bcrypt, os, uuid, qrcode, io, base64, hashlib, json, math, secrets, requests
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.utils import secure_filename

app = Flask(__name__)

# enable CORS for frontend origin on all endpoints and handle preflight automatically
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173').rstrip('/')

CORS(app, origins=[FRONTEND_URL, "https://ayurveda-frontend-qko9.onrender.com", "http://localhost:5173"], supports_credentials=True)

app.config['SECRET_KEY']    = os.environ.get('SECRET_KEY',    'ayurveda-secret-2026')
app.config['ADMIN_SECRET']  = os.environ.get('ADMIN_SECRET',  'ayurveda-admin-2026')
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
ALLOWED = {'png','jpg','jpeg','gif','pdf'}

# ── Hyperledger Fabric integration (optional, feature-flagged) ─────────────
# When FABRIC_GATEWAY_URL is set (e.g. http://localhost:4000), every batch
# event is ALSO submitted as a real, signed transaction to your Fabric
# network via blockchain/gateway-api. If it's unset, or the network isn't
# running, the app degrades gracefully to the hash-chain audit_log only —
# nothing breaks. See blockchain/README.md for how to turn this on.
FABRIC_GATEWAY_URL = os.environ.get('FABRIC_GATEWAY_URL', '').rstrip('/')
FABRIC_ENABLED = bool(FABRIC_GATEWAY_URL)

def fabric_submit(route, payload):
    """Best-effort call into the Fabric gateway bridge. Never raises —
    a Fabric outage must never break the working app."""
    if not FABRIC_ENABLED:
        return {'skipped': True, 'reason': 'FABRIC_GATEWAY_URL not set'}
    try:
        r = requests.post(f"{FABRIC_GATEWAY_URL}/{route}", json=payload, timeout=6)
        return r.json()
    except Exception as e:
        print(f"[fabric] {route} failed: {e}")
        return {'ok': False, 'error': str(e)}

# fallback CORS headers in case flask-cors doesn't fire (e.g. on render preflight)
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin', '')
    allowed = [FRONTEND_URL, 'https://ayurveda-frontend-qko9.onrender.com', 'http://localhost:5173']
    response.headers['Access-Control-Allow-Origin'] = origin if origin in allowed else allowed[0]
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

import psycopg2
import os

def get_db():
    return psycopg2.connect(
        dbname=os.environ.get('DB_NAME', 'ayurvedic_herb'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', 'postgres123'),
        host=os.environ.get('DB_HOST', 'localhost'),
        port=os.environ.get('DB_PORT', '5432')
    )

def serialize(row):
    return {k:(v.isoformat() if hasattr(v,'isoformat') else v) for k,v in row.items()}

def allowed_file(fn): return '.' in fn and fn.rsplit('.',1)[1].lower() in ALLOWED

def save_file(f, pfx=''):
    if f and f.filename and allowed_file(f.filename):
        fname = secure_filename(f"{pfx}{uuid.uuid4().hex}_{f.filename}")
        f.save(os.path.join(app.config['UPLOAD_FOLDER'], fname))
        return f"/uploads/{fname}"
    return None

def make_qr(data):
    qr = qrcode.QRCode(version=1,box_size=10,border=5,error_correction=qrcode.constants.ERROR_CORRECT_L)
    qr.add_data(data); qr.make(fit=True)
    img = qr.make_image(fill_color='black',back_color='white')
    buf = io.BytesIO(); img.save(buf,format='PNG')
    return base64.b64encode(buf.getvalue()).decode()

def haversine_km(lat1, lng1, lat2, lng2):
    """Great-circle distance in km — used for geo-fence and transport-speed checks."""
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def check_geofence(cur, species, harvest_date_str, gps_lat, gps_lng, quantity_kg):
    """Smart-contract-style validation: approved harvesting zone + season window + seasonal quota.
    Returns None if OK, or a human-readable warning string if a rule is violated."""
    if not (gps_lat and gps_lng):
        return None
    try:
        cur.execute("SELECT * FROM conservation_zones WHERE LOWER(herb_species)=LOWER(%s) AND active=TRUE", (species,))
        zones = cur.fetchall()
    except Exception:
        return None
    if not zones:
        return None  # no rules configured for this species yet
    hd = None
    if harvest_date_str:
        try: hd = datetime.strptime(str(harvest_date_str)[:10], '%Y-%m-%d')
        except Exception: hd = None
    matched_zone = None
    for z in zones:
        d = haversine_km(float(gps_lat), float(gps_lng), float(z['center_lat']), float(z['center_lng']))
        if d <= float(z['radius_km']):
            matched_zone = z
            break
    if not matched_zone:
        return f"Collection point is outside all AYUSH-approved harvesting zones registered for {species}."
    z = matched_zone
    if hd and z.get('season_start_month') and z.get('season_end_month'):
        if not (z['season_start_month'] <= hd.month <= z['season_end_month']):
            return f"Harvest date falls outside the approved collection season for {species} in zone '{z['zone_name']}'."
    if z.get('max_seasonal_qty_kg') and hd:
        try:
            cur.execute("SELECT COALESCE(SUM(quantity_kg),0) AS s FROM herb_batches WHERE LOWER(herb_species)=LOWER(%s) AND EXTRACT(YEAR FROM harvest_date)=%s",
                        (species, hd.year))
            used = float(cur.fetchone()['s'] or 0)
            if used + float(quantity_kg or 0) > float(z['max_seasonal_qty_kg']):
                return f"Seasonal conservation quota for {species} in zone '{z['zone_name']}' would be exceeded ({used:.1f}kg already logged this season)."
        except Exception:
            pass
    return None


def record_audit(conn, event, actor, etype, eid, payload):
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT block_hash FROM audit_log ORDER BY sequence DESC LIMIT 1")
        last = cur.fetchone(); prev = last['block_hash'] if last else '0'*64
        ts  = datetime.utcnow().isoformat()
        ds  = f"{prev}|{event}|{actor}|{eid}|{json.dumps(payload,sort_keys=True)}|{ts}"
        bhash = hashlib.sha256(ds.encode()).hexdigest()
        cur.execute("INSERT INTO audit_log(event_type,actor_id,entity_type,entity_id,payload,prev_hash,block_hash,created_at) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)",
                    (event,str(actor),etype,str(eid),json.dumps(payload),prev,bhash,ts))
        cur.close()
    except Exception as e:
        print(f"Audit note: {e}")


def init_db():
    conn = get_db()
    cur = conn.cursor()

    try:
        # STEP 1 — Load SQL file safely
        base_dir = os.path.dirname(os.path.abspath(__file__))
        sql_file = os.path.join(base_dir, "migrate_v6.sql")

        with open(sql_file, "r") as f:
            sql_commands = f.read()

        for command in sql_commands.split(";"):
            if command.strip():
                cur.execute(command)

        conn.commit()

        # STEP 2 — SAFE migration
        migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_note TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE",
        ]

        for sql in migrations:
            try:
                cur.execute(sql)
                conn.commit()
            except Exception as e:
                conn.rollback()
                print(f"Migration note: {e}")

        # STEP 3 — Fix NULL values
        try:
            cur.execute("UPDATE users SET approval_status='approved', is_active=TRUE WHERE role='admin'")
            cur.execute("""
                UPDATE users SET approval_status='approved', is_active=TRUE
                WHERE role != 'admin' AND approval_status IS NULL
            """)
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"Fix note: {e}")

        # STEP 4 — Seed admin
        try:
            cur.execute("SELECT id FROM users WHERE role='admin' LIMIT 1")
            if not cur.fetchone():

                pw = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode()
                admin_id = str(uuid.uuid4())

                cur.execute("""
                    INSERT INTO users(
                        id,email,password_hash,role,
                        full_name,approval_status,is_active
                    )
                    VALUES(%s,%s,%s,%s,%s,%s,%s)
                """,(
                    admin_id,
                    'admin@ayurveda.com',
                    pw,
                    'admin',
                    'System Admin',
                    'approved',
                    True
                ))

                conn.commit()
                print("Default admin created")

        except Exception as e:
            conn.rollback()
            print(f"Seed note: {e}")

        # STEP 5 — Seed a demo conservation zone (pilot species per AYUSH problem statement)
        try:
            cur.execute("SELECT id FROM conservation_zones LIMIT 1")
            if not cur.fetchone():
                cur.execute("""INSERT INTO conservation_zones
                    (herb_species, zone_name, center_lat, center_lng, radius_km, season_start_month, season_end_month, max_seasonal_qty_kg)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                    ('Ashwagandha', 'Nagaur-Mandsaur Approved Belt (Rajasthan/MP)', 25.15, 74.85, 120, 11, 3, 50000))
                conn.commit()
                print("Demo conservation zone seeded")
        except Exception as e:
            conn.rollback()
            print(f"Zone seed note: {e}")

    finally:
        cur.close()
        conn.close()

    

# ── Auth decorators ────────────────────────────────────────────────────────────
def token_required(f):
    @wraps(f)
    def d(*a,**kw):
        tok = request.headers.get('Authorization','').replace('Bearer ','').strip()
        if not tok: return jsonify({'error':'Token required'}),401
        try: payload = jwt.decode(tok,app.config['SECRET_KEY'],algorithms=['HS256'])
        except jwt.ExpiredSignatureError: return jsonify({'error':'Token expired'}),401
        except: return jsonify({'error':'Invalid token'}),401
        return f(payload,*a,**kw)
    return d

def role_required(*roles):
    def dec(f):
        @wraps(f)
        def d(cu,*a,**kw):
            if cu['role'] not in roles: return jsonify({'error':f'Requires: {"/".join(roles)}'}),403
            return f(cu,*a,**kw)
        return d
    return dec


# ══════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════

# ================= DB MANUAL INIT =================


# ================= AUTH =================

@app.route('/api/auth/admin-register', methods=['POST'])
def admin_register():
    """Admin-only register. Needs secret key. No docs, no approval wait."""
    data = request.get_json() or {}
    if data.get('admin_secret') != app.config['ADMIN_SECRET']:
        return jsonify({'error':'Invalid admin secret key. Contact your system administrator.'}),403
    for field in ('email','password','full_name'):
        if not data.get(field): return jsonify({'error':f'"{field}" is required'}),400
    if len(data['password'])<6: return jsonify({'error':'Password min 6 chars'}),400
    pw = bcrypt.hashpw(data['password'].encode(),bcrypt.gensalt()).decode()
    try:
        conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        admin_id = str(uuid.uuid4())
        cur.execute("INSERT INTO users(id,email,password_hash,role,full_name,phone,approval_status,is_active) VALUES(%s,%s,%s,'admin',%s,%s,'approved',TRUE) RETURNING id,email,role,full_name",
                    (admin_id,data['email'],pw,data['full_name'],data.get('phone')))
        user = dict(cur.fetchone())
        record_audit(conn,'ADMIN_REGISTERED',str(user['id']),'user',str(user['id']),{'email':data['email'],'name':data['full_name']})
        conn.commit(); cur.close(); conn.close()
        token = jwt.encode({'user_id':str(user['id']),'email':user['email'],'role':'admin','exp':datetime.utcnow()+timedelta(days=7)},app.config['SECRET_KEY'],algorithm='HS256')
        return jsonify({'message':f'Admin account created. Welcome, {data["full_name"]}!','token':token,'user':user}),201
    except psycopg2.IntegrityError as e:
        msg = str(e)
        # Only treat UNIQUE email violation as "already registered"
        if 'users_email_key' in msg or 'unique constraint' in msg.lower():
            return jsonify({'error':'Email already registered'}),409
        # For any other integrity error, surface a generic DB error
        return jsonify({'error':'Database constraint error','details':msg}),400
    except Exception as e:
        return jsonify({'error':str(e)}),500


@app.route('/api/auth/register', methods=['POST'])
def register():
    """Farmer / Lab / Consumer register. Documents required. Starts as PENDING."""
    data = request.form
    for field in ('email','password','role','full_name'):
        if not data.get(field): return jsonify({'error':f'"{field}" is required'}),400
    # Normalize email/role for consistent lookups
    email = (data.get('email') or '').strip().lower()
    role = data['role']
    if role == 'admin':
        return jsonify({'error':'Admin accounts use the /admin-register page with a secret key'}),400
    if role not in ('farmer','consumer','lab','collector','production_unit'):
        return jsonify({'error':'Role must be: farmer, consumer, lab, collector, or production_unit'}),400
    if len(data['password'])<6: return jsonify({'error':'Password min 6 chars'}),400

    # Document validation
    if role=='farmer':
        if not request.files.get('land_document'): return jsonify({'error':'Land ownership document is required'}),400
        if not data.get('land_district') or not data.get('land_state'): return jsonify({'error':'Land district and state are required'}),400
    elif role=='lab':
        if not request.files.get('lab_licence'): return jsonify({'error':'Laboratory licence document is required'}),400
        if not data.get('lab_licence_no'): return jsonify({'error':'Lab licence number is required'}),400
    elif role=='consumer':
        if not request.files.get('govt_id'): return jsonify({'error':'Government ID document is required'}),400
        if not data.get('govt_id_type') or not data.get('govt_id_number'): return jsonify({'error':'Govt ID type and number are required'}),400
    elif role=='collector':
        if not data.get('courier_name'): return jsonify({'error':'Courier/company name is required'}),400
        if not data.get('vehicle_number'): return jsonify({'error':'Default vehicle number is required'}),400
    elif role=='production_unit':
        if not data.get('unit_name'): return jsonify({'error':'Production unit / manufacturer name is required'}),400

    pw = bcrypt.hashpw(data['password'].encode(),bcrypt.gensalt()).decode()

    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # early duplicate check so we can avoid a DB error and return consistent message
        cur.execute("SELECT 1 FROM users WHERE LOWER(email)=LOWER(%s)", (email,))
        if cur.fetchone():
            cur.close(); conn.close()
            return jsonify({'error':'Email already registered'}),409

        uid = str(uuid.uuid4())
        cur.execute("""
        INSERT INTO users(
            id,email,password_hash,role,full_name,phone,address,
            approval_status,is_active
        )
        VALUES(%s,%s,%s,%s,%s,%s,%s,'pending',FALSE)
        """,(
            uid,
            email,pw,role,
            data['full_name'],
            data.get('phone'),
            data.get('address')
        ))

        # PROFILE (explicit id to avoid NULL id on older DBs without DEFAULT)
        profile_id = str(uuid.uuid4())
        cur.execute("""
        INSERT INTO user_profiles(
            id,user_id,land_area_acres,land_survey_no,
            land_district,land_state,farming_type,
            lab_name,lab_licence_no,lab_accreditation,
            lab_address,govt_id_type,govt_id_number,notes,
            courier_name,vehicle_number,unit_name
        )
        VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,(
            profile_id,
            uid,
            data.get('land_area_acres'),
            data.get('land_survey_no'),
            data.get('land_district'),
            data.get('land_state'),
            data.get('farming_type'),
            data.get('lab_name'),
            data.get('lab_licence_no'),
            data.get('lab_accreditation'),
            data.get('lab_address'),
            data.get('govt_id_type'),
            data.get('govt_id_number'),
            data.get('notes'),
            data.get('courier_name'),
            data.get('vehicle_number'),
            data.get('unit_name')
        ))

        # DOCUMENTS (explicit id to avoid NULL id on older DBs without DEFAULT)
        for fname,(label,pfx) in [
            ('land_document',('Land Ownership Doc','land_')),
            ('lab_licence',('Lab Licence','lab_')),
            ('govt_id',('Govt ID','govtid_')),
            ('extra_document',('Extra Doc','extra_'))
        ]:
            url = save_file(request.files.get(fname),pfx)
            if url:
                doc_id = str(uuid.uuid4())
                cur.execute("""
                INSERT INTO registration_documents(
                id,user_id,doc_type,doc_label,file_url
                )
                VALUES(%s,%s,%s,%s,%s)
                """,(doc_id,uid,fname,label,url))

        record_audit(conn,'USER_REGISTERED',
                     str(uid),'user',str(uid),
                     {'email':email,'role':role})

        # 🔥 COMMIT ONLY ONCE AT THE END
        conn.commit()

        cur.close()
        conn.close()
        return jsonify({
            'message':'Registration submitted!',
            'status':'pending',
            'application_email':data['email']
        }),201

    except psycopg2.IntegrityError as e:
        msg = str(e)
        if 'users_email_key' in msg or 'unique constraint' in msg.lower():
            return jsonify({'error':'Email already registered'}),409
        return jsonify({'error':'Database constraint error','details':msg}),400

    except Exception as e:
        return jsonify({'error':str(e)}),500


@app.route('/api/auth/application-status', methods=['GET'])
def application_status():
    """Public — user checks registration status by email. Uses COALESCE for old DB compat."""
    email = request.args.get('email','').strip().lower()
    if not email: return jsonify({'error':'Email is required'}),400
    try:
        conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # COALESCE handles old DB where columns might be NULL
        # Primary: exact match on normalized email
        cur.execute("""
            SELECT u.id, u.email, u.role, u.full_name, u.phone, u.created_at,
                   COALESCE(u.approval_status,'pending') AS approval_status,
                   u.approved_at, u.rejection_note,
                   COALESCE(u.is_active,FALSE) AS is_active,
                   up.land_district, up.land_state, up.farming_type,
                   up.lab_name, up.lab_licence_no, up.govt_id_type
            FROM users u
            LEFT JOIN user_profiles up ON u.id=up.user_id
            WHERE LOWER(TRIM(u.email))=%s AND u.role!='admin'
        """, (email,))
        user = cur.fetchone()

        # Fallback 1: fuzzy match on email local-part in users table
        if not user:
            local_part = email.split('@')[0] if '@' in email else email
            cur.execute("""
                SELECT u.id, u.email, u.role, u.full_name, u.phone, u.created_at,
                       COALESCE(u.approval_status,'pending') AS approval_status,
                       u.approved_at, u.rejection_note,
                       COALESCE(u.is_active,FALSE) AS is_active,
                       up.land_district, up.land_state, up.farming_type,
                       up.lab_name, up.lab_licence_no, up.govt_id_type
                FROM users u
                LEFT JOIN user_profiles up ON u.id=up.user_id
                WHERE u.role!='admin'
                  AND LOWER(TRIM(u.email)) LIKE %s
                ORDER BY u.created_at DESC
                LIMIT 1
            """, (f"%{local_part}%",))
            user = cur.fetchone()

        # Fallback 2: look up via audit_log payload email in case users.email was normalized differently
        if not user:
            cur.execute("""
                SELECT u.id, u.email, u.role, u.full_name, u.phone, u.created_at,
                       COALESCE(u.approval_status,'pending') AS approval_status,
                       u.approved_at, u.rejection_note,
                       COALESCE(u.is_active,FALSE) AS is_active,
                       up.land_district, up.land_state, up.farming_type,
                       up.lab_name, up.lab_licence_no, up.govt_id_type
                FROM audit_log al
                JOIN users u ON al.entity_type='user' AND al.entity_id = u.id::text
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE al.event_type = 'USER_REGISTERED'
                  AND LOWER(al.payload->>'email') = %s
                  AND u.role != 'admin'
                ORDER BY al.created_at DESC
                LIMIT 1
            """, (email,))
            user = cur.fetchone()

        if not user:
            cur.close(); conn.close(); return jsonify({'error':'No registration found for this email'}),404
        user = dict(user); uid = user['id']

        try:
            cur.execute("SELECT doc_type,doc_label,uploaded_at,verified FROM registration_documents WHERE user_id=%s",(uid,))
            docs = [serialize(dict(d)) for d in cur.fetchall()]
        except Exception: docs = []

        try:
            cur.execute("SELECT event_type,payload,created_at,block_hash FROM audit_log WHERE entity_type='user' AND entity_id=%s ORDER BY created_at ASC",(str(uid),))
            audit = [serialize(dict(a)) for a in cur.fetchall()]
        except Exception: audit = []

        cur.close(); conn.close()
        labels = {
            'pending':  {'label':'Under Review 🔍','desc':'Your application is being reviewed. You can log in once an admin approves your account.'},
            'approved': {'label':'Approved ✓','desc':'Your account is active! You can now log in with your email and password.'},
            'rejected': {'label':'Rejected ✗','desc':'Your application was not approved. See the reason below.'},
        }
        return jsonify({'application':serialize(user),'documents':docs,'audit_trail':audit,'status_info':labels.get(user['approval_status'],labels['pending'])})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    if not data.get('email') or not data.get('password'): return jsonify({'error':'Email and password required'}),400
    try:
        conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM users WHERE LOWER(email)=LOWER(%s)",(data['email'],))
        user = cur.fetchone(); cur.close(); conn.close()
        if not user or not bcrypt.checkpw(data['password'].encode(),user['password_hash'].encode()):
            return jsonify({'error':'Invalid email or password'}),401
        if data.get('role') and user['role']!=data['role']:
            return jsonify({'error':f'This account is registered as "{user["role"]}", not "{data["role"]}"'}),403

        # ── Approval gate (non-admin only) ──────────────────────────────────
        if user['role'] != 'admin':
            status = user.get('approval_status') or 'pending'
            active = user.get('is_active') or False
            if status == 'pending':
                return jsonify({
                    'error':'Your registration is pending admin approval. You will receive access once an administrator reviews your application.',
                    'approval_status':'pending',
                    'hint':'Track your status at /application-status'
                }),403
            if status == 'rejected':
                reason = user.get('rejection_note') or 'No reason provided.'
                return jsonify({'error':f'Your registration was rejected. Reason: {reason}','approval_status':'rejected'}),403
            if not active:
                return jsonify({'error':'Your account is not active. Contact the administrator.'}),403

        token = jwt.encode({'user_id':str(user['id']),'email':user['email'],'role':user['role'],'exp':datetime.utcnow()+timedelta(days=7)},app.config['SECRET_KEY'],algorithm='HS256')
        return jsonify({'token':token,'user':{'id':str(user['id']),'email':user['email'],'role':user['role'],'full_name':user['full_name']}})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/collector/pending-pickups', methods=['GET'])
@token_required
@role_required('collector','admin')
def collector_pending_pickups(cu):
    """Every lab-approved, QR-generated batch that hasn't been dispatched
    yet — a Collector's 'ready for pickup' queue, so they don't need a
    physical QR handed to them to know a shipment is waiting."""
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""SELECT hb.batch_id,hb.herb_species,hb.quantity_kg,hb.location_name,hb.gps_lat,hb.gps_lng,
                       u.full_name AS farmer_name, p.product_id, p.created_at AS qr_generated_at,
                       lt.overall_status AS lab_status
                       FROM herb_batches hb
                       JOIN products p ON p.batch_id=hb.batch_id
                       JOIN lab_tests lt ON lt.batch_id=hb.batch_id AND lt.overall_status='approved'
                       LEFT JOIN users u ON hb.farmer_id=u.id
                       WHERE NOT EXISTS (SELECT 1 FROM custody_transfers ct WHERE ct.batch_id=hb.batch_id)
                       ORDER BY p.created_at DESC""")
        rows=[serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({'pending_pickups':rows})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/collector/my-dispatches', methods=['GET'])
@token_required
@role_required('collector','admin')
def my_dispatches(cu):
    """Every shipment this collector has dispatched, most recent first."""
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""SELECT ct.batch_id,ct.from_stage,ct.to_stage,ct.courier_name,ct.vehicle_number,
                       ct.dispatched_at,ct.delivered_at,ct.status,ct.anomaly_flag,ct.receiver_name,
                       hb.herb_species,hb.quantity_kg,u.full_name AS farmer_name
                       FROM custody_transfers ct
                       LEFT JOIN herb_batches hb ON ct.batch_id=hb.batch_id
                       LEFT JOIN users u ON hb.farmer_id=u.id
                       WHERE ct.dispatched_by=%s
                       ORDER BY ct.dispatched_at DESC""",(cu['user_id'],))
        rows=[serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({'dispatches':rows})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/production-unit/my-deliveries', methods=['GET'])
@token_required
@role_required('production_unit','admin')
def my_deliveries(cu):
    """Every delivery this production unit has confirmed receipt of, plus
    whether a final consumer product QR has been generated for it yet."""
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""SELECT ct.batch_id,ct.delivered_at,ct.receiver_name,ct.courier_name,ct.vehicle_number,
                       hb.herb_species,hb.quantity_kg,u.full_name AS farmer_name,
                       p.product_id,p.product_name
                       FROM custody_transfers ct
                       LEFT JOIN herb_batches hb ON ct.batch_id=hb.batch_id
                       LEFT JOIN users u ON hb.farmer_id=u.id
                       LEFT JOIN products p ON p.batch_id=ct.batch_id
                       WHERE ct.received_by=%s AND ct.status='delivered'
                       ORDER BY ct.delivered_at DESC""",(cu['user_id'],))
        rows=[serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({'deliveries':rows})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/logistics/my-profile', methods=['GET'])
@token_required
def my_logistics_profile(cu):
    """Returns the logged-in user's saved courier name / vehicle number
    (set at registration for logistics accounts) so dispatch forms can
    prefill automatically instead of retyping every time."""
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT courier_name,vehicle_number,unit_name FROM user_profiles WHERE user_id=%s",(cu['user_id'],))
        profile=cur.fetchone(); cur.close(); conn.close()
        return jsonify(serialize(dict(profile)) if profile else {'courier_name':None,'vehicle_number':None,'unit_name':None})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(u): return jsonify(u)


# ══════════════════════════════════════════════════════════════════
# ADMIN — Registration management
# ══════════════════════════════════════════════════════════════════

@app.route('/api/admin/registrations', methods=['GET'])
@token_required
@role_required('admin')
def admin_registrations(cu):
    sf=request.args.get('status','all'); rf=request.args.get('role','all')
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        conds=["u.role!='admin'"]; params=[]
        if sf!='all': conds.append("COALESCE(u.approval_status,'pending')=%s"); params.append(sf)
        if rf!='all': conds.append("u.role=%s"); params.append(rf)
        cur.execute(f"""
            SELECT u.id,u.email,u.role,u.full_name,u.phone,u.address,
                   COALESCE(u.approval_status,'pending') AS approval_status,
                   u.approved_at,u.rejection_note,u.created_at,
                   COALESCE(u.is_active,FALSE) AS is_active,
                   up.land_area_acres,up.land_district,up.land_state,up.farming_type,
                   up.lab_name,up.lab_licence_no,up.lab_accreditation,
                   up.govt_id_type,up.govt_id_number,
                   adm.full_name AS approved_by_name,
                   (SELECT COUNT(*) FROM registration_documents rd WHERE rd.user_id=u.id) AS doc_count
            FROM users u
            LEFT JOIN user_profiles up ON u.id=up.user_id
            LEFT JOIN users adm ON u.approved_by=adm.id
            WHERE {' AND '.join(conds)}
            ORDER BY CASE COALESCE(u.approval_status,'pending') WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, u.created_at DESC
        """, params)
        regs=[serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({'registrations':regs,'total':len(regs)})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/admin/registrations/<uid>/documents', methods=['GET'])
@token_required
@role_required('admin')
def admin_user_docs(cu, uid):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT rd.*,u.full_name,u.email,u.role FROM registration_documents rd JOIN users u ON rd.user_id=u.id WHERE rd.user_id=%s ORDER BY rd.uploaded_at",(uid,))
        docs=[serialize(dict(d)) for d in cur.fetchall()]
        cur.execute("SELECT * FROM user_profiles WHERE user_id=%s",(uid,))
        profile=cur.fetchone()
        cur.close(); conn.close()
        return jsonify({'documents':docs,'profile':serialize(dict(profile)) if profile else {}})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/admin/registrations/<uid>/approve', methods=['POST'])
@token_required
@role_required('admin')
def admin_approve(cu, uid):
    data=request.get_json() or {}
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM users WHERE id=%s AND role!='admin'",(uid,))
        user=cur.fetchone()
        if not user: cur.close(); conn.close(); return jsonify({'error':'User not found'}),404
        if (user.get('approval_status') or 'pending')=='approved': cur.close(); conn.close(); return jsonify({'error':'Already approved'}),400
        cur.execute("UPDATE users SET approval_status='approved',is_active=TRUE,approved_by=%s,approved_at=NOW(),rejection_note=NULL WHERE id=%s RETURNING email,full_name,role",(cu['user_id'],uid))
        upd=dict(cur.fetchone())
        cur.execute("UPDATE registration_documents SET verified=TRUE WHERE user_id=%s",(uid,))
        record_audit(conn,'REGISTRATION_APPROVED',cu['user_id'],'user',uid,{'email':upd['email'],'role':upd['role'],'by':cu.get('email','')})
        conn.commit(); cur.close(); conn.close()
        return jsonify({'message':f'✓ {upd["full_name"]} ({upd["role"]}) approved. They can now log in.','user':upd})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/admin/registrations/<uid>/reject', methods=['POST'])
@token_required
@role_required('admin')
def admin_reject(cu, uid):
    data=request.get_json() or {}
    reason=data.get('reason','').strip()
    if not reason: return jsonify({'error':'Rejection reason is required'}),400
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM users WHERE id=%s AND role!='admin'",(uid,))
        user=cur.fetchone()
        if not user: cur.close(); conn.close(); return jsonify({'error':'User not found'}),404
        cur.execute("UPDATE users SET approval_status='rejected',is_active=FALSE,approved_by=%s,approved_at=NOW(),rejection_note=%s WHERE id=%s RETURNING email,full_name,role",(cu['user_id'],reason,uid))
        upd=dict(cur.fetchone())
        record_audit(conn,'REGISTRATION_REJECTED',cu['user_id'],'user',uid,{'email':upd['email'],'role':upd['role'],'reason':reason})
        conn.commit(); cur.close(); conn.close()
        return jsonify({'message':f'✗ {upd["full_name"]} rejected.','user':upd})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/admin/audit-log', methods=['GET'])
@token_required
@role_required('admin')
def audit_log(cu):
    page=int(request.args.get('page',1)); pp=int(request.args.get('per_page',50))
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT COUNT(*) FROM audit_log"); total=cur.fetchone()['count']
        cur.execute("SELECT al.*,u.full_name AS actor_name,u.email AS actor_email FROM audit_log al LEFT JOIN users u ON al.actor_id::uuid=u.id ORDER BY al.sequence DESC LIMIT %s OFFSET %s",(pp,(page-1)*pp))
        logs=[serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({'logs':logs,'total':total,'page':page,'pages':(total+pp-1)//pp})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/admin/audit-log/verify', methods=['GET'])
@token_required
@role_required('admin')
def verify_chain(cu):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM audit_log ORDER BY sequence ASC")
        logs=cur.fetchall(); cur.close(); conn.close()
        prev='0'*64; broken=None
        for i,log in enumerate(logs):
            pl=json.loads(log['payload']) if log['payload'] else {}
            ts=log['created_at'].isoformat() if hasattr(log['created_at'],'isoformat') else str(log['created_at'])
            ds=f"{prev}|{log['event_type']}|{log['actor_id']}|{log['entity_id']}|{json.dumps(pl,sort_keys=True)}|{ts}"
            if hashlib.sha256(ds.encode()).hexdigest()!=log['block_hash']: broken=i; break
            prev=log['block_hash']
        return jsonify({'chain_valid':broken is None,'total_blocks':len(logs),'broken_at':broken,
                        'message':'✓ Blockchain integrity verified.' if broken is None else f'⚠ Chain broken at block {broken}!'})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/admin/stats', methods=['GET'])
@token_required
@role_required('admin')
def admin_stats(cu):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        s={}
        for k,q in [
            ('total_users',"SELECT COUNT(*) FROM users WHERE role!='admin'"),
            ('pending_registrations',"SELECT COUNT(*) FROM users WHERE COALESCE(approval_status,'pending')='pending' AND role!='admin'"),
            ('approved_users',"SELECT COUNT(*) FROM users WHERE approval_status='approved' AND role!='admin'"),
            ('rejected_users',"SELECT COUNT(*) FROM users WHERE approval_status='rejected' AND role!='admin'"),
            ('pending_farmers',"SELECT COUNT(*) FROM users WHERE COALESCE(approval_status,'pending')='pending' AND role='farmer'"),
            ('pending_labs',"SELECT COUNT(*) FROM users WHERE COALESCE(approval_status,'pending')='pending' AND role='lab'"),
            ('pending_consumers',"SELECT COUNT(*) FROM users WHERE COALESCE(approval_status,'pending')='pending' AND role='consumer'"),
            ('total_batches',"SELECT COUNT(*) FROM herb_batches"),
            ('approved_batches',"SELECT COUNT(*) FROM lab_tests WHERE overall_status='approved'"),
            ('total_products',"SELECT COUNT(*) FROM products"),
            ('total_audit_events',"SELECT COUNT(*) FROM audit_log"),
        ]:
            try: cur.execute(q); s[k]=cur.fetchone()['count']
            except Exception: s[k]=0
        cur.close(); conn.close()
        return jsonify({'stats':s})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/admin/users', methods=['GET'])
@token_required
@role_required('admin')
def admin_users(cu):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id,email,role,full_name,phone,created_at,COALESCE(is_active,FALSE) AS is_active,COALESCE(approval_status,'pending') AS approval_status FROM users ORDER BY created_at DESC")
        users=[serialize(dict(u)) for u in cur.fetchall()]
        cur.close(); conn.close(); return jsonify({'users':users})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/admin/batches', methods=['GET'])
@token_required
@role_required('admin')
def admin_batches(cu):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT hb.*,u.full_name AS farmer_name,lt.overall_status AS lab_status,p.product_id FROM herb_batches hb LEFT JOIN users u ON hb.farmer_id=u.id LEFT JOIN lab_tests lt ON hb.batch_id=lt.batch_id LEFT JOIN products p ON hb.batch_id=p.batch_id ORDER BY hb.created_at DESC")
        batches=[serialize(dict(b)) for b in cur.fetchall()]
        cur.close(); conn.close(); return jsonify({'batches':batches})
    except Exception as e: return jsonify({'error':str(e)}),500


# ══════════════════════════════════════════════════════════════════
# FARMER
# ══════════════════════════════════════════════════════════════════

@app.route('/api/farmer/batches', methods=['POST'])
@token_required
@role_required('farmer','admin')
def create_batch(cu):
    data=request.form
    if not data.get('herb_species'): return jsonify({'error':'Herb species required'}),400
    if not data.get('harvest_date'): return jsonify({'error':'Harvest date required'}),400
    img=save_file(request.files.get('image'),'herb_')
    bid=f"BATCH-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        gflag = check_geofence(cur, data.get('herb_species'), data.get('harvest_date'), data.get('gps_lat'), data.get('gps_lng'), data.get('quantity_kg'))
        cur.execute("INSERT INTO herb_batches(batch_id,farmer_id,herb_species,quantity_kg,moisture_level,harvest_date,farming_practices,gps_lat,gps_lng,location_name,image_url,notes,geofence_flag) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                    (bid,cu['user_id'],data.get('herb_species'),data.get('quantity_kg') or None,data.get('moisture_level') or None,data.get('harvest_date'),data.get('farming_practices') or None,data.get('gps_lat') or None,data.get('gps_lng') or None,data.get('location_name'),img,data.get('notes'),gflag))
        batch=serialize(dict(cur.fetchone()))
        record_audit(conn,'BATCH_REGISTERED',cu['user_id'],'batch',bid,{'herb':data.get('herb_species'),'geofence_flag':gflag})
        conn.commit(); cur.close(); conn.close()
        fabric_submit('collection-event', {
            'batchId':bid,'species':data.get('herb_species'),'collectorId':cu['user_id'],
            'lat':data.get('gps_lat') or 0,'lng':data.get('gps_lng') or 0,
            'harvestDate':data.get('harvest_date'),'quantityKg':data.get('quantity_kg') or 0,
            'initialMoisture':data.get('moisture_level') or ''
        })
        msg = f'Batch {bid} registered!'
        if gflag: msg += f' ⚠ Compliance note: {gflag} (sent to admin for review)'
        return jsonify({'batch':batch,'message':msg,'geofence_flag':gflag}),201
    except Exception as e: return jsonify({'error':str(e)}),500

@app.route('/api/farmer/batches', methods=['GET'])
@token_required
@role_required('farmer','admin')
def list_batches(cu):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if cu['role']=='admin':
            cur.execute("SELECT hb.*,u.full_name AS farmer_name,lt.overall_status AS lab_status,p.product_id FROM herb_batches hb LEFT JOIN users u ON hb.farmer_id=u.id LEFT JOIN lab_tests lt ON hb.batch_id=lt.batch_id LEFT JOIN products p ON hb.batch_id=p.batch_id ORDER BY hb.created_at DESC")
        else:
            cur.execute("SELECT hb.*,lt.overall_status AS lab_status,p.product_id FROM herb_batches hb LEFT JOIN lab_tests lt ON hb.batch_id=lt.batch_id LEFT JOIN products p ON hb.batch_id=p.batch_id WHERE hb.farmer_id=%s ORDER BY hb.created_at DESC",(cu['user_id'],))
        batches=[serialize(dict(b)) for b in cur.fetchall()]
        cur.close(); conn.close(); return jsonify({'batches':batches})
    except Exception as e: return jsonify({'error':str(e)}),500


# ══════════════════════════════════════════════════════════════════
# PROCESSING
# ══════════════════════════════════════════════════════════════════

@app.route('/api/processing', methods=['POST'])
@token_required
@role_required('admin','lab')
def create_processing(cu):
    data=request.get_json() or {}; bid=data.get('batch_id','').strip()
    if not bid: return jsonify({'error':'batch_id required'}),400
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT batch_id,status FROM herb_batches WHERE batch_id=%s",(bid,))
        batch=cur.fetchone()
        if not batch: cur.close(); conn.close(); return jsonify({'error':f'Batch {bid} not found'}),404
        if batch['status']=='rejected': cur.close(); conn.close(); return jsonify({'error':'Cannot process rejected batch'}),400
        cur.execute("SELECT id FROM processing_records WHERE batch_id=%s",(bid,))
        if cur.fetchone():
            cur.execute("UPDATE processing_records SET drying_method=%s,drying_duration_hours=%s,drying_temperature=%s,grinding_status=%s,grinding_particle_sz=%s,storage_temperature=%s,storage_humidity=%s,storage_location=%s,chain_of_custody=%s,notes=%s,processed_at=NOW() WHERE batch_id=%s RETURNING *",
                        (data.get('drying_method'),data.get('drying_duration_hours') or None,data.get('drying_temperature') or None,data.get('grinding_status',False),data.get('grinding_particle_size'),data.get('storage_temperature') or None,data.get('storage_humidity') or None,data.get('storage_location'),data.get('chain_of_custody'),data.get('notes'),bid))
        else:
            cur.execute("INSERT INTO processing_records(batch_id,processor_id,drying_method,drying_duration_hours,drying_temperature,grinding_status,grinding_particle_sz,storage_temperature,storage_humidity,storage_location,chain_of_custody,notes) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                        (bid,cu['user_id'],data.get('drying_method'),data.get('drying_duration_hours') or None,data.get('drying_temperature') or None,data.get('grinding_status',False),data.get('grinding_particle_size'),data.get('storage_temperature') or None,data.get('storage_humidity') or None,data.get('storage_location'),data.get('chain_of_custody'),data.get('notes')))
        rec=serialize(dict(cur.fetchone()))
        cur.execute("UPDATE herb_batches SET status='processing' WHERE batch_id=%s",(bid,))
        record_audit(conn,'BATCH_PROCESSING',cu['user_id'],'batch',bid,{'method':data.get('drying_method')})
        conn.commit(); cur.close(); conn.close()
        fabric_submit('processing-step', {
            'batchId':bid,'processorId':cu['user_id'],'dryingMethod':data.get('drying_method') or '',
            'storageTemp':data.get('storage_temperature') or '','storageHumidity':data.get('storage_humidity') or '',
            'chainOfCustodyNote':data.get('chain_of_custody') or ''
        })
        return jsonify({'record':rec,'message':'Processing saved!'}),201
    except Exception as e: return jsonify({'error':str(e)}),500

@app.route('/api/processing/<bid>', methods=['GET'])
@token_required
def get_processing(cu, bid):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM processing_records WHERE batch_id=%s ORDER BY processed_at DESC",(bid,))
        recs=[serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify({'records':recs})
    except Exception as e: return jsonify({'error':str(e)}),500

@app.route('/api/processing/list', methods=['GET'])
@token_required
@role_required('admin','lab')
def list_processing(cu):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT pr.*,hb.herb_species,hb.status AS batch_status,u.full_name AS farmer_name FROM processing_records pr JOIN herb_batches hb ON pr.batch_id=hb.batch_id LEFT JOIN users u ON hb.farmer_id=u.id ORDER BY pr.processed_at DESC")
        recs=[serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify({'records':recs})
    except Exception as e: return jsonify({'error':str(e)}),500


# ══════════════════════════════════════════════════════════════════
# LAB
# ══════════════════════════════════════════════════════════════════

@app.route('/api/lab/batches', methods=['GET'])
@token_required
@role_required('lab','admin')
def lab_batches(cu):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT hb.batch_id,hb.herb_species,hb.quantity_kg,hb.harvest_date,hb.status,hb.created_at,u.full_name AS farmer_name,lt.overall_status AS lab_status,pr.drying_method,p.product_id FROM herb_batches hb LEFT JOIN users u ON hb.farmer_id=u.id LEFT JOIN lab_tests lt ON hb.batch_id=lt.batch_id LEFT JOIN processing_records pr ON hb.batch_id=pr.batch_id LEFT JOIN products p ON hb.batch_id=p.batch_id WHERE hb.status!='rejected' ORDER BY hb.created_at DESC")
        batches=[serialize(dict(b)) for b in cur.fetchall()]
        cur.close(); conn.close(); return jsonify({'batches':batches})
    except Exception as e: return jsonify({'error':str(e)}),500

@app.route('/api/lab/tests', methods=['POST'])
@token_required
@role_required('lab','admin')
def create_lab_test(cu):
    data=request.form; bid=data.get('batch_id','').strip(); ost=data.get('overall_status','pending')
    if not bid: return jsonify({'error':'batch_id required'}),400
    if ost not in ('pending','approved','rejected'): return jsonify({'error':'Invalid status'}),400
    furls={}
    for fn in ('moisture_report','pesticide_report','dna_certificate'):
        url=save_file(request.files.get(fn),f'{fn}_')
        if url: furls[f'{fn}_url']=url
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT batch_id FROM herb_batches WHERE batch_id=%s",(bid,))
        if not cur.fetchone(): cur.close(); conn.close(); return jsonify({'error':f'Batch {bid} not found'}),404
        cur.execute("SELECT id FROM lab_tests WHERE batch_id=%s",(bid,))
        if cur.fetchone():
            cur.execute("UPDATE lab_tests SET moisture_content=%s,moisture_report_url=COALESCE(%s,moisture_report_url),pesticide_residue_result=%s,pesticide_report_url=COALESCE(%s,pesticide_report_url),dna_auth_result=%s,dna_certificate_url=COALESCE(%s,dna_certificate_url),heavy_metal_result=%s,microbial_count=%s,overall_status=%s,tested_by=%s,notes=%s,tested_at=NOW() WHERE batch_id=%s RETURNING *",
                        (data.get('moisture_content') or None,furls.get('moisture_report_url'),data.get('pesticide_residue_result') or None,furls.get('pesticide_report_url'),data.get('dna_auth_result') or None,furls.get('dna_certificate_url'),data.get('heavy_metal_result') or None,data.get('microbial_count') or None,ost,data.get('tested_by'),data.get('notes'),bid))
        else:
            cur.execute("INSERT INTO lab_tests(batch_id,lab_id,moisture_content,moisture_report_url,pesticide_residue_result,pesticide_report_url,dna_auth_result,dna_certificate_url,heavy_metal_result,microbial_count,overall_status,tested_by,notes) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                        (bid,cu['user_id'],data.get('moisture_content') or None,furls.get('moisture_report_url'),data.get('pesticide_residue_result') or None,furls.get('pesticide_report_url'),data.get('dna_auth_result') or None,furls.get('dna_certificate_url'),data.get('heavy_metal_result') or None,data.get('microbial_count') or None,ost,data.get('tested_by'),data.get('notes')))
        test=serialize(dict(cur.fetchone()))
        ns={'approved':'approved','rejected':'rejected'}.get(ost,'testing')
        cur.execute("UPDATE herb_batches SET status=%s WHERE batch_id=%s",(ns,bid))
        record_audit(conn,f'LAB_TEST_{ost.upper()}',cu['user_id'],'batch',bid,{'status':ost,'by':data.get('tested_by')})
        conn.commit(); cur.close(); conn.close()
        fabric_submit('quality-test', {
            'batchId':bid,'labId':cu['user_id'],'moistureContent':data.get('moisture_content') or '',
            'pesticideResult':data.get('pesticide_residue_result') or '','dnaAuthResult':data.get('dna_auth_result') or '',
            'overallStatus':ost
        })
        return jsonify({'test':test,'message':f'Lab results saved. Batch → {ns}'}),201
    except Exception as e: return jsonify({'error':str(e)}),500

@app.route('/api/lab/tests/<bid>', methods=['GET'])
@token_required
@role_required('lab','admin')
def get_lab_test(cu, bid):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM lab_tests WHERE batch_id=%s ORDER BY tested_at DESC LIMIT 1",(bid,))
        row=cur.fetchone(); cur.close(); conn.close()
        return jsonify({'test':serialize(dict(row)) if row else None})
    except Exception as e: return jsonify({'error':str(e)}),500


# ══════════════════════════════════════════════════════════════════
# QR + CONSUMER
# ══════════════════════════════════════════════════════════════════

@app.route('/api/products/generate-qr', methods=['POST'])
@token_required
@role_required('production_unit','lab','admin')
def gen_qr(cu):
    data=request.get_json() or {}; bid=data.get('batch_id','').strip()
    if not bid: return jsonify({'error':'batch_id required'}),400
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM herb_batches WHERE batch_id=%s",(bid,))
        batch=cur.fetchone()
        if not batch: cur.close(); conn.close(); return jsonify({'error':f'Batch {bid} not found'}),404
        cur.execute("SELECT overall_status FROM lab_tests WHERE batch_id=%s ORDER BY tested_at DESC LIMIT 1",(bid,))
        lab=cur.fetchone()
        if not lab or lab['overall_status']!='approved': cur.close(); conn.close(); return jsonify({'error':'QR only for lab-APPROVED batches'}),400
        cur.execute("SELECT product_id FROM products WHERE batch_id=%s",(bid,))
        ex=cur.fetchone()
        if ex: cur.close(); conn.close(); return jsonify({'error':'QR already exists','product_id':ex['product_id']}),409
        pid=f"PROD-{uuid.uuid4().hex[:10].upper()}"; scan=f"{FRONTEND_URL}/consumer-portal?pid={pid}"; qr=make_qr(scan)
        cur.execute("INSERT INTO products(product_id,batch_id,qr_code_data,product_name,description,manufacturing_date,expiry_date,generated_by) VALUES(%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                    (pid,bid,f"data:image/png;base64,{qr}",data.get('product_name') or f"Herb - {batch['herb_species']}",data.get('description'),data.get('manufacturing_date') or datetime.now().date(),data.get('expiry_date'),cu['user_id']))
        product=serialize(dict(cur.fetchone()))
        record_audit(conn,'QR_GENERATED',cu['user_id'],'product',pid,{'batch_id':bid,'product_id':pid})
        conn.commit(); cur.close(); conn.close()
        return jsonify({'product':product,'product_id':pid,'qr_code':f"data:image/png;base64,{qr}",'scan_url':scan,'message':f'QR generated. Product ID: {pid}'}),201
    except Exception as e: return jsonify({'error':str(e)}),500

@app.route('/api/products', methods=['GET'])
@token_required
@role_required('lab','admin')
def list_products(cu):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT p.product_id,p.product_name,p.qr_code_data,p.created_at,hb.batch_id,hb.herb_species,hb.status FROM products p JOIN herb_batches hb ON p.batch_id=hb.batch_id ORDER BY p.created_at DESC")
        products=[serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify({'products':products})
    except Exception as e: return jsonify({'error':str(e)}),500

@app.route('/api/products/<pid>/scan', methods=['GET'])
def scan_product(pid):
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""SELECT p.product_id,p.product_name,p.description,p.manufacturing_date,p.expiry_date,p.qr_code_data,p.created_at,p.recalled,
            hb.batch_id,hb.herb_species,hb.quantity_kg,hb.moisture_level,hb.harvest_date,hb.farming_practices,hb.gps_lat,hb.gps_lng,hb.location_name,hb.image_url AS herb_image,hb.recalled AS batch_recalled,hb.recall_reason,hb.geofence_flag,
            u.full_name AS farmer_name,u.address AS farm_address,
            pr.drying_method,pr.drying_duration_hours,pr.grinding_status,pr.grinding_particle_sz AS grinding_particle_size,pr.storage_temperature,pr.storage_humidity,pr.storage_location,pr.chain_of_custody,
            lt.moisture_content,lt.pesticide_residue_result,lt.pesticide_report_url,lt.dna_auth_result,lt.dna_certificate_url,lt.heavy_metal_result,lt.microbial_count,lt.overall_status AS lab_status,lt.tested_by,lt.tested_at,lt.moisture_report_url,
            pu.full_name AS production_unit_contact, pup.unit_name AS production_unit_name
            FROM products p JOIN herb_batches hb ON p.batch_id=hb.batch_id
            LEFT JOIN users u ON hb.farmer_id=u.id
            LEFT JOIN processing_records pr ON hb.batch_id=pr.batch_id
            LEFT JOIN lab_tests lt ON hb.batch_id=lt.batch_id
            LEFT JOIN users pu ON p.generated_by=pu.id
            LEFT JOIN user_profiles pup ON pup.user_id=pu.id
            WHERE p.product_id=%s AND p.is_public=TRUE""",(pid,))
        row=cur.fetchone()
        if row:
            try:
                cur.execute("INSERT INTO consumer_scans(product_id,user_agent,ip_address) VALUES(%s,%s,%s)",(pid,request.headers.get('User-Agent','')[:500],request.remote_addr))
                conn.commit()
            except: pass
        cur.close(); conn.close()
        if not row: return jsonify({'error':f'Product {pid} not found'}),404
        return jsonify({'product':serialize(dict(row))})
    except Exception as e: return jsonify({'error':str(e)}),500

@app.route('/api/consumer/search', methods=['GET'])
def search_product():
    q=request.args.get('q','').strip()
    if not q: return jsonify({'results':[],'count':0})
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT p.product_id,p.product_name,p.created_at,hb.herb_species,hb.harvest_date,lt.overall_status FROM products p JOIN herb_batches hb ON p.batch_id=hb.batch_id LEFT JOIN lab_tests lt ON hb.batch_id=lt.batch_id WHERE(p.product_id ILIKE %s OR p.product_name ILIKE %s OR hb.batch_id ILIKE %s OR hb.herb_species ILIKE %s)AND p.is_public=TRUE ORDER BY p.created_at DESC LIMIT 20",(f'%{q}%',)*4)
        results=[serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify({'results':results,'count':len(results)})
    except Exception as e: return jsonify({'error':str(e)}),500


# ══════════════════════════════════════════════════════════════════
# LOGISTICS / CHAIN-OF-CUSTODY — single-use QR handoffs to stop
# transport-stage scams (cloned labels, diverted trucks, fake deliveries)
# ══════════════════════════════════════════════════════════════════

@app.route('/api/logistics/scan/<token>', methods=['GET'])
def logistics_scan(token):
    """Public: powers the page a courier/receiver lands on after scanning a
    dispatch QR — full batch context, lab status, and this specific leg's
    pickup/delivery details, everything needed to confirm receipt on the spot."""
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""SELECT ct.*, hb.herb_species, hb.quantity_kg, hb.moisture_level, hb.harvest_date,
                       hb.location_name, hb.gps_lat AS farm_gps_lat, hb.gps_lng AS farm_gps_lng,
                       u.full_name AS farmer_name
                       FROM custody_transfers ct
                       LEFT JOIN herb_batches hb ON ct.batch_id=hb.batch_id
                       LEFT JOIN users u ON hb.farmer_id=u.id
                       WHERE ct.transfer_token=%s""",(token,))
        transfer=cur.fetchone()
        if not transfer:
            cur.close(); conn.close()
            return jsonify({'error':'Unknown QR — this transfer token was not issued by this system.'}),404
        transfer=dict(transfer)
        bid=transfer['batch_id']

        cur.execute("""SELECT overall_status,moisture_content,pesticide_residue_result,dna_auth_result,
                       heavy_metal_result,microbial_count,tested_by,tested_at
                       FROM lab_tests WHERE batch_id=%s ORDER BY tested_at DESC LIMIT 1""",(bid,))
        lab=cur.fetchone()

        cur.execute("SELECT product_id,product_name FROM products WHERE batch_id=%s LIMIT 1",(bid,))
        product=cur.fetchone()

        cur.close(); conn.close()
        return jsonify({
            'transfer': serialize(transfer),
            'lab_test': serialize(dict(lab)) if lab else None,
            'product': serialize(dict(product)) if product else None,
        })
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/logistics/dispatch', methods=['POST'])
@token_required
@role_required('collector','admin')
def dispatch_shipment(cu):
    data=request.get_json() or {}
    bid=(data.get('batch_id') or '').strip()
    to_stage=(data.get('to_stage') or '').strip()
    if not bid or not to_stage: return jsonify({'error':'batch_id and to_stage are required'}),400
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT batch_id,status FROM herb_batches WHERE batch_id=%s",(bid,))
        batch=cur.fetchone()
        if not batch: cur.close(); conn.close(); return jsonify({'error':f'Batch {bid} not found'}),404
        cur.execute("SELECT id,to_stage,status,dispatched_at FROM custody_transfers WHERE batch_id=%s ORDER BY dispatched_at DESC LIMIT 1",(bid,))
        existing=cur.fetchone()
        if existing:
            cur.close(); conn.close()
            return jsonify({'error':f"Batch {bid} has already been dispatched once (on {existing['dispatched_at']}, → '{existing['to_stage']}', status: {existing['status']}). Each batch can only be shipped a single time — re-dispatching the same physical batch is not permitted."}),409
        token=secrets.token_hex(16)
        cur.execute("""INSERT INTO custody_transfers(batch_id,transfer_token,from_stage,to_stage,dispatched_by,courier_name,vehicle_number,pickup_gps_lat,pickup_gps_lng,status)
                       VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,'dispatched') RETURNING *""",
                    (bid,token,data.get('from_stage',batch['status']),to_stage,cu['user_id'],data.get('courier_name'),data.get('vehicle_number'),data.get('pickup_gps_lat') or None,data.get('pickup_gps_lng') or None))
        rec=serialize(dict(cur.fetchone()))
        qr=make_qr(f"{FRONTEND_URL}/logistics-scan?token={token}")
        cur.execute("UPDATE herb_batches SET status='in_transit' WHERE batch_id=%s",(bid,))
        record_audit(conn,'CUSTODY_DISPATCHED',cu['user_id'],'batch',bid,{'token':token,'to_stage':to_stage,'courier':data.get('courier_name'),'vehicle':data.get('vehicle_number')})
        conn.commit(); cur.close(); conn.close()
        fabric_result = fabric_submit('dispatch', {
            'batchId':bid,'transferToken':token,'fromStage':data.get('from_stage',batch['status']),'toStage':to_stage,
            'courierName':data.get('courier_name') or '','vehicleNumber':data.get('vehicle_number') or '',
            'pickupLat':data.get('pickup_gps_lat') or '','pickupLng':data.get('pickup_gps_lng') or ''
        })
        on_chain = bool(fabric_result and fabric_result.get('ok'))
        msg = 'Shipment dispatched. Print/share this single-use QR with the courier — it can be redeemed exactly once, at delivery.'
        if on_chain:
            msg += ' ✓ Recorded on Hyperledger Fabric.'
        elif fabric_result and fabric_result.get('error'):
            msg += f" (Fabric ledger did not accept this: {fabric_result['error']})"
        else:
            msg += ' (Fabric network not reachable — recorded locally only; see blockchain/README.md to bring it up.)'
        return jsonify({'transfer':rec,'qr_code':f"data:image/png;base64,{qr}",'transfer_token':token,'on_chain':on_chain,
                        'message':msg}),201
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/logistics/confirm-delivery', methods=['POST'])
@token_required
@role_required('production_unit','admin')
def confirm_delivery(cu):
    data=request.get_json() or {}
    token=(data.get('transfer_token') or '').strip()
    if not token: return jsonify({'error':'transfer_token required'}),400
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM custody_transfers WHERE transfer_token=%s",(token,))
        t=cur.fetchone()
        if not t:
            cur.close(); conn.close()
            return jsonify({'error':'Unknown transfer QR — this code was not issued by the ledger. Possible counterfeit.'}),404
        if t['status']!='dispatched':
            cur.close(); conn.close()
            return jsonify({'error':f"This QR was already redeemed (status: {t['status']}) at {t['delivered_at']}. Reuse detected — treat this shipment as suspicious."}),409

        anomaly=None
        dlat,dlng=data.get('delivery_gps_lat'),data.get('delivery_gps_lng')
        if dlat and dlng and t['pickup_gps_lat'] and t['pickup_gps_lng']:
            dist=haversine_km(float(t['pickup_gps_lat']),float(t['pickup_gps_lng']),float(dlat),float(dlng))
            elapsed_hrs=max((datetime.utcnow()-t['dispatched_at']).total_seconds()/3600,0.01)
            speed=dist/elapsed_hrs
            if speed>120:
                anomaly=f"Implausible transit speed (~{speed:.0f} km/h over {dist:.0f} km) — check for GPS spoofing or route diversion."

        cur.execute("""UPDATE custody_transfers SET received_by=%s,receiver_name=%s,delivery_gps_lat=%s,delivery_gps_lng=%s,delivered_at=NOW(),status='delivered',anomaly_flag=%s,anomaly_reason=%s
                       WHERE transfer_token=%s RETURNING *""",
                    (cu['user_id'],data.get('receiver_name'),dlat or None,dlng or None,bool(anomaly),anomaly,token))
        rec=serialize(dict(cur.fetchone()))
        cur.execute("UPDATE herb_batches SET status=%s WHERE batch_id=%s",(t['to_stage'],t['batch_id']))
        record_audit(conn,'CUSTODY_ANOMALY' if anomaly else 'CUSTODY_DELIVERED',cu['user_id'],'batch',t['batch_id'],{'token':token,'anomaly':anomaly,'receiver':data.get('receiver_name')})
        conn.commit(); cur.close(); conn.close()
        fabric_result = fabric_submit('confirm-delivery', {
            'transferToken':token,'receiverName':data.get('receiver_name') or '',
            'deliveryLat':dlat or '','deliveryLng':dlng or ''
        })
        on_chain = bool(fabric_result and fabric_result.get('ok'))
        msg='Delivery confirmed — chain of custody intact.' if not anomaly else f'Delivery logged but FLAGGED: {anomaly}'
        if on_chain:
            msg += ' ✓ Recorded on Hyperledger Fabric.'
        elif fabric_result and fabric_result.get('error'):
            msg += f" (Fabric ledger did not accept this: {fabric_result['error']})"
        else:
            msg += ' (Fabric network not reachable — recorded locally only.)'
        return jsonify({'transfer':rec,'message':msg,'anomaly':bool(anomaly),'on_chain':on_chain})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/logistics/<bid>', methods=['GET'])
def get_custody_chain(bid):
    """Public: powers the 'Transport Journey' trail on the consumer verification page."""
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""SELECT from_stage,to_stage,courier_name,vehicle_number,dispatched_at,delivered_at,status,anomaly_flag,anomaly_reason,receiver_name,
                       pickup_gps_lat,pickup_gps_lng,delivery_gps_lat,delivery_gps_lng
                       FROM custody_transfers WHERE batch_id=%s ORDER BY dispatched_at ASC""",(bid,))
        chain=[serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({'batch_id':bid,'custody_chain':chain})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/logistics/verify-token/<token>', methods=['GET'])
def verify_transfer_token(token):
    """Public: lets a courier/receiver check a QR's validity before acting on it."""
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT batch_id,status,to_stage,courier_name,delivered_at FROM custody_transfers WHERE transfer_token=%s",(token,))
        t=cur.fetchone(); cur.close(); conn.close()
        if not t: return jsonify({'valid':False,'message':'Unknown QR — not issued by this system.'}),404
        return jsonify({'valid':True,**serialize(dict(t))})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/admin/logistics/<bid>/chain-verify', methods=['GET'])
@token_required
@role_required('admin')
def admin_verify_logistics_chain(cu,bid):
    """Fetches this batch's custody chain straight from the Fabric ledger (via the
    gateway bridge) and compares it against what Postgres has, so the admin can see
    Hyperledger Fabric is the actual source of truth, not just a local database."""
    if not FABRIC_ENABLED:
        return jsonify({'on_chain':False,'message':'FABRIC_GATEWAY_URL is not configured on this server.'}),200
    try:
        r=requests.get(f"{FABRIC_GATEWAY_URL}/provenance/{bid}",timeout=6)
        if not r.ok:
            return jsonify({'on_chain':False,'message':'Fabric network unreachable — is the network/gateway-api running?'}),200
        fabric_data=r.json()
        chain_legs=(fabric_data.get('result') or {}).get('custodyChain') or []
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT COUNT(*) AS c FROM custody_transfers WHERE batch_id=%s",(bid,))
        pg_count=cur.fetchone()['c']; cur.close(); conn.close()
        return jsonify({'on_chain':True,'batch_id':bid,'fabric_legs':chain_legs,'fabric_leg_count':len(chain_legs),
                        'postgres_leg_count':pg_count,'in_sync':len(chain_legs)==pg_count,
                        'message':f'✓ Verified directly against the Fabric ledger — {len(chain_legs)} custody leg(s) on-chain.' if len(chain_legs)==pg_count
                                  else f'⚠ Mismatch: {len(chain_legs)} leg(s) on Fabric vs {pg_count} in the local database.'})
    except Exception as e:
        return jsonify({'on_chain':False,'message':f'Could not reach Fabric gateway: {e}'}),200


@app.route('/api/admin/logistics/<bid>', methods=['DELETE'])
@token_required
@role_required('admin')
def admin_clear_logistics(cu,bid):
    """Admin/testing utility: wipes all custody-transfer history for a batch so it can
    be dispatched again. Use freely while testing; think twice before using this on a
    batch with real data, since it doesn't retroactively undo the Fabric-side records."""
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("DELETE FROM custody_transfers WHERE batch_id=%s RETURNING id",(bid,))
        deleted=cur.rowcount
        cur.execute("UPDATE herb_batches SET status='approved' WHERE batch_id=%s AND status='in_transit'",(bid,))
        record_audit(conn,'LOGISTICS_RESET',cu['user_id'],'batch',bid,{'deleted_legs':deleted})
        conn.commit(); cur.close(); conn.close()
        return jsonify({'message':f'Cleared {deleted} custody-transfer record(s) for {bid}. It can be dispatched again.'})
    except Exception as e: return jsonify({'error':str(e)}),500


@app.route('/api/admin/logistics', methods=['GET'])
@token_required
@role_required('admin')
def admin_list_logistics(cu):
    """Admin: every custody-transfer leg across every batch, most recent first."""
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""SELECT ct.id,ct.batch_id,hb.herb_species,ct.from_stage,ct.to_stage,ct.courier_name,ct.vehicle_number,
                       ct.dispatched_at,ct.delivered_at,ct.status,ct.anomaly_flag,ct.anomaly_reason,ct.receiver_name,
                       ct.pickup_gps_lat,ct.pickup_gps_lng,ct.delivery_gps_lat,ct.delivery_gps_lng,
                       hb.gps_lat AS farm_gps_lat, hb.gps_lng AS farm_gps_lng, hb.location_name AS farm_location,
                       u1.full_name AS dispatched_by_name, u2.full_name AS received_by_name
                       FROM custody_transfers ct
                       LEFT JOIN herb_batches hb ON ct.batch_id=hb.batch_id
                       LEFT JOIN users u1 ON ct.dispatched_by=u1.id
                       LEFT JOIN users u2 ON ct.received_by=u2.id
                       ORDER BY ct.dispatched_at DESC LIMIT 200""")
        rows=[serialize(dict(r)) for r in cur.fetchall()]
        cur.execute("SELECT COUNT(*) AS c FROM custody_transfers WHERE anomaly_flag=TRUE")
        anomalies=cur.fetchone()['c']
        cur.execute("SELECT COUNT(*) AS c FROM custody_transfers WHERE status='dispatched'")
        in_transit=cur.fetchone()['c']
        cur.close(); conn.close()
        return jsonify({'transfers':rows,'total':len(rows),'anomalies':anomalies,'in_transit':in_transit})
    except Exception as e: return jsonify({'error':str(e)}),500


# ══════════════════════════════════════════════════════════════════
# BLOCKCHAIN VERIFICATION (public, read-only, safe subset of audit_log)
# ══════════════════════════════════════════════════════════════════

@app.route('/api/blockchain/verify/<bid>', methods=['GET'])
def verify_batch_chain(bid):
    """Public: consumer-facing proof that this batch's history hasn't been tampered with.
    Re-derives every block hash from genesis and checks the ledger is unbroken."""
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT sequence,event_type,block_hash,created_at FROM audit_log WHERE entity_id=%s ORDER BY sequence ASC",(bid,))
        events=[serialize(dict(r)) for r in cur.fetchall()]
        cur.execute("SELECT * FROM audit_log ORDER BY sequence ASC")
        logs=cur.fetchall()
        prev='0'*64; broken=None
        for i,log in enumerate(logs):
            pl=json.loads(log['payload']) if log['payload'] else {}
            ts=log['created_at'].isoformat() if hasattr(log['created_at'],'isoformat') else str(log['created_at'])
            ds=f"{prev}|{log['event_type']}|{log['actor_id']}|{log['entity_id']}|{json.dumps(pl,sort_keys=True)}|{ts}"
            if hashlib.sha256(ds.encode()).hexdigest()!=log['block_hash']: broken=i; break
            prev=log['block_hash']
        cur.close(); conn.close()
        valid = broken is None
        return jsonify({'batch_id':bid,'events':events,'chain_valid':valid,
                        'message':'✓ Verified — every recorded step for this batch is cryptographically linked and untampered.' if valid else '⚠ Ledger tampering detected — do not trust this product\'s history.'})
    except Exception as e: return jsonify({'error':str(e)}),500


# ══════════════════════════════════════════════════════════════════
# RECALL MANAGEMENT
# ══════════════════════════════════════════════════════════════════

@app.route('/api/admin/batches/<bid>/recall', methods=['POST'])
@token_required
@role_required('admin')
def recall_batch(cu,bid):
    data=request.get_json() or {}
    reason=data.get('reason','Quality/safety concern')
    try:
        conn=get_db(); cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("UPDATE herb_batches SET recalled=TRUE,recall_reason=%s WHERE batch_id=%s",(reason,bid))
        cur.execute("UPDATE products SET recalled=TRUE WHERE batch_id=%s",(bid,))
        record_audit(conn,'BATCH_RECALLED',cu['user_id'],'batch',bid,{'reason':reason})
        conn.commit(); cur.close(); conn.close()
        return jsonify({'message':f'Batch {bid} and all its products are now marked RECALLED. Consumers scanning any linked QR will see an alert.'})
    except Exception as e: return jsonify({'error':str(e)}),500


# ══════════════════════════════════════════════════════════════════
# STATIC + HEALTH
# ══════════════════════════════════════════════════════════════════
# STATIC + HEALTH

@app.route('/uploads/<path:fn>')
def serve_upload(fn):
    return send_from_directory(app.config['UPLOAD_FOLDER'], fn)


@app.route('/')
def home():
    return "Ayurvedic Herbal Traceability Backend is Running!"


@app.route('/api/blockchain/status', methods=['GET'])
def blockchain_status():
    """Reports both ledger layers so the frontend/demo can show which are live."""
    fabric = {'enabled': FABRIC_ENABLED, 'reachable': False}
    if FABRIC_ENABLED:
        try:
            r = requests.get(f"{FABRIC_GATEWAY_URL}/health", timeout=3)
            fabric['reachable'] = r.ok
            fabric.update(r.json() if r.ok else {})
        except Exception as e:
            fabric['error'] = str(e)
    return jsonify({'hash_chain':{'enabled':True,'type':'application-layer SHA-256 chain (audit_log)'},
                    'hyperledger_fabric':fabric})


@app.route('/api/health', methods=['GET'])
def health():
    try:
        conn=get_db(); conn.close(); db=True
    except:
        db=False
    return jsonify({'status':'ok' if db else 'db_error','db':'connected' if db else 'disconnected',
                    'fabric_enabled':FABRIC_ENABLED,'timestamp':datetime.now().isoformat()})

@app.route('/api/init-db')
def initialize_database():
    try:
        init_db()
        return {"message": "Database initialized successfully"}
    except Exception as e:
        return {"error": str(e)}, 500