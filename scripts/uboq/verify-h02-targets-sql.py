"""Targeted offline contracts, evaluating the actual NULL predicates from SQL ASTs.

Uses pglast only. No database driver, engine, connection or SQL execution.
PASS means source/offline contract, never deployed ACL/RLS behavior.
"""
import argparse,hashlib,importlib.util,json,pathlib,re
import pglast
from pglast import ast
ROOT=pathlib.Path(__file__).resolve().parents[2]
SQL=ROOT/'prisma/migrations/20261111120000_uboq_g02_r3_evidence_legacy_cleanup/migration.sql'
def function_bodies(statements):
    result={}
    for raw in statements:
        if isinstance(raw.stmt,ast.CreateFunctionStmt):
            node=raw.stmt
            options={o.defname:o.arg for o in node.options}
            result[node.funcname[-1].sval]=options['as'][0].sval
    return result

def evaluate(node,env,periods):
    # Minimal PostgreSQL three-valued evaluator for these actual source ASTs.
    if isinstance(node,ast.A_Const):
        if node.isnull:return None
        value=node.val
        return value.sval if isinstance(value,ast.String) else value.boolval if isinstance(value,ast.Boolean) else value.ival
    if isinstance(node,ast.ColumnRef):
        fields=[f.sval for f in node.fields]
        return env[fields[0]] if len(fields)==1 else env[fields[0]][fields[1]]
    if isinstance(node,ast.NullTest):
        null=evaluate(node.arg,env,periods) is None
        return null if node.nulltesttype.name=='IS_NULL' else not null
    if isinstance(node,ast.BooleanTest):
        value=evaluate(node.arg,env,periods)
        if node.booltesttype.name=='IS_NOT_TRUE':return value is not True
        raise AssertionError(node.booltesttype)
    if isinstance(node,ast.BoolExpr):
        values=[evaluate(a,env,periods) for a in node.args]
        if node.boolop.name=='AND_EXPR':return False if False in values else None if None in values else True
        if node.boolop.name=='OR_EXPR':return True if True in values else None if None in values else False
        if node.boolop.name=='NOT_EXPR':return None if values[0] is None else not values[0]
    if isinstance(node,ast.A_Expr):
        assert node.name[0].sval=='='
        a,b=evaluate(node.lexpr,env,periods),evaluate(node.rexpr,env,periods)
        return None if a is None or b is None else a==b
    if isinstance(node,ast.CaseExpr):
        assert node.arg is None
        for case in node.args:
            if evaluate(case.expr,env,periods) is True:return evaluate(case.result,env,periods)
        return evaluate(node.defresult,env,periods)
    if isinstance(node,ast.SubLink):
        assert node.subLinkType.name=='EXPR_SUBLINK'
        query=node.subselect
        relation=query.fromClause[0]
        assert relation.relname=='PayrollPeriod'
        results=[]
        for row in periods:
            bound={**env,relation.alias.aliasname:row}
            if evaluate(query.whereClause,bound,periods) is True:results.append(evaluate(query.targetList[0].val,bound,periods))
        assert len(results)<=1
        return results[0] if results else None
    raise AssertionError('Unsupported source AST: '+type(node).__name__)

