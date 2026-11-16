import assert from 'node:assert/strict';
import { resolveExtractionCandidateHumanReview } from '../../src/lib/uboq/adapters/snapshot-orchestrator';
let writes=0;
function db(role='SUPER_ADMIN', project='P', approved=1) {return {
 user:{findUnique:async()=>({id:'U',role,status:'ACTIVE',lockedUntil:null})},
 project:{findUnique:async()=>({id:'P',managerId:'U'})},
 systemRole:{findUnique:async()=>null},
 uboqExtractionCandidate:{findUnique:async()=>({id:'C',sourceDocumentId:'D',sourceDocument:{projectId:project}, parsedJson:{mappedFields:{work_description:'Concrete',unit:'m3',approved_qty:10,contract_unit_rate:20}}}),update:async(args:any)=>{writes++;return args.data;}},
 uboqOperationalSnapshot:{count:async()=>approved},
};}
const params={projectId:'P',candidateId:'C',reviewerUserId:'U',decision:'HUMAN_VERIFIED' as const,reviewNotes:'correction'};
(async()=>{
 await assert.rejects(()=>resolveExtractionCandidateHumanReview(db() as never,params),/APPROVED_EVIDENCE_IMMUTABLE/);
 await assert.rejects(()=>resolveExtractionCandidateHumanReview(db('SUPER_ADMIN','OTHER') as never,params),/CANDIDATE_NOT_FOUND_FOR_PROJECT/);
 await assert.rejects(()=>resolveExtractionCandidateHumanReview(db('GUEST') as never,params),/RBAC_FORBIDDEN/);
 assert.equal(writes,0);
 const result = await resolveExtractionCandidateHumanReview(db('SUPER_ADMIN','P',0) as never,{...params,correctedMappedFields:{approved_qty:12}});
 assert.equal((result.parsedJson as any).mappedFields.approved_qty,10);
 assert.equal((result.parsedJson as any).effectiveCanonicalFields.approved_qty,12);
 assert.equal(writes,1);
 console.log('PASS: application rejects approved evidence review, cross-project candidate and unauthorized reviewer before writes; unapproved review preserves raw fields while correcting effective values. Database trigger/concurrency verification remains pending.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
