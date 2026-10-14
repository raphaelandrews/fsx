export type MeteredStatement = { sql: string; params: unknown[] };

export type D1Meter = {
  binding: D1Database;
  readonly queries: number;
  readonly statements: readonly MeteredStatement[];
};

const TARGET = Symbol("d1-meter-target");
const META = Symbol("d1-meter-meta");

type Metered = { [TARGET]?: D1PreparedStatement; [META]?: MeteredStatement };

// Counts statements a request sends to D1. With `record`, it also keeps SQL and
// params so a measurement run can replay them with `.all()` and read D1's
// `rows_read`; drizzle selects use `raw()`, which returns no metadata.
export function meterD1(database: D1Database, options: { record?: boolean } = {}): D1Meter {
  let queries = 0;
  const statements: MeteredStatement[] = [];

  const track = (meta: MeteredStatement | undefined) => {
    queries += 1;
    if (options.record && meta) statements.push(meta);
  };

  const wrap = (statement: D1PreparedStatement, meta: MeteredStatement): D1PreparedStatement =>
    new Proxy(statement, {
      get(target, property) {
        if (property === TARGET) return target;
        if (property === META) return meta;
        if (property === "bind") {
          return (...values: unknown[]) => wrap(target.bind(...values), { sql: meta.sql, params: values });
        }
        const value = Reflect.get(target, property, target);
        if (typeof value !== "function") return value;
        if (property === "all" || property === "run" || property === "raw" || property === "first") {
          return (...args: unknown[]) => {
            track(meta);
            return value.apply(target, args);
          };
        }
        return value.bind(target);
      },
    });

  const binding = new Proxy(database, {
    get(target, property) {
      if (property === "prepare") {
        return (sql: string) => wrap(target.prepare(sql), { sql, params: [] });
      }
      if (property === "batch") {
        return (batch: D1PreparedStatement[]) => {
          for (const statement of batch) track((statement as Metered)[META]);
          return target.batch(batch.map((statement) => (statement as Metered)[TARGET] ?? statement));
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  return {
    binding,
    get queries() {
      return queries;
    },
    get statements() {
      return statements;
    },
  };
}
