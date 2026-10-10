import { AppError } from "@/utils/errors";

export class CalculationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("CALCULATION_ERROR", message, details);
    this.name = "CalculationError";
  }
}
