# pytest collects this file because its name matches `test_*.py`.
from calculator import Calculator, add


def make_values():
    return [1, 2, 3]


def test_add():
    assert add(1, 2) == 3


class TestCalculator:
    def test_total(self, values):
        assert Calculator().total(values) == sum(make_values())
