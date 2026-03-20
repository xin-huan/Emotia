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


def generate_positive_cbt_texts(sampled_seeds, batch_size=10):
    """
    定向生成 CBT 认知重构成功（理性/平静）与 纯积极（轻松/愉悦）的数据
    """
    seeds_text = "\n".join([f"负面内耗种子 {i + 1}: {seed}" for i, seed in enumerate(sampled_seeds)])

    # 🚨 专门为了“认知免疫”和“激活正面标签”定制的 Prompt
    system_prompt = f"""
    你是一名顶级的认知行为疗法（CBT）督导师。
    请阅读以下 {len(sampled_seeds)} 条真实患者的极度内耗种子数据：

    {seeds_text}

    【你的任务】
    请不要生成负面内耗数据！你需要生成 {batch_size} 条【完全健康、理性、积极】的衍生数据。
    请平均分配生成以下两种类型的数据：

    类型 1：认知重构成功（平静/释怀）。面对糟糕的客观事件，采用极其理智、客观、不灾难化的健康认知。
    类型 2：纯粹的正向体验（轻松/愉悦）。面对中性或好的客观事件，产生积极、自我肯定的健康认知。

    【强制输出格式】
    必须严格输出一个 JSON 对象，且必须包含一个名为 "data" 的键，其值是一个字符串数组（List）。
    不要包含任何打分，不要任何解释。
    每一条数据必须严格符合以下格式：
    "[事件]: {{15字以内的客观事实}} [认知]: {{理性的、客观的、或积极自我肯定的想法}}"

    【JSON 输出结构示例（仅参考结构）】
    {{
      "data": [
        "[事件]: {{生成糟糕事件1}} [认知]: {{生成客观理性认知1}}",
        "[事件]: {{生成美好事件2}} [认知]: {{生成积极肯定认知2}}"
      ]
    }}
    """

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.85
        )

        result_str = response.choices[0].message.content
        parsed_json = json.loads(result_str)

        if isinstance(parsed_json, dict):
            if "data" in parsed_json and isinstance(parsed_json["data"], list):
                return parsed_json["data"]
            for value in parsed_json.values():
                if isinstance(value, list):
                    return value
        elif isinstance(parsed_json, list):
            return parsed_json

        return []

    except Exception as e:
        print(f"⚠️ API 调用出错: {e}")
        return []


def main():
    input_file = "cbt_seed_data.csv"
    # ⚠️ 注意这里换了输出文件名，防止覆盖你之前的负面数据！
    output_file = "cbt_synthetic_texts_positive_400.csv"

    # 目标生成数量：400条足够作为 1600 条负面数据的完美锚点
    TARGET_COUNT = 400
    BATCH_SIZE = 10

    print("📥 正在加载种子数据...")
    all_seeds = []
    with open(input_file, 'r', encoding='utf-8') as f_in:
        reader = csv.reader(f_in)
        header = next(reader)
        for row in reader:
            if row:
                all_seeds.append(row[0])

    if len(all_seeds) < 3:
        print("❌ 错误：种子数据太少！")
        return

    print(f"✅ 成功加载 {len(all_seeds)} 条种子数据。")
    print(f"🛡️ 启动【认知免疫与正向激活】裂变引擎，目标: {TARGET_COUNT} 条...")

    total_generated = 0

    with open(output_file, 'w', encoding='utf-8', newline='') as f_out:
        writer = csv.writer(f_out)
        writer.writerow(["ml_input"])

        while total_generated < TARGET_COUNT:
            sampled_seeds = random.sample(all_seeds, 3)

            print(f"\n🔄 进度: {total_generated}/{TARGET_COUNT} | 正在生成健康认知批次...")

            new_texts = generate_positive_cbt_texts(sampled_seeds, batch_size=BATCH_SIZE)

            if new_texts:
                for text in new_texts:
                    if "[事件]:" in text and "[认知]:" in text:
                        writer.writerow([text])
                        total_generated += 1
                        print(f"  🌟 {text[:45]}...")

                        if total_generated >= TARGET_COUNT:
                            break

            time.sleep(1.5)

    print(f"\n🎉 伟大竣工！{total_generated} 条“解药数据”已安全保存至 {output_file}")


if __name__ == "__main__":
    main()