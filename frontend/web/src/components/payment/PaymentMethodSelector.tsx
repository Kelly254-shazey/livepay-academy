import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { http } from '@/lib/http';

interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  country: string;
  lastFour?: string;
  brand?: string;
  isDefault: boolean;
}

interface PaymentProvider {
  provider: string;
  countries: string[];
  paymentTypes: string[];
  fees: { fixed?: number; percentage?: number };
}

interface Props {
  onSelect: (method: PaymentMethod) => void;
  amount: number;
  currency: string;
}

export function PaymentMethodSelector({ onSelect, amount, currency }: Props) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [availableProviders, setAvailableProviders] = useState<PaymentProvider[]>([]);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddNew, setShowAddNew] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPaymentMethods = async () => {
      try {
        const data = await http<{ methods: PaymentMethod[]; providers: PaymentProvider[] }>('/payment-methods');

        if (!isMounted) {
          return;
        }

        setMethods(Array.isArray(data.methods) ? data.methods : []);
        setAvailableProviders(Array.isArray(data.providers) ? data.providers : []);
        setUserCountry(data.methods.find((method) => method.country)?.country ?? null);
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPaymentMethods();
    return () => {
      isMounted = false;
    };
  }, []);

  const calculateFees = (provider: string) => {
    const prov = availableProviders.find((p) => p.provider === provider);
    if (!prov?.fees) return { fixed: 0, percentage: 0, total: 0 };

    const fixed = prov.fees.fixed || 0;
    const percentage = ((prov.fees.percentage || 0) / 100) * amount;
    const total = fixed + percentage;

    return { fixed, percentage, total: Math.round(total * 100) / 100 };
  };

  const getPaymentTypeIcon = (type: string): ReactNode => {
    const icons: Record<string, string> = {
      credit_card: '💳',
      debit_card: '💳',
      paypal: '🅿️',
      bank_transfer: '🏦',
      mobile_money: '📱',
      digital_wallet: '👛',
      upi: '🔄'
    };
    return icons[type] || '💰';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-slate-500">Loading payment methods...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing Methods */}
      {methods.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Your Payment Methods</h3>
          <div className="space-y-2">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => onSelect(method)}
                className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPaymentTypeIcon(method.type)}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                        {method.brand || method.provider}
                        {method.lastFour && ` •••• ${method.lastFour}`}
                      </p>
                      {method.isDefault && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">Default</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {currency} {(amount + calculateFees(method.provider).total).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      +{currency} {calculateFees(method.provider).total.toFixed(2)} fees
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add New Method */}
      <div>
        <button
          onClick={() => setShowAddNew(!showAddNew)}
          className="w-full p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition text-slate-600 dark:text-slate-400 text-sm font-medium"
        >
          + Add New Payment Method
        </button>

        {showAddNew && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {userCountry ? `Available in your country (${userCountry})` : 'Available payment methods'}
            </p>
            {availableProviders.map((provider) => {
              const fees = provider.paymentTypes.map((type) => {
                const fixed = provider.fees?.fixed || 0;
                const percentage = ((provider.fees?.percentage || 0) / 100) * amount;
                return { type, total: fixed + percentage };
              })[0];

              return (
                <button
                  key={provider.provider}
                  onClick={() => {
                    // In real app, would show form to add new method
                    onSelect({
                      id: `new-${provider.provider}`,
                      type: provider.paymentTypes[0],
                      provider: provider.provider as any,
                      country: userCountry || '',
                      isDefault: false
                    });
                  }}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                        {provider.provider}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {provider.paymentTypes.join(', ')}
                      </p>
                    </div>
                    {fees && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {currency} {fees.total.toFixed(2)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* No Methods */}
      {methods.length === 0 && !showAddNew && (
        <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
          No payment methods added yet
        </div>
      )}
    </div>
  );
}
