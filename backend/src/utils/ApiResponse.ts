// ============================================================
// ApiResponse — Standard success response envelope
// All successful API responses follow this structure for
// consistency and easy frontend consumption.
// ============================================================

export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T;
  public readonly timestamp: string;

  constructor(statusCode: number, message: string, data: T) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 200 OK
   */
  static ok<T>(message: string, data: T): ApiResponse<T> {
    return new ApiResponse(200, message, data);
  }

  /**
   * 201 Created
   */
  static created<T>(message: string, data: T): ApiResponse<T> {
    return new ApiResponse(201, message, data);
  }

  /**
   * 204 No Content (returns empty data)
   */
  static noContent(message: string = 'No content'): ApiResponse<null> {
    return new ApiResponse(204, message, null);
  }
}

// ============================================================
// Paginated Response — For list endpoints
// ============================================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class PaginatedResponse<T> {
  public readonly success = true;
  public readonly statusCode = 200;
  public readonly message: string;
  public readonly data: T[];
  public readonly pagination: PaginationMeta;
  public readonly timestamp: string;

  constructor(message: string, data: T[], meta: PaginationMeta) {
    this.message = message;
    this.data = data;
    this.pagination = meta;
    this.timestamp = new Date().toISOString();
  }

  static create<T>(
    message: string,
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    return new PaginatedResponse(message, data, {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  }
}
