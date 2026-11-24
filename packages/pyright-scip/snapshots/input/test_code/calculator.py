"""Code under test: nothing in this file is test code."""


def add(a, b):
    return a + b


class Calculator:
    def total(self, values):
        result = 0
        for value in values:
            result = add(result, value)
        return result
