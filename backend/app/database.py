import os
from supabase import create_client, Client
from dotenv import load_dotenv

# 加载 .env 里的秘钥
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# 实例化数据库客户端，供其他文件调用
supabase: Client = create_client(url, key)