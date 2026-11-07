import "server-only";

import path from "node:path";
import type { Order } from "@/lib/types";
import { readJson } from "./json-store";

const ORDERS_PATH = path.join(process.cwd(), "data/orders.json");

export async function findOrder(orderNumber: string, email: string) {
  const orders = await readJson<Order[]>(ORDERS_PATH);
  const normalizedOrder = orderNumber.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  return (
    orders.find(
      (order) =>
        order.orderNumber.toUpperCase() === normalizedOrder &&
        order.email.toLowerCase() === normalizedEmail,
    ) ?? null
  );
}
