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

type ParticipantQueryBuilder = {
  select: Mock<(columns: string) => QueryBuilder>;
  eq: Mock<(column: string, value: unknown) => QueryBuilder>;
  maybeSingle: Mock<
    () => Promise<SupabaseMockResult<unknown>>
  >;
};

type QueryBuilder = ParticipantQueryBuilder;

type InvitationQueryBuilder = Record<string, unknown>;

type AuthInviteOptions = {
  redirectTo: string;
  data: Record<string, unknown>;
};

type AuthUser = {
  id: string;
};

type AuthInviteResult = {
  data: {
    user: AuthUser | null;
  };
  error: SupabaseMockError | null;
};

type DeleteUserResult = {
  data: unknown;
  error: SupabaseMockError | null;
};

export type ActiveInvitationLookupSpies = {
  select: Mock<(columns: string) => ActiveInvitationLookupSpies>;
  eq: Mock<
    (
      column: string,
      value: unknown
    ) => ActiveInvitationLookupSpies
  >;
  in: Mock<
    (
      column: string,
      values: readonly unknown[]
    ) => ActiveInvitationLookupSpies
  >;
  maybeSingle: Mock<
    () => Promise<SupabaseMockResult<unknown>>
  >;
};

export type InvitationInsertSpies = {
  insert: Mock<
    (payload: Record<string, unknown>) => InvitationInsertSpies
  >;
  select: Mock<() => InvitationInsertSpies>;
  single: Mock<
    () => Promise<SupabaseMockResult<unknown>>
  >;
};

export type InvitationFailureUpdateSpies = {
  update: Mock<
    (
      payload: Record<string, unknown>
    ) => InvitationFailureUpdateSpies
  >;
  eq: Mock<
    (
      column: string,
      value: unknown
    ) => Promise<SupabaseMockResult<unknown>>
  >;
};

export type InvitationFinalizationSpies = {
  update: Mock<
    (
      payload: Record<string, unknown>
    ) => InvitationFinalizationSpies
  >;
  eq: Mock<
    (
      column: string,
      value: unknown
    ) => InvitationFinalizationSpies
  >;
  select: Mock<() => InvitationFinalizationSpies>;
  single: Mock<
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

const invitationOperationQueue: InvitationQueryBuilder[] = [];

const from = vi.fn<
  (
    table: string
  ) => ParticipantQueryBuilder | InvitationQueryBuilder
>();
const rpc = vi.fn<
  (
    functionName: string,
    payload: Record<string, unknown>
  ) => Promise<SupabaseMockResult<unknown>>
>();
const inviteUserByEmail = vi.fn<
  (
    email: string,
    options: AuthInviteOptions
  ) => Promise<AuthInviteResult>
>();
const deleteUser = vi.fn<
  (authUserId: string) => Promise<DeleteUserResult>
>();

export const supabaseAdminMock = {
  from,
  rpc,
  auth: {
    admin: {
      inviteUserByEmail,
      deleteUser,
    },
  },
};

export const supabaseAdminSpies = {
  from,
  select: participantQuery.select,
  eq: participantQuery.eq,
  maybeSingle,
  rpc,
  inviteUserByEmail,
  deleteUser,
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

export function queueRpcResult<T>(
  result: SupabaseMockResult<T>
): void {
  rpc.mockResolvedValueOnce(result);
}

export function queueActiveInvitationLookup<T>(
  result: SupabaseMockResult<T>
): ActiveInvitationLookupSpies {
  // Fluent builders are initialized incrementally; this narrow cast
  // supplies the self-referential test-only method shape.
  const builder = {} as ActiveInvitationLookupSpies;

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);

  invitationOperationQueue.push(builder);

  return builder;
}

export function queueInvitationInsert<T>(
  result: SupabaseMockResult<T>
): InvitationInsertSpies {
  const builder = {} as InvitationInsertSpies;

  builder.insert = vi.fn(() => builder);
  builder.select = vi.fn(() => builder);
  builder.single = vi.fn().mockResolvedValue(result);

  invitationOperationQueue.push(builder);

  return builder;
}

export function queueInvitationFailureUpdate(
  result: SupabaseMockResult<unknown> = successfulResult(null)
): InvitationFailureUpdateSpies {
  const builder = {} as InvitationFailureUpdateSpies;

  builder.update = vi.fn(() => builder);
  builder.eq = vi.fn().mockResolvedValue(result);

  invitationOperationQueue.push(builder);

  return builder;
}

export function queueInvitationFinalization<T>(
  result: SupabaseMockResult<T>
): InvitationFinalizationSpies {
  const builder = {} as InvitationFinalizationSpies;

  builder.update = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.select = vi.fn(() => builder);
  builder.single = vi.fn().mockResolvedValue(result);

  invitationOperationQueue.push(builder);

  return builder;
}

export function setAuthInviteResult(
  result: AuthInviteResult
): void {
  inviteUserByEmail.mockResolvedValue(result);
}

export function setDeleteUserResult(
  result: DeleteUserResult
): void {
  deleteUser.mockResolvedValue(result);
}

export function resetSupabaseAdminMock(): void {
  vi.resetAllMocks();
  invitationOperationQueue.length = 0;

  participantQuery.select.mockImplementation(
    () => participantQuery
  );
  participantQuery.eq.mockImplementation(() => participantQuery);
  from.mockImplementation((table) => {
    if (table === "participants") {
      return participantQuery;
    }

    if (table === "participant_invitations") {
      const operation = invitationOperationQueue.shift();

      if (!operation) {
        throw new Error(
          "No participant invitation mock operation was queued."
        );
      }

      return operation;
    }

    throw new Error(`Unexpected Supabase mock table: ${table}`);
  });

  setParticipantLookupResult(nullResult());
  setRpcResult(nullResult());
  setAuthInviteResult({
    data: {
      user: null,
    },
    error: null,
  });
  setDeleteUserResult({
    data: null,
    error: null,
  });
}

resetSupabaseAdminMock();