def contracts(source):
    statements=pglast.parse_sql(source)
    bodies=function_bodies(statements)
    policies={}
    grants={}
    for raw in statements:
        node=raw.stmt
        if isinstance(node,ast.CreatePolicyStmt):policies[(node.table.relname,node.policy_name)]=node
        if isinstance(node,ast.GrantStmt) and node.is_grant and node.objtype.name=='OBJECT_TABLE':
            roles={r.rolename for r in node.grantees}
            if not {'oserp_compat_app','oserp_legacy_app'}<=roles:continue
            for table in node.objects:
                grants.setdefault(table.relname,set()).update(p.priv_name.upper() for p in node.privileges)
    for table in ['SubcontractPackage','ProgramOfWorks','JobOrder']:
        assert {'SELECT','INSERT','UPDATE'}<=grants.get(table,set()),'Missing ordinary grant: '+table
        assert 'DELETE' not in grants[table], 'Ordinary A scope must not add DELETE'
        for op in ['select','insert','update','tenant']:assert (table,'g02_targets_'+op) in policies
    allowed=bodies['uboq_h02_ordinary_allowed']
    for part in ['uboq_verify_signed_rls_proof','uboq_verify_bound_actor_for_project',"p_project=NULLIF(current_setting('app.current_project_id',true),'')",'rp."canView"','rp."canCreate"','rp."canEditDraft"',"p_operation IN ('SELECT','INSERT','UPDATE')"]:assert part in allowed,part
    guard=bodies['uboq_h02_guard_ordinary_write']
    for name in ['H02_ORDINARY_REPARENT_DENIED','H02_ORDINARY_WORKFLOW_DENIED','H02_PAYROLL_WORKFLOW_DENIED','H02_PAID_PAYROLL_WRITE_DENIED','H02_PAYROLL_WORKER_SCOPE_DENIED','H02_PAYROLL_OWNERSHIP_REQUIRED']:assert name in guard
    for table in ['PayrollPeriod','Payroll','DailyTimeRecord']:
        assert {'SELECT','INSERT','UPDATE','DELETE'}<=grants.get(table,set())
        for name in ['g02_r3_payroll_read','g02_r3_payroll_delete','g02_r3_payroll_tenant','g02_targets_insert','g02_targets_update']:assert (table,name) in policies
        tenant=policies[(table,'g02_r3_payroll_tenant')]
        assert isinstance(tenant.with_check,ast.FuncCall),'No unconditional false/true write scope'
    periods=[{'id':'period-P1','projectId':'P1'},{'id':'company','projectId':None}]
    helper=pglast.parse_sql(bodies['uboq_h02_payroll_child_project'])[0].stmt.targetList[0].val
    examples=[(None,'period-P1','P1'),('P1','period-P1','P1'),('P2','period-P1',None),(None,'missing',None),('P1','company',None),(None,'company',None),('P1',None,'P1'),(None,None,None)]
    for child,parent,expected in examples:
        assert evaluate(helper,{'p_project':child,'p_period':parent},periods)==expected,(child,parent,expected)
    # Evaluate the policy's actual SQL predicate, including NULL, not a rewritten copy.
    text=re.search(r"EXECUTE '(CREATE POLICY g02_r3_ungoverned_item_delete (?:''|[^'])*)';",source).group(1).replace("''", "'")
    predicate=pglast.parse_sql(text)[0].stmt.qual
    c_results=[]
    for flag,expected in [(True,False),(False,True),(None,True)]:
        actual=evaluate(predicate,{'isUboqResourceGoverned':flag},[])
        assert actual is expected,('C predicate',flag,actual,expected)
        c_results.append({'flag':flag,'predicate_allows':actual})
    assert 'AND "isUboqResourceGoverned" IS NOT TRUE' in bodies['uboq_h02_project_mutation']
    assert 'app.current_user_global_admin' not in source
    return {'H02-A':{'status':'PASS','scope':'Source grants/RLS/guards and scoped delegate contracts only; SQL runtime not verified'},'H02-B':{'status':'BLOCKED','implemented':'Project-owned draft INSERT/UPDATE plus nullable-child inheritance from a real owning period; conflicting/missing/NULL-period ownership denied','blocker':'Company/global NULL-project periods lack an approved tenant ownership model; source still reads Worker and other payroll dependencies without an established restricted-role compatibility boundary. No global bypass introduced.','null_child_cases':len(examples)},'H02-C':{'status':'PASS','scope':'Actual SQL predicate AST evaluated offline; other authorization/dependency predicates still apply','truth_table':c_results}}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=pathlib.Path);args=parser.parse_args()
    source=SQL.read_text()
    spec=importlib.util.spec_from_file_location('migration17_static',ROOT/'scripts/uboq/verify-migration17-static.py')
    checker=importlib.util.module_from_spec(spec);spec.loader.exec_module(checker)
    static=checker.validate(source,(ROOT/'prisma/schema.prisma').read_text())
    result=contracts(source)
    for label,bad in [
        ('missing_A_grant',source.replace('GRANT SELECT,INSERT,UPDATE ON public."JobOrder" TO oserp_compat_app,oserp_legacy_app;','',1)),
        ('C_NULL_regression',source.replace('USING ("isUboqResourceGoverned" IS NOT TRUE)', 'USING (NOT "isUboqResourceGoverned")',1)),
    ]:
        assert bad!=source
        try:contracts(bad)
        except Exception:pass
        else:raise AssertionError('Negative fixture accepted: '+label)
    report={'targets':result,'static':static,'negative_fixtures_rejected':['missing_A_grant','C_NULL_regression'],'migration_sha256':hashlib.sha256(SQL.read_bytes()).hexdigest(),'limits':'Offline parsing, source contracts and actual SQL-expression AST fixture evaluation only. No database engine/connection or SQL execution; actual RLS/grant/type/trigger behavior and races remain unverified.'}
    if args.output:args.output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':main()
