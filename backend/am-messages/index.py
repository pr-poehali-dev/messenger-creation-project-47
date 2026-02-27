"""
AstreyMessange Messages API
Чаты, сообщения, создание диалогов. Polling для обновлений в реальном времени.
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={SCHEMA}")


def cors():
    return {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization"}


def resp(status, data):
    return {"statusCode": status, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}


def get_user_id(cur, token):
    if not token:
        return None
    cur.execute(f"SELECT user_id FROM {SCHEMA}.am_sessions WHERE token=%s AND expires_at > NOW()", (token,))
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    """Messages: list chats, get messages, send, create chat, delete (admin)"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    path = event.get("path", "/").rstrip("/")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass
    token = (event.get("headers") or {}).get("X-Authorization", "").replace("Bearer ", "").strip()
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()

    try:
        uid = get_user_id(cur, token)

        # GET /chats — список чатов пользователя
        if path.endswith("/chats") and method == "GET":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"""
                SELECT c.id, c.type, c.name, c.avatar_color,
                    (SELECT m.text FROM {SCHEMA}.am_messages m WHERE m.chat_id=c.id ORDER BY m.id DESC LIMIT 1) as last_msg,
                    (SELECT m.created_at FROM {SCHEMA}.am_messages m WHERE m.chat_id=c.id ORDER BY m.id DESC LIMIT 1) as last_time,
                    (SELECT COUNT(*) FROM {SCHEMA}.am_messages m WHERE m.chat_id=c.id AND NOT (%s = ANY(m.read_by)) AND m.sender_id != %s) as unread,
                    (SELECT u2.id FROM {SCHEMA}.am_chat_members cm2 JOIN {SCHEMA}.am_users u2 ON u2.id=cm2.user_id WHERE cm2.chat_id=c.id AND cm2.user_id != %s LIMIT 1) as other_id,
                    (SELECT u2.display_name FROM {SCHEMA}.am_chat_members cm2 JOIN {SCHEMA}.am_users u2 ON u2.id=cm2.user_id WHERE cm2.chat_id=c.id AND cm2.user_id != %s LIMIT 1) as other_name,
                    (SELECT u2.avatar_color FROM {SCHEMA}.am_chat_members cm2 JOIN {SCHEMA}.am_users u2 ON u2.id=cm2.user_id WHERE cm2.chat_id=c.id AND cm2.user_id != %s LIMIT 1) as other_color,
                    (SELECT u2.status FROM {SCHEMA}.am_chat_members cm2 JOIN {SCHEMA}.am_users u2 ON u2.id=cm2.user_id WHERE cm2.chat_id=c.id AND cm2.user_id != %s LIMIT 1) as other_status,
                    (SELECT u2.is_system FROM {SCHEMA}.am_chat_members cm2 JOIN {SCHEMA}.am_users u2 ON u2.id=cm2.user_id WHERE cm2.chat_id=c.id AND cm2.user_id != %s LIMIT 1) as other_system,
                    (SELECT u2.is_premium FROM {SCHEMA}.am_chat_members cm2 JOIN {SCHEMA}.am_users u2 ON u2.id=cm2.user_id WHERE cm2.chat_id=c.id AND cm2.user_id != %s LIMIT 1) as other_premium
                FROM {SCHEMA}.am_chats c
                JOIN {SCHEMA}.am_chat_members cm ON cm.chat_id=c.id AND cm.user_id=%s
                ORDER BY last_time DESC NULLS LAST
            """, (uid, uid, uid, uid, uid, uid, uid, uid, uid))
            rows = cur.fetchall()
            chats = []
            for r in rows:
                chat_name = r[2] if r[1] == 'group' else (r[8] or "Чат")
                chat_color = r[3] if r[1] == 'group' else (r[9] or "#2d8cf0")
                chats.append({
                    "id": r[0], "type": r[1], "name": chat_name, "avatar_color": chat_color,
                    "last_msg": r[4] or "", "last_time": r[5],
                    "unread": int(r[6]), "other_id": r[7],
                    "other_status": r[10] or "offline",
                    "other_system": r[11] or False,
                    "other_premium": r[12] or False,
                })
            return resp(200, {"chats": chats})

        # GET /messages?chat_id=X — сообщения чата
        if path.endswith("/messages") and method == "GET":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            chat_id = params.get("chat_id")
            if not chat_id:
                return resp(400, {"error": "chat_id обязателен"})
            # Проверяем доступ
            cur.execute(f"SELECT 1 FROM {SCHEMA}.am_chat_members WHERE chat_id=%s AND user_id=%s", (chat_id, uid))
            if not cur.fetchone():
                return resp(403, {"error": "Нет доступа к чату"})
            # Отмечаем как прочитанные
            cur.execute(f"UPDATE {SCHEMA}.am_messages SET read_by = array_append(read_by, %s) WHERE chat_id=%s AND NOT (%s = ANY(read_by)) AND sender_id != %s", (uid, chat_id, uid, uid))
            conn.commit()
            since = params.get("since_id", "0")
            cur.execute(f"""
                SELECT m.id, m.sender_id, u.display_name, u.avatar_color, u.is_system, u.is_premium, m.text, m.created_at
                FROM {SCHEMA}.am_messages m
                JOIN {SCHEMA}.am_users u ON u.id=m.sender_id
                WHERE m.chat_id=%s AND m.id > %s
                ORDER BY m.id ASC LIMIT 100
            """, (chat_id, since))
            rows = cur.fetchall()
            messages = [{
                "id": r[0], "sender_id": r[1], "sender_name": r[2],
                "sender_color": r[3], "is_system": r[4], "is_premium": r[5],
                "text": r[6], "created_at": r[7], "is_mine": r[1] == uid
            } for r in rows]
            return resp(200, {"messages": messages})

        # POST /send — отправить сообщение
        if path.endswith("/send") and method == "POST":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            chat_id = body.get("chat_id")
            text = (body.get("text") or "").strip()
            if not chat_id or not text:
                return resp(400, {"error": "chat_id и text обязательны"})
            cur.execute(f"SELECT 1 FROM {SCHEMA}.am_chat_members WHERE chat_id=%s AND user_id=%s", (chat_id, uid))
            if not cur.fetchone():
                return resp(403, {"error": "Нет доступа"})
            cur.execute(f"INSERT INTO {SCHEMA}.am_messages (chat_id, sender_id, text, read_by) VALUES (%s, %s, %s, ARRAY[%s]) RETURNING id, created_at", (chat_id, uid, text, uid))
            msg = cur.fetchone()
            conn.commit()
            return resp(200, {"ok": True, "message_id": msg[0], "created_at": msg[1]})

        # POST /create_chat — создать личный чат
        if path.endswith("/create_chat") and method == "POST":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            other_id = body.get("other_id")
            if not other_id:
                return resp(400, {"error": "other_id обязателен"})
            # Проверяем существующий чат
            cur.execute(f"""
                SELECT c.id FROM {SCHEMA}.am_chats c
                JOIN {SCHEMA}.am_chat_members m1 ON m1.chat_id=c.id AND m1.user_id=%s
                JOIN {SCHEMA}.am_chat_members m2 ON m2.chat_id=c.id AND m2.user_id=%s
                WHERE c.type='personal' LIMIT 1
            """, (uid, other_id))
            existing = cur.fetchone()
            if existing:
                return resp(200, {"ok": True, "chat_id": existing[0], "existed": True})
            cur.execute(f"INSERT INTO {SCHEMA}.am_chats (type, created_by) VALUES ('personal', %s) RETURNING id", (uid,))
            chat_id = cur.fetchone()[0]
            cur.execute(f"INSERT INTO {SCHEMA}.am_chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, uid))
            cur.execute(f"INSERT INTO {SCHEMA}.am_chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, other_id))
            conn.commit()
            return resp(200, {"ok": True, "chat_id": chat_id, "existed": False})

        # Admin: DELETE /admin/message?id=X
        if "/admin/message" in path and method == "POST":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"SELECT is_admin FROM {SCHEMA}.am_users WHERE id=%s", (uid,))
            user_row = cur.fetchone()
            if not user_row or not user_row[0]:
                return resp(403, {"error": "Нет прав"})
            msg_id = body.get("message_id")
            if msg_id:
                cur.execute(f"UPDATE {SCHEMA}.am_messages SET text='[сообщение удалено]' WHERE id=%s", (msg_id,))
                conn.commit()
            return resp(200, {"ok": True})

        # Admin: ban/delete user
        if "/admin/ban_user" in path and method == "POST":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"SELECT is_admin FROM {SCHEMA}.am_users WHERE id=%s", (uid,))
            user_row = cur.fetchone()
            if not user_row or not user_row[0]:
                return resp(403, {"error": "Нет прав"})
            target_id = body.get("user_id")
            if target_id:
                cur.execute(f"UPDATE {SCHEMA}.am_users SET status='banned', stars_balance=0 WHERE id=%s AND is_admin=FALSE", (target_id,))
                conn.commit()
            return resp(200, {"ok": True})

        # Admin: give premium
        if "/admin/give_premium" in path and method == "POST":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"SELECT is_admin FROM {SCHEMA}.am_users WHERE id=%s", (uid,))
            user_row = cur.fetchone()
            if not user_row or not user_row[0]:
                return resp(403, {"error": "Нет прав"})
            target_id = body.get("user_id")
            months = body.get("months", 1)
            if target_id:
                cur.execute(f"UPDATE {SCHEMA}.am_users SET is_premium=TRUE, premium_until=NOW() + INTERVAL '{months} months' WHERE id=%s", (target_id,))
                conn.commit()
            return resp(200, {"ok": True})

        # Admin: give stars
        if "/admin/give_stars" in path and method == "POST":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"SELECT is_admin FROM {SCHEMA}.am_users WHERE id=%s", (uid,))
            user_row = cur.fetchone()
            if not user_row or not user_row[0]:
                return resp(403, {"error": "Нет прав"})
            target_id = body.get("user_id")
            amount = body.get("amount", 0)
            if target_id and amount:
                cur.execute(f"UPDATE {SCHEMA}.am_users SET stars_balance=stars_balance+%s WHERE id=%s", (amount, target_id))
                cur.execute(f"INSERT INTO {SCHEMA}.am_star_transactions (user_id, type, amount, description) VALUES (%s, 'admin_grant', %s, 'Выдано администратором')", (target_id, amount))
                conn.commit()
            return resp(200, {"ok": True})

        # Admin: get all users
        if "/admin/users" in path and method == "GET":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"SELECT is_admin FROM {SCHEMA}.am_users WHERE id=%s", (uid,))
            user_row = cur.fetchone()
            if not user_row or not user_row[0]:
                return resp(403, {"error": "Нет прав"})
            cur.execute(f"SELECT id, display_name, username, phone, avatar_color, stars_balance, is_premium, is_admin, status, created_at FROM {SCHEMA}.am_users ORDER BY created_at DESC")
            rows = cur.fetchall()
            users = [{"id": r[0], "display_name": r[1], "username": r[2], "phone": r[3], "avatar_color": r[4], "stars_balance": r[5], "is_premium": r[6], "is_admin": r[7], "status": r[8], "created_at": r[9]} for r in rows]
            return resp(200, {"users": users})

        # Admin: get all payments
        if "/admin/payments" in path and method == "GET":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"SELECT is_admin FROM {SCHEMA}.am_users WHERE id=%s", (uid,))
            user_row = cur.fetchone()
            if not user_row or not user_row[0]:
                return resp(403, {"error": "Нет прав"})
            cur.execute(f"SELECT p.id, p.user_id, u.display_name, u.phone, p.stars_amount, p.rub_amount, p.status, p.created_at, p.comment FROM {SCHEMA}.am_payment_requests p JOIN {SCHEMA}.am_users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 100")
            rows = cur.fetchall()
            payments = [{"id": r[0], "user_id": r[1], "user_name": r[2], "user_phone": r[3], "stars_amount": r[4], "rub_amount": r[5], "status": r[6], "created_at": r[7], "comment": r[8]} for r in rows]
            return resp(200, {"payments": payments})

        # Admin: confirm payment
        if "/admin/confirm_payment" in path and method == "POST":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"SELECT is_admin FROM {SCHEMA}.am_users WHERE id=%s", (uid,))
            user_row = cur.fetchone()
            if not user_row or not user_row[0]:
                return resp(403, {"error": "Нет прав"})
            pay_id = body.get("payment_id")
            action = body.get("action", "confirm")
            if pay_id:
                cur.execute(f"SELECT user_id, stars_amount, status FROM {SCHEMA}.am_payment_requests WHERE id=%s", (pay_id,))
                pay = cur.fetchone()
                if pay and pay[2] == "pending":
                    if action == "confirm":
                        cur.execute(f"UPDATE {SCHEMA}.am_payment_requests SET status='confirmed', confirmed_by=%s, confirmed_at=NOW() WHERE id=%s", (uid, pay_id))
                        cur.execute(f"UPDATE {SCHEMA}.am_users SET stars_balance=stars_balance+%s WHERE id=%s", (pay[1], pay[0]))
                        cur.execute(f"INSERT INTO {SCHEMA}.am_star_transactions (user_id, type, amount, description, ref_id) VALUES (%s, 'topup', %s, 'Пополнение кошелька', %s)", (pay[0], pay[1], pay_id))
                    else:
                        cur.execute(f"UPDATE {SCHEMA}.am_payment_requests SET status='rejected', confirmed_by=%s, confirmed_at=NOW() WHERE id=%s", (uid, pay_id))
                    conn.commit()
            return resp(200, {"ok": True})

        return resp(404, {"error": "Путь не найден"})

    except Exception as e:
        conn.rollback()
        return resp(500, {"error": str(e)})
    finally:
        cur.close()
        conn.close()
