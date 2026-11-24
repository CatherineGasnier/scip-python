# < definition scip-python python snapshot-util 0.1 calculator/__init__:

"""Code under test: nothing in this file is test code."""


def add(a, b):
#   ^^^ definition  snapshot-util 0.1 calculator/add().
#       ^ definition  snapshot-util 0.1 calculator/add().(a)
#          ^ definition  snapshot-util 0.1 calculator/add().(b)
    return a + b
#          ^ reference  snapshot-util 0.1 calculator/add().(a)
#              ^ reference  snapshot-util 0.1 calculator/add().(b)


class Calculator:
#     ^^^^^^^^^^ definition  snapshot-util 0.1 calculator/Calculator#
    def total(self, values):
#       ^^^^^ definition  snapshot-util 0.1 calculator/Calculator#total().
#             ^^^^ definition  snapshot-util 0.1 calculator/Calculator#total().(self)
#                   ^^^^^^ definition  snapshot-util 0.1 calculator/Calculator#total().(values)
        result = 0
#       ^^^^^^ definition local 0
        for value in values:
#           ^^^^^ definition local 1
#                    ^^^^^^ reference  snapshot-util 0.1 calculator/Calculator#total().(values)
            result = add(result, value)
#           ^^^^^^ reference local 0
#                    ^^^ reference  snapshot-util 0.1 calculator/add().
#                        ^^^^^^ reference local 0
#                                ^^^^^ reference local 1
        return result
#              ^^^^^^ reference local 0

