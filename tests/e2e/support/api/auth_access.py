from support.api.http_client import HTTPClient


class ApiAuthAccess:
    def __init__(self, api_url: str):
        self._client = HTTPClient(api_url)

    def login(
        self,
        email: str,
        password: str,
    ) -> str:
        response = self._client.post(
            "/users/login",
            data={
                "username": email,
                "password": password,
            },
        )
        return response.json()["access_token"]
