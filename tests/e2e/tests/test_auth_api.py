import pytest


@pytest.mark.e2e
@pytest.mark.authorization
class TestAuthAPI:
    def test_admin(self, admin) -> None:
        admin.should_be_logged_in()

    def test_buyer(self, buyer) -> None:
        buyer.should_be_logged_in()

    def test_seller(self, seller) -> None:
        seller.should_be_logged_in()
