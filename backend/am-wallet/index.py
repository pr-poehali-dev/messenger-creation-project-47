"""
AstreyMessange Wallet & Gifts API
Кошелёк звёзд, покупка premium, подарки, платёжные заявки.
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

ADMIN_PHONE = "+79694501843"
ADMIN_REQUISITES = {
    "phone": "+7 969 450-18-43",
    "sbp": "СБП: +79694501843",
    "bank": "Сбербанк / Тинькофф / СБП",
    "comment_template": "AstreyMessange пополнение #{id}"
}

STAR_PACKS = [
    {"id": 1, "stars": 50, "rub": 99},
    {"id": 2, "stars": 150, "rub": 249},
    {"id": 3, "stars": 500, "rub": 749},
    {"id": 4, "stars": 1000, "rub": 1299},
    {"id": 5, "stars": 3000, "rub": 2999},
]

PREMIUM_PLANS = [
    {"id": "month_1", "label": "1 месяц", "months": 1, "stars": 100},
    {"id": "month_3", "label": "3 месяца", "months": 3, "stars": 250},
    {"id": "year_1", "label": "1 год", "months": 12, "stars": 800},
]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={SCHEMA}")


def cors():
    return {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization"}


def resp(status, data):
    return {"statusCode": status, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}


def get_uid(cur, token):
    if not token:
        return None
    cur.execute(f"SELECT user_id FROM {SCHEMA}.am_sessions WHERE token=%s AND expires_at > NOW()", (token,))
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    """Wallet: balance, transactions, buy stars request, buy premium, gifts catalog, send gift, my gifts"""
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

    conn = get_conn()
    cur = conn.cursor()

    try:
        uid = get_uid(cur, token)

        # GET /balance
        if path.endswith("/balance") and method == "GET":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"SELECT stars_balance, is_premium, premium_until FROM {SCHEMA}.am_users WHERE id=%s", (uid,))
            row = cur.fetchone()
            cur.execute(f"SELECT type, amount, description, created_at FROM {SCHEMA}.am_star_transactions WHERE user_id=%s ORDER BY created_at DESC LIMIT 20", (uid,))
            txs = cur.fetchall()
            transactions = [{"type": t[0], "amount": t[1], "description": t[2], "created_at": t[3]} for t in txs]
            return resp(200, {
                "stars_balance": row[0], "is_premium": row[1], "premium_until": row[2],
                "transactions": transactions,
                "star_packs": STAR_PACKS,
                "premium_plans": PREMIUM_PLANS,
                "requisites": ADMIN_REQUISITES
            })

        # POST /request_topup — создать заявку на пополнение
        if path.endswith("/request_topup") and method == "POST":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            pack_id = body.get("pack_id")
            pack = next((p for p in STAR_PACKS if p["id"] == pack_id), None)
            if not pack:
                return resp(400, {"error": "Пакет не найден"})
            cur.execute(f"INSERT INTO {SCHEMA}.am_payment_requests (user_id, stars_amount, rub_amount) VALUES (%s, %s, %s) RETURNING id", (uid, pack["stars"], pack["rub"]))
            pay_id = cur.fetchone()[0]
            conn.commit()
            comment = f"AstreyMessange #{pay_id}"
            return resp(200, {
                "ok": True,
                "payment_id": pay_id,
                "stars": pack["stars"],
                "rub": pack["rub"],
                "requisites": {**ADMIN_REQUISITES, "comment": comment}
            })

        # POST /buy_premium
        if path.endswith("/buy_premium") and method == "POST":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            plan_id = body.get("plan_id")
            plan = next((p for p in PREMIUM_PLANS if p["id"] == plan_id), None)
            if not plan:
                return resp(400, {"error": "Тариф не найден"})
            cur.execute(f"SELECT stars_balance FROM {SCHEMA}.am_users WHERE id=%s", (uid,))
            balance = cur.fetchone()[0]
            if balance < plan["stars"]:
                return resp(400, {"error": f"Недостаточно звёзд. Нужно {plan['stars']}, у вас {balance}"})
            cur.execute(f"UPDATE {SCHEMA}.am_users SET stars_balance=stars_balance-%s, is_premium=TRUE, premium_until=COALESCE(GREATEST(premium_until, NOW()), NOW()) + INTERVAL '{plan['months']} months' WHERE id=%s", (plan["stars"], uid))
            cur.execute(f"INSERT INTO {SCHEMA}.am_star_transactions (user_id, type, amount, description) VALUES (%s, 'premium_purchase', %s, %s)", (uid, -plan["stars"], f"Premium {plan['label']}"))
            conn.commit()
            return resp(200, {"ok": True, "message": f"Premium активирован на {plan['label']}!"})

        # GET /gifts_catalog
        if path.endswith("/gifts_catalog") and method == "GET":
            cur.execute(f"SELECT id, name, emoji, description, price_stars, rarity, is_premium_only, gradient_from, gradient_to FROM {SCHEMA}.am_gifts ORDER BY price_stars ASC")
            rows = cur.fetchall()
            gifts = [{"id": r[0], "name": r[1], "emoji": r[2], "description": r[3], "price_stars": r[4], "rarity": r[5], "is_premium_only": r[6], "gradient_from": r[7], "gradient_to": r[8]} for r in rows]
            return resp(200, {"gifts": gifts})

        # POST /send_gift
        if path.endswith("/send_gift") and method == "POST":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            gift_id = body.get("gift_id")
            to_user_id = body.get("to_user_id")
            message = (body.get("message") or "").strip()[:200]
            if not gift_id or not to_user_id:
                return resp(400, {"error": "gift_id и to_user_id обязательны"})
            cur.execute(f"SELECT price_stars, is_premium_only, name, emoji FROM {SCHEMA}.am_gifts WHERE id=%s", (gift_id,))
            gift = cur.fetchone()
            if not gift:
                return resp(404, {"error": "Подарок не найден"})
            price, premium_only, gift_name, emoji = gift
            cur.execute(f"SELECT stars_balance, is_premium FROM {SCHEMA}.am_users WHERE id=%s", (uid,))
            sender = cur.fetchone()
            if sender[0] < price:
                return resp(400, {"error": f"Недостаточно звёзд. Нужно {price}"})
            if premium_only and not sender[1]:
                return resp(403, {"error": "Этот подарок только для Premium пользователей"})
            cur.execute(f"UPDATE {SCHEMA}.am_users SET stars_balance=stars_balance-%s WHERE id=%s", (price, uid))
            cur.execute(f"INSERT INTO {SCHEMA}.am_star_transactions (user_id, type, amount, description, ref_id) VALUES (%s, 'gift_send', %s, %s, %s)", (uid, -price, f"Подарок {emoji} {gift_name}", to_user_id))
            cur.execute(f"INSERT INTO {SCHEMA}.am_star_transactions (user_id, type, amount, description, ref_id) VALUES (%s, 'gift_receive', %s, %s, %s)", (to_user_id, price // 2, f"Получен подарок {emoji} {gift_name}", uid))
            cur.execute(f"UPDATE {SCHEMA}.am_users SET stars_balance=stars_balance+%s WHERE id=%s", (price // 2, to_user_id))
            cur.execute(f"INSERT INTO {SCHEMA}.am_sent_gifts (gift_id, from_user_id, to_user_id, message) VALUES (%s, %s, %s, %s) RETURNING id", (gift_id, uid, to_user_id, message))
            sg_id = cur.fetchone()[0]
            # Отправляем системное сообщение в чат
            cur.execute(f"""
                SELECT c.id FROM {SCHEMA}.am_chats c
                JOIN {SCHEMA}.am_chat_members m1 ON m1.chat_id=c.id AND m1.user_id=%s
                JOIN {SCHEMA}.am_chat_members m2 ON m2.chat_id=c.id AND m2.user_id=%s
                WHERE c.type='personal' LIMIT 1
            """, (uid, to_user_id))
            chat = cur.fetchone()
            if chat:
                gift_msg = f"🎁 Подарок: {emoji} {gift_name}"
                if message:
                    gift_msg += f"\n💬 {message}"
                cur.execute(f"INSERT INTO {SCHEMA}.am_messages (chat_id, sender_id, text) VALUES (%s, %s, %s)", (chat[0], uid, gift_msg))
            conn.commit()
            return resp(200, {"ok": True, "sent_gift_id": sg_id})

        # GET /my_gifts
        if path.endswith("/my_gifts") and method == "GET":
            if not uid:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(f"""
                SELECT sg.id, g.name, g.emoji, g.rarity, g.gradient_from, g.gradient_to, g.price_stars,
                    sg.message, sg.created_at, u.display_name, u.avatar_color
                FROM {SCHEMA}.am_sent_gifts sg
                JOIN {SCHEMA}.am_gifts g ON g.id=sg.gift_id
                JOIN {SCHEMA}.am_users u ON u.id=sg.from_user_id
                WHERE sg.to_user_id=%s AND sg.is_displayed=TRUE
                ORDER BY sg.created_at DESC
            """, (uid,))
            rows = cur.fetchall()
            gifts = [{"id": r[0], "name": r[1], "emoji": r[2], "rarity": r[3], "gradient_from": r[4], "gradient_to": r[5], "price_stars": r[6], "message": r[7], "created_at": r[8], "from_name": r[9], "from_color": r[10]} for r in rows]
            return resp(200, {"gifts": gifts})

        return resp(404, {"error": "Не найдено"})

    except Exception as e:
        conn.rollback()
        return resp(500, {"error": str(e)})
    finally:
        cur.close()
        conn.close()
