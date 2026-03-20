import json
import csv
import os


def extract_psyqa_seeds(input_filename, output_filename):
    print(f"🔍 正在读取原始文件: {input_filename} ...")

    if not os.path.exists(input_filename):
        print(f"❌ 错误：找不到文件 '{input_filename}'。请确保它和本脚本在同一目录下。")
        return

    # 1. 读取 JSON 文件
    with open(input_filename, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print("❌ 错误：JSON 格式不正确，请检查文件内容。")
            return

    extracted_seeds = []

    # 2. 遍历并提取数据
    for item in data:
        # 获取问题和描述，如果不存在则默认为空字符串
        question = item.get("question", "").strip()
        description = item.get("description", "").strip()

        # 如果描述为空，就只用标题；如果有描述，就把它们拼起来
        # 拼接的格式能最大程度保留患者的完整语境
        if description:
            merged_text = f"【标题】{question}\n【描述】{description}"
        else:
            merged_text = question

        # 过滤掉完全为空的数据
        if merged_text:
            extracted_seeds.append([merged_text])

    # 3. 保存为干净的 CSV 文件
    print(f"✅ 成功清洗并提取出 {len(extracted_seeds)} 条纯净的种子文本！")
    print(f"💾 正在保存至: {output_filename} ...")

    with open(output_filename, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        # 写入表头
        writer.writerow(["seed_text"])
        # 写入数据
        writer.writerows(extracted_seeds)

    print("🎉 种子数据集提取完毕！现在你拥有了一座没有版权纠纷的金矿。")


if __name__ == "__main__":
    INPUT_FILE = "PsyQA_example.json"
    OUTPUT_FILE = "cbt_seed_data.csv"

    extract_psyqa_seeds(INPUT_FILE, OUTPUT_FILE)