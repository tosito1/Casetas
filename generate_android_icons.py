import os
from PIL import Image

def resize_v(source_path, target_path, size):
    img = Image.open(source_path)
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    img.save(target_path, "WEBP")
    print(f"Generated {target_path} ({size}x{size})")

def generate_android_icons():
    source = "c:/Users/Tosito/Documents/GitHub/Casetas/public/app_icon.png"
    base_res = "c:/Users/Tosito/Documents/GitHub/Casetas/Casetas/app/src/main/res"
    
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }
    
    for folder, size in densities.items():
        folder_path = os.path.join(base_res, folder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
            
        # Standard Icon
        resize_v(source, os.path.join(folder_path, "ic_launcher.webp"), size)
        
        # Round Icon (just resized for now, Android circle clips it)
        resize_v(source, os.path.join(folder_path, "ic_launcher_round.webp"), size)
        
        # Foreground Icon (usually padded/inset)
        # For a simple update, we'll use the same, but higher-res for foreground
        resize_v(source, os.path.join(folder_path, "ic_launcher_foreground.webp"), size)

if __name__ == "__main__":
    import pip
    generate_android_icons()
