"""
Управление чатами и пользователями мессенджера.
action=list   — список чатов текущего пользователя
action=create — создать чат с пользователем
action=users  — поиск пользователей (по имени/тегу/телефону и интересам)
"""

import json
import os
import hashlib
import hmac
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p22192869_messenger_animated_a")
SECRET = "messenger_jwt_secret_42"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def verify_token(token: str):
    try:
        parts = token.split(":")
        if len(parts) != 3:
            return None
        user_id, ts, sig = parts
        expected = hmac.new(SECRET.encode(), f"{user_id}:{ts}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        return int(user_id)
    except Exception:
        return None


def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    }


def ok(data):
    return {"statusCode": 200, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    params = event.get("queryStringParameters") or {}
    action = body.get("action") or params.get("action", "")
    token = event.get("headers", {}).get("X-Auth-Token", "")
    user_id = verify_token(token)
    if not user_id:
        return err("Не авторизован", 401)

    if action == "list":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT
                c.id,
                cm.is_pinned,
                cm.unread_count,
                u.id, u.name, u.tag, u.avatar_url, u.status, u.last_seen, u.interests,
                m.id, m.text, m.sticker, m.sender_id, m.created_at
            FROM {SCHEMA}.chat_members cm
            JOIN {SCHEMA}.chats c ON c.id = cm.chat_id
            JOIN {SCHEMA}.chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id != %s
            JOIN {SCHEMA}.users u ON u.id = cm2.user_id
            LEFT JOIN LATERAL (
                SELECT id, text, sticker, sender_id, created_at
                FROM {SCHEMA}.messages
                WHERE chat_id = c.id
                ORDER BY created_at DESC
                LIMIT 1
            ) m ON TRUE
            WHERE cm.user_id = %s
            ORDER BY COALESCE(m.created_at, c.created_at) DESC
        """, (user_id, user_id))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        chats = []
        for row in rows:
            chats.append({
                "id": row[0], "is_pinned": row[1], "unread_count": row[2],
                "other_user": {"id": row[3], "name": row[4], "tag": row[5], "avatar_url": row[6], "status": row[7], "last_seen": str(row[8]), "interests": row[9] or []},
                "last_message": {"id": row[10], "text": row[11], "sticker": row[12], "sender_id": row[13], "created_at": str(row[14])} if row[10] else None
            })
        return ok({"chats": chats})

    if action == "create":
        other_id = body.get("other_user_id")
        if not other_id:
            return err("Укажи other_user_id")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id FROM {SCHEMA}.chats c
            JOIN {SCHEMA}.chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s
            JOIN {SCHEMA}.chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s
        """, (user_id, other_id))
        existing = cur.fetchone()
        if existing:
            cur.close()
            conn.close()
            return ok({"chat_id": existing[0], "created": False})
        cur.execute(f"INSERT INTO {SCHEMA}.chats DEFAULT VALUES RETURNING id")
        chat_id = cur.fetchone()[0]
        cur.execute(f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s,%s),(%s,%s)", (chat_id, user_id, chat_id, other_id))
        conn.commit()
        cur.close()
        conn.close()
        return ok({"chat_id": chat_id, "created": True})

    if action == "users":
        q = body.get("q") or params.get("q", "")
        interests = body.get("interests") or []
        if isinstance(interests, str):
            interests = [i.strip() for i in interests.split(",") if i.strip()]
        conn = get_conn()
        cur = conn.cursor()
        sql = f"SELECT id, name, tag, avatar_url, status, last_seen, interests FROM {SCHEMA}.users WHERE id != %s"
        vals = [user_id]
        if q:
            sql += " AND (name ILIKE %s OR tag ILIKE %s OR phone ILIKE %s)"
            like = f"%{q}%"
            vals += [like, like, like]
        if interests:
            sql += " AND interests && %s"
            vals.append(interests)
        sql += " ORDER BY name LIMIT 50"
        cur.execute(sql, vals)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        users = [{"id": r[0], "name": r[1], "tag": r[2], "avatar_url": r[3], "status": r[4], "last_seen": str(r[5]), "interests": r[6] or []} for r in rows]
        return ok({"users": users})

    return err("Неизвестное действие", 404)
