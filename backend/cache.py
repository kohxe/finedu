"""Supabase 기반 영구 AI 캐시 유틸리티"""
import os
from supabase import create_client

_supabase = None


def _get_sb():
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_KEY", "")
        if url and key:
            _supabase = create_client(url, key)
    return _supabase


def cache_get(key: str) -> dict | None:
    sb = _get_sb()
    if not sb:
        return None
    try:
        row = sb.table("ai_cache").select("value").eq("key", key).maybe_single().execute()
        if row.data:
            return row.data["value"]
    except Exception:
        pass
    return None


def cache_set(key: str, value: dict) -> None:
    sb = _get_sb()
    if not sb:
        return
    try:
        sb.table("ai_cache").upsert({"key": key, "value": value}).execute()
    except Exception:
        pass
