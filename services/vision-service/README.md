# vision-service

FastAPI service for the computer-vision pipeline used by Aura.

It decodes portrait images, detects facial landmarks with MediaPipe and derives experimental features such as face shape, skin tone, undertone, eye color, hair color and facial symmetry. Those features are passed to the recommendation layer together with the project's colorimetry knowledge base.

The current implementation is a prototype: image-based classifications use interpretable heuristics and should be evaluated against a representative dataset before being treated as production-grade measurements.
