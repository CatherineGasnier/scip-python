import * as TOML from '@iarna/toml';
import * as path from 'path';

import { FileSystem } from 'pyright-internal/common/fileSystem';
import { combinePaths, forEachAncestorDirectory, normalizeSlashes } from 'pyright-internal/common/pathUtils';

import { parseToml } from './config';

/** pytest's default `python_files` setting. */
const defaultPythonFiles = ['test_*.py', '*_test.py'];

/**
 * Decides which files hold test code, following pytest's rules.
 *
 * A file is test code if pytest would collect tests from it, meaning it is
 * a `.py` file whose path matches one of the `python_files` glob patterns,
 * or if it is a `conftest.py` file, which pytest loads for fixtures and
 * hooks whatever `python_files` says.
 */
export class TestFileMatcher {
    private readonly patterns: CompiledPattern[];

    /** @param pythonFiles glob patterns, as in pytest's `python_files` setting. */
    constructor(pythonFiles: string[] = defaultPythonFiles) {
        this.patterns = pythonFiles
            .map(compilePythonFilesPattern)
            .filter((pattern): pattern is CompiledPattern => pattern !== undefined);
    }

    /**
     * Creates a matcher from the configuration file that pytest would use
     * when run from `projectRoot`, or from pytest's defaults if there is none.
     */
    public static fromPytestConfig(fs: FileSystem, projectRoot: string): TestFileMatcher {
        return new TestFileMatcher(findPytestConfig(fs, projectRoot)?.pythonFiles);
    }

    /** @param filePath an absolute path. */
    public isTestFile(filePath: string): boolean {
        const normalizedPath = normalizeForMatching(filePath);
        const fileName = path.posix.basename(normalizedPath);
        const isCollectedModule =
            path.extname(filePath) === '.py' &&
            this.patterns.some(({ regExp, matchesFileName }) =>
                regExp.test(matchesFileName ? fileName : normalizedPath)
            );
        return isCollectedModule || fileName === 'conftest.py';
    }
}

/** The pytest settings that decide which files hold tests. */
interface PytestConfig {
    /** Unset when the configuration file does not set `python_files`. */
    pythonFiles?: string[];
}

/** Reads the pytest settings in a configuration file, or returns undefined if it holds none. */
type ConfigReader = (contents: string) => PytestConfig | undefined;

/**
 * The files pytest reads its configuration from, in the order it tries them
 * in each directory. See `CONFIG_LOADERS_BY_NAME` in pytest's
 * `_pytest/config/findpaths.py`.
 */
const configReaders: [string, ConfigReader][] = [
    ['pytest.toml', readPytestToml],
    ['.pytest.toml', readPytestToml],
    ['pytest.ini', (contents) => readIniConfig(contents, 'pytest') ?? {}],
    ['.pytest.ini', (contents) => readIniConfig(contents, 'pytest') ?? {}],
    ['pyproject.toml', readPyprojectToml],
    ['tox.ini', (contents) => readIniConfig(contents, 'pytest')],
    ['setup.cfg', (contents) => readIniConfig(contents, 'tool:pytest')],
];

/**
 * Finds the configuration pytest would use when run from `projectRoot`
 * without arguments: the first file holding pytest settings, searching
 * `projectRoot` and then its ancestors.
 */
function findPytestConfig(fs: FileSystem, projectRoot: string): PytestConfig | undefined {
    let config: PytestConfig | undefined;
    // The search stops at the first directory for which the callback returns a path.
    forEachAncestorDirectory(projectRoot, (directory) => {
        for (const [fileName, readConfig] of configReaders) {
            const filePath = combinePaths(directory, fileName);
            config = fs.existsSync(filePath) ? readConfig(fs.readFileSync(filePath, 'utf8')) : undefined;
            if (config) {
                return filePath;
            }
        }
        return undefined;
    });
    return config;
}

/** Reads `pytest.toml`, which counts as pytest's configuration even without a `[pytest]` table. */
function readPytestToml(contents: string): PytestConfig {
    const table = asTable(tryParseToml(contents)?.pytest);
    return table ? readTableConfig(table) : {};
}

/**
 * Reads `pyproject.toml`, which holds pytest settings either in the
 * `[tool.pytest.ini_options]` table or, since pytest 9, directly in `[tool.pytest]`.
 */
function readPyprojectToml(contents: string): PytestConfig | undefined {
    const toolPytest = asTable(asTable(tryParseToml(contents)?.tool)?.pytest);
    const iniOptions = asTable(toolPytest?.ini_options);
    if (iniOptions) {
        return readTableConfig(iniOptions);
    }
    return toolPytest && Object.keys(toolPytest).length > 0 ? readTableConfig(toolPytest) : undefined;
}

/** Reads `python_files` from a TOML table, where it is a list of patterns or a space-separated string. */
function readTableConfig(table: TOML.JsonMap): PytestConfig {
    const value = table.python_files;
    if (typeof value === 'string') {
        return { pythonFiles: splitWords(value) };
    }
    if (Array.isArray(value)) {
        return { pythonFiles: value.flatMap((item) => (typeof item === 'string' ? [item] : [])) };
    }
    return {};
}

