import cv2
import numpy as np
from imwatermark import WatermarkEncoder, WatermarkDecoder

img = np.zeros((512, 512, 3), dtype=np.uint8)
img[:, :] = (128, 128, 128)

encoder = WatermarkEncoder()
wm = bytes.fromhex("1122334455667788")
encoder.set_watermark('bytes', wm)
encoded = encoder.encode(img, 'dwtDct')

cropped = encoded[128:384, 128:384].copy()
decoder = WatermarkDecoder('bytes', 64)
decoded = decoder.decode(cropped, 'dwtDct')
print("Decoded hex 128x128 crop:", decoded.hex())

cropped2 = encoded[130:386, 130:386].copy()
decoded2 = decoder.decode(cropped2, 'dwtDct')
print("Decoded hex 130x130 crop:", decoded2.hex())
