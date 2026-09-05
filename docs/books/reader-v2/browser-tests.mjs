// Run with the connected CUA tab; no independent browser process required.
export async function checkReader(tab) {
 const result = {checks:[]};
 const assert = (value, message) => { if(!value) throw Error(message); result.checks.push(message); };
 const contents = () => tab.playwright.getByRole('button',{name:'Contents',exact:true}).last();
 await contents().click();
 const close = tab.playwright.getByRole('button',{name:'Close',exact:true});
 await close.press('Shift+Tab');
 assert(await tab.playwright.evaluate(()=>!!document.activeElement.closest('dialog')), 'Shift Tab contained');
 await tab.playwright.locator('dialog a').last().press('Tab');
 assert(await tab.playwright.evaluate(()=>document.activeElement.textContent==='Close'),'Tab wraps to Close');
 await close.press('Escape');
 assert(await tab.playwright.evaluate(()=>!document.querySelector('dialog').open && document.activeElement.textContent==='Contents'),'Escape closes and returns focus');
 await contents().click();
 await tab.playwright.locator('dialog a[href="#src_D0189"]').click();
 assert(await tab.playwright.evaluate(()=>document.activeElement.id==='src_D0189'&&!document.querySelector('dialog').open),'Section jump focuses heading and closes');
 await tab.playwright.getByRole('link',{name:'← Previous',exact:true}).click();
 assert(await tab.playwright.evaluate(()=>document.activeElement.id==='src_D0173'),'Previous reaches 2.3');
 await tab.playwright.getByRole('link',{name:'Next →',exact:true}).click();
 assert(await tab.playwright.evaluate(()=>document.activeElement.id==='src_D0189'),'Next reaches 2.4');
 await tab.playwright.getByRole('link',{name:'Preview end →',exact:true}).click();
 assert(await tab.playwright.evaluate(()=>document.activeElement.id==='reader-end'),'Preview end reachable');
 assert(await tab.playwright.evaluate(()=>document.querySelector('option[value="te"]').disabled&&document.querySelector('select').value==='en'),'Telugu unavailable; English selected');
 assert(await tab.playwright.evaluate(()=>!!document.getElementById('src_D0202')&&!document.getElementById('src_D0205')),'D0202 boundary');
 assert(await tab.playwright.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
 result.result='PASS'; return result;
}
