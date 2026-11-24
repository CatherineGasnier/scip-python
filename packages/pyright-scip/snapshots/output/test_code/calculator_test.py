# < definition test scip-python python snapshot-util 0.1 calculator_test/__init__:

# pytest collects this file because its name matches `*_test.py`.
from calculator import add
#    ^^^^^^^^^^ reference test  snapshot-util 0.1 calculator/__init__:
#                      ^^^ reference test  snapshot-util 0.1 calculator/add().


def test_add_negative():
#   ^^^^^^^^^^^^^^^^^ definition test  snapshot-util 0.1 calculator_test/test_add_negative().
    assert add(-1, -2) == -3
#          ^^^ reference test  snapshot-util 0.1 calculator/add().

