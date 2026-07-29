/**
 * WPAG Admin Application Service
 *
 * Responsibilities:
 * - Provide application-review data to the admin UI
 * - Validate incoming application identifiers
 * - Keep database access inside the repository layer
 *
 * This file must not:
 * - Query Supabase directly
 * - Render UI
 * - Approve or reject applications
 * - Create participant records
 */

import { AdminApplicationRepository } from "@/lib/repositories/admin/admin-application-repository";

import type {
  AdminApplicationDetail,
  AdminApplicationListItem,
} from "@/lib/types/admin/admin-application";

export class AdminApplicationServiceError extends Error {
  readonly operation: string;

  constructor(operation: string, message: string) {
    super(message);

    this.name = "AdminApplicationServiceError";
    this.operation = operation;
  }
}

export class AdminApplicationService {
  constructor(
    private readonly repository = new AdminApplicationRepository(),
  ) {}

  async getPendingApplications(): Promise<AdminApplicationListItem[]> {
    return this.repository.getPendingApplications();
  }

  async getApplicationById(
    applicationId: string,
  ): Promise<AdminApplicationDetail | null> {
    const normalizedApplicationId = applicationId.trim();

    if (!normalizedApplicationId) {
      throw new AdminApplicationServiceError(
        "getApplicationById",
        "Application ID is required.",
      );
    }

    return this.repository.getApplicationById(
      normalizedApplicationId,
    );
  }
}

export const adminApplicationService =
  new AdminApplicationService();