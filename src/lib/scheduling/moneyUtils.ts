import { Prisma } from "@prisma/client";

export function toMoney(
  value: Prisma.Decimal | string | number | null | undefined
): Prisma.Decimal {
  if (value === null || value === undefined || Number.isNaN(Number(value)) || !isFinite(Number(value))) {
    throw new Error("Invalid monetary value: Cannot convert null, undefined, NaN, or infinite values to Decimal.");
  }

  const decimal =
    value instanceof Prisma.Decimal
      ? value
      : new Prisma.Decimal(String(value));

  return decimal.toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP
  );
}
