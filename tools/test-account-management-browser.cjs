// Local UI contract tests. Responses are mocked only on the local Vite server.
const { chromium } = require('../../tmp/service-month-review/qa/node_modules/playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/account/admin-api.ts*',route=>route.fulfill({contentType:'application/javascript',body:`
 export const isOwnerCandidate=u=>u?.email==='libinvarghese16@gmail.com'&&u.emailVerified;
 export class AdminApiError extends Error { constructor(message,status,code){super(message);this.status=status;this.code=code;} }
 export async function adminRequest(action,body={},token){window.adminCalls.push({action,body,token});
 if(window.adminUnavailable)throw new AdminApiError('Setup required',503,'setup-required');
 if(action==='access')return {owner:window.adminOwner,paidAccess:window.adminPaid};
 if(action==='status')return {configured:window.adminConfigured};
 if(action==='setup'){window.adminConfigured=true;return {ok:true};}
 if(action==='unlock'){if(body.pin!=='82461937')throw new AdminApiError('Incorrect PIN.',401);return {token:body.purpose+'-token',expiresAt:Date.now()+900000};}
 if(action==='users')return {users:[{uid:'customer',email:'customer@example.com',name:'Test customer',disabled:false,paidAccess:null}],nextPage:null};
 return {ok:true};}
 `}));
 await page.goto('http://127.0.0.1:4316',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{const text=await(await fetch('/src/main.tsx')).text();const reactPath=text.match(/from "([^"\n]*\/react\.js\?[^"\n]*)"/)[1];const domPath=text.match(/from "([^"\n]*\/react-dom_client\.js\?[^"\n]*)"/)[1];window.R=(await import(reactPath)).default;const dom=(await import(domPath)).default;document.getElementById('root').style.display='none';const el=document.createElement('div');el.id='admin-qa';document.body.append(el);window.root=dom.createRoot(el);window.adminCalls=[];window.adminConfigured=true;window.adminOwner=true;window.adminPaid=null;});
 const mount=async(mode,owner=true)=>{await page.evaluate(async({mode,owner})=>{const user={uid:owner?'owner':'customer',email:owner?'libinvarghese16@gmail.com':'customer@example.com',emailVerified:true};const module=await import('/src/account/'+(mode==='management'?'AccountManagement':'AccountSecurityGate')+'.tsx');window.root.render(window.R.createElement(mode==='management'?module.AccountManagement:module.AccountSecurityGate,{key:mode+owner+Math.random(),user,authentication:{user,signOut:async()=>{window.signedOut=true;}}},window.R.createElement('div',{'data-testid':'protected'},'Protected workspace')));},{mode,owner});await page.waitForTimeout(100);};
 await mount('management',false);assert.equal(await page.getByText('Account management',{exact:true}).count(),0);
 await mount('management');await page.getByRole('button',{name:'Open account management'}).click();await page.getByLabel('Security PIN',{exact:true}).fill('11111111');await page.getByRole('button',{name:'Unlock',exact:true}).click();await page.getByRole('alert').filter({hasText:'Incorrect PIN'}).waitFor();
 await page.getByLabel('Security PIN',{exact:true}).fill('82461937');await page.getByRole('button',{name:'Unlock',exact:true}).click();await page.getByRole('heading',{name:'Test customer'}).waitFor();await page.getByRole('button',{name:'Grant paid access',exact:true}).click();assert.equal(await page.evaluate(()=>window.adminCalls.some(x=>x.action==='grant-paid')),false);await page.getByRole('button',{name:'Confirm change'}).click();await page.getByRole('status').filter({hasText:'Account updated'}).waitFor();assert.equal(await page.evaluate(()=>window.adminCalls.some(x=>x.action==='grant-paid'&&x.body.uid==='customer'&&x.token==='management-token')),true);
 for(const width of [390,820,1440]){await page.setViewportSize({width,height:1000});for(const theme of ['light','dark']){await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'tmp/account-admin-'+width+'-'+theme+'.png',fullPage:true});}}
 await page.getByRole('button',{name:'Lock and close'}).click();await page.getByRole('button',{name:'Open account management'}).click();await page.getByLabel('Security PIN',{exact:true}).waitFor();assert.ok(await page.evaluate(()=>window.adminCalls.some(x=>x.action==='lock')));
 await page.clock.install();await mount('gate');await page.getByRole('heading',{name:'Unlock your account'}).waitFor();assert.equal(await page.getByTestId('protected').isVisible(),false);await page.getByLabel('Security PIN',{exact:true}).fill('82461937');await page.getByRole('button',{name:'Unlock',exact:true}).click();await page.getByTestId('protected').waitFor();
 await page.clock.fastForward(900001);await page.getByRole('heading',{name:'Unlock your account'}).waitFor();assert.equal(await page.getByTestId('protected').isVisible(),false);
 await page.evaluate(()=>{window.adminOwner=false;window.adminPaid=false;});await mount('gate',false);await page.getByRole('heading',{name:'Account access is not active'}).waitFor();assert.equal(await page.getByTestId('protected').isVisible(),false);
 await page.evaluate(()=>{window.adminUnavailable=true;});await mount('gate',false);await page.getByTestId('protected').waitFor();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ownerOnly:true,pinRequired:true,wrongPin:true,confirmation:true,separatePurposes:true,expiry:true,paidRevocation:true,setupPending:true,responsive:[390,820,1440],errors}));await browser.close();
})();

