import { Prisma } from "@prisma/client";

export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function toPrismaNullableJson(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}
