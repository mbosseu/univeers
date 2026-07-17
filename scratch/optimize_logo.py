from PIL import Image
import os

pwa192 = r"c:\Users\PC\Desktop\univers\public\pwa-192x192.png"
pwa512 = r"c:\Users\PC\Desktop\univers\public\pwa-512x512.png"

if os.path.exists(pwa192):
    img = Image.open(pwa192)
    img.resize((192, 192), Image.Resampling.LANCZOS).save(pwa192, "PNG", optimize=True)
    print(f"pwa-192x192 optimized: {os.path.getsize(pwa192) / 1024:.2f} KB")

if os.path.exists(pwa512):
    img = Image.open(pwa512)
    img.resize((512, 512), Image.Resampling.LANCZOS).save(pwa512, "PNG", optimize=True)
    print(f"pwa-512x512 optimized: {os.path.getsize(pwa512) / 1024:.2f} KB")
