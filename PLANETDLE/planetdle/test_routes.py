"""Integration tests to run on a computer with Flask installed: python -m unittest -v."""
import unittest
try:
    from app import app, _GAMES
    from game_logic import OBJECTS
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

@unittest.skipUnless(FLASK_AVAILABLE, 'Install Flask from requirements.txt to run route tests')
class RouteTests(unittest.TestCase):
    def setUp(self):
        app.testing = True
        self.client = app.test_client()
        self.client.get('/')
    def test_first_guess_and_duplicate(self):
        self.assertTrue(self.client.post('/api/guess',json={'guess':'Mercury'}).get_json()['ok'])
        repeated = self.client.post('/api/guess',json={'guess':'Mercury'}).get_json()
        self.assertFalse(repeated['ok'])
        self.assertIn('already',repeated['error'].lower())
    def test_session_contains_no_secret_answer(self):
        with self.client.session_transaction() as session:
            self.assertEqual(set(session),{'game_id'})
            self.assertNotIn('target',str(session))
    def test_invalid_then_practice_reset(self):
        self.assertFalse(self.client.post('/api/guess',json={'guess':'not real'}).get_json()['ok'])
        self.client.post('/api/guess',json={'guess':'Mercury'})
        self.assertTrue(self.client.post('/api/new',json={'practice':True}).get_json()['ok'])
        self.assertTrue(self.client.post('/api/guess',json={'guess':'Mercury'}).get_json()['ok'])
    def test_loss_and_no_extra_guesses(self):
        with self.client.session_transaction() as session:
            _GAMES[session['game_id']][1]['target'] = 'Jupiter'
        others=[x for x in OBJECTS if x!='Jupiter'][:6]
        for name in others:
            res=self.client.post('/api/guess',json={'guess':name}).get_json()
            self.assertTrue(res['ok'])
        self.assertTrue(res['over']);self.assertFalse(res['won'])
        self.assertFalse(self.client.post('/api/guess',json={'guess':'Jupiter'}).get_json()['ok'])
    def test_instant_win(self):
        with self.client.session_transaction() as session:
            _GAMES[session['game_id']][1]['target']='Jupiter'
        res=self.client.post('/api/guess',json={'guess':'Jupiter'}).get_json()
        self.assertTrue(res['ok'] and res['won'] and res['over'])
        self.assertEqual(res['answer'],'Jupiter')
    def test_texture_missing_is_404(self):
        self.assertEqual(self.client.get('/api/texture/Halley%27s%20Comet').status_code,404)

if __name__ == '__main__': unittest.main()
