import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import pg from 'pg';
import {createEphemeralScramVerifier} from './provision-local-restricted-logins';
const out='artifacts/uboq/g02-r3/h02-b-implementation',receipt=JSON.parse(fs.readFileSync(out+'/local-database.json','utf8'));
const config=JSON.parse(fs.readFileSync(path.join(receipt.runtime_directory,'connection.json'),'utf8'));
if(config.host!=='127.0.0.1'||config.port!==55483||config.database!==receipt.target_database||!/^oserp_h02b_local_[0-9a-f]+$/.test(config.database))throw Error('ISOLATED_DATABASE_REQUIRED');
const admin=new pg.Client(config),login='h02b_scram_'+crypto.randomBytes(6).toString('hex'),password=crypto.randomBytes(24).toString('hex');
(async()=>{await admin.connect();
 const identity=(await admin.query('SELECT current_database() db,host(inet_server_addr()) host,inet_server_port() port')).rows[0];
 assert.equal(identity.db,receipt.target_database);assert.equal(identity.host,'127.0.0.1');assert.equal(identity.port,55483);
 const verifier=createEphemeralScramVerifier(password);
 await admin.query('CREATE ROLE "'+login+'" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '+"'"+verifier+"'");
 await admin.query('GRANT CONNECT ON DATABASE "'+config.database+'" TO "'+login+'"');
 const valid=new pg.Client({...config,user:login,password});await valid.connect();assert.equal((await valid.query('SELECT current_user u')).rows[0].u,login);await valid.end();
 const invalid=new pg.Client({...config,user:login,password:crypto.randomBytes(24).toString('hex')});try{await assert.rejects(()=>invalid.connect(),(e:any)=>e.code==='28P01');}finally{await invalid.end();}
 await admin.query('ALTER ROLE "'+login+'" NOLOGIN PASSWORD NULL');
 const revoked=new pg.Client({...config,user:login,password});try{await assert.rejects(()=>revoked.connect());}finally{await revoked.end();}
 fs.writeFileSync(out+'/scram-runtime.json',JSON.stringify({status:'PASS_ACTUAL_TCP_SCRAM_GENERATOR_AND_REVOCATION',identity,synthetic_only:true,checks:['Existing createEphemeralScramVerifier used without modifying M02 source','Fresh restricted TCP login accepted','Wrong password rejected with SQLSTATE 28P01','NOLOGIN and password revocation reject fresh connection'],limits:'Generator and real login behavior verified; complete multi-role provisioner transaction/rollback is not exercised.'},null,2)+'\n');
 console.log('PASS: actual existing M02 SCRAM generator, TCP login, wrong-password denial and revocation');
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{await admin.query('ALTER ROLE "'+login+'" NOLOGIN PASSWORD NULL').catch(()=>{});await admin.end();});
