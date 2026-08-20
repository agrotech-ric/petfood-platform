import unittest

from app.kcal_calculate import kcal_calculate


class KcalCalculateTest(unittest.TestCase):
    def test_lactation_accepts_unspecified_week(self):
        for lactation_week in ("none", None):
            with self.subTest(lactation_week=lactation_week):
                kcal, formula, page, additional_text = kcal_calculate(
                    reproductive_status="lactation",
                    berem_time=None,
                    num_pup=0,
                    L_time=lactation_week,
                    age_type="adult",
                    weight=12,
                    expected=12,
                    activity_level="active",
                    user_breed="basset hound",
                    age=2,
                )

                self.assertGreater(kcal, 0)
                self.assertEqual("lactation_num_pup_less_5", formula)
                self.assertEqual("56", page)
                self.assertIn("неуказанного периода лактации", additional_text)


if __name__ == "__main__":
    unittest.main()
