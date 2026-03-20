import csv
import random
import os


def read_and_split(filename, split_ratio=0.9):
    """读取单个 CSV 文件，打乱后按比例划分为 train 和 val"""
    if not os.path.exists(filename):
        print(f"❌ 找不到文件: {filename}")
        return None, [], []

    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        # 过滤掉空行
        data = [row for row in reader if row and row[0].strip()]

    # 🚨 固定随机种子，保证每次划分绝对一致
    random.seed(42)
    random.shuffle(data)

    # 计算切分点
    split_index = int(len(data) * split_ratio)

    train_data = data[:split_index]
    val_data = data[split_index:]

    print(f"📄 {filename} -> 提取 {len(train_data)} 条训练数据, {len(val_data)} 条验证数据。")
    return header, train_data, val_data


def save_csv(filename, header, data):
    """将数据保存到 CSV 文件"""
    with open(filename, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        if header:
            writer.writerow(header)
        writer.writerows(data)
    print(f"💾 成功保存: {filename} (共 {len(data)} 条)")


def main():
    print("🚀 启动高质量数据集划分引擎 (分层抽样策略)...")

    # ==========================================
    # ✨ 已经为你更新为最终带有 7 维分数的黄金数据文件！
    # ==========================================
    file_neg = "final_scored_1600.csv"
    file_pos = "final_scored_positive_400.csv"

    # 1. 分别读取并按照 9:1 划分两个文件
    header_neg, train_neg, val_neg = read_and_split(file_neg, split_ratio=0.9)
    header_pos, train_pos, val_pos = read_and_split(file_pos, split_ratio=0.9)

    if header_neg is None or header_pos is None:
        print("⚠️ 存在缺失文件，程序终止。请确保你在跑这个脚本前，已经用 DeepSeek 成功打完了分数。")
        return

    # 2. 合并训练集，合并验证集
    train_combined = train_neg + train_pos
    val_combined = val_neg + val_pos

    # 3. 全局深度打乱（防止模型梯度震荡）
    random.seed(1024)
    random.shuffle(train_combined)
    random.shuffle(val_combined)

    # 4. 统一表头
    final_header = header_neg

    # 5. 保存最终文件
    print("\n📦 正在融合并写入最终数据集...")
    save_csv("train.csv", final_header, train_combined)
    save_csv("val.csv", final_header, val_combined)

    print("\n🎉 数据集构建完毕！")
    print(f"📊 训练集 (train.csv) 总量: {len(train_combined)} 条 (约 90%)")
    print(f"🧪 验证集 (val.csv) 总量: {len(val_combined)} 条 (约 10%)")


if __name__ == "__main__":
    main()