import urllib.request,urllib.error,json,concurrent.futures
from pathlib import Path
from html.parser import HTMLParser
OUT=Path(__file__).parent
class Main(HTMLParser):
 def __init__(self):super().__init__();self.on=False;self.text=[]
 def handle_starttag(self,t,a):
  if t=='main':self.on=True
 def handle_endtag(self,t):
  if t=='main':self.on=False
 def handle_data(self,s):
  if self.on and s.strip():self.text.append(s.strip())
def read(path):
 try:r=urllib.request.urlopen('https://www.wealthpathaiglobal.com'+path,timeout=40)
 except urllib.error.HTTPError as e:r=e
 p=Main();p.feed(r.read().decode());return path,{'status':r.status,'main':p.text,'url':r.url}
before=json.loads((OUT/'production-before.json').read_text())
after=dict(concurrent.futures.ThreadPoolExecutor(5).map(read,before))
assert before==after,[p for p in before if before[p]!=after[p]]
(OUT/'production-regression.json').write_text(json.dumps({'result':'PASS','routes':list(before),'status_url_main_content':'identical to pre-deployment baseline'},indent=2))
print('PASS: all 12 existing route status, URL and main-content baselines unchanged.')
