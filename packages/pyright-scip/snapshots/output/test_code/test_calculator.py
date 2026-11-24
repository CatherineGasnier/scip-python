# < definition test scip-python python snapshot-util 0.1 test_calculator/__init__:

# pytest collects this file because its name matches `test_*.py`.
from calculator import Calculator, add
#    ^^^^^^^^^^ reference test  snapshot-util 0.1 calculator/__init__:
#                      ^^^^^^^^^^ reference test  snapshot-util 0.1 calculator/Calculator#
#                                  ^^^ reference test  snapshot-util 0.1 calculator/add().


def make_values():
#   ^^^^^^^^^^^ definition test  snapshot-util 0.1 test_calculator/make_values().
    return [1, 2, 3]


def test_add():
#   ^^^^^^^^ definition test  snapshot-util 0.1 test_calculator/test_add().
    assert add(1, 2) == 3
#          ^^^ reference test  snapshot-util 0.1 calculator/add().


class TestCalculator:
#     ^^^^^^^^^^^^^^ definition test  snapshot-util 0.1 test_calculator/TestCalculator#
    def test_total(self, values):
#       ^^^^^^^^^^ definition test  snapshot-util 0.1 test_calculator/TestCalculator#test_total().
#                  ^^^^ definition test  snapshot-util 0.1 test_calculator/TestCalculator#test_total().(self)
#                        ^^^^^^ definition test  snapshot-util 0.1 test_calculator/TestCalculator#test_total().(values)
        assert Calculator().total(values) == sum(make_values())
#              ^^^^^^^^^^ reference test  snapshot-util 0.1 calculator/Calculator#
#                           ^^^^^ reference test  snapshot-util 0.1 calculator/Calculator#total().
#                                 ^^^^^^ reference test  snapshot-util 0.1 test_calculator/TestCalculator#test_total().(values)
#                                            ^^^ reference test  python-stdlib 3.11 builtins/sum().
#                                                ^^^^^^^^^^^ reference test  snapshot-util 0.1 test_calculator/make_values().

