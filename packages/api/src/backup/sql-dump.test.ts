import { describe, expect, test } from "bun:test";

import { splitSqlStatements } from "./sql-dump";

describe("splitSqlStatements", () => {
  test("splits on semicolons outside quotes and comments", () => {
    const dump = [
      "PRAGMA defer_foreign_keys=TRUE;",
      "CREATE TABLE `posts` (",
      "  `title` text, -- headline; may contain ;",
      '  "body" text',
      ");",
      "INSERT INTO posts VALUES('It''s; fine','a \"quoted\"; body');",
      "INSERT INTO posts VALUES('second','x');",
    ].join("\n");
    expect(splitSqlStatements(dump)).toEqual([
      "PRAGMA defer_foreign_keys=TRUE",
      "CREATE TABLE `posts` (\n  `title` text, \n  \"body\" text\n)",
      "INSERT INTO posts VALUES('It''s; fine','a \"quoted\"; body')",
      "INSERT INTO posts VALUES('second','x')",
    ]);
  });
});
