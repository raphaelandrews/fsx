import csv
import sqlite3
import tempfile
import unittest
from pathlib import Path

from export_d1_csv import export_database, safe_csv_value


class CsvExportTests(unittest.TestCase):
    def test_prefixes_formula_like_text_without_changing_numbers(self):
        for value in ("=1+1", "+SUM(A1:A2)", "-cmd", "@SUM(A1)", "  =1+1"):
            with self.subTest(value=value):
                self.assertTrue(safe_csv_value(value).startswith("'"))
        self.assertEqual(safe_csv_value(12), 12)
        self.assertEqual(safe_csv_value("ordinary text"), "ordinary text")

    def test_export_escapes_formula_cells(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "fixture.sqlite"
            output_directory = Path(temp_dir) / "csv"
            with sqlite3.connect(database_path) as connection:
                connection.execute("CREATE TABLE players (name TEXT, rating INTEGER)")
                connection.execute("INSERT INTO players VALUES (?, ?)", ("=1+1", 1800))

            self.assertEqual(export_database(str(database_path), str(output_directory)), ["players"])
            with (output_directory / "players.csv").open(encoding="utf-8-sig", newline="") as csv_file:
                row = next(csv.DictReader(csv_file))

            self.assertEqual(row["name"], "'=1+1")
            self.assertEqual(row["rating"], "1800")


if __name__ == "__main__":
    unittest.main()
