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
 await page.getByText('Post-Repair Bottom Assessment',{exact:true}).click();
 const values={'Build / in-service date':'2014-10-01','Current assessment date':'2026-10-01','Original steel thickness (mm)':'6','Retained RTbc after repairs (mm)':'3.72','Retained RTip after repairs (mm)':'3.72','Proposed operating interval (years)':'6','Manual underside rate (mm/year)':'.190','Manual rate engineering justification':'Verified retained-area basis','Top-side StPr (mm/year)':'0','Top-side rate basis':'Documented zero rate','Section 6.4.2 interval limit (years)':'10','Inspection-limit basis / review reference':'Interval review','Critical-zone / annular review reference':'CZ-01','Thickness / inspection record reference':'UT-01'};
 for(const [label,value]of Object.entries(values))await page.getByLabel(label,{exact:true}).fill(value);
 await page.getByRole('combobox',{name:'Post-repair rate selection'}).selectOption('manual');
 for(const text of ['Retained thicknesses and coverage','Every repaired area','Separate critical-zone assessment','Separate annular assessment'])await page.getByRole('checkbox',{name:new RegExp(text)}).check();
 assert.match(await page.locator('.post-repair-results').innerText(),/6\.2105/);assert.match(await page.locator('.post-repair-results').innerText(),/Proposed interval meets/);
 await page.getByLabel('Manual underside rate (mm/year)',{exact:true}).fill(String(1.1/2.68));assert.match(await page.locator('.post-repair-results').innerText(),/2\.8749/);
 await page.getByRole('button',{name:'Add patch area'}).click();assert.equal(await page.locator('.post-repair-patches tbody tr').count(),1);
 assert.match(await page.locator('.post-repair-results').innerText(),/Correct these inputs/);await page.locator('.post-repair-patches').getByRole('button',{name:'Delete',exact:true}).click();
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download post-repair report',exact:true}).click();await (await downloaded).saveAs('tmp/post-repair-mobile-report.html');assert.match(fs.readFileSync('tmp/post-repair-mobile-report.html','utf8'),/2\.8749/);
 for(const width of [390,820,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:1000});await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.querySelector('.post-repair-assessment').scrollIntoView({block:'start'});},theme);
  await page.waitForTimeout(400);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`overflow at ${width}`);
  await page.screenshot({path:`tmp/post-repair-mobile-${width}-${theme}.png`,animations:'disabled'});
 }
 await page.getByRole('combobox',{name:'Build month',exact:true}).focus();assert.equal(await page.locator(':focus').getAttribute('aria-label'),'Build month');
 assert.deepEqual(errors,[]);
 fs.writeFileSync('tmp/month-repair-browser.json',JSON.stringify({calculatorChecks:checks,checks:checks.length,errors,reportDownload:true,viewports:[390,820,1440],themes:['light','dark']},null,2));
 console.log(JSON.stringify({calculatorChecks:checks.length,errors,reportDownload:true}));await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
