class HuggingFaceException(Exception):
    """Raised when the HuggingFace Inference API returns an unexpected response."""
    pass


class OCRException(Exception):
    """Raised when OCR processing fails."""
    pass


class ImageProcessingException(Exception):
    """Raised when image cannot be opened or pre-processed."""
    pass