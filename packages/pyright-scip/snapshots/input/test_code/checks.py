# unittest runs `TestCase` subclasses as tests, whatever the file name,
# so only the code inside those classes, nested classes included, is test code.
import unittest

from calculator import add


def describe(value):
    return f"value={value}"


class AdditionChecks(unittest.TestCase):
    class Numbers:
        two = 2

    def test_add(self):
        self.assertEqual(add(self.Numbers.two, 2), 4)


class StricterAdditionChecks(AdditionChecks):
    def test_add_zero(self):
        self.assertEqual(add(0, 0), 0)


class Report:
    def render(self):
        return describe(add(1, 1))
