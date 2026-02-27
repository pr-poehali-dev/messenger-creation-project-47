"""
AstreyMessange Auth API
Регистрация/вход по номеру телефона или username. OTP-коды для верификации.
"""
import json
import os
import random
import secrets
import psycopg2
from datetime import datetime

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={SCHEMA}")


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
    }


def resp(status, data):
    return {"statusCode": status, "headers": {**cors_headers(), "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    """Auth: send_otp, verify_otp, register, login_username, me, logout, update_profile"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    path = event.get("path", "/").rstrip("/")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_conn()
    cur = conn.cursor()

    try:
        # POST /send_otp — отправить код
        if path.endswith("/send_otp") and method == "POST":
            phone = (body.get("phone") or "").strip()
            if not phone or len(phone) < 7:
                return resp(400, {"error": "Укажите номер телефона"})
            code = str(random.randint(100000, 999999))
            cur.execute(
                f"INSERT INTO {SCHEMA}.am_otp_codes (phone, code) VALUES (%s, %s)",
                (phone, code)
            )
            conn.commit()
            # В продакшне здесь SMS-отправка. Для MVP — возвращаем код в ответе
            return resp(200, {"ok": True, "code": code, "message": "Код отправлен"})

        # POST /verify_otp — проверить код и войти/зарегать
        if path.endswith("/verify_otp") and method == "POST":
            phone = (body.get("phone") or "").strip()
            code = (body.get("code") or "").strip()
            name = (body.get("name") or "").strip() or "Пользователь"
            if not phone or not code:
                return resp(400, {"error": "Укажите телефон и код"})
            cur.execute(
                f"SELECT id FROM {SCHEMA}.am_otp_codes WHERE phone=%s AND code=%s AND used=FALSE AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
                (phone, code)
            )
            otp = cur.fetchone()
            if not otp:
                return resp(400, {"error": "Неверный или устаревший код"})
            cur.execute(f"UPDATE {SCHEMA}.am_otp_codes SET used=TRUE WHERE id=%s", (otp[0],))

            # Ищем или создаём пользователя
            cur.execute(f"SELECT id, display_name, username, avatar_color, stars_balance, is_premium, is_admin, is_system, system_display_phone, status, bio FROM {SCHEMA}.am_users WHERE phone=%s", (phone,))
            user = cur.fetchone()
            if not user:
                colors = ["#2d8cf0", "#a855f7", "#10b981", "#ef4444", "#f59e0b", "#ec4899", "#06b6d4"]
                color = random.choice(colors)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.am_users (phone, display_name, avatar_color, status) VALUES (%s, %s, %s, 'online') RETURNING id, display_name, username, avatar_color, stars_balance, is_premium, is_admin, is_system, system_display_phone, status, bio",
                    (phone, name, color)
                )
                user = cur.fetchone()
                # Добавляем в чат поддержки
                cur.execute(f"SELECT id FROM {SCHEMA}.am_chats WHERE name='Техническая поддержка' LIMIT 1")
                sup_chat = cur.fetchone()
                if sup_chat:
                    cur.execute(f"INSERT INTO {SCHEMA}.am_chat_members (chat_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (sup_chat[0], user[0]))
            else:
                cur.execute(f"UPDATE {SCHEMA}.am_users SET status='online', last_seen=NOW() WHERE id=%s", (user[0],))

            token = secrets.token_urlsafe(48)
            cur.execute(f"INSERT INTO {SCHEMA}.am_sessions (user_id, token) VALUES (%s, %s)", (user[0], token))
            conn.commit()

            display_phone = user[8] if user[7] else phone  # system_display_phone
            return resp(200, {
                "ok": True,
                "token": token,
                "user": {
                    "id": user[0], "display_name": user[1], "username": user[2],
                    "avatar_color": user[3], "stars_balance": user[4],
                    "is_premium": user[5], "is_admin": user[6], "is_system": user[7],
                    "phone": display_phone, "status": user[9], "bio": user[10] or ""
                }
            })

        # POST /login_username — вход по @username (без пароля для MVP, только для тестов)
        if path.endswith("/login_username") and method == "POST":
            username = (body.get("username") or "").strip().lstrip("@")
            if not username:
                return resp(400, {"error": "Укажите username"})
            cur.execute(f"SELECT id, display_name, username, avatar_color, stars_balance, is_premium, is_admin, is_system, system_display_phone, status, bio, phone FROM {SCHEMA}.am_users WHERE username=%s", (f"@{username}",))
            user = cur.fetchone()
            if not user:
                return resp(404, {"error": "Пользователь не найден"})
            cur.execute(f"UPDATE {SCHEMA}.am_users SET status='online', last_seen=NOW() WHERE id=%s", (user[0],))
            token = secrets.token_urlsafe(48)
            cur.execute(f"INSERT INTO {SCHEMA}.am_sessions (user_id, token) VALUES (%s, %s)", (user[0], token))
            conn.commit()
            display_phone = user[8] if user[7] else user[11]
            return resp(200, {
                "ok": True, "token": token,
                "user": {
                    "id": user[0], "display_name": user[1], "username": user[2],
                    "avatar_color": user[3], "stars_balance": user[4],
                    "is_premium": user[5], "is_admin": user[6], "is_system": user[7],
                    "phone": display_phone, "status": user[9], "bio": user[10] or ""
                }
            })

        # GET /me — получить текущего пользователя
        if path.endswith("/me") and method == "GET":
            token = (event.get("headers") or {}).get("X-Authorization", "").replace("Bearer ", "").strip()
            if not token:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"SELECT u.id, u.display_name, u.username, u.avatar_color, u.stars_balance, u.is_premium, u.is_admin, u.is_system, u.system_display_phone, u.status, u.bio, u.phone FROM {SCHEMA}.am_users u JOIN {SCHEMA}.am_sessions s ON s.user_id=u.id WHERE s.token=%s AND s.expires_at > NOW()", (token,))
            user = cur.fetchone()
            if not user:
                return resp(401, {"error": "Сессия устарела"})
            display_phone = user[8] if user[7] else user[11]
            return resp(200, {
                "id": user[0], "display_name": user[1], "username": user[2],
                "avatar_color": user[3], "stars_balance": user[4],
                "is_premium": user[5], "is_admin": user[6], "is_system": user[7],
                "phone": display_phone, "status": user[9], "bio": user[10] or ""
            })

        # PUT /update_profile
        if path.endswith("/update_profile") and method == "PUT":
            token = (event.get("headers") or {}).get("X-Authorization", "").replace("Bearer ", "").strip()
            if not token:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"SELECT user_id FROM {SCHEMA}.am_sessions WHERE token=%s AND expires_at > NOW()", (token,))
            sess = cur.fetchone()
            if not sess:
                return resp(401, {"error": "Сессия устарела"})
            uid = sess[0]
            name = body.get("display_name", "").strip()
            username = body.get("username", "").strip()
            color = body.get("avatar_color", "").strip()
            bio = body.get("bio", "").strip()
            status = body.get("status", "").strip()
            if name:
                cur.execute(f"UPDATE {SCHEMA}.am_users SET display_name=%s WHERE id=%s", (name, uid))
            if username:
                uname = username if username.startswith("@") else f"@{username}"
                cur.execute(f"UPDATE {SCHEMA}.am_users SET username=%s WHERE id=%s", (uname, uid))
            if color:
                cur.execute(f"UPDATE {SCHEMA}.am_users SET avatar_color=%s WHERE id=%s", (color, uid))
            if bio is not None:
                cur.execute(f"UPDATE {SCHEMA}.am_users SET bio=%s WHERE id=%s", (bio, uid))
            if status in ("online", "offline"):
                cur.execute(f"UPDATE {SCHEMA}.am_users SET status=%s WHERE id=%s", (status, uid))
            conn.commit()
            return resp(200, {"ok": True})

        # POST /logout
        if path.endswith("/logout") and method == "POST":
            token = (event.get("headers") or {}).get("X-Authorization", "").replace("Bearer ", "").strip()
            if token:
                cur.execute(f"UPDATE {SCHEMA}.am_sessions SET expires_at=NOW() WHERE token=%s", (token,))
                cur.execute(f"UPDATE {SCHEMA}.am_users SET status='offline' WHERE id=(SELECT user_id FROM {SCHEMA}.am_sessions WHERE token=%s)", (token,))
                conn.commit()
            return resp(200, {"ok": True})

        # GET /users — поиск пользователей
        if path.endswith("/users") and method == "GET":
            q = (event.get("queryStringParameters") or {}).get("q", "").strip()
            if q:
                cur.execute(f"SELECT id, display_name, username, avatar_color, is_premium, is_system, system_display_phone, status, phone FROM {SCHEMA}.am_users WHERE (display_name ILIKE %s OR username ILIKE %s) AND is_system=FALSE LIMIT 20", (f"%{q}%", f"%{q}%"))
            else:
                cur.execute(f"SELECT id, display_name, username, avatar_color, is_premium, is_system, system_display_phone, status, phone FROM {SCHEMA}.am_users WHERE is_system=FALSE ORDER BY created_at DESC LIMIT 50")
            rows = cur.fetchall()
            users = [{"id": r[0], "display_name": r[1], "username": r[2], "avatar_color": r[3], "is_premium": r[4], "is_system": r[5], "phone": r[6] if r[5] else r[8], "status": r[7]} for r in rows]
            return resp(200, {"users": users})

        return resp(404, {"error": "Метод не найден"})

    except Exception as e:
        conn.rollback()
        return resp(500, {"error": str(e)})
    finally:
        cur.close()
        conn.close()
