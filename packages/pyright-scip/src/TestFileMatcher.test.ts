import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { createFromRealFileSystem } from 'pyright-internal/common/realFileSystem';
import { PyrightFileSystem } from 'pyright-internal/pyrightFileSystem';

import { TestFileMatcher } from './TestFileMatcher';

describe('TestFileMatcher with default patterns', () => {
    const matcher = new TestFileMatcher();

    test.each(['/repo/test_math.py', '/repo/pkg/math_test.py', '/repo/conftest.py', '/repo/tests/conftest.py'])(
        'matches %s',
        (filePath) => assert.ok(matcher.isTestFile(filePath))
    );

    test.each([
        '/repo/math.py',
        '/repo/testing.py',
        '/repo/test.py',
        '/repo/tests/helpers.py',
        '/repo/test_pkg/math.py',
        '/repo/test_math.pyi',
    ])('does not match %s', (filePath) => assert.ok(!matcher.isTestFile(filePath)));
});

describe('TestFileMatcher with custom patterns', () => {
    test('only .py files are collected, whatever the pattern', () => {
        const matcher = new TestFileMatcher(['check_*']);
        assert.ok(matcher.isTestFile('/repo/check_a.py'));
        assert.ok(!matcher.isTestFile('/repo/check_a.pyi'));
        assert.ok(!matcher.isTestFile('/repo/check_a.txt'));
    });

    test('an absolute pattern matches the whole path', () => {
        const matcher = new TestFileMatcher(['/repo/tests/*.py']);
        assert.ok(matcher.isTestFile('/repo/tests/a.py'));
        assert.ok(!matcher.isTestFile('/other/repo/tests/a.py'));
    });

    test('a pattern without a slash only matches the file name', () => {
        const matcher = new TestFileMatcher(['*check*.py']);
        assert.ok(matcher.isTestFile('/repo/pkg/sanity_checks.py'));
        assert.ok(!matcher.isTestFile('/repo/checks/models.py'));
    });

    test('a pattern with a slash matches the end of the path, and * also matches slashes', () => {
        const matcher = new TestFileMatcher(['tests/*.py']);
        assert.ok(matcher.isTestFile('/repo/tests/helpers.py'));
        assert.ok(matcher.isTestFile('/repo/tests/unit/helpers.py'));
        assert.ok(!matcher.isTestFile('/repo/src/helpers.py'));
        assert.ok(!matcher.isTestFile('/repo/src/test_helpers.py'));
    });

    test('character sets and single-character wildcards', () => {
        const matcher = new TestFileMatcher(['check_[ab].py', 'spec_[!x]?.py']);
        assert.ok(matcher.isTestFile('/repo/check_a.py'));
        assert.ok(!matcher.isTestFile('/repo/check_c.py'));
        assert.ok(matcher.isTestFile('/repo/spec_y1.py'));
        assert.ok(!matcher.isTestFile('/repo/spec_x1.py'));
    });

    test('regular expression characters are literal, and invalid sets never match', () => {
        const matcher = new TestFileMatcher(['test+(x).py', '[z-a].py']);
        assert.ok(matcher.isTestFile('/repo/test+(x).py'));
        assert.ok(!matcher.isTestFile('/repo/testtt(x)py'));
        assert.ok(!matcher.isTestFile('/repo/z.py'));
    });
});

