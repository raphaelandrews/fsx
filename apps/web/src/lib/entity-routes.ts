import { notFound } from "@tanstack/react-router";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Toast copy shared by the create, update and delete mutations of one entity. */
export function entityMessages(noun: string) {
  return {
    create: { success: `${capitalize(noun)} created`, failure: `Failed to create ${noun}` },
    update: { success: `${capitalize(noun)} updated`, failure: `Failed to update ${noun}` },
    delete: { success: `${capitalize(noun)} deleted`, failure: `Failed to delete ${noun}` },
  };
}

/** Route loader step: 404 unless the id is in a collection that edit pages read from. */
export async function ensureListRecord<T extends { id: number }>(
  records: Promise<T[]>,
  id: number,
) {
  if (!(await records).some((record) => record.id === id)) throw notFound();
}
