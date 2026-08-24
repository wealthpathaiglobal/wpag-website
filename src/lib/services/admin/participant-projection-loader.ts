export async function loadIndependentParticipantProjections<
  T extends Record<string, () => Promise<unknown>>,
>(loaders: T): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const entries = Object.entries(loaders);
  const values = await Promise.all(entries.map(([, load]) => load()));
  return Object.fromEntries(entries.map(([key], index) => [key, values[index]])) as {
    [K in keyof T]: Awaited<ReturnType<T[K]>>;
  };
}
