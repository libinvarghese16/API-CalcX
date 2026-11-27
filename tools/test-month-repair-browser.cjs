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
   window.qaRoot.render(window.qaReact.createElement(module[name],{key:file+JSON.stringify(extra),projects:[{id:'qa-project',name:'QA project',equipment:[],status:'active',createdAt:'2026-11-27T00:00:00Z',updatedAt:'2026-11-27T00:00:00Z'}],initialCalculation:null,onBack:()=>{},onNeedProject:()=>{},notify:()=>{},onSave:input=>{const saved={...input,id:'qa-record',equipmentId:'qa-equipment',updatedAt:'2026-11-27T00:00:00Z',workflow:{revision:1,preparedBy:'QA',history:[]}};window.qaSaved=JSON.parse(JSON.stringify(saved));return saved;},onReview:()=>{},onApprove:()=>{},...extra}));
  },{file,name,extra});
  await page.getByRole('spinbutton',{name:'Build year',exact:true}).waitFor().catch(error=>{console.error('Mount errors',errors);throw error;});
 };
 const modules=[
  ['api570/Api570PipingCalculator.tsx','Api570PipingCalculator'],['api570/Api570TubeCalculator.tsx','Api570TubeCalculator'],['api570/Api570HeaderCalculator.tsx','Api570HeaderCalculator'],
  ['api653/Api653BottomPlateCalculator.tsx','Api653BottomPlateCalculator'],['api653/Api653AnnularPlateCalculator.tsx','Api653AnnularPlateCalculator'],['api653/Api653RoofPlateCalculator.tsx','Api653RoofPlateCalculator'],['api653/Api653NozzleCalculator.tsx','Api653NozzleCalculator'],['api653/Api653ShellCourseCalculator.tsx','Api653ShellCourseCalculator'],['api653/Api653Other432Calculator.tsx','Api653Other432Calculator']
 ];
 for(const shape of ['cylindrical','spherical','ellipsoidal','torispherical','hemispherical','conical','flat-circular'])modules.push(['App.tsx','CalculatorPreview',{initialComponent:shape}]);
 const checks=[];const repairChecks=[];
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
  if(name !== 'Api653Other432Calculator') {
   const originalResults=await page.locator('#qa-components .calculator-page > .calculator-workspace .result-card').allTextContents();
   const repair=page.locator('.post-repair-assessment');
   assert.equal(await repair.count(),1,name);
   assert.equal(await repair.locator('.post-repair-mfl').count(),name === 'CalculatorPreview' ? 0 : 1,'MFL limited to tank and piping');
   assert.match(await repair.locator('.post-repair-heading').innerText(),/^Remaining life after repair$/);
   const repairThickness=repair.getByRole('spinbutton',{name:'Lowest remaining thickness after repair (mm)',exact:true});
   await repairThickness.fill('20.123456');await repairThickness.blur();
   assert.equal(await repairThickness.inputValue(),'20.12');
   await repairThickness.focus();await repairThickness.press('ArrowUp');await repairThickness.press('ArrowDown');
   assert.equal(await repairThickness.inputValue(),'20.12');
   await repairThickness.hover();await page.mouse.wheel(0,100);await page.waitForTimeout(100);
   assert.equal(await repairThickness.inputValue(),'20.12','wheel must not change thickness');
   await repair.getByRole('spinbutton',{name:'Post-repair operating interval (years)',exact:true}).fill('5');
   await repair.getByRole('spinbutton',{name:'Post-repair operating interval (years)',exact:true}).blur();
   assert.match(await repair.locator('.result-value strong').innerText(),/^\d+\.\d{2}$/);
   assert.match(await repair.locator('.post-repair-required').innerText(),/^\d+\.\d{2} mm$/);
   const rateTexts=await repair.locator('.result-comparison strong').allTextContents();
   for(const rate of rateTexts)assert.match(rate,/^(\d+\.\d{3}|—) mm\/year$/);
   assert.deepEqual(await page.locator('#qa-components .calculator-page > .calculator-workspace .result-card').allTextContents(),originalResults);
   const selector=page.getByRole('combobox',{name:'Repair assessment component',exact:true});
   if(await selector.count()){
    const ids=await selector.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));
    if(ids.length>1){
     await selector.selectOption(ids[1]);assert.equal(await repairThickness.inputValue(),'');
     await repairThickness.fill('21');await repairThickness.blur();
     await selector.selectOption(ids[0]);assert.equal(await repairThickness.inputValue(),'20.12');
    }
   }

   await page.getByRole('button',{name:'Save draft',exact:true}).click();
   await page.getByRole('dialog').getByRole('textbox',{name:/Prepared by/}).fill('QA');
   await page.getByRole('button',{name:'Save locally',exact:true}).click();
   const saved=await page.evaluate(()=>window.qaSaved);
   const savedAdditions=name === 'Api653BottomPlateCalculator' ? saved.inputs.formState?.postRepair : saved.inputs.repairAdditions ?? saved.inputs.formState?.repairAdditions;
   assert.ok(JSON.stringify(savedAdditions).includes('20.123456'),'raw saved repair precision: '+name);
   await mount(file,name,{...extra,initialCalculation:saved});
   assert.equal(await page.getByRole('spinbutton',{name:'Lowest remaining thickness after repair (mm)',exact:true}).inputValue(),'20.12','restored '+name);
   repairChecks.push(name+(extra?.initialComponent?':'+extra.initialComponent:''));
  }
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
 assert.match(await results.innerText(),/2\.87/);
 assert.match(await results.innerText(),/Short-term rate governs/);
 assert.match(await results.innerText(),/0\.410/);
 assert.equal(await page.locator('.post-repair-assessment input[type="number"]:not([readonly])').count(),2);
 assert.equal(await page.locator('#qa-components .calculator-page > .calculator-workspace .result-card').innerText(),original);
 await field.fill('2.5');assert.equal(await results.locator('.result-value strong').innerText(),'0.00');
 await field.fill('3.72');
 // Manual UPr above cannot suppress the higher history rate in the repair calculation.
 await page.getByRole('button',{name:'Switch Underside corrosion rate UPr to manual mode',exact:true}).click();
 await page.getByRole('spinbutton',{name:'Underside corrosion rate UPr',exact:true}).fill('0.01');
 assert.match(await results.innerText(),/2\.87/);
 await page.getByRole('spinbutton',{name:'Previous measured thickness',exact:true}).fill('2.6');
 assert.match(await results.innerText(),/Long-term rate governs/);
 assert.match(await results.innerText(),/4\.05/);
 await page.getByRole('spinbutton',{name:'Previous measured thickness',exact:true}).fill('3.6');
 // Global unit changes preserve the SI rate and this explicitly mm-based input.
 await page.getByRole('combobox',{name:'Unit system',exact:true}).selectOption('us-customary');
 assert.match(await results.innerText(),/2\.87/);
 await page.getByRole('combobox',{name:'Unit system',exact:true}).selectOption('metric');
 // Restore the exact fixture after the existing six-decimal field-unit round trip.
 for(const [label,value]of Object.entries(values))await page.getByRole('spinbutton',{name:label,exact:true}).fill(value);
 await page.getByRole('spinbutton',{name:'Post-repair operating interval (years)',exact:true}).fill('6');
 assert.match(await page.locator('.post-repair-interval').innerText(),/5\.00 mm/);
 assert.match(await page.locator('.post-repair-interval').innerText(),/too low/);
 await field.fill('');
 assert.match(await page.locator('.post-repair-interval').innerText(),/5\.00 mm/);
 await field.fill('4');
 await page.getByRole('checkbox',{name:'Use MFL inspection metal loss (%)',exact:true}).check();
 await page.getByRole('spinbutton',{name:'MFL metal loss (%)',exact:true}).fill('38');
 const mflOriginal=page.getByRole('spinbutton',{name:'MFL original plate thickness (mm)',exact:true});
 await mflOriginal.fill('8');
 await mflOriginal.blur();
 assert.equal(await mflOriginal.inputValue(),'8.00');
 assert.equal(await page.getByRole('spinbutton',{name:'MFL metal loss (%)',exact:true}).inputValue(),'38.00');
 assert.match(await page.locator('.post-repair-mfl').innerText(),/4\.96 mm remaining/);
 assert.equal(Number(await page.getByRole('spinbutton',{name:'Original bottom thickness',exact:true}).inputValue()),6);
 assert.equal(Number(await field.inputValue()),4);
 await mflOriginal.fill('');
 await mflOriginal.blur();
 assert.equal(await mflOriginal.inputValue(),'');
 assert.equal(await page.getByRole('button',{name:'Use converted thickness above',exact:true}).isDisabled(),true);
 await mflOriginal.fill('6');
 await mflOriginal.blur();
 assert.equal(await mflOriginal.inputValue(),'6.00');
 assert.equal(await field.evaluate(el=>el.readOnly),false);
 assert.equal(Number(await field.inputValue()),4);
 await page.getByRole('button',{name:'Use converted thickness above',exact:true}).click();
 assert.ok(Math.abs(Number(await field.inputValue())-3.72)<1e-9);
 assert.match(await results.innerText(),/2\.87/);
 assert.match(await page.locator('.post-repair-assessment').innerText(),/2\.28 mm lost/);
 await page.getByRole('spinbutton',{name:'MFL metal loss (%)',exact:true}).fill('101');
 assert.equal(await page.getByRole('button',{name:'Use converted thickness above',exact:true}).isDisabled(),true);
 assert.match(await results.innerText(),/2\.87/);
 await page.getByRole('spinbutton',{name:'MFL metal loss (%)',exact:true}).fill('100');
 assert.match(await results.innerText(),/2\.87/);
 await page.getByRole('spinbutton',{name:'MFL metal loss (%)',exact:true}).fill('38');
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download post-repair report',exact:true}).click();
 await (await downloaded).saveAs('tmp/post-repair-mobile-report.html');
 assert.match(fs.readFileSync('tmp/post-repair-mobile-report.html','utf8'),/2\.87/);
 assert.match(fs.readFileSync('tmp/post-repair-mobile-report.html','utf8'),/5\.00/);
 assert.match(fs.readFileSync('tmp/post-repair-mobile-report.html','utf8'),/2\.28 mm lost/);
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
  const additionGap=await page.evaluate(()=>{
   const first=document.querySelector('.post-repair-assessment .input-column > .form-card');
   const heading=document.querySelector('.post-repair-additions-heading');
   return heading.getBoundingClientRect().top-first.getBoundingClientRect().bottom;
  });
  assert.ok(additionGap>=0 && additionGap<=20,'Additional checks gap: '+additionGap);
  assert.equal(await field.evaluate(el=>getComputedStyle(el).appearance),'textfield');
  const mflPadding=await page.locator('.post-repair-mfl').evaluate(el=>getComputedStyle(el).padding);
  assert.equal(mflPadding,alignment.paddingA);
  await page.locator('.post-repair-mfl').scrollIntoViewIfNeeded();
  await page.screenshot({path:'tmp/mfl-edit-'+width+'-'+theme+'.png',animations:'disabled'});
  await page.screenshot({path:'tmp/simple-repair-'+width+'-'+theme+'.png',animations:'disabled'});
 }
 await page.getByRole('checkbox',{name:'Use MFL inspection metal loss (%)',exact:true}).uncheck();
 assert.equal(await field.inputValue(),'3.72');
 await field.focus();assert.equal(await page.locator(':focus').getAttribute('aria-label'),'Lowest remaining thickness after repair (mm)');
 assert.deepEqual(errors,[]);
 // Display rounding must not round the value sent to a calculator or change it on blur.
 await page.evaluate(async()=>{
  const {DecimalNumberInput}=await import('/src/components/DecimalNumberInput.tsx');
  const React=window.qaReact;
  window.qaPrecisionRaw='1.234567';window.qaPrecisionChanges=0;
  function PrecisionProbe(){
   const [value,setValue]=React.useState(window.qaPrecisionRaw);
   return React.createElement(DecimalNumberInput,{value,'aria-label':'Corrosion rate probe',onChange:e=>{window.qaPrecisionRaw=e.target.value;window.qaPrecisionChanges++;setValue(e.target.value);}});
  }
  window.qaRoot.render(React.createElement(PrecisionProbe));
 });
 const probe=page.getByRole('spinbutton',{name:'Corrosion rate probe',exact:true});
 await probe.waitFor();assert.equal(await probe.inputValue(),'1.235');
 await probe.fill('0.1234567');await probe.blur();
 assert.equal(await probe.inputValue(),'0.123');
 assert.equal(await page.evaluate(()=>window.qaPrecisionRaw),'0.1234567');
 const changes=await page.evaluate(()=>window.qaPrecisionChanges);
 await probe.focus();await probe.blur();
 assert.equal(await page.evaluate(()=>window.qaPrecisionChanges),changes);
 assert.equal(await page.evaluate(()=>window.qaPrecisionRaw),'0.1234567');
 await probe.fill('');await probe.blur();assert.equal(await probe.inputValue(),'');
 fs.writeFileSync('tmp/month-repair-browser.json',JSON.stringify({calculatorChecks:checks,repairChecks,errors,reportDownload:true,higherRateAfterRepair:true,existingResultsPreserved:true,viewports:[390,820,1440],themes:['light','dark']},null,2));
 console.log(JSON.stringify({calculatorChecks:checks.length,repairChecks:repairChecks.length,errors,reportDownload:true,higherRateAfterRepair:true}));await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
