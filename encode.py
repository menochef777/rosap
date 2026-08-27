import imageio
import os

frames_dir = 'imghero2'
frame_files = [os.path.join(frames_dir, f'frame_{str(i+1).zfill(3)}.png') for i in range(175)]

print(f'Compiling {len(frame_files)} frames...')
all_frames = frame_files + frame_files[-2:0:-1]
print(f'Total loop frames: {len(all_frames)}')

writer = imageio.get_writer('hero_bg.mp4', fps=30, codec='libx264', quality=8, pixelformat='yuv420p', macro_block_size=1)
for i, fpath in enumerate(all_frames):
    img = imageio.v2.imread(fpath)
    writer.append_data(img)
    if (i + 1) % 50 == 0:
        print(f'Processed {i+1}/{len(all_frames)} frames')

writer.close()
file_mb = os.path.getsize('hero_bg.mp4') / (1024 * 1024)
print(f'Successfully generated hero_bg.mp4 ({file_mb:.2f} MB)!')
