// Pure business logic, shared by the exported n8n Code nodes and local checks.
export function yes(value) {
  return value === true || /^(true|yes|1)$/i.test(String(value||'').trim());
}
export function clean(value, limit=200) {
  return String(value||'').replace(/[\r\n\x00-\x1f]/g,' ').trim().slice(0,limit);
}
export function indiaDate(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return ['year','month','day'].map(t=>parts.find(p=>p.type===t).value).join('-');
}
export function validEmail(value) {
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(value)
    && !/@(?:example\.(?:com|org|net)|.+\.invalid|.+\.test)$/i.test(value);
}
export function validateRows(rows) {
  const ids=new Set();
  for(const row of rows) {
    const id=String(row.business_id||'');
    if(!/^[a-z0-9_-]{1,64}$/i.test(id)) throw new Error('Every row needs a stable business_id using letters, digits, underscore or hyphen');
    if(ids.has(id)) throw new Error('Duplicate business_id');
    ids.add(id);
  }
}
export function prepareInvite(rows, config, now=new Date()) {
  validateRows(rows);
  if(String(config.sender).toLowerCase()!=='naviigo24@gmail.com') throw new Error('Unexpected sender');
  const today=indiaDate(now);
  const count=rows.filter(r=>r.sent_at && indiaDate(new Date(r.sent_at))===today).length;
  if(count>=Math.min(Number(config.daily_limit)||20,50)) return null;
  // A previously attempted address is never automatically retried or emailed twice.
  const attempted=new Set(rows.filter(r=>r.delivery_key || r.sent_at || ['Sending','Sent'].includes(r.delivery_state))
    .map(r=>String(r.email||'').trim().toLowerCase()));
  const candidate=rows.find(r=>r.delivery_state==='Ready'
    && yes(r.email_verified) && yes(r.outreach_approved) && !yes(r.opt_out)
    && !r.delivery_key && !r.gmail_thread_id && !r.sent_at
    && (!r.reply_status || r.reply_status==='No reply')
    && validEmail(String(r.email||'').trim())
    && /^https:\/\//i.test(String(r.contact_source_url||''))
    && !attempted.has(String(r.email).trim().toLowerCase()));
  if(!candidate) return null;
  const business=clean(candidate.business_name,120);
  if(!business) throw new Error('Missing business name');
  const key=clean(config.campaign_id,60)+':'+candidate.business_id;
  return {business_id:candidate.business_id,email:String(candidate.email).trim(),
    delivery_key:key,preview_only:config.live!==true,
    subject:'NaviiGo pilot invitation | '+business+' ['+candidate.business_id+']',
    body_text:'Hello '+business+' team,\n\n'+
      'We are inviting businesses to join the NaviiGo pilot. NaviiGo helps travellers discover places and plan their trips.\n\n'+
      'Participation is free during this pilot; no upfront payment is required. Would you like us to share the onboarding details? We will confirm your business information with you before publishing a listing.\n\n'+
      'Please reply Yes, No, or share the right person for us to contact. If you would prefer no further outreach, reply Unsubscribe.\n\n'+
      'Thank you,\nTeam NaviiGo\nNaviiGo24@gmail.com',
    delivery_state:'Sending',last_updated_at:now.toISOString()};
}
export function senderAddress(message) {
  const from=message.from;
  if(from?.value?.[0]?.address) return String(from.value[0].address).toLowerCase();
  const text=typeof from==='string'?from:String(from?.text||message.From||'');
  return (text.match(/<([^<>]+)>/)?.[1]||text).trim().toLowerCase();
}
export function topReply(value) {
  return String(value||'').slice(0,20000)
    .split(/\nOn [^\n]{0,200}wrote:|\n[- ]*Original Message[- ]*|\nFrom:\s/i)[0]
    .split('\n').filter(line=>!/^\s*>/.test(line)).join('\n').trim().slice(0,5000);
}
export function classifyReply(message, row, now=new Date()) {
  // Match both sender and the actual Gmail thread; never match by subject alone.
  if(!message.id || !message.threadId || message.threadId!==row.gmail_thread_id
     || senderAddress(message)!==String(row.email||'').trim().toLowerCase()) return null;
  if(message.id===row.reply_message_id) return null;
  const received=new Date(message.date);
  if(!Number.isFinite(received.getTime())) return null;
  if(row.reply_received_at && received.getTime()<=new Date(row.reply_received_at).getTime()) return null;
  const text=topReply(message.text);
  const low=text.toLowerCase();
  let status='Needs review', next='Read the reply and respond manually';
  let optOut=yes(row.opt_out), contact='';
  const addresses=(text.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi)||[])
    .filter(a=>!['naviigo24@gmail.com',String(row.email).toLowerCase()].includes(a.toLowerCase()));
  const negative=/\b(not interested|no thanks|no thank you|not now|we decline|not looking|do not want|don't want)\b|^no[.!\s]*$/i.test(low);
  const positive=/\byes\b|\b(we are interested|we're interested|happy to join|we would like to join|we'd like to join|interested in joining)\b/i.test(low);
  if(/\b(unsubscribe|remove me|stop emailing|do not contact|don't contact|no more emails|remove us)\b/.test(low)) {
    status='Unsubscribe'; optOut=true; next='Suppress further outreach';
  } else if(optOut) {
    status='Unsubscribe'; next='Suppression retained; review manually before any change';
  } else if(/\b(out of (the )?office|away until|on leave|automatic reply|auto.reply)\b/.test(low+' '+String(message.subject||'').toLowerCase())) {
    status='Out of office'; next='Review the return date; no automatic resend';
  } else if(/\b(contact|reach|email|speak to|manager|owner)\b/.test(low) && addresses.length) {
    status='Contact'; contact=addresses.join(', '); next='Verify the suggested contact before creating a new outreach row';
  } else if(negative && positive) {
    status='Needs review'; next='Mixed intent; review manually';
  } else if(negative) {
    status='No'; optOut=true; next='Do not send further pilot invitations';
  } else if(/\?|\b(pricing|how much|more details|more information|send details|share details)\b/.test(low)) {
    status='Question'; next='Team member to answer the question';
  } else if(positive) {
    status='Yes'; next='Arrange onboarding and verify business details; listing still needs approval';
  }
  return {business_id:row.business_id,reply_status:status,reply_message_id:message.id,
    reply_received_at:received.toISOString(),reply_summary:clean(text,500),
    suggested_contact:contact,opt_out:optOut,next_action:next,last_updated_at:now.toISOString()};
}
export function buildReport(rows, now=new Date()) {
  validateRows(rows);
  const statuses=['Yes','No','Contact','Question','Needs review','Unsubscribe','Out of office'];
  const counts=Object.fromEntries(statuses.map(s=>[s,rows.filter(r=>r.reply_status===s).length]));
  const sent=rows.filter(r=>r.delivery_state==='Sent').length;
  const noReply=rows.filter(r=>r.delivery_state==='Sent' && (!r.reply_status || r.reply_status==='No reply')).length;
  const pending=rows.filter(r=>r.delivery_state==='Sending').length;
  const lines=['NaviiGo pilot outreach / '+indiaDate(now),'', 'Sent: '+sent,'Awaiting reply: '+noReply,
    ...Object.entries(counts).map(([k,v])=>k+': '+v), 'Unreconciled sends: '+pending,'',
    'Next actions:',...rows.filter(r=>r.next_action).slice(0,30).map(r=>clean(r.business_name,100)+' — '+clean(r.reply_status,30)+' — '+clean(r.next_action,180)),
    '', 'Reply labels are triage signals, not verified onboarding approval. No reply does not mean No.'];
  return {subject:'NaviiGo pilot outreach report / '+indiaDate(now),body_text:lines.join('\n'),counts,sent,no_reply:noReply,unreconciled:pending};
}
