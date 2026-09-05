import numpy as np

from app.analysis.face import _classify_eye_color, _sample_feature, _sample_patch


def test_green_eye_is_not_classified_as_brown() -> None:
  green = np.array([70, 115, 80], dtype=np.float64)
  assert _classify_eye_color(green, float(green.mean())) == 'green'


def test_brown_eye_remains_brown() -> None:
  brown = np.array([45, 65, 95], dtype=np.float64)
  assert _classify_eye_color(brown, float(brown.mean())) == 'brown'


def test_low_light_dark_eye_is_not_classified_by_hue() -> None:
  dark_eye = np.array([40.5, 35.5, 36], dtype=np.float64)
  assert _classify_eye_color(dark_eye, float(dark_eye.mean())) == 'dark'


def test_sample_patch_ignores_overexposed_and_shadow_pixels() -> None:
  image = np.full((7, 7, 3), [80, 90, 100], dtype=np.uint8)
  image[0, 0] = [255, 255, 255]
  image[1, 1] = [0, 0, 0]

  sample = _sample_patch(image, 3, 3, radius=3)

  assert np.allclose(sample, [80, 90, 100])


def test_sample_feature_uses_median_across_landmarks() -> None:
  image = np.zeros((10, 10, 3), dtype=np.uint8)
  image[2:4, 2:4] = [40, 40, 40]
  image[6:8, 6:8] = [100, 100, 100]

  sample = _sample_feature(image, [(0.3, 0.3), (0.7, 0.7)], 10, 10, radius=1)

  assert np.allclose(sample, [70, 70, 70])