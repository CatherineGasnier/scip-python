# < definition scip-python python snapshot-util 0.1 advanced/__init__:

# < start enclosing_range scip-python python snapshot-util 0.1 advanced/__init__:
# format-options: showRanges
# < start enclosing_range scip-python python snapshot-util 0.1 advanced/class_decorator().
#                   ⌄ start enclosing_range scip-python python snapshot-util 0.1 advanced/class_decorator().(cls)
def class_decorator(cls):
#   ^^^^^^^^^^^^^^^ definition  snapshot-util 0.1 advanced/class_decorator().
#                   ^^^ definition  snapshot-util 0.1 advanced/class_decorator().(cls)
#                   ^ end enclosing_range scip-python python snapshot-util 0.1 advanced/class_decorator().(cls)
#   ⌄ start enclosing_range scip-python python snapshot-util 0.1 advanced/class_decorator().wrapper().
#               ⌄ start enclosing_range scip-python python snapshot-util 0.1 advanced/class_decorator().wrapper().(args)
#                      ⌄ start enclosing_range scip-python python snapshot-util 0.1 advanced/class_decorator().wrapper().(kwargs)
    def wrapper(*args, **kwargs):
#       ^^^^^^^ definition  snapshot-util 0.1 advanced/class_decorator().wrapper().
#                ^^^^ definition  snapshot-util 0.1 advanced/class_decorator().wrapper().(args)
#                        ^^^^^^ definition  snapshot-util 0.1 advanced/class_decorator().wrapper().(kwargs)
#                      ^ end enclosing_range scip-python python snapshot-util 0.1 advanced/class_decorator().wrapper().(kwargs)
#               ^ end enclosing_range scip-python python snapshot-util 0.1 advanced/class_decorator().wrapper().(args)
        return cls(*args, **kwargs)
#              ^^^ reference  snapshot-util 0.1 advanced/class_decorator().(cls)
#                   ^^^^ reference  snapshot-util 0.1 advanced/class_decorator().wrapper().(args)
#                           ^^^^^^ reference  snapshot-util 0.1 advanced/class_decorator().wrapper().(kwargs)
#   ^ end enclosing_range scip-python python snapshot-util 0.1 advanced/class_decorator().wrapper().
    return wrapper
#          ^^^^^^^ reference  snapshot-util 0.1 advanced/class_decorator().wrapper().
# < end enclosing_range scip-python python snapshot-util 0.1 advanced/class_decorator().

# < start enclosing_range scip-python python snapshot-util 0.1 advanced/Test#
@class_decorator
#^^^^^^^^^^^^^^^ reference  snapshot-util 0.1 advanced/class_decorator().
class Test:
#     ^^^^ definition  snapshot-util 0.1 advanced/Test#
#   ⌄ start enclosing_range scip-python python snapshot-util 0.1 advanced/Test#__init__().
#                ⌄ start enclosing_range scip-python python snapshot-util 0.1 advanced/Test#__init__().(self)
#                      ⌄ start enclosing_range scip-python python snapshot-util 0.1 advanced/Test#__init__().(x)
    def __init__(self, x: float):
#       ^^^^^^^^ definition  snapshot-util 0.1 advanced/Test#__init__().
#                ^^^^ definition  snapshot-util 0.1 advanced/Test#__init__().(self)
#                      ^ definition  snapshot-util 0.1 advanced/Test#__init__().(x)
#                         ^^^^^ reference  python-stdlib 3.11 builtins/float#
#                      ^ end enclosing_range scip-python python snapshot-util 0.1 advanced/Test#__init__().(x)
#                ^ end enclosing_range scip-python python snapshot-util 0.1 advanced/Test#__init__().(self)
        self.x = x
#       ^^^^ reference  snapshot-util 0.1 advanced/Test#__init__().(self)
#            ^ definition  snapshot-util 0.1 advanced/Test#x.
#                ^ reference  snapshot-util 0.1 advanced/Test#__init__().(x)
#   ^ end enclosing_range scip-python python snapshot-util 0.1 advanced/Test#__init__().

#   ⌄ start enclosing_range scip-python python snapshot-util 0.1 advanced/Test#test().
#            ⌄ start enclosing_range scip-python python snapshot-util 0.1 advanced/Test#test().(self)
    def test(self) -> float:
#       ^^^^ definition  snapshot-util 0.1 advanced/Test#test().
#            ^^^^ definition  snapshot-util 0.1 advanced/Test#test().(self)
#                     ^^^^^ reference  python-stdlib 3.11 builtins/float#
#            ^ end enclosing_range scip-python python snapshot-util 0.1 advanced/Test#test().(self)
        return self.x
#              ^^^^ reference  snapshot-util 0.1 advanced/Test#test().(self)
#                   ^ reference  snapshot-util 0.1 advanced/Test#x.
#   ^ end enclosing_range scip-python python snapshot-util 0.1 advanced/Test#test().
# < end enclosing_range scip-python python snapshot-util 0.1 advanced/Test#
# < end enclosing_range scip-python python snapshot-util 0.1 advanced/__init__:

