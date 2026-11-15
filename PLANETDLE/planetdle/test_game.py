"""Run with: python test_game.py (no third-party test packages required)."""
import unittest
from game_logic import OBJECTS, new_game, submit_guess, get_hint

class GameTests(unittest.TestCase):
    def test_all_targets_and_guesses(self):
        for target in OBJECTS:
            for guess in OBJECTS:
                game = new_game(daily=False)
                game['target'] = target
                result = submit_guess(game, guess)
                self.assertTrue(result['ok'], (target, guess))
                self.assertIn('game', result)
                self.assertEqual(result['won'], target == guess)
                self.assertEqual(len(result['row']['feedback']), 6)
    def test_target_facts_on_every_accepted_guess(self):
        for target in OBJECTS:
            game = new_game(daily=False)
            game["target"] = target
            guesses = [name for name in OBJECTS if name != target]
            first = submit_guess(game, guesses[0])
            second = submit_guess(game, guesses[1])
            self.assertTrue(first["fun_fact"])
            self.assertTrue(second["fun_fact"])
            self.assertNotEqual(first["fun_fact"], second["fun_fact"])
            self.assertNotIn("fun_fact", submit_guess(game, guesses[0]))
            winning_game = new_game(daily=False)
            winning_game["target"] = target
            win = submit_guess(winning_game, target)
            self.assertTrue(win["won"])
            self.assertTrue(win["fun_fact"])
            self.assertTrue(win["over"])
    def test_invalid_and_duplicate(self):
        game = new_game()
        self.assertFalse(submit_guess(game, 'not a planet')['ok'])
        first = next(iter(OBJECTS))
        game['target'] = next(name for name in OBJECTS if name != first)
        self.assertTrue(submit_guess(game, first)['ok'])
        self.assertFalse(submit_guess(game, first)['ok'])
    def test_hint_limit(self):
        game = new_game()
        for i in range(3):
            self.assertTrue(get_hint(game)['ok'])
        self.assertFalse(get_hint(game)['ok'])
    def test_six_guesses(self):
        game = new_game()
        target = game['target']
        other = [name for name in OBJECTS if name != target][:6]
        for name in other:
            result = submit_guess(game, name)
        self.assertTrue(result['over'])
        self.assertFalse(result['won'])
        self.assertEqual(result['answer'], target)
        self.assertFalse(submit_guess(game, target)['ok'])

if __name__ == '__main__':
    unittest.main()
