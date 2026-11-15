import concurrent.futures
import sys
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).parent))
from app import app
from game_logic import LEARNING_NOTES, new_game, OBJECTS

class ReleaseChecks(unittest.TestCase):
    def setUp(self):
        self.c=app.test_client()
    def read_round(self):
        import re,json
        page=self.c.get('/').get_data(as_text=True)
        return json.loads(re.search(r'<script id="round-history" type="application/json">(.*?)</script>',page)[1])
    def post(self,name,round,attempts):
        return self.c.post('/api/guess',json={'guess':name,'round_id':round,'attempts':attempts})
    def test_refresh_and_cross_tab(self):
        original=self.read_round()
        name=next(n for n in OBJECTS if n!=new_game()['target'])
        r=self.post(name,original['id'],0)
        self.assertTrue(r.json['ok'])
        self.assertNotIn('answer',r.json)
        after=self.read_round()
        self.assertEqual(after['id'],original['id'])
        self.assertEqual(after['guesses'],[r.json])
        self.assertEqual(self.post(name,original['id'],0).status_code,409)
        new_round=self.c.post('/api/new',json={'practice':True}).json
        self.assertNotEqual(new_round['round_id'],original['id'])
        self.assertEqual(self.post(name,original['id'],0).status_code,409)
        self.assertEqual(self.read_round()['guesses'],[])
    def test_malformed(self):
        for path in ('/api/guess','/api/new'):
            for data in (['Mars'],'Mars',10,True):
                self.assertEqual(self.c.post(path,json=data).status_code,400)
    def test_texture_and_mesh_routes(self):
        for name in OBJECTS:
            reply=self.c.get('/api/texture/'+name)
            if name == "Halley's Comet":
                self.assertEqual(reply.status_code,404)
            else:
                self.assertEqual(reply.status_code,200)
                self.assertTrue(reply.data.startswith(b'\xff\xd8\xff'))
        for name in ('pluto','bennu','vesta','ceres','phobos','halley'):
            import struct
            with self.c.get(f'/static/planet_maps/{name}-mesh.bin') as reply:
                body=reply.get_data()
            points,indices=struct.unpack_from('<II',body)
            self.assertEqual(len(body),8+32*points+2*indices)
    def test_notes_and_hint_route(self):
        self.assertEqual(len(set(LEARNING_NOTES)),15)
        self.read_round()
        hints=[self.c.post('/api/hint').json for _ in range(4)]
        self.assertEqual([entry.get('remaining') for entry in hints],[2,1,0,None])
        self.assertFalse(hints[-1]['ok'])
        self.assertEqual(len({entry['message'] for entry in hints[:3]}),3)
    def test_gallery_excludes_events_and_partial_name_matches(self):
        import io,json
        from unittest.mock import patch
        from app import _NASA_CACHE
        _NASA_CACHE.pop("Mars", None)
        def item(title, key):
            return {"data":[{"title":title,"nasa_id":key,"media_type":"image"}],
                    "links":[{"render":"image","href":f"https://images-assets.nasa.gov/{key}~small.jpg"}]}
        payload={"collection":{"items":[item("Mars research event","event"),
            item("Marsh on Earth","partial"),item("Mars from space","valid")]}}
        with patch("app.urlopen",return_value=io.BytesIO(json.dumps(payload).encode())):
            result=self.c.get("/api/nasa/Mars").json
            self.assertEqual([entry["nasa_id"] for entry in result["items"]],["valid"])
        _NASA_CACHE.pop("Mars", None)
    def test_earth_gallery_does_not_depend_on_nasa_search(self):
        from unittest.mock import patch
        with patch("app.urlopen", side_effect=TimeoutError) as upstream:
            response = self.c.get("/api/nasa/Earth")
        upstream.assert_not_called()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [entry["nasa_id"] for entry in response.json["items"]],
            ["AS17-148-22727", "AS08-14-2383", "DSCOVR-EPIC-20150706"],
        )
    def test_two_sessions(self):
        one=self.read_round()
        with app.test_client() as other:
            page=other.get('/').get_data(as_text=True)
            self.assertNotIn(one['id'],page)
    def test_once_on_parallel_submissions(self):
        round_id=self.read_round()['id']
        cookie=self.c.get_cookie('session').value
        names=list(OBJECTS)[:2]
        def make_guess(name):
            with app.test_client() as client:
                client.set_cookie('session',cookie)
                return client.post('/api/guess',json={'round_id':round_id,'attempts':0,'guess':name}).status_code
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            self.assertEqual(sorted(pool.map(make_guess,names)),[200,409])
        self.assertEqual(len(self.read_round()['guesses']),1)
if __name__=='__main__':
    unittest.main()
