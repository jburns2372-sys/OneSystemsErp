const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),pg=require('pg');
const ROOT=process.cwd(),OUT='artifacts/uboq/g02-r3/bounded-blocker-correction';
fs.mkdirSync(OUT,{recursive:true});
const receipt=JSON.parse(fs.readFileSync('artifacts/uboq/g02-r3/h02-b-implementation/local-database.json'));
const config=JSON.parse(fs.readFileSync(path.join(receipt.runtime_directory,'connection.json')));
assert.equal(config.host,'127.0.0.1');assert.equal(config.port,55483);assert.equal(config.database,receipt.target_database);
assert.match(config.database,/^oserp_h02b_local_[0-9a-f]+$/);
const f=JSON.parse(fs.readFileSync(path.join(receipt.runtime_directory,'fixture-config.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function connect(extra={}){const c=new pg.Client({...config,...extra});await c.connect();await c.query("SET statement_timeout='15s'; SET lock_timeout='3s'");return c;}
async function identity(c){const r=(await c.query("SELECT current_database() db,host(inet_server_addr()) host,inet_server_port() port,current_setting('data_directory',true) data_directory")).rows[0];assert.equal(r.db,config.database);assert.equal(r.host,'127.0.0.1');assert.equal(r.port,55483);assert.equal(r.data_directory.replaceAll('\\','/').toLowerCase(),(receipt.runtime_directory+'/data').replaceAll('\\','/').toLowerCase());return r;}
async function project(c,p,user=f.ids.a,sv=7){const issued=String(Math.floor(Date.now()/1000)),nonce=crypto.randomBytes(12).toString('hex');const proof=issued+'.'+nonce+'.'+hash(f.signing+'|UBOQ_RLS_V1|'+p+'|'+user+'|'+sv+'|'+issued+'|'+nonce);
await c.query("SELECT set_config('app.enforce_project_rls','on',true),set_config('app.current_project_id',$1,true),set_config('app.current_user_id',$2,true),set_config('app.current_session_version',$3,true),set_config('app.current_rls_proof',$4,true)",[p,user,String(sv),proof]);}
async function transaction(c,fn){await c.query('BEGIN');try{const r=await fn(c);await c.query('COMMIT');return r;}catch(e){await c.query('ROLLBACK');throw e;}}
async function blocked(admin,pid){for(let i=0;i<30;i++){if((await admin.query('SELECT cardinality(pg_blocking_pids($1)) n',[pid])).rows[0].n>0)return true;await new Promise(r=>setTimeout(r,30));}return false;}
function suite(name){const report={suite:name,created_at:new Date().toISOString(),database:{db:config.database,host:config.host,port:config.port},synthetic_only:true,checks:[]};const file=OUT+'/'+name+'.json';if(fs.existsSync(file))throw Error('Evidence already exists; preserve and choose an explicit new run before retry');
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');return {report,save,check:async(name,fn)=>{const start=Date.now();try{const detail=await fn();report.checks.push({name,result:'PASS',milliseconds:Date.now()-start,...(detail?{detail}: {})});console.log('PASS '+name);}catch(e){report.checks.push({name,result:'FAIL',sqlstate:e.code||null,error:e.message,milliseconds:Date.now()-start});console.log('FAIL '+name+': '+e.message);}save();},finish:()=>{report.status=report.checks.some(x=>x.result==='FAIL')?'FAIL':'PASS';save();}};}
module.exports={fs,path,crypto,assert,pg,ROOT,OUT,receipt,config,f,hash,connect,identity,project,transaction,blocked,suite};
