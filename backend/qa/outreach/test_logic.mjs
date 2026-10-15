import assert from 'node:assert/strict';
import {prepareInvite,classifyReply,buildReport} from './outreach_logic.mjs';
const now=new Date('2026-10-16T04:00:00Z');
const config={sender:'NaviiGo24@gmail.com',live:false,campaign_id:'pilot-free-2026',daily_limit:20};
const row={business_id:'venue-001',business_name:'Test Venue',email:'hello@unit-fixture.in',contact_source_url:'https://unit-fixture.in/contact',email_verified:true,outreach_approved:true,opt_out:false,delivery_state:'Ready'};
let checks=0;
function check(fn) {fn();checks++;}
check(()=>assert.equal(prepareInvite([row],config,now).preview_only,true));
check(()=>assert.equal(prepareInvite([row],{...config,live:true},now).preview_only,false));
check(()=>assert.match(prepareInvite([row],config,now).body_text,/free during this pilot/));
for(const patch of [{email_verified:false},{outreach_approved:false},{opt_out:true},{delivery_state:'Sending'},{sent_at:'2026-10-15'},{delivery_key:'attempted'},{email:'a@example.com'},{email:'a@fixture.in\r\nBcc:b@fixture.in'},{reply_status:'No'}])
  check(()=>assert.equal(prepareInvite([{...row,...patch}],config,now),null));
check(()=>assert.throws(()=>prepareInvite([row,row],config,now),/Duplicate/));
check(()=>assert.equal(prepareInvite([{...row,business_id:'old',delivery_state:'Sent',sent_at:now.toISOString()},row],config,now),null));
const sent={...row,gmail_thread_id:'thread1'};
const message={id:'reply1',threadId:'thread1',from:{value:[{address:row.email}]},date:now.toISOString()};
for(const [text,status] of [['Yes, we are interested.','Yes'],['No thanks.','No'],['Please unsubscribe us.','Unsubscribe'],['Please contact our manager at owner@fixture.in','Contact'],['Can you share more details?','Question'],['Automatic reply: out of office until Monday','Out of office'],['Thanks for reaching out','Needs review'],['Not interested, but yes perhaps later','Needs review'],['Thank you\n\nOn Friday NaviiGo wrote:\nPlease reply Yes, No, or share the right contact.','Needs review']])
  check(()=>assert.equal(classifyReply({...message,text},sent,now).reply_status,status));
check(()=>assert.equal(classifyReply({...message,threadId:'unrelated',text:'Yes'},sent,now),null));
check(()=>assert.equal(classifyReply({...message,from:'stranger@fixture.in',text:'Yes'},sent,now),null));
check(()=>assert.equal(classifyReply({...message,text:'Yes'},{...sent,reply_message_id:'reply1'},now),null));
check(()=>assert.equal(classifyReply({...message,text:'Yes'},{...sent,opt_out:true},now).reply_status,'Unsubscribe'));
check(()=>assert.equal(classifyReply({...message,text:'Yes'},{...sent,reply_received_at:'2026-10-17T00:00:00Z'},now),null));
check(()=>assert.equal(buildReport([{...row,delivery_state:'Sent',reply_status:'No reply'}],now).no_reply,1));
console.log(JSON.stringify({checks,passed:true,emails_sent:0}));