describe('TestFileMatcher.fromPytestConfig', () => {
    let root: string;
    beforeEach(() => {
        root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'scip-pytest-config-')));
    });
    afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

    /** Writes `files` under the temporary root and returns the matcher for project directory `project`. */
    function matcherFor(files: Record<string, string>, project = '.'): TestFileMatcher {
        for (const [relativePath, contents] of Object.entries(files)) {
            fs.mkdirSync(path.dirname(path.join(root, relativePath)), { recursive: true });
            fs.writeFileSync(path.join(root, relativePath), contents);
        }
        const projectRoot = path.join(root, project);
        fs.mkdirSync(projectRoot, { recursive: true });
        return TestFileMatcher.fromPytestConfig(new PyrightFileSystem(createFromRealFileSystem()), projectRoot);
    }

    function assertMatches(matcher: TestFileMatcher, matching: string[], notMatching: string[]): void {
        for (const fileName of matching) {
            assert.ok(matcher.isTestFile(path.join(root, fileName)), `expected ${fileName} to be a test file`);
        }
        for (const fileName of notMatching) {
            assert.ok(!matcher.isTestFile(path.join(root, fileName)), `expected ${fileName} not to be a test file`);
        }
    }

    test('without configuration, uses the defaults', () => {
        assertMatches(matcherFor({}), ['test_a.py', 'a_test.py', 'conftest.py'], ['check_a.py']);
    });

    test.each([
        ['pytest.toml', '[pytest]\npython_files = ["check_*.py"]\n'],
        ['.pytest.toml', '[pytest]\npython_files = ["check_*.py"]\n'],
        ['pytest.ini', '[pytest]\npython_files = check_*.py\n'],
        ['pytest.ini', '; CRLF line endings\r\n[pytest]\r\npython_files = check_*.py\r\n'],
        ['.pytest.ini', '[pytest]\npython_files = check_*.py\n'],
        ['pyproject.toml', '[tool.pytest.ini_options]\npython_files = ["check_*.py"]\n'],
        ['pyproject.toml', '[tool.pytest.ini_options]\npython_files = "check_*.py"\n'],
        ['pyproject.toml', '[tool.pytest]\npython_files = ["check_*.py"]\n'],
        ['pyproject.toml', '# CRLF line endings\r\n[tool.pytest]\r\npython_files = ["check_*.py"]\r\n'],
        ['tox.ini', '[pytest]\npython_files = check_*.py\n'],
        ['setup.cfg', '[tool:pytest]\npython_files = check_*.py\n'],
    ])('reads python_files from %s: %j', (fileName, contents) => {
        assertMatches(matcherFor({ [fileName]: contents }), ['check_a.py', 'conftest.py'], ['test_a.py']);
    });

    test('reads several patterns, over continuation lines, next to comments and other settings', () => {
        const matcher = matcherFor({
            'pytest.ini': [
                '# comment',
                '[pytest]',
                'addopts = -ra',
                'python_files: check_*.py',
                '    ; comment',
                '    *_check.py',
                '[other]',
                'python_files = other_*.py',
            ].join('\n'),
        });
        assertMatches(matcher, ['check_a.py', 'a_check.py'], ['test_a.py', 'other_a.py']);
    });

    test('a configuration without python_files means the defaults', () => {
        assertMatches(matcherFor({ 'pytest.ini': '[pytest]\naddopts = -ra\n' }), ['test_a.py'], ['check_a.py']);
    });

    const parentConfig = { 'setup.cfg': '[tool:pytest]\npython_files = check_*.py\n' };

    test.each([
        ['pyproject.toml', '[project]\nname = "x"\n'],
        ['pyproject.toml', '[tool.pytest]\n'],
        ['tox.ini', '[tox]\n'],
        ['setup.cfg', '[metadata]\n'],
    ])('a %s without pytest settings is skipped: %j', (fileName, contents) => {
        const matcher = matcherFor({ ...parentConfig, [`project/${fileName}`]: contents }, 'project');
        assertMatches(matcher, ['project/check_a.py'], ['project/test_a.py']);
    });

    test.each(['pytest.ini', 'pytest.toml'])('an empty %s is used, so the defaults apply', (fileName) => {
        const matcher = matcherFor({ ...parentConfig, [`project/${fileName}`]: '' }, 'project');
        assertMatches(matcher, ['project/test_a.py'], ['project/check_a.py']);
    });

    test('the nearest directory wins, then the first file in pytest order', () => {
        const matcher = matcherFor(
            {
                'pytest.ini': '[pytest]\npython_files = outer_*.py\n',
                'project/pyproject.toml': '[tool.pytest.ini_options]\npython_files = ["pyproject_*.py"]\n',
                'project/pytest.ini': '[pytest]\npython_files = ini_*.py\n',
            },
            'project'
        );
        assertMatches(matcher, ['project/ini_a.py'], ['project/pyproject_a.py', 'project/outer_a.py']);
    });
});
