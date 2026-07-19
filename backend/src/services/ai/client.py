import httpx
import logging

logger = logging.getLogger(__name__)


class HuggingFaceClient:
    """
    Async HTTP client for the HuggingFace Inference API.
    Sends raw image bytes to a model endpoint and returns the response.
    """

    def __init__(self, api_key: str):
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/octet-stream",
        }

    async def post(
        self,
        url: str,
        data: bytes,
        timeout: int = 60,
    ) -> httpx.Response:
        """
        POST raw bytes to the given HuggingFace Inference API endpoint.

        Args:
            url:     Full endpoint URL.
            data:    Raw image bytes.
            timeout: Request timeout in seconds.

        Returns:
            httpx.Response object — caller checks status_code.
        """
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                url,
                headers=self.headers,
                content=data,
            )

        logger.debug(
            "HuggingFace API %s → %d (%.2f KB)",
            url,
            response.status_code,
            len(data) / 1024,
        )
        return response