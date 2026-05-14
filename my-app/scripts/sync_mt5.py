import importlib
import MetaTrader5 as mt5
from datetime import datetime
import pandas as pd
import os

# โหลดค่าจากไฟล์ .env.local
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
load_dotenv('.env.local')

# 1. ข้อมูลสำหรับ Login MT5 (อ่านจาก .env.local)
login_id = int(os.environ.get("MT5_LOGIN_ID", "0"))
password = os.environ.get("MT5_PASSWORD", "")
server = os.environ.get("MT5_SERVER", "")

if not login_id or not password or not server:
    print("❌ ไม่พบข้อมูล MT5 Login ในไฟล์ .env.local")
    print("   กรุณาเพิ่ม MT5_LOGIN_ID, MT5_PASSWORD, MT5_SERVER")
    quit()

# 2. เริ่มต้นการเชื่อมต่อกับโปรแกรม MT5 ที่เปิดไว้
print("กำลังเชื่อมต่อ MT5...")
if not mt5.initialize():
    print("เชื่อมต่อ MT5 ไม่สำเร็จ (initialize failed), Error:", mt5.last_error())
    quit()

# 3. สั่ง Login เข้าบัญชี Exness
authorized = mt5.login(login_id, password=password, server=server)

if authorized:
    print(f"✅ เข้าสู่ระบบสำเร็จ! Account: {login_id}")
    
    # ---------------------------------------------------------
    from datetime import timedelta
    from supabase import create_client, Client
    import time

    # ตั้งค่าเชื่อมต่อ Supabase (ค่า env ถูกโหลดจากด้านบนแล้ว)

    SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    # ดึงค่า SERVICE ROLE KEY จาก .env.local (ต้องไปเพิ่มในไฟล์เอง)
    SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") 

    if not SUPABASE_KEY:
        print("❌ ไม่พบ SUPABASE_SERVICE_ROLE_KEY ในไฟล์ .env.local")
        mt5.shutdown()
        quit()

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("เริ่มระบบ Real-time Sync (อัปเดตทุกๆ 60 วินาที)...")
    print("กด Ctrl+C เพื่อหยุดการทำงาน")
    
    try:
        while True:
            # ดึงประวัติย้อนหลัง 3 วัน (เพื่อไม่ให้หนักเกินไปเวลารันแบบ Real-time)
            date_to = datetime.now()
            date_from = date_to - timedelta(days=3)
            
            deals = mt5.history_deals_get(date_from, date_to)
            
            if deals is None:
                pass # เงียบไว้เวลารันลูป
            elif len(deals) > 0:
                data_to_insert = []
                for deal in deals:
                    # DEAL_ENTRY_OUT คือการปิดออเดอร์ (entry = 1)
                    if deal.entry == 1: 
                        data = {
                            "user_id": str(login_id),
                            "ticket": deal.ticket,
                            "symbol": deal.symbol,
                            "trade_type": deal.type,
                            "volume": deal.volume,
                            "commission": deal.commission,
                            "swap": deal.swap,
                            "profit": deal.profit,
                            "net_profit": deal.profit + deal.swap + deal.commission,
                            "close_time": datetime.fromtimestamp(deal.time).strftime('%Y-%m-%d %H:%M:%S')
                        }
                        data_to_insert.append(data)
                        
                if len(data_to_insert) > 0:
                    try:
                        supabase.table("trading_deals").upsert(data_to_insert, on_conflict="ticket").execute()
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] อัปเดตข้อมูลล่าสุด {len(data_to_insert)} รายการ")
                    except Exception as e:
                        print(f"❌ Error: {e}")
            
            # รอ 60 วินาทีแล้วทำงานใหม่
            time.sleep(60)
            
    except KeyboardInterrupt:
        print("\nหยุดการทำงาน Real-time Sync")

else:
    print(f"❌ Login ไม่สำเร็จ, Error: {mt5.last_error()}")

# ปิดการเชื่อมต่อ MT5 เมื่อทำงานเสร็จ
mt5.shutdown()
