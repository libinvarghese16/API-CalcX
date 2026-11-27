// Local component harness only: no authentication or production application code is changed.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '../../tmp/service-month-review/qa/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = process.env.TEST_URL || 'http://127.0.0.1:4316';
(async () => {
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'Asia/Dubai',acceptDownloads:true});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 // Expose the existing private vessel component for local rendering, in the response only.
 await page.route('**/src/App.tsx',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport { CalculatorPreview };'});});
 await page.goto(origin,{waitUntil:'networkidle'});
 await page.evaluate(async()=>{
  const text=await (await fetch('/src/main.tsx')).text();
  const reactPath=text.match(/from "([^"\n]*\/react\.js\?[^"\n]*)"/)[1];
  const domPath=text.match(/from "([^"\n]*\/react-dom_client\.js\?[^"\n]*)"/)[1];
  window.qaReact=(await import(reactPath)).default;
  const dom=(await import(domPath)).default;
  document.getElementById('root').style.display='none';
  const container=document.createElement('div');container.id='qa-components';document.body.append(container);window.qaRoot=dom.createRoot(container);
 });
 const mount=async(file,name,extra={})=>{
  await page.evaluate(async({file,name,extra})=>{
   window.qaRoot.render(null);const module=await import('/src/'+file);
   window.qaRoot.render(window.qaReact.createElement(module[name],{key:file+JSON.stringify(extra),projects:[],initialCalculation:null,onBack:()=>{},onNeedProject:()=>{},notify:()=>{},onSave:()=>{throw Error('Save requires a real local project fixture');},onReview:()=>{},onApprove:()=>{},...extra}));
  },{file,name,extra});
  await page.getByRole('spinbutton',{name:'Build year',exact:true}).waitFor();
 };
 const modules=[
  ['api570/Api570PipingCalculator.tsx','Api570PipingCalculator'],['api570/Api570TubeCalculator.tsx','Api570TubeCalculator'],['api570/Api570HeaderCalculator.tsx','Api570HeaderCalculator'],
  ['api653/Api653BottomPlateCalculator.tsx','Api653BottomPlateCalculator'],['api653/Api653AnnularPlateCalculator.tsx','Api653AnnularPlateCalculator'],['api653/Api653RoofPlateCalculator.tsx','Api653RoofPlateCalculator'],['api653/Api653NozzleCalculator.tsx','Api653NozzleCalculator'],['api653/Api653ShellCourseCalculator.tsx','Api653ShellCourseCalculator'],['api653/Api653Other432Calculator.tsx','Api653Other432Calculator']
 ];
 for(const shape of ['cylindrical','spherical','ellipsoidal','torispherical','hemispherical','conical','flat-circular'])modules.push(['App.tsx','CalculatorPreview',{initialComponent:shape}]);
 const checks=[];
 for(const [file,name,extra] of modules){
  await mount(file,name,extra); console.log('Checking',name,extra?.initialComponent || '');
  await page.getByRole('spinbutton',{name:'Build year',exact:true}).fill('2006');
  await page.getByRole('spinbutton',{name:'Previous inspection year',exact:true}).fill('2024');
  const current=await page.evaluate(()=>({year:new Date().getFullYear(),month:new Date().getMonth()+1}));
  assert.equal(Number(await page.locator('#qa-components label.field').filter({hasText:/^Years in service/i}).locator('input').inputValue()),current.year-2006);
  await page.getByRole('combobox',{name:'Build month',exact:true}).selectOption('2');
  await page.getByRole('combobox',{name:'Previous inspection month',exact:true}).selectOption('2');
  const expected=(12*(current.year-2006)+current.month-2)/12;
  assert.ok(Math.abs(Number(await page.locator('#qa-components label.field').filter({hasText:/^Years in service/i}).locator('input').inputValue())-expected)<1e-9,file);
  assert.ok(Math.abs(Number(await page.locator('#qa-components label.field').filter({hasText:/^Years since previous inspection/i}).locator('input').inputValue())-((12*(current.year-2024)+current.month-2)/12))<1e-9,file);
  checks.push(name+(extra?.initialComponent?':'+extra.initialComponent:''));
 }
 await mount('api653/Api653BottomPlateCalculator.tsx','Api653BottomPlateCalculator');
 await page.getByRole('button',{name:'Switch Years in service to manual mode',exact:true}).click();
 await page.getByRole('button',{name:'Switch Years since previous inspection to manual mode',exact:true}).click();
 const values={'Original bottom thickness':'6','Previous measured thickness':'3.6','Current bottom remaining thickness RTbc':'2.5','Current internal-pitting depth':'0','Years in service':'12','Years since previous inspection':'2.68'};
 for(const [label,value]of Object.entries(values))await page.getByRole('spinbutton',{name:label,exact:true}).fill(value);
 const original=await page.locator('#qa-components .calculator-page > .calculator-workspace .result-card').innerText();
 assert.equal(await page.locator('details.post-repair-assessment').count(),0);
 assert.ok(await page.getByRole('spinbutton',{name:'Lowest remaining thickness after repair (mm)',exact:true}).isVisible());
 const field=page.getByRole('spinbutton',{name:'Lowest remaining thickness after repair (mm)',exact:true});
 await field.fill('3.72');
 const results=page.locator('.post-repair-results');
 assert.match(await results.innerText(),/2\.8749/);
 assert.match(await results.innerText(),/Short-term rate governs/);
 assert.match(await results.innerText(),/0\.4104/);
 assert.equal(await page.locator('.post-repair-assessment input[type="number"]:not([readonly])').count(),2);
 assert.equal(await page.locator('#qa-components .calculator-page > .calculator-workspace .result-card').innerText(),original);
 await field.fill('2.5');assert.equal(await results.locator('.result-value strong').innerText(),'0.0000');
 await field.fill('3.72');
 // Manual UPr above cannot suppress the higher history rate in the repair calculation.
 await page.getByRole('button',{name:'Switch Underside corrosion rate UPr to manual mode',exact:true}).click();
 await page.getByRole('spinbutton',{name:'Underside corrosion rate UPr',exact:true}).fill('0.01');
 assert.match(await results.innerText(),/2\.8749/);
 await page.getByRole('spinbutton',{name:'Previous measured thickness',exact:true}).fill('2.6');
 assert.match(await results.innerText(),/Long-term rate governs/);
 assert.match(await results.innerText(),/4\.0457/);
 await page.getByRole('spinbutton',{name:'Previous measured thickness',exact:true}).fill('3.6');
 // Global unit changes preserve the SI rate and this explicitly mm-based input.
 await page.getByRole('combobox',{name:'Unit system',exact:true}).selectOption('us-customary');
 assert.match(await results.innerText(),/2\.8749/);
 await page.getByRole('combobox',{name:'Unit system',exact:true}).selectOption('metric');
 // Restore the exact fixture after the existing six-decimal field-unit round trip.
 for(const [label,value]of Object.entries(values))await page.getByRole('spinbutton',{name:label,exact:true}).fill(value);
 await page.getByRole('spinbutton',{name:'Post-repair operating interval (years)',exact:true}).fill('6');
 assert.match(await page.locator('.post-repair-interval').innerText(),/5\.0027 mm/);
 assert.match(await page.locator('.post-repair-interval').innerText(),/too low/);
 await field.fill('');
 assert.match(await page.locator('.post-repair-interval').innerText(),/5\.0027 mm/);
 await field.fill('4');
 await page.getByRole('checkbox',{name:'Use MFL inspection metal loss (%)',exact:true}).check();
 await page.getByRole('spinbutton',{name:'MFL metal loss (%)',exact:true}).fill('38');
 assert.ok(await field.evaluate(el=>el.readOnly));
 assert.ok(Math.abs(Number(await field.inputValue())-3.72)<1e-9);
 assert.match(await results.innerText(),/2\.8749/);
 assert.match(await page.locator('.post-repair-assessment').innerText(),/2\.2800 mm lost/);
 await page.getByRole('spinbutton',{name:'MFL metal loss (%)',exact:true}).fill('101');
 assert.equal(await results.locator('.result-value strong').innerText(),'—');
 await page.getByRole('spinbutton',{name:'MFL metal loss (%)',exact:true}).fill('100');
 assert.equal(await results.locator('.result-value strong').innerText(),'0.0000');
 await page.getByRole('spinbutton',{name:'MFL metal loss (%)',exact:true}).fill('38');
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download post-repair report',exact:true}).click();
 await (await downloaded).saveAs('tmp/post-repair-mobile-report.html');
 assert.match(fs.readFileSync('tmp/post-repair-mobile-report.html','utf8'),/2\.8749/);
 assert.match(fs.readFileSync('tmp/post-repair-mobile-report.html','utf8'),/5\.0027/);
 assert.match(fs.readFileSync('tmp/post-repair-mobile-report.html','utf8'),/2\.2800/);
 for(const width of [390,820,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.querySelector('.post-repair-assessment').scrollIntoView({block:'start'});},theme);
  await page.waitForTimeout(400);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'overflow');
  const alignment=await page.evaluate(()=>{
   const a=document.querySelector('#qa-components .calculator-page > .calculator-workspace');
   const b=document.querySelector('.post-repair-assessment .calculator-workspace');
   const end=Math.max(...[...a.children].map(el=>el.getBoundingClientRect().bottom));
   const heading=document.querySelector('.post-repair-heading').getBoundingClientRect();
   return {gap:heading.top-end,left:Math.abs(a.getBoundingClientRect().left-b.getBoundingClientRect().left),width:Math.abs(a.getBoundingClientRect().width-b.getBoundingClientRect().width),paddingA:getComputedStyle(a.querySelector('.form-card')).padding,paddingB:getComputedStyle(b.querySelector('.form-card')).padding};
  });
  assert.ok(alignment.left<1 && alignment.width<1);assert.equal(alignment.paddingA,alignment.paddingB);
  assert.ok(alignment.gap>=0 && alignment.gap<=20,JSON.stringify(alignment));
  assert.equal(await field.evaluate(el=>getComputedStyle(el).appearance),'textfield');
  await page.screenshot({path:'tmp/simple-repair-'+width+'-'+theme+'.png',animations:'disabled'});
 }
 await page.getByRole('checkbox',{name:'Use MFL inspection metal loss (%)',exact:true}).uncheck();
 assert.equal(await field.inputValue(),'4');
 await field.focus();assert.equal(await page.locator(':focus').getAttribute('aria-label'),'Lowest remaining thickness after repair (mm)');
 assert.deepEqual(errors,[]);
 fs.writeFileSync('tmp/month-repair-browser.json',JSON.stringify({calculatorChecks:checks,errors,reportDownload:true,higherRateAfterRepair:true,existingResultsPreserved:true,viewports:[390,820,1440],themes:['light','dark']},null,2));
 console.log(JSON.stringify({calculatorChecks:checks.length,errors,reportDownload:true,higherRateAfterRepair:true}));await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
