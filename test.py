from moviepy import VideoFileClip

# 加载视频
clip = VideoFileClip(r"C:\Users\Administrator\web\public\.mp4")
# 导出为标准的 H.264 格式
clip.write_videofile("4.mp4", codec="libx264", audio_codec="aac")