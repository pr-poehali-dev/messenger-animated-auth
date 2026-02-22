"""
Авторизация и регистрация пользователей мессенджера. v2
action=check_phone  — проверить, существует ли номер
action=register     — создать аккаунт
action=login        — войти по телефону и паролю
action=logout       — выйти (обновить статус)
action=me           — получить текущего пользователя по токену
action=update       — обновить профиль
"""

import json
import os
import hashlib
import hmac
import time
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p22192869_messenger_animated_a")
SECRET = "messenger_jwt_secret_42"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token(user_id: int) -> str:
    payload = f"{user_id}:{int(time.time())}"
    sig = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"


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


def user_row_to_dict(row):
    return {"id": row[0], "name": row[1], "phone": row[2], "tag": row[3], "avatar_url": row[4], "status": row[5], "interests": row[6] or [], "last_seen": str(row[7])}


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

    if action == "check_phone":
        phone = body.get("phone") or params.get("phone", "")
        if not phone:
            return err("Не передан телефон")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone=%s", (phone,))
        exists = cur.fetchone() is not None
        cur.close()
        conn.close()
        return ok({"exists": exists})

    if action == "register":
        name = body.get("name", "").strip()
        phone = body.get("phone", "").strip()
        tag = body.get("tag", "").strip().lower().replace("@", "")
        password = body.get("password", "")
        avatar_url = body.get("avatar_url", "")
        if not name or not phone or not tag or not password:
            return err("Заполните все поля")
        if len(password) < 4:
            return err("Пароль минимум 4 символа")
        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute(f"INSERT INTO {SCHEMA}.users (name, phone, tag, password_hash, avatar_url, status) VALUES (%s,%s,%s,%s,%s,'online') RETURNING id, name, phone, tag, avatar_url, status, interests, last_seen", (name, phone, tag, pw_hash, avatar_url))
            row = cur.fetchone()
            conn.commit()
            return ok({"token": make_token(row[0]), "user": user_row_to_dict(row)})
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return err("Телефон или тег уже заняты")
        finally:
            cur.close()
            conn.close()

    if action == "login":
        phone = body.get("phone", "").strip()
        password = body.get("password", "")
        if not phone or not password:
            return err("Введите телефон и пароль")
        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id, name, phone, tag, avatar_url, status, interests, last_seen FROM {SCHEMA}.users WHERE phone=%s AND password_hash=%s", (phone, pw_hash))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return err("Неверный телефон или пароль", 401)
        cur.execute(f"UPDATE {SCHEMA}.users SET status='online', last_seen=NOW() WHERE id=%s", (row[0],))
        conn.commit()
        cur.close()
        conn.close()
        d = user_row_to_dict(row)
        d["status"] = "online"
        return ok({"token": make_token(row[0]), "user": d})

    if action == "me":
        user_id = verify_token(token)
        if not user_id:
            return err("Не авторизован", 401)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id, name, phone, tag, avatar_url, status, interests, last_seen FROM {SCHEMA}.users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return err("Пользователь не найден", 404)
        return ok({"user": user_row_to_dict(row)})

    if action == "update":
        user_id = verify_token(token)
        if not user_id:
            return err("Не авторизован", 401)
        fields, vals = [], []
        if "name" in body:
            fields.append("name=%s"); vals.append(body["name"].strip())
        if "tag" in body:
            fields.append("tag=%s"); vals.append(body["tag"].strip().lower().replace("@", ""))
        if "avatar_url" in body:
            fields.append("avatar_url=%s"); vals.append(body["avatar_url"])
        if "interests" in body:
            fields.append("interests=%s"); vals.append(body["interests"])
        if "password" in body:
            fields.append("password_hash=%s"); vals.append(hash_password(body["password"]))
        if not fields:
            return err("Нечего обновлять")
        vals.append(user_id)
        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(fields)} WHERE id=%s RETURNING id, name, phone, tag, avatar_url, status, interests, last_seen", vals)
            row = cur.fetchone()
            conn.commit()
            return ok({"user": user_row_to_dict(row)})
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return err("Тег уже занят")
        finally:
            cur.close()
            conn.close()

    if action == "logout":
        user_id = verify_token(token)
        if user_id:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET status='offline', last_seen=NOW() WHERE id=%s", (user_id,))
            conn.commit()
            cur.close()
            conn.close()
        return ok({"ok": True})

    return err("Неизвестное действие", 404)