import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { createEphemeralScramVerifier } from './provision-local-restricted-logins';
const require = createRequire(import.meta.url);
const sasl = require('pg/lib/crypto/sasl');
const mac=(key:Buffer,message:string)=>crypto.createHmac('sha256',key).update(message).digest();
async function check(password:string, supplied:string) {
 const verifier=createEphemeralScramVerifier(password);
 const match=/^SCRAM-SHA-256\$4096:([^$]+)\$([^:]+):(.+)$/.exec(verifier)!;
 assert.ok(match); assert.ok(!verifier.includes(password));
 const session=sasl.startSession(['SCRAM-SHA-256']);
 const first=session.response.slice(3);
 const serverFirst=`r=${session.clientNonce}servernonce,s=${match[1]},i=4096`;
 await sasl.continueSession(session,supplied,serverFirst);
 const final=session.response.split(',p=');
 const auth=[first,serverFirst,final[0]].join(',');
 const stored=Buffer.from(match[2],'base64');
 const signature=mac(stored,auth), proof=Buffer.from(final[1],'base64');
 const recovered=Buffer.from(proof.map((x:number,i:number)=>x^signature[i]));
 const valid=crypto.timingSafeEqual(crypto.createHash('sha256').update(recovered).digest(),stored);
 if(password===supplied) {assert.ok(valid);sasl.finalizeSession(session,'v='+mac(Buffer.from(match[3],'base64'),auth).toString('base64'));}
 else {assert.equal(valid,false);assert.throws(()=>sasl.finalizeSession(session,'v='+mac(Buffer.from(match[3],'base64'),auth).toString('base64')));}
}
(async()=>{
 const password=crypto.randomBytes(24).toString('hex');
 await check(password,password);
 await check(password,crypto.randomBytes(24).toString('hex'));
 assert.notEqual(createEphemeralScramVerifier(password),createEphemeralScramVerifier(password));
 assert.throws(()=>createEphemeralScramVerifier('invalid'));
 console.log('PASS: pg SCRAM client/server proof roundtrip, wrong-password rejection, random salts, invalid input rejection. No database connections.');
})().catch(()=>{console.error('SCRAM_SOURCE_TEST_FAILED');process.exitCode=1;});
