import urllib.request,urllib.error,json
from pathlib import Path
b='https://www.wealthpathaiglobal.com'; root=Path('/Users/wealthpathaiglobal/Documents/01_Wealth_Path_AI_Global/01_BOOKS/01_PHASE_1_STABILITY/Release_Package/v1.0_2026-09-05/Web_Reader')
preview={p['text'] for n in ['front-matter','ch01','ch02'] for p in json.loads((root/'Preview'/f'{n}.json').read_text())['paragraphs']}
protected=[p['text'] for n in range(3,11) for p in json.loads((root/'Full'/f'ch{n:02}.json').read_text())['paragraphs'] if len(p['text'])>100 and p['text'] not in preview]
records=[]
for path in ['/books','/books/hfos-phase-1-stability','/books/hfos-phase-1-stability/preview']:
 r=urllib.request.urlopen(urllib.request.Request(b+path,headers={'RSC':'1'}),timeout=40);s=r.read().decode()
 assert r.status==200 and 'text/x-component' in r.headers.get('content-type','')
 assert 'src_D0205' not in s
 for label in ['Production master','NON-PUBLIC','RELEASE REVIEW REQUIRED']:
  assert label not in s
 for p in protected:assert p not in s and json.dumps(p,ensure_ascii=False)[1:-1] not in s
 records.append({'route':path,'status':r.status,'type':'RSC','protected_content':'absent'})
for path in ['/library','/account','/reader','/api/reader/ch03','/api/entitlements','/api/books/entitlements']:
 try:r=urllib.request.urlopen(urllib.request.Request(b+path,data=b'{}',method='POST'),timeout=40)
 except urllib.error.HTTPError as e:r=e
 assert r.status==404 and r.read()==b'Not found'
 records.append({'route':path,'method':'POST','status':404})
try:r=urllib.request.urlopen('https://wealthpathaiglobal.com/books',timeout=40);assert r.url==b+'/books'
except urllib.error.HTTPError as e:assert e.code==308 and e.headers['location']==b+'/books'
(Path(__file__).parent/'live-rsc-and-methods.json').write_text(json.dumps({'checks':records,'non_www_redirect':'www verified','result':'PASS'},indent=2));print('PASS: RSC payloads exclude protected content, private POST routes blocked, www redirect verified.')
