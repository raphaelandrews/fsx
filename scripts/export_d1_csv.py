#!/usr/bin/env python3
import csv
import sqlite3
import sys
from pathlib import Path


FORMULA_PREFIXES = ("=", "+", "-", "@")


def safe_csv_value(value):
    if isinstance(value, str) and value.lstrip(" \t\r\n").startswith(FORMULA_PREFIXES):
        return "'" + value
    return value


def quote_identifier(value):
    return '"' + value.replace('"', '""') + '"'


def export_database(database_path: str, output_directory: str):
    output = Path(output_directory)
    output.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    try:
        tables = connection.execute(
            "SELECT name FROM sqlite_schema WHERE type='table' "
            "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' "
            "AND name != 'd1_migrations' ORDER BY name"
        ).fetchall()
        exported = []
        for (table_name,) in tables:
            table_identifier = quote_identifier(table_name)
            columns = [row[1] for row in connection.execute(f"PRAGMA table_info({table_identifier})")]
            cursor = connection.execute(f"SELECT * FROM {table_identifier}")
            row_count = 0
            with (output / f"{table_name}.csv").open("w", newline="", encoding="utf-8-sig") as csv_file:
                writer = csv.writer(csv_file)
                writer.writerow(columns)
                for row in cursor:
                    writer.writerow([safe_csv_value(value) for value in row])
                    row_count += 1
            print(f"   • {table_name}.csv ({row_count} rows)")
            exported.append(table_name)
        return exported
    finally:
        connection.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: export-d1-csv.py <sqlite-database> <output-directory>")
    export_database(sys.argv[1], sys.argv[2])
