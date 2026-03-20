import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os

# ==========================================
# ⚙️ 配置区
# ==========================================
MODEL_DIR = "./roberta_cbt_scorer_best"  # 刚刚训练保存的权重目录
TARGET_COLS = ["焦虑", "悲伤", "生气", "羞愧", "无助", "平静", "轻松"]

def draw_bar(score, max_score=100, length=20):
    """在终端画一个极其直观的情绪进度条"""
    filled_len = int(length * score // max_score)
    bar = '█' * filled_len + '░' * (length - filled_len)
    return bar

def main():
    print("⏳ 正在唤醒你亲手炼制的 CBT 情绪分析专家...")
    
    if not os.path.exists(MODEL_DIR):
        print(f"❌ 找不到模型文件夹 {MODEL_DIR}，请确认你已经成功跑完了 train.py！")
        return

    # 1. 加载你微调后的专属模型和分词器
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    
    # 2. 自动分配设备
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    model.eval()  # 切换到推理模式（关闭 Dropout 等训练专属特性）
    print(f"✨ 模型加载完毕！(运行在 {device} 上)\n")
    print("="*50)
    print("💬 进入实时打分模式！(输入 'q' 退出程序)")
    print("="*50)

    # 3. 开启无限对话循环
    while True:
        text = input("\n👉 请输入要测试的认知想法: ")
        if text.strip().lower() == 'q':
            print("👋 测评结束，专家下线。")
            break
        if not text.strip():
            continue

        # 将句子转化为张量，扔进显卡
        inputs = tokenizer(
            text, 
            return_tensors="pt", 
            max_length=128, 
            truncation=True, 
            padding="max_length"
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}

        # 不计算梯度，极速推理
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits

        # 🚨 核心还原：把 0.0-1.0 的输出乘回 100，并限制在 0-100 之间防溢出
        scores = (logits.squeeze().cpu().numpy() * 100.0).clip(0, 100)

        # 打印炫酷的结果
        print("\n📊 专家诊断报告:")
        print("-" * 30)
        for col, score in zip(TARGET_COLS, scores):
            # 将正向情绪和平静情绪用不同颜色区分一下 (终端ANSI转义码)
            if col in ["平静", "轻松"]:
                color_prefix = "\033[92m" # 绿色
            else:
                color_prefix = "\033[91m" # 红色
            color_suffix = "\033[0m"
            
            bar = draw_bar(score)
            print(f"{col:<4} | {color_prefix}{bar}{color_suffix} | {score:>5.1f} 分")
        print("-" * 30)

if __name__ == "__main__":
    main()