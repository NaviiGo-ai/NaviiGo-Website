import fs from 'node:fs/promises';
import * as logic from './outreach_logic.mjs';
const output=new URL('./deliverables/',import.meta.url);
await fs.mkdir(output,{recursive:true});
const helpers=Object.values(logic).map(fn=>fn.toString()).join('\n\n');
let counter=0;
const node=(name,type,version,parameters,x=0,y=0,extra={})=>({name,type:'n8n-nodes-base.'+type,typeVersion:version,parameters,id:'naviigo-'+(++counter),position:[x,y],...extra});
const code=(name,js,x=0,y=0)=>node(name,'code',2,{mode:'runOnceForAllItems',jsCode:js},x,y);
const manual=()=>node('Run manually','manualTrigger',1,{},0,0);
const schedule=(expression)=>node('Scheduled run - enable after setup','scheduleTrigger',1.2,{rule:{interval:[{field:'cronExpression',expression}]}},0,200,{disabled:true});
const settings=()=>code('Campaign settings','return [{json:'+JSON.stringify({sender:'NaviiGo24@gmail.com',live:false,campaign_id:'pilot-free-2026-10',daily_limit:20})+'}];',240,0);
const profile=()=>node('Verify sender mailbox','httpRequest',4.2,{url:'https://gmail.googleapis.com/gmail/v1/users/me/profile',authentication:'predefinedCredentialType',nodeCredentialType:'gmailOAuth2',options:{}},480,0);
const check=()=>code('Check sender','if(String($input.first().json.emailAddress||"").toLowerCase()!=="naviigo24@gmail.com") throw new Error("Connect the NaviiGo24@gmail.com Gmail credential"); return $input.all();',720,0);
const sheetsBase={resource:'sheet',documentId:{__rl:true,value:'SET_GOOGLE_SHEET_ID',mode:'id'},sheetName:{__rl:true,value:'Outreach',mode:'name'}};
const read=()=>node('Read outreach rows','googleSheets',4.7,{...sheetsBase,operation:'read',options:{}},960,0);
function update(name,fields,x,y=0) {
 return node(name,'googleSheets',4.7,{...sheetsBase,operation:'update',columns:{mappingMode:'defineBelow',value:Object.fromEntries(fields.map(f=>[f,'={{ $json.'+f+' }}'])),matchingColumns:['business_id'],schema:fields.map(f=>({id:f,displayName:f,type:f==='opt_out'?'boolean':'string',required:false,defaultMatch:f==='business_id',canBeUsedToMatch:true}))},options:{cellFormat:'RAW'}},x,y);
}
const send=(name,to,subject,message,x,y=0)=>node(name,'gmail',2.1,{resource:'message',operation:'send',sendTo:to,subject,emailType:'text',message,options:{senderName:'Team NaviiGo',replyTo:'NaviiGo24@gmail.com',appendAttribution:false}},x,y);
function workflow(name,nodes,chains) {
 const connections={};
 for(const chain of chains) for(let i=0;i<chain.length-1;i++) connections[chain[i]]={main:[[{node:chain[i+1],type:'main',index:0}]]};
 return {name,nodes,connections,active:false,settings:{executionOrder:'v1',timezone:'Asia/Kolkata'},pinData:{},tags:[]};
}
const prepare=code('Prepare invite',helpers+'\nconst invite=prepareInvite($input.all().map(i=>i.json),$("Campaign settings").first().json); return invite?[{json:invite}]:[];',1200,0);
const live=code('Live sending gate','return $input.first().json.preview_only ? [] : $input.all();',1440,0);
const claim=update('Claim before send',['business_id','delivery_key','delivery_state','last_updated_at'],1680);
const gmail=send('Send pilot invitation','={{ $("Prepare invite").first().json.email }}','={{ $("Prepare invite").first().json.subject }}','={{ $("Prepare invite").first().json.body_text }}',1920);
// Never automatically retry Send. A failed/ambiguous send remains claimed for manual reconciliation.
const receipt=code('Record delivery receipt','const sent=$input.first().json; const invite=$("Prepare invite").first().json; if(!sent.id||!sent.threadId) throw new Error("Missing Gmail receipt; reconcile Sending row manually"); return [{json:{business_id:invite.business_id,delivery_key:invite.delivery_key,delivery_state:"Sent",sent_at:new Date().toISOString(),gmail_message_id:sent.id,gmail_thread_id:sent.threadId,reply_status:"No reply",last_updated_at:new Date().toISOString()}}];',2160);
const persisted=update('Save delivery receipt',['business_id','delivery_key','delivery_state','sent_at','gmail_message_id','gmail_thread_id','reply_status','last_updated_at'],2400);
const outbound=[manual(),schedule('0 */15 9-18 * * *'),settings(),profile(),check(),read(),prepare,live,claim,gmail,receipt,persisted];
const outboundChain=outbound.filter(n=>n.type!=='n8n-nodes-base.scheduleTrigger').map(n=>n.name);
const w1=workflow('NaviiGo 1 - Free pilot invitations',outbound,[outboundChain,[outbound[1].name,outbound[2].name]]);

