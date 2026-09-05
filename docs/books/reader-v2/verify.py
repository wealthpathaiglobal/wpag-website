from pathlib import Path
import json,hashlib,urllib.request,urllib.error,sys,re,concurrent.futures
from html.parser import HTMLParser
SITE=Path(__file__).resolve().parents[3]
AUTH=Path('/Users/wealthpathaiglobal/Documents/01_Wealth_Path_AI_Global/01_BOOKS/01_PHASE_1_STABILITY/Release_Package/v1.0_2026-09-05')
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4320'
OUT=Path(__file__).parent
PUBLIC=['/books','/books/hfos-phase-1-stability','/books/hfos-phase-1-stability/preview']
PRIVATE=['/library','/account','/reader','/chapter/ch03','/books/hfos-phase-1-stability/chapter/ch03','/api/reader/ch03','/api/entitlements','/api/books/entitlements']+['/books/policies/'+s for s in ['access','refunds','privacy','terms','support']]
def get(path,method='GET'):
 req=urllib.request.Request(BASE+path,method=method,data=b'{}' if method=='POST' else None)
 try:r=urllib.request.urlopen(req,timeout=40)
 except urllib.error.HTTPError as e:r=e
 return r.status,dict(r.headers),r.read()
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.values={};self.key=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if a.get('id','').startswith(('src_','prod_')):self.key=a['id'];self.values[self.key]=''
 def handle_data(self,data):
  if self.key:self.values[self.key]+=data
 def handle_endtag(self,tag):
  if tag in ['p','h2','h3']:self.key=None
preview=[]
for name in ['front-matter','ch01','ch02']:
 source=AUTH/'Web_Reader/Preview'/f'{name}.json'
 assert source.read_bytes()==(SITE/'src/content/books'/source.name).read_bytes()
 preview+=json.loads(source.read_text())['paragraphs']
assert preview[-1]['id']=='src_D0202'
responses={p:get(p) for p in PUBLIC}
for p,(status,h,b) in responses.items():
 assert status==200,(p,status)
 s=b.decode();assert 'https://www.wealthpathaiglobal.com'+p in s
 assert 'noindex' not in s
 if p!=PUBLIC[-1]:assert 'Coming soon' in s and 'disabled=""' in s and '/books/policies' not in s
parsed=Parser();parsed.feed(responses[PUBLIC[-1]][2].decode())
expected={p['id']:p['links'][0]['text'] if p['style'].startswith('TOC') else p['text'] for p in preview if p['id'] not in {'prod_p0008','prod_p0009','prod_p0010'}}
assert parsed.values==expected
for label in ['Production master', 'NON-PUBLIC', 'RELEASE REVIEW REQUIRED', '5 September 2026']:
 assert label not in responses[PUBLIC[-1]][2].decode()
assert b'src_D0205' not in responses[PUBLIC[-1]][2]
for p in PRIVATE:
 status,h,b=get(p);assert status==404,(p,status)
 assert 'noindex' in h.get('X-Robots-Tag',h.get('x-robots-tag','')),(p,h)
 assert b'Not found'==b,(p,b[:100])
for p in ['/books/full.pdf','/books/full.zip','/books/ch03.json','/Web_Reader/Full/ch03.json','/api/books/chapters/ch03']:
 assert get(p)[0]==404,p
status,h,b=get('/api/books/orders','POST');assert status==503 and json.loads(b)=={'error':'PAYMENTS_DISABLED'}
sitemap=get('/sitemap.xml')[2].decode()
for p in PUBLIC:assert 'https://www.wealthpathaiglobal.com'+p in sitemap
for p in PRIVATE:assert p not in sitemap
assert 'https://wealthpathaiglobal.com' not in sitemap
assert b'https://www.wealthpathaiglobal.com/sitemap.xml' in get('/robots.txt')[2]
preview_text={p['text'] for p in preview}
protected=[]
for i in range(3,11):protected += [p['text'] for p in json.loads((AUTH/f'Web_Reader/Full/ch{i:02}.json').read_text())['paragraphs'] if len(p['text'])>100 and p['text'] not in preview_text]
files=list((SITE/'.next/static').rglob('*'))+list((SITE/'.next/server/app').rglob('*'))+list((SITE/'public').rglob('*'))
files=[p for p in files if p.is_file() and p.suffix in ['.js','.json','.html','.rsc','.txt','.body','.map','.pdf','.zip']]
for f in files:
 text=f.read_text(errors='replace')
 for value in protected: assert value not in text and json.dumps(value,ensure_ascii=False)[1:-1] not in text,str(f)
# Inspect every deployed client chunk referenced by the Books HTML.
chunks=set()
for _,_,b in responses.values(): chunks.update(re.findall(r'(?:src|href)="(/_next/static/[^"?]+\.js)',b.decode()))
for path in chunks:
 status,h,b=get(path);assert status==200
 text=b.decode()
 for value in protected:assert value not in text and json.dumps(value,ensure_ascii=False)[1:-1] not in text,path
cover=get('/books/hfos-phase1-800.webp');assert cover[0]==200 and cover[2]==(SITE/'public/books/hfos-phase1-800.webp').read_bytes()
assert cover[2]==(AUTH/'Cover/HFOS_Phase1_Cover_800px_v1.0.webp').read_bytes()
result={'public_paragraphs':len(expected),'base':BASE,'preview_paragraphs':len(preview),'last_id':preview[-1]['id'],'protected_paragraphs_scanned':len(protected),'build_files_scanned':len(files),'served_chunks_scanned':len(chunks),'private_routes_404_noindex':len(PRIVATE),'orders':'503 PAYMENTS_DISABLED','public_routes':PUBLIC,'cover_sha256':hashlib.sha256(cover[2]).hexdigest(),'result':'PASS'}
(OUT/('live-checks.json' if BASE.startswith('https') else 'local-checks.json')).write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
