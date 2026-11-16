
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process'),net=require('node:net'),pg=require('pg');
(async()=>{
 const out='artifacts/uboq/g02-r3/h02-b-implementation',evidenceFile=out+'/local-database.json';
 if(fs.existsSync(evidenceFile))throw Error('Database evidence exists; refusing recreation');
 const port=55483;
 await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',reject);server.listen(port,'127.0.0.1',()=>server.close(resolve));});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oserp-h02b-isolated-')),data=path.join(dir,'data'),admin='h02b_cluster_admin',password=crypto.randomBytes(32).toString('hex');
 const pwfile=path.join(dir,'bootstrap-password');fs.writeFileSync(pwfile,password+'\n',{mode:0o600});
 const run=(exe,args)=>{const r=cp.spawnSync('C:/Program Files/PostgreSQL/18/bin/'+exe,args,{encoding:'utf8',windowsHide:true,stdio:exe==='pg_ctl.exe'?'ignore':'pipe',timeout:45000});if(r.status!==0)throw Error(exe+': '+r.stderr+' '+r.stdout);return r.stdout;};
 run('initdb.exe',['-D',data,'-U',admin,'--pwfile='+pwfile,'--auth-host=scram-sha-256','--auth-local=trust','--encoding=UTF8','--no-locale']);
 fs.unlinkSync(pwfile);
 run('pg_ctl.exe',['-D',data,'-l',path.join(dir,'postgres.log'),'-o','-h 127.0.0.1 -p '+port,'-w','-t','30','start']);
 const config={host:'127.0.0.1',port,user:admin,password,database:'postgres'},c=new pg.Client(config);await c.connect();
 try{
  const identity=(await c.query("SELECT current_database() AS database,host(inet_server_addr()) AS host,inet_server_port() AS port,current_setting('data_directory') AS data_directory,version() AS version")).rows[0];
  if(identity.database!=='postgres'||identity.host!=='127.0.0.1'||identity.port!==port||path.resolve(identity.data_directory).toLowerCase()!==path.resolve(data).toLowerCase())throw Error('Isolated server identity mismatch');
  const names=(await c.query('SELECT datname FROM pg_database ORDER BY datname')).rows.map(r=>r.datname);
  if(names.some(n=>!['postgres','template0','template1'].includes(n)))throw Error('Unexpected database on fresh private cluster');
  const database='oserp_h02b_local_'+crypto.randomBytes(5).toString('hex');
  if((await c.query('SELECT 1 FROM pg_database WHERE datname=$1',[database])).rowCount)throw Error('Target already exists');
  await c.query('CREATE DATABASE "'+database+'"');
  const runtime={...config,database};fs.writeFileSync(path.join(dir,'connection.json'),JSON.stringify(runtime),{mode:0o600});
  const receipt={status:'CREATED_DEDICATED_LOCAL_DISPOSABLE',identity,pre_creation_database_names:names,target_database:database,target_did_not_exist:true,protected_databases_excluded:['testdb','testdb_uboq_001','all production and other-project databases'],private_cluster:true,port,runtime_directory:dir,credentials:'Random isolated bootstrap credential stored only outside worktree; not in evidence',created_at:new Date().toISOString(),migrations:[]};
  fs.writeFileSync(evidenceFile,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({status:receipt.status,host:identity.host,port,database,private_cluster:true,protected_connections:0}));
 }finally{await c.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
