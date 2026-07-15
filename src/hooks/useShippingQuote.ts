import { useEffect, useMemo, useState } from 'react';
import { isMissingSupabaseTableError, supabase } from '../lib/supabase';
import type { CartItem } from '../contexts/CartContext';
import { calculateShippingQuote, type ShippingQuoteBreakdownItem } from '../lib/shipping';

interface ShippingQuoteState {
  loading: boolean;
  shippingTotal: number;
  breakdown: ShippingQuoteBreakdownItem[];
  error: string | null;
}

const initialState: ShippingQuoteState = {
  loading: true,
  shippingTotal: 0,
  breakdown: [],
  error: null,
};

export function useShippingQuote(items: CartItem[]) {
  const [state, setState] = useState<ShippingQuoteState>(initialState);
  const serializedItems = useMemo(
    () => items.map((item) => `${item.productId}:${item.quantity}`).join('|'),
    [items]
  );

  useEffect(() => {
    if (!items.length) {
      setState({
        loading: false,
        shippingTotal: 0,
        breakdown: [],
        error: null,
      });
      return;
    }

    let cancelled = false;

    const loadShippingQuote = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const productIds = Array.from(new Set(items.map((item) => item.productId)));
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, shipping_category_id')
          .in('id', productIds);

        if (productsError) throw productsError;

        const shippingCategoryIds = Array.from(
          new Set((products || []).map((product) => product.shipping_category_id).filter(Boolean))
        );

        let shippingCategories: Array<{
          id: string;
          name: string;
          quantity: number | null;
          quantity_to: number | null;
          amount: number | null;
        }> = [];

        if (shippingCategoryIds.length > 0) {
          const { data, error } = await supabase
            .from('shipping_categories')
            .select('id, name, quantity, quantity_to, amount, is_active')
            .in('id', shippingCategoryIds)
            .order('name')
            .order('quantity', { ascending: true });

          if (error) throw error;
          shippingCategories = data || [];

          const shippingCategoryNames = Array.from(
            new Set(shippingCategories.map((category) => category.name).filter(Boolean))
          );

          if (shippingCategoryNames.length > 0) {
            const { data: groupedCategories, error: groupedError } = await supabase
              .from('shipping_categories')
              .select('id, name, quantity, quantity_to, amount, is_active')
              .in('name', shippingCategoryNames)
              .eq('is_active', true)
              .order('name')
              .order('quantity', { ascending: true });

            if (groupedError) throw groupedError;
            shippingCategories = groupedCategories || [];
          }
        }

        const quote = calculateShippingQuote(items, products || [], shippingCategories);
        if (cancelled) return;

        setState({
          loading: false,
          shippingTotal: quote.shippingTotal,
          breakdown: quote.breakdown,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;

        if (isMissingSupabaseTableError(error)) {
          setState({
            loading: false,
            shippingTotal: 0,
            breakdown: [],
            error: null,
          });
          return;
        }

        console.error('Failed to load shipping quote:', error);
        setState({
          loading: false,
          shippingTotal: 0,
          breakdown: [],
          error: error instanceof Error ? error.message : 'Failed to calculate shipping',
        });
      }
    };

    void loadShippingQuote();

    return () => {
      cancelled = true;
    };
  }, [serializedItems, items]);

  return state;
}
