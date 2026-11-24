# pytest collects this file because its name matches `*_test.py`.
from calculator import add


def test_add_negative():
    assert add(-1, -2) == -3
