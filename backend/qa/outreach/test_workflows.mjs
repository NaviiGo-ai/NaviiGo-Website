import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('./deliverables/',import.meta.url);
let count=0;
for(const file of ['1_send_pilot_invitations.json','2_classify_business_replies.json','3_daily_findings_report.json']) {
 const w=JSON.parse(await fs.readFile(new URL(file,root),'utf8'));
 assert.equal(w.active,false);
 const names=new Set(w.nodes.map(n=>n.name));assert.equal(names.size,w.nodes.length);
 for(const [name,c] of Object.entries(w.connections)) {
   assert(names.has(name));
   for(const branch of c.main) for(const edge of branch) assert(names.has(edge.node));
 }
 for(const n of w.nodes.filter(n=>n.type==='n8n-nodes-base.code')) {new vm.Script('(function(){'+n.parameters.jsCode+'})()');count++;}
 for(const n of w.nodes.filter(n=>n.type==='n8n-nodes-base.googleSheets' && n.parameters.operation==='update')) {
   assert.deepEqual(n.parameters.columns.matchingColumns,['business_id']);
   assert.equal(n.parameters.options.cellFormat,'RAW');
 }
 const send=w.nodes.filter(n=>n.type==='n8n-nodes-base.gmail' && n.parameters.operation==='send');
 for(const n of send) assert(!n.retryOnFail && !n.continueOnFail);
}
const w=JSON.parse(await fs.readFile(new URL('1_send_pilot_invitations.json',root),'utf8'));
const gate=w.nodes.find(n=>n.name==='Live sending gate').parameters.jsCode;
const input={json:{preview_only:true}};
assert.equal(vm.runInNewContext('(function(){'+gate+'})()',{$input:{first:()=>input,all:()=>[input]}}).length,0);
console.log(JSON.stringify({code_nodes_compiled:count,connections_valid:true,dry_run_gate_passed:true,external_calls:0,n8n_account_tested:false}));
