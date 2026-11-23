# pytest loads fixtures and hooks from `conftest.py` files.
import pytest


@pytest.fixture
def values():
    return [1, 2, 3]
