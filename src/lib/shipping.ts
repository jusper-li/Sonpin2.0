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
  unitQuantity: number;
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
      categoryId: string;
      categoryName: string;
      quantity: number;
      unitQuantity: number;
      amount: number;
    }
  >();

  for (const item of items) {
    const product = productById.get(item.productId);
    const categoryId = product?.shipping_category_id;
    if (!categoryId) continue;

    const category = categoryById.get(categoryId);
    if (!category) continue;

    const unitQuantity = Math.max(1, Number(category.quantity || 1));
    const amount = Math.max(0, Number(category.amount || 0));
    const quantity = Math.max(0, Number(item.quantity || 0));
    if (quantity <= 0) continue;

    const existing = grouped.get(categoryId);
    if (existing) {
      existing.quantity += quantity;
      continue;
    }

    grouped.set(categoryId, {
      categoryId,
      categoryName: category.name,
      quantity,
      unitQuantity,
      amount,
    });
  }

  const breakdown = Array.from(grouped.values())
    .map((entry) => {
      const fee = Math.ceil(entry.quantity / entry.unitQuantity) * entry.amount;
      return {
        ...entry,
        fee,
      };
    })
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'zh-Hant'));

  return {
    shippingTotal: breakdown.reduce((sum, item) => sum + item.fee, 0),
    breakdown,
  };
}
