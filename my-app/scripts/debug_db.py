from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv('.env.local')
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") 

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Fetch some trading_deals
deals = supabase.table("trading_deals").select("*").order("close_time", desc=True).limit(20).execute()
print("--- TRADING DEALS ---")
for d in deals.data:
    print(f"{d['ticket']} | {d['close_time']} | {d['symbol']} | {d['net_profit']}")

# Fetch daily stats
stats = supabase.table("daily_trading_stats").select("*").order("trade_date", desc=True).limit(20).execute()
print("\n--- DAILY STATS ---")
for s in stats.data:
    print(f"{s['trade_date']} | Trades: {s['total_trades']} | Profit: {s['daily_profit']}")
