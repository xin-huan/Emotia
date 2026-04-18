import json
from supabase import create_client
from langchain_openai import OpenAIEmbeddings

# ==========================================
# 1. 配置你的环境密钥
# ==========================================
SUPABASE_URL = "你的_Supabase_URL"
SUPABASE_KEY = "你的_Supabase_Key"
OPENAI_API_KEY = "你的_OpenAI_或_DeepSeek_API_Key"

# 初始化客户端
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=OPENAI_API_KEY
)

# ==========================================
# 2. 读取理论库 JSON (这里以理论库为例)
# ==========================================
print("正在读取 JSON 数据...")
with open('cbt_theory.json', 'r', encoding='utf-8') as f:
    theory_data = json.load(f)

# ==========================================
# 3. 遍历、向量化并注入 Supabase
# ==========================================
print(f"共发现 {len(theory_data)} 条数据，开始生成向量并注入...")

for item in theory_data:
    # 核心逻辑：只提取 trigger_context 作为“检索靶子”
    # 如果你处理的是对话库，这里就改成 item.get("trigger_dialogue", "")
    content_to_embed = item.get("trigger_context", "")

    if not content_to_embed:
        continue

    print(f"正在向量化: {content_to_embed[:20]}...")

    # 调用大模型，把文字变成 1536 维的数字数组
    vector = embeddings.embed_query(content_to_embed)

    # 组装最终要写入数据库的“万能格式”
    db_record = {
        "type": "theory",  # 打上标签，证明这是理论数据
        "content": content_to_embed,  # 纯文本靶子
        "metadata": item,  # 【关键】把一整段原汁原味的 JSON 挂载在这里！
        "embedding": vector  # 向量数组
    }

    # 写入 Supabase
    supabase.table("cbt_knowledge").insert(db_record).execute()

print("🎉 全部知识库数据注入完成！赶紧去 Supabase 后台看看吧！")