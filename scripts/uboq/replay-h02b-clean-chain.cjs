const fs=require('fs'),path=require('path'),crypto=require('crypto'),pg=require('pg');
(async()=>{
 const file='artifacts/uboq/g02-r3/h02-b-implementation/local-database.json';
 const previous=JSON.parse(fs.readFileSync(file)),config=JSON.parse(fs.readFileSync(path.join(previous.runtime_directory,'connection.json')));
 if(config.host!=='127.0.0.1'||config.port!==55483||config.database!==previous.target_database||!/^oserp_h02b_local_[0-9a-f]+$/.test(config.database))throw Error('ISOLATED_IDENTITY_REQUIRED');
 const c=new pg.Client({...config,database:'postgres'});await c.connect();
 try {
  const identity=(await c.query("SELECT current_database() database,host(inet_server_addr()) host,inet_server_port() port,current_setting('data_directory') data_directory")).rows[0];
  if(identity.database!=='postgres'||identity.host!=='127.0.0.1'||identity.port!==55483||path.resolve(identity.data_directory).toLowerCase()!==path.resolve(previous.identity.data_directory).toLowerCase())throw Error('PRIVATE_CLUSTER_MISMATCH');
  const names=(await c.query('SELECT datname FROM pg_database ORDER BY datname')).rows.map(x=>x.datname);
  if(names.some(x=>!['postgres','template0','template1'].includes(x)&&!/^oserp_h02b_local_[0-9a-f]+$/.test(x)))throw Error('UNEXPECTED_DATABASE_ON_PRIVATE_CLUSTER');
  const database='oserp_h02b_local_'+crypto.randomBytes(5).toString('hex');
  if(names.includes(database)||(await c.query('SELECT 1 FROM pg_database WHERE datname=$1',[database])).rowCount)throw Error('TARGET_ALREADY_EXISTS');
  fs.copyFileSync(file,file.replace('.json','-before-clean-'+Date.now()+'.json'));
  await c.query('CREATE DATABASE "'+database+'"');
  fs.writeFileSync(path.join(previous.runtime_directory,'connection-'+previous.target_database+'.json'),JSON.stringify(config));
  fs.writeFileSync(path.join(previous.runtime_directory,'connection.json'),JSON.stringify({...config,database}));
  fs.writeFileSync(file,JSON.stringify({status:'CREATED_FRESH_DISPOSABLE_FOR_FINAL_CHAIN',identity,pre_creation_database_names:names,target_database:database,target_did_not_exist:true,private_cluster:true,protected_databases_excluded:['testdb','testdb_uboq_001','production','other project databases'],runtime_directory:previous.runtime_directory,created_at:new Date().toISOString(),previous_database_preserved:previous.target_database,migrations:[]},null,2)+'\n');
  console.log('Created verified isolated fresh target '+database+'; prior database and evidence preserved');
 }finally{await c.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
