import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
# ✨ 修改后的正确代码
import torch.optim as optim
from transformers import AutoTokenizer, AutoModelForSequenceClassification, get_linear_schedule_with_warmup
import numpy as np
import os

# ==========================================
# ⚙️ 核心超参数配置 (基于业界 RoBERTa 最佳实践)
# ==========================================
MODEL_NAME = "hfl/chinese-roberta-wwm-ext"
BATCH_SIZE = 16  # 显存友好，梯度稳定
MAX_LEN = 128  # 你的 CBT 文本通常在 50-100 字，128 完全足够且省显存
EPOCHS = 5  # 回归任务通常 5 轮左右收敛
LEARNING_RATE = 2e-5  # 黄金学习率
WEIGHT_DECAY = 0.01

# 情绪维度标签
TARGET_COLS = ["焦虑", "悲伤", "生气", "羞愧", "无助", "平静", "轻松"]


# ==========================================
# 📦 1. 构建 PyTorch 数据集 (Dataset)
# ==========================================
class CBTDataset(Dataset):
    def __init__(self, csv_file, tokenizer, max_len):
        self.data = pd.read_csv(csv_file)
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.data)

    def __getitem__(self, index):
        row = self.data.iloc[index]
        text = str(row['ml_input'])

        # 🚨 核心黑科技：标签归一化 (除以100)
        # 将 0-100 的分数映射到 0.0-1.0，防止梯度爆炸
        labels = torch.tensor(
            [float(row[col]) / 100.0 for col in TARGET_COLS],
            dtype=torch.float
        )

        # 将文本转化为 RoBERTa 认识的 Token 编号
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt',
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': labels
        }


# ==========================================
# 🧠 2. 训练与评估逻辑
# ==========================================
def main():
    print(f"🚀 正在加载预训练权重: {MODEL_NAME}...")

    # 自动下载哈工大 RoBERTa 权重和分词器
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(TARGET_COLS),
        problem_type="regression"
    )

    # 检查是否有 GPU (自动使用 CUDA)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    print(f"💻 训练设备: {device}")

    # 准备 DataLoader
    train_dataset = CBTDataset("datasets/train.csv", tokenizer, MAX_LEN)
    val_dataset = CBTDataset("datasets/val.csv", tokenizer, MAX_LEN)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)

    # 学习率预热 (Warmup)：让学习率在前 10% 的步数里慢慢上升，防止刚开始时步子太大毁掉预训练权重
    total_steps = len(train_loader) * EPOCHS
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(total_steps * 0.1),
        num_training_steps=total_steps
    )

    loss_fn = nn.MSELoss()

    best_val_mae = float('inf')

    print("\n🔥 开始激情的炼丹之旅...")
    for epoch in range(EPOCHS):
        model.train()
        total_train_loss = 0

        for batch_idx, batch in enumerate(train_loader):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)

            model.zero_grad()

            # 前向传播
            outputs = model(input_ids, attention_mask=attention_mask)
            logits = outputs.logits  # 模型输出的预测值 (0.0-1.0)

            # 计算 Loss
            loss = loss_fn(logits, labels)
            total_train_loss += loss.item()

            # 反向传播，更新权重
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)  # 防梯度爆炸
            optimizer.step()
            scheduler.step()

            if (batch_idx + 1) % 10 == 0:
                print(
                    f"  Epoch {epoch + 1}/{EPOCHS} | Batch {batch_idx + 1}/{len(train_loader)} | Train Loss (MSE): {loss.item():.4f}")

        avg_train_loss = total_train_loss / len(train_loader)

        # ==========================================
        # 🧪 验证集测试 (每跑完一轮就考试)
        # ==========================================
        model.eval()
        total_val_loss = 0
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels = batch['labels'].to(device)

                outputs = model(input_ids, attention_mask=attention_mask)
                logits = outputs.logits

                loss = loss_fn(logits, labels)
                total_val_loss += loss.item()

                # 收集用于计算 MAE
                all_preds.append(logits.cpu().numpy())
                all_labels.append(labels.cpu().numpy())

        avg_val_loss = total_val_loss / len(val_loader)

        # 🚨 将分数乘以 100 还原回原始刻度，计算 MAE
        all_preds = np.vstack(all_preds) * 100.0
        all_labels = np.vstack(all_labels) * 100.0
        val_mae = np.mean(np.abs(all_preds - all_labels))

        print(f"\n📊 --- Epoch {epoch + 1} 考试成绩单 ---")
        print(f"  🎯 训练集均方误差 (Train Loss): {avg_train_loss:.4f}")
        print(f"  🎯 验证集均方误差 (Val Loss): {avg_val_loss:.4f}")
        print(f"  🏆 验证集绝对误差 (Val MAE): {val_mae:.2f} 分 (预测分数与专家的平均差距)")
        print(f"---------------------------------\n")

        # 💾 保存最佳模型
        if val_mae < best_val_mae:
            best_val_mae = val_mae
            output_dir = "../roberta_cbt_scorer_best"
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)

            # 保存权重、配置和分词器
            model.save_pretrained(output_dir)
            tokenizer.save_pretrained(output_dir)
            print(f"⭐ 发现更好模型！当前最佳 MAE: {best_val_mae:.2f} 分。已保存至 {output_dir}\n")

    print("🎉 炼丹彻底圆满结束！你的私有化 CBT 情绪打分专家已诞生！")


if __name__ == "__main__":
    main()