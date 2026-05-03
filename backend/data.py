import json
import os
import glob
from app.database import supabase

# 🎯 请确保这个路径指向你克隆下来的 json_docs 文件夹
SOURCE_FOLDER = "D:/WebProject/data_import/myPsychology/myPsychology/json_docs" 

def migrate_single_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 验证是否是量表 JSON
        if 'chinese_name' not in data or 'contents' not in data:
            return

        # 1. 插入 tests 表（不传 id，让数据库自动生成）
        test_entry = {
            "title": data['chinese_name'],
            "abbreviation": data.get('abbreviation', ''),
            "description": data.get('outline', ''),
            "category_type": "professional",
            "icon": "📝",
            "metadata": data,  # 🚀 [新增] 变量名 data 保持不变，直接存入
            "tags": [data.get('category', '心理测评')]
        }
        
        test_res = supabase.table("tests").insert(test_entry).execute()
        new_test_id = test_res.data[0]['id']


        # 2. 解析题目逻辑
        contents = data['contents']
        items = contents.get('items', {})
        reverse_items = [str(i) for i in contents.get('reverse_items', [])]
        scales_items = contents.get('scales_items', {}) # 🚀 关键：获取维度映射
        rating = contents.get('rating', {})
        score_rules = contents.get('score_rules', {})

        questions_to_db = []
        for q_id_str, content in items.items():
            # 获取选项和原始分数
            raw_options = rating.get(q_id_str, {})
            # 注意：有的 JSON 里 score_rules 可能是列表，也可能是字典
            raw_scores = score_rules.get(q_id_str, [])
            
            # 处理反向计分
            if q_id_str in reverse_items:
                raw_scores = raw_scores[::-1] # 翻转分数数组

            # 格式化为你的数据库 options 格式
            formatted_options = []
            # 兼容处理：将字母(A,B,C)对应的选项和分数配对
            option_letters = sorted(raw_options.keys()) # ['A', 'B', 'C'...]
            for i, letter in enumerate(option_letters):
                if i < len(raw_scores):
                    formatted_options.append({
                        "label": raw_options[letter],
                        "score": raw_scores[i]
                    })

            # 确定该题属于哪个分量表/维度
            belong_scale = "通用"
            for s_name, s_ids in scales_items.items():
                if q_id_str in [str(sid) for sid in s_ids]:
                    belong_scale = s_name
                    break

            questions_to_db.append({
                "test_id": new_test_id,
                "question_text": content,
                "options": formatted_options,
                "scale_name": belong_scale,
                "sort_order": int(q_id_str) if q_id_str.isdigit() else 0
            })

        # 3. 批量插入题目
        if questions_to_db:
            supabase.table("test_questions").insert(questions_to_db).execute()
            print(f"✅ 已导入: {data['chinese_name']} ({len(questions_to_db)} 题)")

    except Exception as e:
        print(f"❌ 处理 {os.path.basename(file_path)} 失败: {e}")

def main():
    json_files = glob.glob(os.path.join(SOURCE_FOLDER, "*.json"))
    print(f"🚀 开始迁移 {len(json_files)} 个量表...")
    for file in json_files:
        migrate_single_file(file)
    print("✨ 任务全部完成！")

if __name__ == "__main__":
    main()