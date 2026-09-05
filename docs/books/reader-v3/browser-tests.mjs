// Run through the connected CUA tab on both local and production URLs.
export async function* checkReader(tab) {
 const checks=[];
 const assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 const button=name=>tab.playwright.getByRole('button',{name,exact:true});
 const active=()=>tab.playwright.evaluate(()=>document.querySelector('.digital-page:not([hidden])')?.id);
 await button('Pages').click();
 await button('Contents').click();
 await tab.playwright.locator('dialog[open] a[href="#preview-page-1"]').click();
 await tab.playwright.locator('#preview-page-1').waitFor({state:'visible'});
 assert(await active()==='preview-page-1','Pages default / front matter');
 const count=await tab.playwright.locator('.digital-page').count();
 for(let i=1;i<=count;i++) {
  await tab.playwright.locator(`#preview-page-${i}`).waitFor({state:'visible'});
  const layout=await tab.playwright.evaluate(()=>{
   const page=document.querySelector('.digital-page:not([hidden])'), box=page.getBoundingClientRect(), nav=document.querySelector('.reader-page-nav').getBoundingClientRect();
   return {count:document.querySelectorAll('.digital-page:not([hidden])').length,overflow:document.documentElement.scrollWidth>innerWidth, unclipped:[...page.children].every(el=>el.getBoundingClientRect().bottom<=box.bottom+1),innerScroll:page.scrollHeight>page.clientHeight+2,navOutside:nav.top>=box.bottom,indicator:document.querySelector('.reader-page-nav [role=status]').textContent};
  });
  assert(layout.count===1&&!layout.overflow&&layout.unclipped&&!layout.innerScroll&&layout.navOutside&&layout.indicator===`Page ${i} of ${count}`,`Page ${i}: complete, single, no clipping or overflow, navigation outside`);
  await button(i===count?'Finish →':'Next →').click();
  if(i%5===0) yield {result:'PASS',checks:[...checks]};
 }
 await tab.playwright.locator('#reader-end').waitFor({state:'visible'});
 assert(await tab.playwright.getByRole('link',{name:'Explore the Full Edition',exact:true}).isVisible(),'End returns to product');
 assert(await button('Give feedback').isVisible()&&await button('Share this preview').isVisible(),'End feedback and share');
 await button('← Previous').click();
 await tab.playwright.locator(`#preview-page-${count}`).waitFor({state:'visible'});
 await tab.playwright.locator(`#preview-page-${count}`).press('ArrowLeft');
 await tab.playwright.locator(`#preview-page-${count-1}`).waitFor({state:'visible'});
 await tab.playwright.locator(`#preview-page-${count-1}`).press('ArrowRight');
 await tab.playwright.locator(`#preview-page-${count}`).waitFor({state:'visible'});
 assert(await active()===`preview-page-${count}`,'Previous and keyboard left/right');
 await button('Contents').click();
 await tab.playwright.locator('dialog[open] button').press('Shift+Tab');
 assert(await tab.playwright.evaluate(()=>!!document.activeElement.closest('dialog[open]')),'Contents Shift+Tab contained');
 await tab.playwright.locator('dialog[open] a').last().press('Tab');
 assert(await tab.playwright.evaluate(()=>document.activeElement.textContent==='Close'),'Contents Tab wraps');
 await tab.playwright.locator('dialog[open] button').press('Escape');
 assert(await tab.playwright.evaluate(()=>!document.querySelector('dialog[open]')&&document.activeElement.textContent==='Contents'),'Contents Escape/focus return');
 yield {result:'PASS',checks:[...checks]};
 await button('Contents').click();
 const ids=await tab.playwright.locator('dialog[open] nav a').allTextContents({});
 const hrefs=await tab.playwright.locator('dialog[open] nav a').evaluateAll(els=>els.map(e=>e.getAttribute('href')));
 for(let i=0;i<hrefs.length;i++) {
  if(i)await button('Contents').click();
  await tab.playwright.locator(`dialog[open] nav a[href="${hrefs[i]}"]`).click();
  await tab.playwright.locator(hrefs[i]).waitFor({state:'visible'});
  assert(await tab.playwright.evaluate(id=>document.activeElement.id===id&&!document.querySelector('dialog[open]'),hrefs[i].slice(1)),`Contents jump: ${ids[i]}`);
  if(i%5===4) yield {result:'PASS',checks:[...checks]};
 }
 yield {result:'PASS',checks:[...checks]};
 await button('Feedback').click();
 await tab.playwright.locator('dialog[open]').waitFor({state:'visible'});
 const fd=tab.playwright.locator('dialog[open]');
 await tab.playwright.locator('dialog[open] select').nth(0).selectOption('5');
 await tab.playwright.locator('dialog[open] textarea').first().fill('Clear reading layout — QA draft only');
 await tab.playwright.locator('dialog[open] select').nth(1).selectOption('Good');
 await tab.playwright.locator('dialog[open] select').nth(2).selectOption('Maybe');
 const mail=await fd.getByRole('link',{name:'Open email draft',exact:true}).getAttribute('href');
 assert(mail.startsWith('mailto:contact@wealthpathaiglobal.com?')&&decodeURIComponent(mail).includes('Clear reading layout — QA draft only')&&decodeURIComponent(mail).includes('Full Edition interest: Maybe'),'Feedback populated mailto route; no message sent');
 const before=await active();
 await tab.playwright.locator('dialog[open] textarea').first().press('ArrowLeft');
 assert(await active()===before,'Form arrows do not turn pages');
 await fd.getByRole('button',{name:'Close',exact:true}).press('Shift+Tab');
 assert(await tab.playwright.evaluate(()=>!!document.activeElement.closest('dialog[open]')),'Feedback focus contained');
 await tab.playwright.locator('dialog[open] a').last().press('Tab');
 assert(await tab.playwright.evaluate(()=>document.activeElement.textContent==='Close'),'Feedback Tab wraps');
 await fd.getByRole('button',{name:'Close',exact:true}).press('Escape');
 assert(await tab.playwright.evaluate(()=>document.activeElement.textContent==='Feedback'),'Feedback Escape focus return');
 yield {result:'PASS',checks:[...checks]};
 await button('Share').click();
 await tab.playwright.locator('dialog[open]').waitFor({state:'visible'});
 if(await tab.playwright.locator('dialog[open]').count()) {
  await button('Copy Link').click();
  assert(await tab.clipboard.readText()==='https://www.wealthpathaiglobal.com/books/hfos-phase-1-stability/preview','Copy shares public preview start only');
  await tab.playwright.locator('dialog[open] a').last().press('Tab');
  assert(await tab.playwright.evaluate(()=>document.activeElement.textContent==='Close'),'Share Tab wraps');
  await tab.playwright.locator('dialog[open] button').first().press('Escape');
  assert(await tab.playwright.evaluate(()=>document.activeElement.textContent==='Share'),'Share Escape focus return');
 } else checks.push('Native share invoked; native outcome covered by unit tests');
 await button('Scroll').click();
 assert(await tab.playwright.locator('.digital-page:not([hidden])').count()===count,'Scroll exposes all preview pages');
 await tab.reload();
 await tab.playwright.locator('.reader-scroll').waitFor({state:'visible'});
 assert(await tab.playwright.locator('.digital-page:not([hidden])').count()===count,'Scroll preference persists after reload');
 await button('Pages').click();await button('Contents').click();await tab.playwright.locator('dialog[open] a[href="#preview-page-1"]').click();
 assert(await tab.playwright.evaluate(()=>document.querySelector('select[aria-label="Reading language"]').value==='en'&&document.querySelector('option[value="te"]').disabled),'English / Telugu Coming later');
 return {result:'PASS',checks};
}
