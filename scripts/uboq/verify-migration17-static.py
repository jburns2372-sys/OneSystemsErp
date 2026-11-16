"""Offline migration-17 checks. Requires temporary pglast on PYTHONPATH; no DB API.

Validates PostgreSQL DDL, every SQL and PL/pgSQL body, generated policy DDL,
function identities, owners, EXECUTE allowlists, and schema object names.
Catalog resolution, effective ACLs/RLS and execution behavior remain runtime gates.
"""
import argparse, collections, hashlib, json, pathlib, re
import pglast
from pglast import ast

ROOT = pathlib.Path(__file__).resolve().parents[2]
MIGRATION = ROOT / 'prisma/migrations/20261111120000_uboq_g02_r3_evidence_legacy_cleanup/migration.sql'

def validate(source, schema):
    statements = pglast.parse_sql(source)
    functions, definitions, blocks, triggers = {}, [], 0, []
    for raw in statements:
        node = raw.stmt
        text = source[raw.stmt_location:raw.stmt_location + raw.stmt_len] if raw.stmt_len else source[raw.stmt_location:]
        if isinstance(node, ast.CreateFunctionStmt):
            name = '.'.join(x.sval for x in node.funcname)
            assert name.startswith('public.'), name
            signature = name + '(' + ','.join(p.argType.names[-1].sval for p in (node.parameters or ())) + ')'
            assert signature not in functions, 'Duplicate function: ' + signature
            options = {o.defname: o.arg for o in node.options}
            body, language = options['as'][0].sval, options['language'].sval
            assert re.search(r'AS\s+\$\$', text), 'Missing function dollar quote: ' + name
            assert re.search(r'SECURITY DEFINER\s+SET search_path\s*=\s*pg_catalog,\s*public,\s*pg_temp', text), 'Unsafe definer path: ' + name
            if language == 'sql':
                pglast.parse_sql(body)
            else:
                assert language == 'plpgsql', language
                pglast.parse_plpgsql(text)
            functions[signature] = {'language': language, 'body': body}
            definitions.append({'function': signature, 'body_parse': 'PASS'})
        elif isinstance(node, ast.DoStmt):
            pglast.parse_plpgsql(text)
            blocks += 1
        elif isinstance(node, ast.CreateTrigStmt):
            fn = '.'.join(x.sval for x in node.funcname)
            triggers.append((node.trigname, node.relation.relname, fn))
    assert len(functions) == 18, 'Unexpected function inventory'
    assert blocks == 1
    assert len(triggers) == 14
    for signature in functions:
        sig = re.escape(signature).replace(',', r',\s*')
        assert re.search(r'ALTER FUNCTION\s+' + sig + r'\s+OWNER TO oserp_migrations_owner;', source), 'Owner missing: ' + signature
        assert re.search(r'REVOKE ALL ON FUNCTION\s+' + sig + r'\s+FROM PUBLIC(?:, [\w, ]+)?;', source), 'PUBLIC revoke missing: ' + signature
    runtime = {'oserp_compat_app', 'oserp_legacy_app'}
    allowlist = {
        'public.uboq_build_synthetic_cleanup_manifest(text)': {'oserp_maint_cleanup_role'},
        'public.uboq_execute_verified_synthetic_cleanup(text,text)': {'oserp_maint_cleanup_role'},
        'public.uboq_authorized_legacy_delete(text)': runtime,
        'public.uboq_resolve_payroll_period_project(text)': runtime,
        'public.uboq_payroll_operation_allowed(text,text)': runtime,
        'public.uboq_h02_record_project(text,text)': runtime,
        'public.uboq_h02_ordinary_allowed(text,text,text)': runtime,
        'public.uboq_h02_package_write_allowed(text,text)': runtime,
        'public.uboq_h02_payroll_child_project(text,text)': runtime,
        'public.uboq_h02_project_mutation(text,text,jsonb)': runtime,
    }
    grants = {}
    for name, args, roles in re.findall(r'GRANT EXECUTE ON FUNCTION\s+(public\.\w+)\(([^)]*)\)\s+TO ([\w, ]+);', source):
        signature = name + '(' + re.sub(r'\s+', '', args) + ')'
        assert signature not in grants
        grants[signature] = {r.strip() for r in roles.split(',')}
    assert grants == allowlist, 'Unexpected EXECUTE grant set'
    function_names = {s.split('(')[0] for s in functions}
    models = {name: set(re.findall(r'^\s{2}(\w+)\s+\S+', body, re.M)) for name, body in re.findall(r'^model (\w+)\s*\{(.*?)^\}', schema, re.M | re.S)}
    for name, table, fn in triggers:
        assert table in models, 'Unknown trigger relation: ' + table
        assert fn in function_names, 'Unknown trigger function: ' + fn
    # Check every quoted application identifier against the reviewed Prisma model.
    # This is a name inventory, not per-query catalog/type resolution.
    known_identifiers = set(models) | set().union(*models.values())
    unknown = set(re.findall(r'"([A-Za-z_][A-Za-z_0-9]*)"', source)) - known_identifiers
    assert not unknown, 'Unknown quoted schema identifiers: ' + repr(sorted(unknown))
    # Expand every migration-generated policy DDL template for its actual targets.
    legacy = source[source.index('-- H02: Restore DELETE'):source.index('-- H02 continuation:')]
    scope_values = legacy[legacy.index('FOR r IN SELECT'):legacy.index(') scope(tbl,expr)')]
    scope = re.findall(r"\('([A-Za-z]+)','((?:''|[^'])*)'\)", scope_values)
    assert len(scope) == 10
    generated = []
    for table, expr in scope:
        for template, args in re.findall(r"EXECUTE format\('((?:''|[^'])*)',(r\.tbl(?:,r\.expr)*)\);", legacy):
            if 'unposted_parent_delete' in template and table not in {'VariationOrderItem', 'VariationOrderDocument', 'VariationOrderApproval'}:
                continue
            if 'g02_r3_unposted_delete' in template and table not in {'VariationOrder', 'ProcurementBenchmarkItem'}:
                continue
            ddl = template.replace("''", "'").replace('%I', '"' + table + '"').replace('%s', expr.replace("''", "'"))
            pglast.parse_sql(ddl)
            generated.append(ddl)
    # Runtime #17 regression: bind each policy to its actual table column.
    assert 'currentStatus' in models['VariationOrder'] and 'status' not in models['VariationOrder']
    assert 'upper(vo."currentStatus")' in legacy and 'upper(vo.status)' not in legacy
    special = re.search(r"EXECUTE format\('((?:''|[^'])*)',r\.tbl,CASE WHEN r\.tbl='VariationOrder' THEN '[^']+' ELSE 'status' END\);", legacy)
    assert special, 'Missing table-specific status binding'
    for table, column in [('VariationOrder', '"currentStatus"'), ('ProcurementBenchmarkItem', 'status')]:
        assert column.strip('"') in models[table]
        ddl = special.group(1).replace("''", "'").replace('%I', '"' + table + '"').replace('%s', column)
        pglast.parse_sql(ddl)
        generated.append(ddl)
    for literal in re.findall(r"EXECUTE '((?:''|[^'])*)';", legacy):
        ddl = literal.replace("''", "'")
        pglast.parse_sql(ddl)
        generated.append(ddl)
    assert len(generated) == 66, 'Unexpected generated DDL coverage: ' + str(len(generated))
    policies = set()
    for ddl in generated:
        for raw in pglast.parse_sql(ddl):
            if isinstance(raw.stmt, ast.CreatePolicyStmt):
                key = (raw.stmt.table.relname, raw.stmt.policy_name)
                assert key not in policies, 'Duplicate generated policy: ' + repr(key)
                policies.add(key)
    for raw in statements:
        if isinstance(raw.stmt, ast.CreatePolicyStmt):
            key = (raw.stmt.table.relname, raw.stmt.policy_name)
            assert key not in policies, 'Duplicate policy: ' + repr(key)
            policies.add(key)
    auth = functions['public.uboq_h02_project_authorized(text,text,text)']['body']
    assert 'SELECT COALESCE(' in auth and 'canDeleteDraft' not in auth
    for fn in ['uboq_verify_signed_rls_proof', 'uboq_verify_bound_actor_for_project']:
        assert 'public.' + fn + '(' in auth
    mutator = functions['public.uboq_h02_project_mutation(text,text,jsonb)']['body']
    assert re.search(r'IF public\.uboq_h02_project_authorized\([^\n]+\) IS NOT TRUE THEN', mutator), 'Nullable RPC authorization gate'
    assert 'app.current_user_global_admin' not in source and 'app.current_user_role' not in source
    return {'status': 'PASS_STATIC_ONLY', 'parser': pglast.__version__, 'outer_statements': len(statements), 'functions': definitions, 'procedural_blocks': blocks, 'triggers': triggers, 'generated_ddl_statements': len(generated), 'total_policies_including_generated': len(policies), 'execute_grants': {s: sorted(v) for s, v in grants.items()}, 'limits': 'Offline PostgreSQL grammar and source-definition checks only. No SQL execution, DB connection, catalog/type binding, effective ACL/RLS, role inheritance, trigger behavior, migration applicability or concurrency proof.'}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=pathlib.Path)
    args = parser.parse_args()
    source, schema = MIGRATION.read_text(), (ROOT / 'prisma/schema.prisma').read_text()
    result = validate(source, schema)
    # Prove these checks reject the reviewed failure modes without executing SQL.
    negatives = {
        'variation_status_regression': source.replace('upper(vo."currentStatus")', 'upper(vo.status)', 1),
        'broken_dollar_quote': source.replace('AS $$', 'AS $', 1),
        'unsafe_public_execute': source + '\nGRANT EXECUTE ON FUNCTION public.uboq_h02_project_mutation(text,text,jsonb) TO PUBLIC;\n',
        'nullable_authorization': source.replace("END,'DELETE') IS NOT TRUE THEN", "END,'DELETE') THEN", 1),
    }
    for name, broken in negatives.items():
        assert broken != source
        try:
            validate(broken, schema)
        except Exception:
            pass
        else:
            raise AssertionError('Negative fixture accepted: ' + name)
    result['negative_fixtures_rejected'] = list(negatives)
    result['migration_sha256'] = hashlib.sha256(MIGRATION.read_bytes()).hexdigest()
    if args.output:
        args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
