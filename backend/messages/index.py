"""
Сообщения и реакции мессенджера.
action=list  — получить сообщения чата
action=send  — отправить сообщение
action=react — добавить/убрать реакцию
action=read  — пометить прочитанными
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


def get_reactions(cur, message_ids):
    if not message_ids:
        return {}
    placeholders = ",".join(["%s"] * len(message_ids))
    cur.execute(f"""
        SELECT message_id, emoji, ARRAY_AGG(user_id) as user_ids
        FROM {SCHEMA}.reactions
        WHERE message_id IN ({placeholders}) AND emoji != ''
        GROUP BY message_id, emoji
    """, message_ids)
    result = {}
    for row in cur.fetchall():
        mid = row[0]
        if mid not in result:
            result[mid] = []
        result[mid].append({"emoji": row[1], "user_ids": row[2]})
    return result


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
        chat_id = body.get("chat_id") or params.get("chat_id")
        if not chat_id:
            return err("Укажи chat_id")
        before_id = body.get("before_id") or params.get("before_id")
        limit = min(int(body.get("limit") or params.get("limit", 50)), 100)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT 1 FROM {SCHEMA}.chat_members WHERE chat_id=%s AND user_id=%s", (chat_id, user_id))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return err("Нет доступа", 403)
        sql = f"SELECT id, sender_id, text, sticker, is_read, created_at FROM {SCHEMA}.messages WHERE chat_id=%s"
        vals = [chat_id]
        if before_id:
            sql += " AND id < %s"
            vals.append(before_id)
        sql += " ORDER BY created_at DESC LIMIT %s"
        vals.append(limit)
        cur.execute(sql, vals)
        rows = cur.fetchall()
        msg_ids = [r[0] for r in rows]
        reactions = get_reactions(cur, msg_ids)
        cur.close()
        conn.close()
        messages = [{"id": r[0], "sender_id": r[1], "text": r[2], "sticker": r[3], "is_read": r[4], "created_at": str(r[5]), "reactions": reactions.get(r[0], [])} for r in rows]
        messages.reverse()
        return ok({"messages": messages})

    if action == "send":
        chat_id = body.get("chat_id")
        text = (body.get("text") or "").strip() or None
        sticker = body.get("sticker") or None
        if not chat_id or (not text and not sticker):
            return err("Укажи chat_id и текст или стикер")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT 1 FROM {SCHEMA}.chat_members WHERE chat_id=%s AND user_id=%s", (chat_id, user_id))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return err("Нет доступа", 403)
        cur.execute(f"INSERT INTO {SCHEMA}.messages (chat_id, sender_id, text, sticker) VALUES (%s,%s,%s,%s) RETURNING id, sender_id, text, sticker, is_read, created_at", (chat_id, user_id, text, sticker))
        row = cur.fetchone()
        cur.execute(f"UPDATE {SCHEMA}.chat_members SET unread_count = unread_count + 1 WHERE chat_id=%s AND user_id != %s", (chat_id, user_id))
        conn.commit()
        cur.close()
        conn.close()
        return ok({"message": {"id": row[0], "sender_id": row[1], "text": row[2], "sticker": row[3], "is_read": row[4], "created_at": str(row[5]), "reactions": []}})

    if action == "react":
        message_id = body.get("message_id")
        emoji = body.get("emoji", "")
        if not message_id or not emoji:
            return err("Укажи message_id и emoji")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT m.id FROM {SCHEMA}.messages m
            JOIN {SCHEMA}.chat_members cm ON cm.chat_id = m.chat_id AND cm.user_id = %s
            WHERE m.id = %s
        """, (user_id, message_id))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return err("Нет доступа", 403)
        cur.execute(f"SELECT id, emoji FROM {SCHEMA}.reactions WHERE message_id=%s AND user_id=%s", (message_id, user_id))
        existing = cur.fetchone()
        if existing and existing[1] == emoji:
            cur.execute(f"UPDATE {SCHEMA}.reactions SET emoji='' WHERE id=%s", (existing[0],))
            action_result = "removed"
        elif existing:
            cur.execute(f"UPDATE {SCHEMA}.reactions SET emoji=%s WHERE id=%s", (emoji, existing[0]))
            action_result = "changed"
        else:
            cur.execute(f"INSERT INTO {SCHEMA}.reactions (message_id, user_id, emoji) VALUES (%s,%s,%s) ON CONFLICT DO NOTHING", (message_id, user_id, emoji))
            action_result = "added"
        conn.commit()
        cur.execute(f"""
            SELECT emoji, ARRAY_AGG(user_id) as user_ids
            FROM {SCHEMA}.reactions
            WHERE message_id=%s AND emoji != ''
            GROUP BY emoji
        """, (message_id,))
        reactions = [{"emoji": r[0], "user_ids": r[1]} for r in cur.fetchall()]
        cur.close()
        conn.close()
        return ok({"action": action_result, "reactions": reactions})

    if action == "read":
        chat_id = body.get("chat_id")
        if not chat_id:
            return err("Укажи chat_id")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.messages SET is_read=TRUE WHERE chat_id=%s AND sender_id!=%s AND is_read=FALSE", (chat_id, user_id))
        cur.execute(f"UPDATE {SCHEMA}.chat_members SET unread_count=0 WHERE chat_id=%s AND user_id=%s", (chat_id, user_id))
        conn.commit()
        cur.close()
        conn.close()
        return ok({"ok": True})

    return err("Неизвестное действие", 404)
