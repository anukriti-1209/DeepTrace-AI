import os
from services.encoder.watermark import encode_watermark, decode_watermark

try:
    with open("tmp_test_img.png", "wb") as f:
        # Create a simple valid PNG in memory
        import numpy as np
        from PIL import Image
        import io
        img = np.zeros((512, 512, 3), dtype=np.uint8)
        img[:, :] = (128, 128, 128)
        img = Image.fromarray(img)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        raw_bytes = buf.getvalue()

    fingerprint = "1122334455667788"
    print("Original fingerprint:", fingerprint)

    watermarked_bytes, metadata = encode_watermark(raw_bytes, fingerprint, "PNG")
    print("Encoded metadata:", metadata)

    extracted_fp, conf, details = decode_watermark(watermarked_bytes)
    print("Decoded fingerprint:", extracted_fp)
    print("Decoded conf:", conf)
    print("Decoded details:", details)
except Exception as e:
    import traceback
    traceback.print_exc()
