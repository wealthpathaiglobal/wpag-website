import urllib.request,urllib.error,json,concurrent.futures,sys
from pathlib import Path
from html.parser import HTMLParser
OUT=Path(__file__).parent
BASE=sys.argv[1] if len(sys.argv)>1 else 'https://www.wealthpathaiglobal.com'
class Main(HTMLParser):
 def __init__(self):super().__init__();self.on=False;self.text=[]
 def handle_starttag(self,t,a):
  if t=='main':self.on=True
 def handle_endtag(self,t):
  if t=='main':self.on=False
 def handle_data(self,s):
  if self.on and s.strip():self.text.append(s.strip())
def read(path):
 try:r=urllib.request.urlopen(BASE+path,timeout=40)
 except urllib.error.HTTPError as e:r=e
 p=Main();p.feed(r.read().decode());return path,{'status':r.status,'main':p.text,'url':r.url}
before=json.loads((OUT/'production-before.json').read_text())
after=dict(concurrent.futures.ThreadPoolExecutor(5).map(read,before))
for path, record in after.items():
 record['url']=record['url'].replace(BASE, 'https://www.wealthpathaiglobal.com')
 if path in ['/privacy-policy','/terms-of-use','/cookie-policy']:
  assert record['main'][:3]==['Home','Books','Back to Phase 1']
  assert record['main'][-3:]==['Home','Books','Back to Phase 1']
  record['main']=record['main'][3:-3]
assert before==after,[p for p in before if before[p]!=after[p]]
(OUT/'production-regression.json').write_text(json.dumps({'result':'PASS','routes':list(before),'status_url_main_content':'identical canonical page content; policy return navigation excluded explicitly'},indent=2))
print('PASS: all 12 existing route status, URL and main-content baselines unchanged.')
