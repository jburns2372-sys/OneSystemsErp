import pglast,pathlib,json,hashlib
from pglast import ast
root=pathlib.Path.cwd();results=[]
for name in ['20261112120000_h02b_verified_employer_payroll','20261112143000_h02b_dependency_and_history_guards','20261112160000_h02b_verified_period_child_ownership']:
 p=root/'prisma/migrations'/name/'migration.sql'; source=p.read_text();statements=pglast.parse_sql(source);functions=blocks=0
 for raw in statements:
  n=raw.stmt; text=source[raw.stmt_location:raw.stmt_location+raw.stmt_len] if raw.stmt_len else source[raw.stmt_location:]
  if isinstance(n,ast.CreateFunctionStmt):
   options={o.defname:o.arg for o in n.options};language=options['language'].sval;body=options['as'][0].sval
   if language=='sql':pglast.parse_sql(body)
   elif language=='plpgsql':pglast.parse_plpgsql(text)
   else:raise AssertionError(language)
   functions+=1
  elif isinstance(n,ast.DoStmt):pglast.parse_plpgsql(text);blocks+=1
 results.append({'migration':name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'outer_statements':len(statements),'parsed_functions':functions,'parsed_do_blocks':blocks,'result':'PASS'})
(root/'artifacts/uboq/g02-r3/h02-b-implementation/migration18-20-sql.json').write_text(json.dumps({'status':'PASS_SQL_AND_FUNCTION_PARSE','migrations':results,'limits':'Parser validation only; actual migration/authorization results recorded separately.'},indent=2)+'\n')
print('PASS: migration 18/20 SQL, SQL functions, PL/pgSQL functions and DO blocks parsed')
