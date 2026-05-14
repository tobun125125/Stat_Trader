import MetaTrader5 as mt5
from datetime import datetime
import pandas as pd

# 1. ข้อมูลสำหรับ Login MT5
login_id = 463299905
password = "@8Kobualove1234"
server = "Exness-MT5Trial17"

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
    import os

    # ตั้งค่าเชื่อมต่อ Supabase
    import os
    from dotenv import load_dotenv

    # โหลดค่าจากไฟล์ .env.local
    load_dotenv('.env.local')

    SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    # ดึงค่า SERVICE ROLE KEY จาก .env.local (ต้องไปเพิ่มในไฟล์เอง)
    SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") 

    if not SUPABASE_KEY:
        print("❌ ไม่พบ SUPABASE_SERVICE_ROLE_KEY ในไฟล์ .env.local")
        mt5.shutdown()
        quit()

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    # ดึงประวัติย้อนหลัง 30 วัน
    date_to = datetime.now()
    date_from = date_to - timedelta(days=30)
    
    # ดึงประวัติการปิดออเดอร์ (Deals)
    deals = mt5.history_deals_get(date_from, date_to)
    
    if deals is None:
        print("❌ ไม่พบประวัติการเทรด หรือ ดึงข้อมูลผิดพลาด")
    elif len(deals) > 0:
        print(f"พบประวัติการเทรดจำนวน: {len(deals)} รายการ")
        
        data_to_insert = []
        for deal in deals:
            # คัดลอกเฉพาะ Deal ที่เป็นการปิดออเดอร์จริงๆ (มีกำไร/ขาดทุน) 
            # DEAL_ENTRY_OUT คือการปิดออเดอร์ (entry = 1)
            if deal.entry == 1: 
                data = {
                    "user_id": str(login_id), # ใช้เลขพอร์ต (String) เป็น ID เลยตามฐานข้อมูลใหม่
                    "ticket": deal.ticket,
                    "symbol": deal.symbol,
                    "trade_type": deal.type, # 0 = Buy, 1 = Sell
                    "volume": deal.volume,
                    "commission": deal.commission,
                    "swap": deal.swap,
                    "profit": deal.profit,
                    "net_profit": deal.profit + deal.swap + deal.commission,
                    "close_time": datetime.fromtimestamp(deal.time).strftime('%Y-%m-%d %H:%M:%S')
                }
                data_to_insert.append(data)
                
        # ส่งข้อมูลเข้า Supabase (Upsert)
        if len(data_to_insert) > 0:
            print(f"กำลังส่งข้อมูล {len(data_to_insert)} รายการขึ้น Supabase...")
            try:
                response = supabase.table("trading_deals").upsert(data_to_insert, on_conflict="ticket").execute()
                print("✅ บันทึกข้อมูลสำเร็จ!")
            except Exception as e:
                print(f"❌ เกิดข้อผิดพลาดในการส่งข้อมูล: {e}")
        else:
            print("ไม่มีออเดอร์ที่ถูกปิดในช่วงเวลานี้")
            
else:
    print(f"❌ Login ไม่สำเร็จ, Error: {mt5.last_error()}")

# ปิดการเชื่อมต่อ MT5 เมื่อทำงานเสร็จ
mt5.shutdown()
