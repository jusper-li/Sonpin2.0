export interface ShippingCategoryRow {
  id: string;
  name: string;
  quantity: number | null;
  quantity_to: number | null;
  amount: number | null;
}

export interface ShippingQuoteItem {
  productId: string;
  quantity: number;
}

export interface ShippingQuoteBreakdownItem {
  breakdownKey: string;
  productId: string;
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

const normalizeQuantity = (value: number | null | undefined) => Math.max(0, Number(value || 0));

const pickTierForQuantity = (quantity: number, categories: ShippingCategoryRow[]) => {
  const candidates = categories
    .filter((row) => row.quantity !== null && row.amount !== null)
    .sort((a, b) => {
      const quantityA = Number(a.quantity || 0);
      const quantityB = Number(b.quantity || 0);
      if (quantityA !== quantityB) return quantityA - quantityB;
      const endA = a.quantity_to === null ? Number.MAX_SAFE_INTEGER : Number(a.quantity_to || 0);
      const endB = b.quantity_to === null ? Number.MAX_SAFE_INTEGER : Number(b.quantity_to || 0);
      return endA - endB;
    });

  if (candidates.length === 0) return null;

  const exactMatch = candidates.find((row) => {
    const start = Number(row.quantity || 0);
    const end = row.quantity_to === null ? null : Number(row.quantity_to);
    return quantity >= start && (end === null || quantity <= end);
  });

  if (exactMatch) return exactMatch;

  const floorMatch = [...candidates]
    .reverse()
    .find((row) => quantity >= Number(row.quantity || 0));

  return floorMatch || candidates[0];
};

const formatQuantityLabel = (row: ShippingCategoryRow | null) => {
  if (!row) return '';

  const start = Math.max(1, Number(row.quantity || 1));
  const end = row.quantity_to === null ? null : Math.max(start, Number(row.quantity_to || 0));
  return end === null ? `${start}+` : `${start}-${end}`;
};

export function calculateShippingQuote(
  items: ShippingQuoteItem[],
  products: ProductShippingRow[],
  categories: ShippingCategoryRow[]
): ShippingQuoteResult {
  const productById = new Map(products.map((product) => [product.id, product]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const categoriesByName = new Map<string, ShippingCategoryRow[]>();

  for (const category of categories) {
    const groupName = category.name.trim();
    if (!groupName) continue;

    const existing = categoriesByName.get(groupName) || [];
    existing.push(category);
    categoriesByName.set(groupName, existing);
  }

  const groupedItems = new Map<
    string,
    {
      groupName: string;
      productId: string;
      quantity: number;
    }
  >();

  for (const item of items) {
    const quantity = normalizeQuantity(item.quantity);
    if (quantity <= 0) continue;

    const product = productById.get(item.productId);
    const categoryId = product?.shipping_category_id;
    if (!categoryId) continue;

    const category = categoryById.get(categoryId);
    if (!category) continue;

    const groupName = category.name.trim();
    if (!groupName) continue;

    const existing = groupedItems.get(groupName);
    if (existing) {
      existing.quantity += quantity;
    } else {
      groupedItems.set(groupName, {
        groupName,
        productId: item.productId,
        quantity,
      });
    }
  }

  const breakdown = Array.from(groupedItems.values())
    .map((group) => {
      const matchingCategories = categoriesByName.get(group.groupName) || [];
      const chosen =
        pickTierForQuantity(group.quantity, matchingCategories) ||
        matchingCategories[0] ||
        null;

      if (!chosen) return null;

      const fee = Math.max(0, Number(chosen.amount || 0));
      const quantityLabel = formatQuantityLabel(chosen);

      return {
        breakdownKey: `${group.groupName}:${chosen.id}`,
        productId: group.productId,
        categoryId: chosen.id,
        categoryName: group.groupName,
        quantity: group.quantity,
        quantityLabel,
        amount: fee,
        fee,
      };
    })
    .filter((item): item is ShippingQuoteBreakdownItem => item !== null)
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'zh-Hant'));

  return {
    shippingTotal: breakdown.reduce((sum, item) => sum + item.fee, 0),
    breakdown,
  };
}
