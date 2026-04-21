import cv2
import numpy as np
from imwatermark import WatermarkEncoder, WatermarkDecoder

try:
    img = np.zeros((512, 512, 3), dtype=np.uint8)
    img[:, :] = (128, 128, 128)

    encoder = WatermarkEncoder()
    wm = bytes.fromhex("1122334455667788")
    encoder.set_watermark('bytes', wm)
    encoded = encoder.encode(img, 'dwtDct')

    cropped = encoded[100:412, 100:412].copy()

    decoder = WatermarkDecoder('bytes', 64)
    decoded = decoder.decode(cropped, 'dwtDct')
    print("Decoded length:", len(decoded))
    print("Decoded hex:", decoded.hex())
except Exception as e:
    print("ERROR:", str(e))
