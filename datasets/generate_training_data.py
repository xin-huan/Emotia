import csv
import json
import time
import os
from openai import OpenAI

# ==========================================
# ⚠️ 1. 请在这里填入你的 DeepSeek API Key
# ==========================================
API_KEY = "sk-017e613bf5754e37ac2140e058885b81"

# 🚨 切换回极其稳定的 DeepSeek 客户端
client = OpenAI(api_key=API_KEY, base_url="https://api.deepseek.com")


def score_cbt_text(text):
    """调用 DeepSeek 带有思维链的精准 7 维打分"""

    system_prompt = """
    你是一名资深的认知行为疗法（CBT）专家。
    请对患者的自我陈述进行深度心理评估。

    【你的任务】
    1. 深刻理解文本的情绪内核。
    2. 必须先写出 rationale（打分推理依据），再给出最终分数。

    【打分标准】
    参考 SUDS 量表：0(无), 25(轻度), 50(中度), 75(重度), 100(极度)。微调精度可控制在 5 分以内（如 85, 40）。

    【强制 JSON 输出结构】
    必须严格输出如下 JSON 格式，包含 "rationale" 和 "scores" 两个键，不要有任何其他多余文本：
    {
      "rationale": "基于 SUDS 量表评估情绪强度的推理过程（50字以内）",
      "scores": {
        "焦虑": 0,
        "悲伤": 0,
        "生气": 0,
        "羞愧": 0,
        "无助": 0,
        "平静": 0,
        "轻松": 0
      }
    }
    """

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                # 将要评估的文本以 User 身份传入，结构更清晰
                {"role": "user", "content": f"【评估文本】\n{text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0  # 绝对冷酷、客观的打分机器
        )

        result_str = response.choices[0].message.content
        return json.loads(result_str)

    except Exception as e:
        print(f"⚠️ 接口调用或解析失败: {e}")
        return None


def process_single_file(input_file, output_file):
    """处理单个文件，带断点续传和纯净保存逻辑"""
    if not os.path.exists(input_file):
        print(f"❌ 找不到文件: {input_file}，已跳过。")
        return

    print(f"\n📂 开始处理数据集: {input_file}")
    print(f"💾 目标保存路径: {output_file}")

    all_texts = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader, None)
        for row in reader:
            if row and row[0].strip():
                all_texts.append(row[0].strip())

    total_count = len(all_texts)
    print(f"✅ 成功加载 {total_count} 条待打分数据。")
    if total_count == 0:
        return

    processed_texts = set()
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader, None)
            for row in reader:
                if row:
                    processed_texts.add(row[0])
        print(f"🔄 检测到已有进度，跳过已打分的 {len(processed_texts)} 条数据...")

    with open(output_file, 'a', encoding='utf-8', newline='') as f_out:
        writer = csv.writer(f_out)

        if len(processed_texts) == 0:
            writer.writerow(["ml_input", "焦虑", "悲伤", "生气", "羞愧", "无助", "平静", "轻松"])

        current_count = len(processed_texts)

        for text in all_texts:
            if text in processed_texts:
                continue

            print(f"⏳ 进度: {current_count + 1}/{total_count} | 正在评估: {text[:30]}...")

            max_retries = 3
            result = None
            for attempt in range(max_retries):
                result = score_cbt_text(text)
                if result and "scores" in result:
                    break
                print(f"  🔁 尝试失败，2秒后重试 (重试 {attempt + 1}/{max_retries})...")
                time.sleep(2)

            if result and "scores" in result:
                scores = result.get("scores", {})

                row_data = [
                    text,
                    scores.get("焦虑", 0), scores.get("悲伤", 0), scores.get("生气", 0),
                    scores.get("羞愧", 0), scores.get("无助", 0), scores.get("平静", 0), scores.get("轻松", 0)
                ]
                writer.writerow(row_data)

                # 物理级落盘保护依然保留
                f_out.flush()
                os.fsync(f_out.fileno())

                current_count += 1
                print(f"  ✅ 成功 | 内部推理: {result.get('rationale', '')[:20]}...")
            else:
                print(f"  ❌ 多次重试均遇阻，暂时跳过本条。")

            # ⚡️ 钞能力加速：因为是付费 API，只需象征性地休眠 0.5 秒防止并发过高，速度起飞！
            time.sleep(0.5)


def main():
    print("🚀 启动双通道 CBT 数据打分引擎 (DeepSeek V3 极速版)...")

    tasks = [
        {
            "in": "cbt_synthetic_texts_positive_400.csv",
            "out": "final_scored_positive_400.csv"
        },
        {
            "in": "cbt_synthetic_texts_1600.csv",
            "out": "final_scored_1600.csv"
        }
    ]

    for task in tasks:
        process_single_file(task["in"], task["out"])

    print("\n🎉 所有数据集打分任务圆满完成！你的黄金训练集已准备就绪。")


if __name__ == "__main__":
    main()