function tryParseToml(contents: string): TOML.JsonMap | undefined {
    try {
        return parseToml(contents);
    } catch {
        return undefined;
    }
}

function asTable(value: TOML.AnyJson | undefined): TOML.JsonMap | undefined {
    const isTable = typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
    return isTable ? value : undefined;
}

/** Reads the pytest settings in section `sectionName` of an INI file, or returns undefined if there is no such section. */
function readIniConfig(contents: string, sectionName: string): PytestConfig | undefined {
    const section = parseIniSection(contents, sectionName);
    if (section === undefined) {
        return undefined;
    }
    const pythonFiles = section.get('python_files');
    return pythonFiles === undefined ? {} : { pythonFiles: splitWords(pythonFiles.join('\n')) };
}

/**
 * Returns the settings in one section of an INI file, each as a list of
 * lines, or undefined if the file has no such section. Follows `iniconfig`,
 * the parser pytest uses: lines starting with `#` or `;` are comments,
 * `name = value` or `name: value` starts a setting, and indented lines add
 * lines to its value.
 */
function parseIniSection(contents: string, sectionName: string): Map<string, string[]> | undefined {
    let found: Map<string, string[]> | undefined;
    // The settings of the section being read, if it is the one we want.
    let current: Map<string, string[]> | undefined;
    // The lines of the setting being read, if it is in that section.
    let currentValue: string[] | undefined;
    for (const line of contents.split(/\r\n|\r|\n/)) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith(';')) {
            continue;
        }
        const header = /^\[(.*)\]$/.exec(line.split(/[#;]/)[0].trimEnd());
        // iniconfig splits a setting at the first `=`, unless a `:` comes before it.
        const separator = line.search(/[=:]/);
        if (header) {
            current = header[1] === sectionName ? (found = new Map()) : undefined;
            currentValue = undefined;
        } else if (/^\s/.test(line)) {
            currentValue?.push(trimmed);
        } else if (current && separator >= 0) {
            currentValue = [line.slice(separator + 1).trim()];
            current.set(line.slice(0, separator).trim(), currentValue);
        } else {
            currentValue = undefined;
        }
    }
    return found;
}

/** Splits a string setting into words, like pytest does with `shlex.split` (quotes are not supported). */
function splitWords(value: string): string[] {
    return value.split(/\s+/).filter((word) => word !== '');
}

/** Like Python's `fnmatch`, ignore case and treat `\` as `/` on Windows only. */
function normalizeForMatching(text: string): string {
    return process.platform === 'win32' ? normalizeSlashes(text, '/').toLowerCase() : text;
}

/** A `python_files` pattern, compiled to a regular expression. */
interface CompiledPattern {
    regExp: RegExp;
    /** Whether the pattern applies to the file name, rather than to the whole path. */
    matchesFileName: boolean;
}

/**
 * Compiles a `python_files` pattern, following pytest's `fnmatch_ex`: a
 * pattern without `/` matches the file name, and a relative pattern with `/`
 * matches the end of the absolute path. As in Python's `fnmatch`, `*` also
 * matches `/`. Returns undefined for a pattern that cannot match anything,
 * such as `[z-a].py`.
 */
function compilePythonFilesPattern(pattern: string): CompiledPattern | undefined {
    const normalizedPattern = normalizeForMatching(pattern);
    const matchesFileName = !normalizedPattern.includes('/');
    const prefix = matchesFileName || path.isAbsolute(pattern) ? '' : '.*/';
    try {
        return { regExp: new RegExp(`^${prefix}${fnmatchToRegExpSource(normalizedPattern)}$`, 's'), matchesFileName };
    } catch {
        return undefined;
    }
}

/**
 * Translates a Python `fnmatch` pattern into regular expression syntax:
 * `*` matches any text, `?` any character, `[seq]` any character in seq,
 * and `[!seq]` any character not in seq.
 */
function fnmatchToRegExpSource(pattern: string): string {
    let source = '';
    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        const setEnd = char === '[' ? findSetEnd(pattern, i) : -1;
        if (char === '*') {
            source += '.*';
        } else if (char === '?') {
            source += '.';
        } else if (setEnd >= 0) {
            const set = pattern.slice(i + 1, setEnd).replace(/[\\\]]/g, '\\$&');
            source += set.startsWith('!') ? `[^${set.slice(1)}]` : `[${set.startsWith('^') ? '\\' : ''}${set}]`;
            i = setEnd;
        } else {
            source += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    }
    return source;
}

/**
 * Returns the index of the `]` that closes the set opened by the `[` at
 * `start`, or -1 if that `[` is a literal character. As in `fnmatch`, a `]`
 * right after `[` or `[!` belongs to the set.
 */
function findSetEnd(pattern: string, start: number): number {
    let end = start + 1;
    if (pattern[end] === '!') {
        end++;
    }
    if (pattern[end] === ']') {
        end++;
    }
    return pattern.indexOf(']', end);
}
