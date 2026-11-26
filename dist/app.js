const $ = id => document.getElementById(id);
const paths = {
  layers:'<path d="m3 8 9-5 9 5-9 5-9-5Zm0 4 9 5 9-5M3 16l9 5 9-5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 11h18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', edit:'<path d="m14 6 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15v5Z"/>',
  wallet:'<path d="M19 8V5a1 1 0 0 0-1-1L5 7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2H5"/><path d="M21 13h-5v4h5"/>',
  bolt:'<path d="m14 2-10 12h7l-1 8 10-13h-7l1-7Z"/>',wifi:'<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0"/><circle cx="12" cy="20" r="1" />',
  home:'<path d="m2 11 10-8 10 8M5 10v11h14V10M10 21v-7h4v7"/>', water:'<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',play:'<rect x="3" y="4" width="18" height="16" rx="4"/><path d="m10 8 6 4-6 4V8Z"/>',
  receipt:'<path d="M5 3l3 2 4-2 4 2 3-2v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M9 9h6m-6 4h6"/>',sort:'<path d="M4 6h16M4 12h11m-11 6h6"/>',
  more:'<g fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></g>'
};
const icon = name => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + paths[name] + '</svg>';
const categories = {
  Electricity:['bolt','#fff0cc','#ad7118'], Internet:['wifi','#e9e8ff','#6656c3'],
  Housing:['home','#e4edf9','#426caa'], Water:['water','#dff2f4','#2a8294'],
  Credit:['card','#fae9ea','#af596b'], Subscription:['play','#f1e8fa','#8a58ab'], Other:['receipt','#edf0f4','#606e82']
};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatDate = (date, options) => Planner.dateOf(date).toLocaleDateString('en-US',{timeZone:'UTC',...options});
const shortDate = d => formatDate(d,{month:'short',day:'numeric'});
const ordinal = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
const frequencies = {twice:'Twice a month',monthly:'Monthly',weekly:'Weekly',biweekly:'Every two weeks'};
const storageKey = 'billsort.plan.v1';
function sample() {
  const now = Planner.today();
  const bills = [['Electricity bill','Electricity',2450,0],['Home internet','Internet',1699,1],['Water bill','Water',680,3],['Credit card','Credit',3200,5],['Apartment rent','Housing',7000,8],['Streaming plan','Subscription',399,11]];
  return {settings:{salary:1800000,currency:'PHP',frequency:'twice',first:15,second:31,anchor:now},bills:bills.map(([name,category,amount,days],i)=>({id:'sample-'+i,name,category,amount:amount*100,due:Planner.shift(now,days),paidOn:null}))};
}
let state;
try {state=JSON.parse(localStorage.getItem(storageKey));} catch {}
if (!state?.settings || !Array.isArray(state.bills)) state=sample();
let filter='Unpaid',sort='priority',messageTimer,currentBill;
const money = cents => new Intl.NumberFormat('en-PH',{style:'currency',currency:state.settings.currency,minimumFractionDigits:cents%100 ? 2 : 0,maximumFractionDigits:2}).format(cents/100);
function notify(message){$('toast').textContent=message;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('toast').textContent='',3900);}
function save(message){try{localStorage.setItem(storageKey,JSON.stringify(state));notify(message);}catch{notify('Changes apply to this session. Browser storage is unavailable.');}render();}
if (!state.bills.length || state.bills.some(b=>b.id.startsWith('sample-'))) {try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{}}
function scheduleText(s){if(s.frequency==='twice')return ordinal(s.first)+' & '+(s.second===31?'month-end':ordinal(s.second));if(s.frequency==='monthly')return s.first===31?'Month-end':ordinal(s.first)+' of each month';return frequencies[s.frequency]+' · '+formatDate(s.anchor,{weekday:'short'});}
function priority(b,on){if(b.paidOn)return ['paid','Paid'];const days=Planner.distance(on,b.due);if(days<0)return ['urgent','Overdue'];if(days===0)return ['urgent','Due today'];if(days<=2)return ['urgent','Urgent'];if(days<=7)return ['soon','Due soon'];return ['later','Upcoming'];}
const metric = (label,value) => '<div class="metric"><span>'+label+'</span><strong>'+value+'</strong></div>';
function overview(calc){
  const s=state.settings;
  return '<div class="overview-grid"><article class="balance"><div class="art" aria-hidden="true"><i class="wallet-back"></i><i class="note"></i><i class="note second"></i><i class="wallet-front"></i><i class="clasp"></i></div><div class="balance-label">'+icon('wallet')+'Cutoff balance</div><div class="amount">'+money(calc.available)+'</div><small>Available after planned bills</small><div class="metrics">'+metric('Cutoff salary',money(s.salary))+metric('Planned payments',money(calc.allocated))+metric('Bills covered',calc.covered.size+' of '+calc.queue.length)+'</div></article><article class="period"><div class="panel-top"><h2>Pay schedule</h2><button class="icon-btn" data-settings aria-label="Edit pay schedule">'+icon('edit')+'</button></div><div class="payday"><div class="date-tile" aria-hidden="true"><b>'+formatDate(calc.next,{month:'short'}).toUpperCase()+'</b><strong>'+Number(calc.next.slice(-2))+'</strong></div><div><small>Next payday</small><h3>'+formatDate(calc.next,{month:'long',day:'numeric'})+'</h3></div></div><div class="period-line"><span>'+frequencies[s.frequency]+'</span><span>'+scheduleText(s)+'</span></div></article></div>';
}
function billRow(b,on){
  const [glyph,bg,fg]=categories[b.category] || categories.Other;
  const [klass,label]=priority(b,on);
  return '<div class="bill-grid bill-row"><div class="bill-identity"><span class="category-icon" style="background:'+bg+';color:'+fg+'">'+icon(glyph)+'</span><div><strong>'+esc(b.name)+'</strong><small>'+esc(b.category)+'</small></div></div><span class="date">'+formatDate(b.due,{month:'short',day:'numeric',year:'numeric'})+'</span><span class="priority"><span class="status '+klass+'">'+label+'</span></span><span class="money">'+money(b.amount)+'</span><button class="row-edit" data-bill="'+esc(b.id)+'" aria-label="Manage '+esc(b.name)+'">'+icon('more')+'</button></div>';
}
function billList(view,on,calc){
  const bills=state.bills.filter(b=>filter==='All'||(filter==='Unpaid'?!b.paidOn:!!b.paidOn)).sort((a,b)=>Number(!!a.paidOn)-Number(!!b.paidOn)||(sort==='amount'?b.amount-a.amount:0)||a.due.localeCompare(b.due)||a.id.localeCompare(b.id));
  return '<article class="list"><div class="list-top"><div><h2>'+(view==='overview'?'Bill queue':'Bill list')+'</h2><p>'+(sort==='priority'?'Earliest due dates come first.':'Highest amounts come first.')+'</p></div><button class="sort" data-sort title="Change sorting">'+icon('sort')+(sort==='priority'?'Due date':'Amount')+'</button></div><div class="segmented" role="group" aria-label="Filter bills">'+['Unpaid','Paid','All'].map(f=>'<button data-filter="'+f+'" aria-pressed="'+(filter===f)+'" class="'+(filter===f?'active':'')+'">'+f+'</button>').join('')+'</div><div class="bill-grid table-head" aria-hidden="true"><span>Bill name</span><span>Due date</span><span>Priority</span><span class="money" style="font:inherit">Amount</span><span></span></div>'+ (bills.length?bills.map(b=>billRow(b,on)).join(''):'<div class="empty"><strong>No '+(filter==='All'?'':filter.toLowerCase()+' ')+'bills</strong><p>'+(filter==='Paid'?'Bills you mark as paid will appear here.':'Add a bill to plan your next payment.')+'</p></div>')+'<div class="list-foot">'+bills.length+' '+(bills.length===1?'bill':'bills')+' · Current cutoff '+shortDate(calc.start)+' – '+shortDate(Planner.shift(calc.next,-1))+'</div></article>';
}
function render(){
  const on=Planner.today(),calc=Planner.calculate(state.settings,state.bills,on);
  const view=['bills','schedule'].includes(location.hash.slice(1))?location.hash.slice(1):'overview';
  document.querySelectorAll('nav a').forEach(a=>{if(a.hash==='#'+view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('today').innerHTML=icon('calendar')+formatDate(on,{weekday:'short',month:'short',day:'numeric',year:'numeric'});
  $('pageTitle').textContent=({overview:'Overview',bills:'All bills',schedule:'Pay schedule'})[view];
  $('subtitle').textContent=({overview:'Your paycheck and upcoming bills at a glance.',bills:'Manage due dates, amounts, and payments.',schedule:'Set the paydays that fund your bills.'})[view];
  $('summary').innerHTML=view==='overview'?overview(calc):'';
  $('bills').innerHTML=view!=='schedule'?billList(view,on,calc):'';
  const rows=[['Salary per cutoff',money(state.settings.salary)],['Pay frequency',frequencies[state.settings.frequency]],['Paydays',scheduleText(state.settings)],['Current cutoff',shortDate(calc.start)+' – '+shortDate(Planner.shift(calc.next,-1))],['Next payday',shortDate(calc.next)],['Already paid this cutoff',money(calc.paid)],['Unpaid bills due before payday',money(calc.required)],['Amount still unfunded',money(calc.required-calc.allocated)]];
  $('schedule').innerHTML=view==='schedule'?'<article class="schedule-detail"><div class="panel-top"><h2>Salary settings</h2><button class="secondary" data-settings>'+icon('edit')+'Edit schedule</button></div><dl>'+rows.map(([a,b])=>'<dt>'+a+'</dt><dd>'+b+'</dd>').join('')+'</dl></article>':'';
}
function openForm(title,fields,actions){$('dialogTitle').textContent=title;$('fields').innerHTML=fields+'<p class="error" id="error" role="alert"></p>';$('actions').innerHTML='<div class="action-row">'+actions+'</div>';if(!$('dialog').open)$('dialog').showModal();}
const input=(label,name,type,value,attrs='')=>'<label>'+label+'<input required name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+attrs+'></label>';
const select=(label,name,options,value)=>'<label>'+label+'<select name="'+name+'">'+Object.entries(options).map(([k,v])=>'<option value="'+k+'" '+(k===value?'selected':'')+'>'+v+'</option>').join('')+'</select></label>';
const cancel='<button type="button" class="secondary" data-close>Cancel</button>';
function billForm(b){
  const now=Planner.today();
  currentBill=b?.id;
  const calc=Planner.calculate(state.settings,state.bills,now);
  const hint=b?(b.paidOn?'Paid on '+shortDate(b.paidOn)+'.':b.due>=calc.next?'Due in a later cutoff.':calc.covered.has(b.id)?'Covered by this cutoff’s salary.':'This cutoff has insufficient funds for this bill.'):'';
  openForm(b?'Manage bill':'Add bill',input('Bill name','name','text',b?.name||'','maxlength="80" placeholder="e.g. Home internet"')+input('Amount ('+state.settings.currency+')','amount','number',b?b.amount/100:'','min="0.01" max="999999999" step="0.01" inputmode="decimal"')+input('Due date','due','date',b?.due||now)+select('Category','category',Object.fromEntries(Object.keys(categories).map(c=>[c,c])),b?.category||'Other')+'<p class="fieldhint">'+hint+'</p>',(b?'<button type="button" class="danger" data-remove>Delete</button><button type="button" class="secondary" data-paid>'+(b.paidOn?'Mark unpaid':'Mark paid')+'</button>':cancel)+'<button class="primary" type="submit">'+(b?'Save changes':'Add bill')+'</button>');
  $('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=String(f.get('name')).trim();if(!name){$('error').textContent='Enter a bill name.';return;}const bill={id:b?.id||crypto.randomUUID(),name,amount:Math.round(Number(f.get('amount'))*100),category:f.get('category'),due:f.get('due'),paidOn:b?.paidOn||null};if(b)state.bills=state.bills.map(v=>v.id===b.id?bill:v);else{state.bills.push(bill);filter='Unpaid';}closeForm();save(b?'Bill updated.':'Bill added.');};
}
function scheduleForm(){
  const s=state.settings;
  const dayInput=(label,name,value)=>input(label,name,'number',value,'min="1" max="31" step="1"');
  openForm('Edit pay schedule',input('Take-home salary per cutoff','salary','number',s.salary/100,'min="0" max="999999999" step="0.01"')+select('Currency','currency',{PHP:'Philippine peso (₱)',USD:'US dollar ($)',EUR:'Euro (€)',GBP:'British pound (£)'},s.currency)+select('Pay frequency','frequency',frequencies,s.frequency)+'<div id="paydays"></div>',cancel+'<button class="primary" type="submit">Save schedule</button>');
  const form=$('form');
  function days(){const freq=form.elements.frequency.value;$('paydays').innerHTML=['weekly','biweekly'].includes(freq)?input('A known payday','anchor','date',s.anchor):dayInput(freq==='twice'?'First payday of month':'Payday of month','first',s.first)+(freq==='twice'?dayInput('Second payday of month','second',s.second):'')+'<p class="fieldhint">Use 31 for the last day of each month.</p>';}
  days();form.elements.frequency.onchange=days;
  form.onsubmit=e=>{e.preventDefault();const f=new FormData(form),freq=f.get('frequency'),first=Number(f.get('first')||s.first),second=Number(f.get('second')||s.second);if(freq==='twice'&&first>=second){$('error').textContent='Choose a second payday later than the first.';return;}state.settings={frequency:freq,first,second,anchor:f.get('anchor')||s.anchor,currency:f.get('currency'),salary:Math.round(Number(f.get('salary'))*100)};closeForm();save('Pay schedule updated.');};
}
function closeForm(){$('dialog').close();}
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.id==='add')billForm();
  else if(b.hasAttribute('data-close'))closeForm();
  else if(b.hasAttribute('data-settings'))scheduleForm();
  else if(b.hasAttribute('data-filter')){filter=b.dataset.filter;render();}
  else if(b.hasAttribute('data-sort')){sort=sort==='priority'?'amount':'priority';render();}
  else if(b.hasAttribute('data-bill'))billForm(state.bills.find(v=>v.id===b.dataset.bill));
  else if(b.hasAttribute('data-paid')){const bill=state.bills.find(v=>v.id===currentBill);bill.paidOn=bill.paidOn?null:Planner.today();closeForm();save(bill.paidOn?'Bill marked as paid.':'Bill marked as unpaid.');}
  else if(b.hasAttribute('data-remove')){const bill=state.bills.find(v=>v.id===currentBill);openForm('Delete bill?','<p>Remove '+esc(bill.name)+' from your plan?</p>',cancel+'<button class="danger" type="submit">Delete bill</button>');$('form').onsubmit=e=>{e.preventDefault();state.bills=state.bills.filter(v=>v.id!==currentBill);closeForm();save('Bill deleted.');};}
});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
window.addEventListener('focus',render);
document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));
render();
