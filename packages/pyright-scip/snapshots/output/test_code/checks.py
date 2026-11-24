# < definition scip-python python snapshot-util 0.1 checks/__init__:

# unittest runs `TestCase` subclasses as tests, whatever the file name,
# so only the code inside those classes, nested classes included, is test code.
import unittest
#      ^^^^^^^^ reference  python-stdlib 3.11 unittest/__init__:

from calculator import add
#    ^^^^^^^^^^ reference  snapshot-util 0.1 calculator/__init__:
#                      ^^^ reference  snapshot-util 0.1 calculator/add().


def describe(value):
#   ^^^^^^^^ definition  snapshot-util 0.1 checks/describe().
#            ^^^^^ definition  snapshot-util 0.1 checks/describe().(value)
    return f"value={value}"
#                   ^^^^^ reference  snapshot-util 0.1 checks/describe().(value)


class AdditionChecks(unittest.TestCase):
#     ^^^^^^^^^^^^^^ definition test  snapshot-util 0.1 checks/AdditionChecks#
#     relationship implementation scip-python python python-stdlib 3.11 `unittest.case`/TestCase#
#                    ^^^^^^^^ reference test  python-stdlib 3.11 unittest/__init__:
#                             ^^^^^^^^ reference test  snapshot-util 0.1 `unittest.case`/TestCase#
    class Numbers:
#         ^^^^^^^ definition test  snapshot-util 0.1 checks/AdditionChecks#Numbers#
        two = 2
#       ^^^ definition test  snapshot-util 0.1 checks/AdditionChecks#Numbers#two.

    def test_add(self):
#       ^^^^^^^^ definition test  snapshot-util 0.1 checks/AdditionChecks#test_add().
#                ^^^^ definition test  snapshot-util 0.1 checks/AdditionChecks#test_add().(self)
        self.assertEqual(add(self.Numbers.two, 2), 4)
#       ^^^^ reference test  snapshot-util 0.1 checks/AdditionChecks#test_add().(self)
#            ^^^^^^^^^^^ reference test local 0
#                        ^^^ reference test  snapshot-util 0.1 calculator/add().
#                            ^^^^ reference test  snapshot-util 0.1 checks/AdditionChecks#test_add().(self)
#                                 ^^^^^^^ reference test  snapshot-util 0.1 checks/AdditionChecks#Numbers#
#                                         ^^^ reference test  snapshot-util 0.1 checks/AdditionChecks#Numbers#two.


class StricterAdditionChecks(AdditionChecks):
#     ^^^^^^^^^^^^^^^^^^^^^^ definition test  snapshot-util 0.1 checks/StricterAdditionChecks#
#     relationship implementation scip-python python snapshot-util 0.1 checks/AdditionChecks#
#                            ^^^^^^^^^^^^^^ reference test  snapshot-util 0.1 checks/AdditionChecks#
    def test_add_zero(self):
#       ^^^^^^^^^^^^^ definition test  snapshot-util 0.1 checks/StricterAdditionChecks#test_add_zero().
#                     ^^^^ definition test  snapshot-util 0.1 checks/StricterAdditionChecks#test_add_zero().(self)
        self.assertEqual(add(0, 0), 0)
#       ^^^^ reference test  snapshot-util 0.1 checks/StricterAdditionChecks#test_add_zero().(self)
#            ^^^^^^^^^^^ reference test local 0
#                        ^^^ reference test  snapshot-util 0.1 calculator/add().


class Report:
#     ^^^^^^ definition  snapshot-util 0.1 checks/Report#
    def render(self):
#       ^^^^^^ definition  snapshot-util 0.1 checks/Report#render().
#              ^^^^ definition  snapshot-util 0.1 checks/Report#render().(self)
        return describe(add(1, 1))
#              ^^^^^^^^ reference  snapshot-util 0.1 checks/describe().
#                       ^^^ reference  snapshot-util 0.1 calculator/add().

