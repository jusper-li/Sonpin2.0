export interface ShippingCategoryRow {
  id: string;
  name: string;
  quantity: number | null;
  amount: number | null;
}

export interface ShippingQuoteItem {
  productId: string;
  quantity: number;
}

export interface ShippingQuoteBreakdownItem {
  categoryId: string;
  categoryName: string;
  quantity: number;
  quantityLabel: string;
  amount: number;
  fee: number;
}

export interface ShippingQuoteResult {
  shippingTotal: number;
  breakdown: ShippingQuoteBreakdownItem[];
}

interface ProductShippingRow {
  id: string;
  shipping_category_id: string | null;
}

export function calculateShippingQuote(
  items: ShippingQuoteItem[],
  products: ProductShippingRow[],
  categories: ShippingCategoryRow[]
): ShippingQuoteResult {
  const productById = new Map(products.map((product) => [product.id, product]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const grouped = new Map<
    string,
    {
      categoryName: string;
      quantity: number;
      matchingCategories: ShippingCategoryRow[];
    }
  >();

  for (const item of items) {
    const product = productById.get(item.productId);
    const categoryId = product?.shipping_category_id;
    if (!categoryId) continue;

    const category = categoryById.get(categoryId);
    if (!category) continue;

    const quantity = Math.max(0, Number(item.quantity || 0));
    if (quantity <= 0) continue;

    const groupKey = category.name.trim();
    if (!groupKey) continue;

    const existing = grouped.get(groupKey);
    if (existing) {
      existing.quantity += quantity;
      if (!existing.matchingCategories.some((row) => row.id === category.id)) {
        existing.matchingCategories.push(category);
      }
      continue;
    }

    grouped.set(groupKey, {
      categoryName: category.name,
      quantity,
      matchingCategories: [category],
    });
  }

  const breakdown = Array.from(grouped.values())
    .map((entry) => {
      const candidates = entry.matchingCategories
        .filter((row) => row.quantity !== null && row.amount !== null)
        .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0));

      const chosen =
        candidates
          .filter((row) => Number(row.quantity || 0) <= entry.quantity)
          .at(-1) ||
        candidates[0] ||
        null;

      const fee = Math.max(0, Number(chosen?.amount || 0));
      const start = Number(chosen?.quantity || 1);
      const nextStart = candidates.find((row) => Number(row.quantity || 0) > start)?.quantity;

      return {
        categoryId: chosen?.id || candidates[0]?.id || entry.categoryName,
        categoryName: entry.categoryName,
        quantity: entry.quantity,
        quantityLabel: nextStart ? `${start}-${Math.max(start, Number(nextStart) - 1)}` : `${start}+`,
        fee,
        amount: fee,
      };
    })
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'zh-Hant'));

  return {
    shippingTotal: breakdown.reduce((sum, item) => sum + item.fee, 0),
    breakdown,
  };
}