const trigger=node('Business replies','gmailTrigger',1.4,{pollTimes:{item:[{mode:'everyMinute'}]},simple:true,maxResults:1,filters:{q:'subject:"NaviiGo pilot" -from:naviigo24@gmail.com -label:NaviiGoHandled',readStatus:'both',includeSpamTrash:false}},0,0);
const fetch=node('Fetch reply text','gmail',2.1,{resource:'message',operation:'get',messageId:'={{ $json.id }}',simple:false,options:{downloadAttachments:false}},240,0);
const rread=read();rread.position=[480,0];
const classify=code('Classify matched reply',helpers+`
const rows=$input.all().map(i=>i.json); validateRows(rows);
const message=$("Fetch reply text").first().json;
const matches=rows.filter(r=>r.gmail_thread_id && r.gmail_thread_id===message.threadId && String(r.email||'').trim().toLowerCase()===senderAddress(message));
if(matches.length!==1) return [];
const row=matches[0];
if(row.reply_message_id===message.id) return [{json:row}]; // Reconcile a previously saved reply whose label step failed.
const result=classifyReply(message,row); return result?[{json:result}]:[];`,720,0);
const replyFields=['business_id','reply_status','reply_message_id','reply_received_at','reply_summary','suggested_contact','opt_out','next_action','last_updated_at'];
const saveReply=update('Save reply findings',replyFields,960);
const handled=node('Mark reply handled','gmail',2.1,{resource:'message',operation:'addLabels',messageId:'={{ $("Fetch reply text").first().json.id }}',labelIds:['SET_NAVIIGO_HANDLED_LABEL_ID']},1200,0);
const replyNodes=[trigger,fetch,rread,classify,saveReply,handled];
const w2=workflow('NaviiGo 2 - Reply triage and contact findings',replyNodes,[replyNodes.map(n=>n.name)]);

const report=code('Build findings report',helpers+'\nreturn [{json:{...buildReport($input.all().map(i=>i.json)),preview_only:$("Campaign settings").first().json.live!==true}}];',1200);
const rGate=code('Live reporting gate','return $input.first().json.preview_only ? [] : $input.all();',1440);
const reportMail=send('Email internal report','NaviiGo24@gmail.com','={{ $json.subject }}','={{ $json.body_text }}',1680);
const reportNodes=[manual(),schedule('0 30 18 * * *'),settings(),profile(),check(),read(),report,rGate,reportMail];
const w3=workflow('NaviiGo 3 - Daily outreach findings report',reportNodes,[reportNodes.filter(n=>n.type!=='n8n-nodes-base.scheduleTrigger').map(n=>n.name),[reportNodes[1].name,reportNodes[2].name]]);

for(const [file,value] of [['1_send_pilot_invitations.json',w1],['2_classify_business_replies.json',w2],['3_daily_findings_report.json',w3]])
 await fs.writeFile(new URL(file,output),JSON.stringify(value,null,2));
const headers=['business_id','business_name','email','contact_source_url','email_verified','outreach_approved','opt_out','delivery_state','delivery_key','sent_at','gmail_message_id','gmail_thread_id','reply_status','reply_message_id','reply_received_at','reply_summary','suggested_contact','next_action','last_updated_at'];
await fs.writeFile(new URL('business_outreach_template.csv',output),'\ufeff'+headers.join(',')+'\r\n');
console.log(JSON.stringify({workflows:3,active:false,automatic_emails_sent:0,sender:'NaviiGo24@gmail.com',offer:'Free during pilot'}));
