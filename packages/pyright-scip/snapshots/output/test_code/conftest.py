# < definition test scip-python python snapshot-util 0.1 conftest/__init__:

# pytest loads fixtures and hooks from `conftest.py` files.
import pytest
#      ^^^^^^ reference test local 0


@pytest.fixture
#^^^^^^ reference test local 0
def values():
#   ^^^^^^ definition test  snapshot-util 0.1 conftest/values().
    return [1, 2, 3]

