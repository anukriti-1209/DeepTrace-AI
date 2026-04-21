import requests
import io
import base64
import numpy as np
from PIL import Image

# 1. Create dummy image
img = Image.fromarray(np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8))
buf = io.BytesIO()
img.save(buf, format="PNG")
img_bytes = buf.getvalue()

# 2. Encode
print("Encoding...")
res = requests.post("http://localhost:8000/api/v1/watermark/encode-json", files={"file": ("test.png", img_bytes, "image/png")})
data = res.json()
print("Encode success?", res.status_code == 200, data.get("fingerprint"))

# 3. Download base64 image
b64 = data["image_base64"].split(",")[1]
watermarked_bytes = base64.b64decode(b64)

# 4. Decode
print("Decoding...")
res2 = requests.post("http://localhost:8000/api/v1/watermark/decode", files={"file": ("test_dl.png", watermarked_bytes, "image/png")})
data2 = res2.json()
print("Decode confidence:", data2.get("confidence"))
print("Decode fingerprint:", data2.get("fingerprint"))
print("Provenance verified?", data2.get("provenance_verified"))
