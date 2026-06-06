import httpx


class HTTPClient:
    def __init__(self, url: str):
        self._client = httpx.Client(base_url=url)

    def _request(
        self,
        method: str,
        url: str,
        **kwargs,
    ) -> httpx.Response:
        response = self._client.request(method, url, **kwargs)
        response.raise_for_status()

        return response

    def get(self, url: str, **kwargs) -> httpx.Response:
        return self._request("GET", url, **kwargs)

    def post(self, url: str, **kwargs) -> httpx.Response:
        return self._request("POST", url, **kwargs)

    def put(self, url: str, **kwargs) -> httpx.Response:
        return self._request("PUT", url, **kwargs)

    def delete(self, url: str, **kwargs) -> httpx.Response:
        return self._request("DELETE", url, **kwargs)
