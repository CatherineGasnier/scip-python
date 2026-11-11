import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';

import { scip } from './scip';

const fixture = `def used():
    return 1

def unused(value=used()):
    return 0

def multiline(
    value=used()
):
    return 0

class Container:
    def method(self):
        def inner():
            return used()
        return inner

@used()
def decorated():
    return 0
def signatures(a, /, b, *args, c, **kw):
    return a, b, args, c, kw

def keyword_only(a, *, b):
    return a, b
`;

describe('real producer declaration metadata', () => {
    let root: string;
    let doc: scip.Document;

    beforeAll(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'scip-python-metadata-'));
        fs.writeFileSync(path.join(root, 'main.py'), fixture);
        fs.writeFileSync(path.join(root, 'environment.json'), '[]');
        execFileSync(
            process.execPath,
            [
                path.resolve(__dirname, '..', 'index.js'),
                'index',
                '--project-version',
                '0',
                '--environment',
                path.join(root, 'environment.json'),
            ],
            { cwd: root, timeout: 120000 }
        );
        const index = scip.Index.deserializeBinary(fs.readFileSync(path.join(root, 'index.scip')));
        assert.strictEqual(index.documents.length, 1);
        doc = index.documents[0];
        assert.strictEqual(doc.relative_path, 'main.py');
        assert.strictEqual(fs.readFileSync(path.join(root, 'main.py'), 'utf8'), fixture);
    }, 120000);

    afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

    function symbol(suffix: string): scip.SymbolInformation {
        const info = doc.symbols.find((s) => s.symbol.endsWith(suffix));
        assert.ok(info, suffix);
        return info;
    }

    function definition(info: scip.SymbolInformation): scip.Occurrence {
        const occurrence = doc.occurrences.find(
            (o) => o.symbol === info.symbol && (o.symbol_roles & scip.SymbolRole.Definition) !== 0
        );
        assert.ok(occurrence, info.symbol);
        return occurrence;
    }

    test('emits authoritative module, function, method, class and parameter kinds', () => {
        assert.strictEqual(symbol('main/__init__:').kind, scip.SymbolInformation.Kind.Module);
        assert.strictEqual(symbol('main/unused().').kind, scip.SymbolInformation.Kind.Function);
        assert.strictEqual(symbol('main/Container#').kind, scip.SymbolInformation.Kind.Class);
        assert.strictEqual(symbol('main/Container#method().').kind, scip.SymbolInformation.Kind.Method);
        const inner = doc.symbols.find((s) => s.symbol.endsWith('inner().'));
        assert.ok(inner);
        assert.strictEqual(inner.kind, scip.SymbolInformation.Kind.Function);
        assert.strictEqual(symbol('main/unused().(value)').kind, scip.SymbolInformation.Kind.Parameter);
    });

    test('retains complete parameter defaults as lexical extents', () => {
        assert.deepStrictEqual(definition(symbol('main/unused().(value)')).enclosing_range, [3, 11, 23]);
        assert.deepStrictEqual(definition(symbol('main/multiline().(value)')).enclosing_range, [7, 4, 16]);
        const defaultReferences = doc.occurrences.filter(
            (o) =>
                o.symbol === symbol('main/used().').symbol &&
                (o.symbol_roles & scip.SymbolRole.Definition) === 0 &&
                (o.range[0] === 3 || o.range[0] === 7)
        );
        assert.strictEqual(defaultReferences.length, 2);
    });

    test('only named parameter declarations receive symbol metadata', () => {
        const signatureParameters = doc.symbols.filter((s) => s.symbol.includes('main/signatures().('));
        assert.strictEqual(signatureParameters.length, 5);
        assert.ok(signatureParameters.every((s) => s.kind === scip.SymbolInformation.Kind.Parameter));
        const keywordParameters = doc.symbols.filter((s) => s.symbol.includes('main/keyword_only().('));
        assert.strictEqual(keywordParameters.length, 2);
        assert.ok(keywordParameters.every((s) => s.kind === scip.SymbolInformation.Kind.Parameter));
        assert.ok(doc.symbols.every((s) => !s.symbol.startsWith('local ')));
    });

    test('does not narrow decorated definition to deferred body', () => {
        const occurrence = definition(symbol('main/decorated().'));
        assert.strictEqual(occurrence.enclosing_range[0], 17);
        assert.strictEqual(occurrence.range[0], 18);
        assert.ok(occurrence.enclosing_range[2] >= 19);
        assert.strictEqual(symbol('main/decorated().').enclosing_symbol, '');
    });
});
