import json
from supabase import create_client
from langchain_openai import OpenAIEmbeddings

# ==========================================
# 1. 配置环境密钥
# ==========================================
SUPABASE_URL = "https://xzflljgbplwshdzhudly.supabase.co"
SUPABASE_KEY = "sb_secret_hzG4sRO5IwSv6qJKNGfrkg_JweQtjsg "
SILICONFLOW_API_KEY = "sk-gcddcehjauehmtzpslnzjpmiggymcuaxsnvvwufzwxiflyck"  # 换成硅基流动的 API 密钥

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
embeddings = OpenAIEmbeddings(
    model="BAAI/bge-m3",
    openai_api_key=SILICONFLOW_API_KEY,
    openai_api_base="https://api.siliconflow.cn/v1"
)

# ==========================================
# 2. 读取对话库 JSON 【修改点 1：更改文件名】
# ==========================================
print("正在读取对话数据...")
with open('cbt_dialogue.json', 'r', encoding='utf-8') as f:
    dialogue_data = json.load(f)

# ==========================================
# 3. 遍历、向量化并注入 Supabase
# ==========================================
print(f"共发现 {len(dialogue_data)} 条对话数据，开始生成 1024 维向量并注入...")

for item in dialogue_data:
    # 【修改点 2：将向量化目标改为 trigger_dialogue】
    # 将患者的表述作为靶子，最利于 RAG 系统的相似度匹配
    content_to_embed = item.get("trigger_dialogue", "")

    if not content_to_embed:
        continue

    print(f"正在向量化: {content_to_embed[:20]}...")

    vector = embeddings.embed_query(content_to_embed)

    db_record = {
        "type": "dialogue",  # 【修改点 3：数据标签改为 dialogue，方便后续在数据库中进行混合检索时的条件过滤】
        "content": content_to_embed,
        "metadata": item, # 完整的包含 distress_type, strategy, template 的 JSON 结构会原封不动存入
        "embedding": vector
    }

    supabase.table("cbt_knowledge").insert(db_record).execute()

print("🎉 对话库数据注入完成！")