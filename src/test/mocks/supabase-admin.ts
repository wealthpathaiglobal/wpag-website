import { vi, type Mock } from "vitest";

export type SupabaseMockError = {
  code: string;
  message: string;
  details?: string;
  hint?: string;
};

export type SupabaseMockResult<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: SupabaseMockError;
    };

type QueryBuilder = {
  select: Mock<(columns: string) => QueryBuilder>;
  eq: Mock<(column: string, value: unknown) => QueryBuilder>;
  maybeSingle: Mock<
    () => Promise<SupabaseMockResult<unknown>>
  >;
};

export function successfulResult<T>(
  data: T
): SupabaseMockResult<T> {
  return {
    data,
    error: null,
  };
}

export function nullResult(): SupabaseMockResult<null> {
  return {
    data: null,
    error: null,
  };
}

export function errorResult(
  message: string,
  code = "SUPABASE_ERROR"
): SupabaseMockResult<never> {
  return {
    data: null,
    error: {
      code,
      message,
    },
  };
}

const maybeSingle =
  vi.fn<() => Promise<SupabaseMockResult<unknown>>>();

const participantQuery: QueryBuilder = {
  select: vi.fn<(columns: string) => QueryBuilder>(),
  eq: vi.fn<
    (column: string, value: unknown) => QueryBuilder
  >(),
  maybeSingle,
};

const from = vi.fn<(table: string) => QueryBuilder>();
const rpc = vi.fn<
  (
    functionName: string,
    payload: Record<string, unknown>
  ) => Promise<SupabaseMockResult<unknown>>
>();

export const supabaseAdminMock = {
  from,
  rpc,
};

export const supabaseAdminSpies = {
  from,
  select: participantQuery.select,
  eq: participantQuery.eq,
  maybeSingle,
  rpc,
};

export function setParticipantLookupResult<T>(
  result: SupabaseMockResult<T>
): void {
  maybeSingle.mockResolvedValue(result);
}

export function setRpcResult<T>(
  result: SupabaseMockResult<T>
): void {
  rpc.mockResolvedValue(result);
}

export function resetSupabaseAdminMock(): void {
  vi.resetAllMocks();

  participantQuery.select.mockImplementation(
    () => participantQuery
  );
  participantQuery.eq.mockImplementation(() => participantQuery);
  from.mockReturnValue(participantQuery);

  setParticipantLookupResult(nullResult());
  setRpcResult(nullResult());
}

resetSupabaseAdminMock();
