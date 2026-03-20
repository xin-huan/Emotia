import json
import csv
import random
import time
from openai import OpenAI

# ==========================================
# ⚠️ 请填入你的 DeepSeek API Key
# ==========================================
API_KEY = "sk-017e613bf5754e37ac2140e058885b81"
client = OpenAI(api_key=API_KEY, base_url="https://api.deepseek.com")


def generate_cbt_texts(sampled_seeds, batch_size=10):
    """
    接收多条随机种子，利用上下文学习(ICL)裂变出全新场景的 CBT 文本
    """
    # 将抽样的 3 条种子拼接成一段带序号的文本
    seeds_text = "\n".join([f"种子 {i + 1}: {seed}" for i, seed in enumerate(sampled_seeds)])

    # 🚨 修复点1：明确告诉模型外层是字典，内层是数组，同时用占位符代替具体例子
    system_prompt = f"""
    你是一名认知行为疗法（CBT）专家和数据生成专家。
    请仔细阅读以下 {len(sampled_seeds)} 条真实患者的种子求助数据：

    {seeds_text}

    【你的任务】
    体会患者的负面认知。
    跳出这几个现有的场景，为我凭空捏造 {batch_size} 条【全新场景】的衍生数据（如：恋爱危机、容貌焦虑、经济压力、疾病恐慌、社交尴尬等）。

    【强制输出格式】
    必须严格输出一个 JSON 对象，且必须包含一个名为 "data" 的键，其值是一个字符串数组（List）。
    不要包含任何打分，不要任何解释。
    每一条数据必须严格符合以下格式：
    "[事件]: {{15字以内的客观事实}} [认知]: {{患者的主观负面评价，和种子求助数据长度语气一致}}"

    【JSON 输出结构示例（请仅参考结构，不要照抄内容）】
    {{
      "data": [
        "[事件]: {{生成事件1}} [认知]: {{生成认知1}}",
        "[事件]: {{生成事件2}} [认知]: {{生成认知2}}"
      ]
    }}
    """

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt}
            ],
            response_format={"type": "json_object"}, # 强制返回 {}
            temperature=0.85
        )

        result_str = response.choices[0].message.content
        parsed_json = json.loads(result_str)

        # 🚨 修复点2：极其强壮的解析逻辑，不管它怎么乱跑格式，统统拿下
        if isinstance(parsed_json, dict):
            # 首选提取 "data" 键
            if "data" in parsed_json and isinstance(parsed_json["data"], list):
                return parsed_json["data"]
            # 如果它没用 "data" 键，遍历所有值找列表
            for value in parsed_json.values():
                if isinstance(value, list):
                    return value
        elif isinstance(parsed_json, list):
            # 如果它无视规则硬是返回了列表，直接返回
            return parsed_json

        return []

    except Exception as e:
        print(f"⚠️ API 调用出错: {e}")
        return []

def main():
    input_file = "cbt_seed_data.csv"
    output_file = "cbt_synthetic_texts_1600.csv"

    # 目标生成数量
    TARGET_COUNT = 1600
    BATCH_SIZE = 16

    print("📥 正在加载种子数据...")
    all_seeds = []
    with open(input_file, 'r', encoding='utf-8') as f_in:
        reader = csv.reader(f_in)
        header = next(reader)
        for row in reader:
            if row:
                all_seeds.append(row[0])

    if len(all_seeds) < 3:
        print("❌ 错误：种子数据太少，无法进行多样本混合抽样！")
        return

    print(f"✅ 成功加载 {len(all_seeds)} 条种子数据。")
    print(f"🚀 启动 Self-Instruct 多样本裂变引擎，目标: {TARGET_COUNT} 条...")

    total_generated = 0

    with open(output_file, 'w', encoding='utf-8', newline='') as f_out:
        writer = csv.writer(f_out)
        writer.writerow(["ml_input"])  # 只有一列纯文本

        while total_generated < TARGET_COUNT:
            # 核心黑科技：每次随机抓取 3 条不同的种子
            sampled_seeds = random.sample(all_seeds, 3)

            print(f"\n🔄 进度: {total_generated}/{TARGET_COUNT} | 正在基于 3 条随机种子生成新批次...")

            new_texts = generate_cbt_texts(sampled_seeds, batch_size=BATCH_SIZE)

            if new_texts:
                for text in new_texts:
                    # 检查格式是否正确
                    if "[事件]:" in text and "[认知]:" in text:
                        writer.writerow([text])
                        total_generated += 1
                        print(f"  ✨ {text[:40]}...")

                        # 达到目标立刻停止
                        if total_generated >= TARGET_COUNT:
                            break

            # API 频率保护
            time.sleep(1.5)

    print(f"\n🎉 太棒了！完美达成目标！{total_generated} 条纯净 CBT 文本已保存至 {output_file}")


if __name__ == "__main__":
    main()