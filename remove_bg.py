import sys
from rembg import remove
from PIL import Image

def strip_bg(input_path, output_path):
    print("Opening model and removing background...")
    img = Image.open(input_path)
    out = remove(img)
    out.save(output_path)
    print("Done")

if __name__ == "__main__":
    strip_bg(sys.argv[1], sys.argv[2])
