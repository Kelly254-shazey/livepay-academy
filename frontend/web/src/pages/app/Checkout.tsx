import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell, PageFrame } from '@/components/layout';
import { webApi } from '@/lib/api';
import { useSessionStore } from '@/store/session-store';
import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Checkbox,
  InlineNotice,
  LoadingBlock,
} from '@/components/ui';

export function CheckoutPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'wallet'>('card');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => ({
      title: 'Premium Session',
      creatorName: 'Creator Name',
      category: 'Education',
      sessionType: 'video',
      isRecorded: true,
      description: 'Sample session description',
      startTime: new Date().toISOString(),
      duration: 60,
      currentAttendees: 5,
      maxParticipants: 100,
      price: 49.99,
      enableChat: true,
      enableQ_A: true,
      allowReplay: true,
      materials: 'Sample materials',
      refundPolicy: 'full' as const,
    }),
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: { sessionId: string; paymentMethod: 'card' | 'paypal' | 'wallet' }) =>
      Promise.resolve({ success: true }),
    onSuccess: () => {
      navigate(`/dashboard/user`);
    },
  });

  if (sessionQuery.isLoading) return <LoadingBlock />;
  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <PageFrame>
        <div className="text-center py-12">
          <p className="text-danger">Failed to load session details</p>
        </div>
      </PageFrame>
    );
  }

  const sessionData = sessionQuery.data;
  const platformFee = sessionData.price * 0.2;
  const creatorEarns = sessionData.price * 0.8;
  const total = sessionData.price;

  return (
    <PageFrame>
      <AppShell sidebarTitle="Checkout" sidebarItems={[]}>
        <div className="grid grid-cols-12 gap-6 max-w-4xl">
          {/* Left: Session Details */}
          <div className="col-span-7 space-y-6">
            {/* Session Summary */}
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-text">Session Summary</h2>

              <div className="flex gap-4">
                <div className="h-32 w-32 rounded-lg bg-accent/20 flex items-center justify-center text-4xl">
                  🎥
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-text">{sessionData.title}</h3>
                  <p className="text-sm text-muted">{sessionData.creatorName}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge tone="default">{sessionData.category}</Badge>
                    <Badge tone="default">{sessionData.sessionType}</Badge>
                    {sessionData.isRecorded && <Badge tone="accent">Recordable</Badge>}
                  </div>
                </div>
              </div>

              <div className="border-t border-stroke/30 pt-4 space-y-2">
                <p className="text-sm text-muted">{sessionData.description}</p>
              </div>

              <div className="border-t border-stroke/30 pt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted">When</p>
                  <p className="font-medium text-text">{sessionData.startTime}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Duration</p>
                  <p className="font-medium text-text">{sessionData.duration} min</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Participants</p>
                  <p className="font-medium text-text">{sessionData.currentAttendees}/{sessionData.maxParticipants}</p>
                </div>
              </div>
            </Card>

            {/* Features */}
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-text">What's Included</h2>
              <div className="space-y-3">
                {sessionData.enableChat && (
                  <div className="flex gap-2 items-start">
                    <span className="text-accent">✓</span>
                    <span className="text-sm text-text">Live chat with creator and attendees</span>
                  </div>
                )}
                {sessionData.enableQ_A && (
                  <div className="flex gap-2 items-start">
                    <span className="text-accent">✓</span>
                    <span className="text-sm text-text">Q&A session with live answers</span>
                  </div>
                )}
                {sessionData.allowReplay && (
                  <div className="flex gap-2 items-start">
                    <span className="text-accent">✓</span>
                    <span className="text-sm text-text">Access to replay for 30 days</span>
                  </div>
                )}
                {sessionData.materials && (
                  <div className="flex gap-2 items-start">
                    <span className="text-accent">✓</span>
                    <span className="text-sm text-text">Session materials and resources</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Refund Policy */}
            <Card className="p-6 space-y-4 border-warning/30 bg-warning/5">
              <h2 className="text-lg font-semibold text-text">Refund Policy</h2>
              <p className="text-sm text-text">
                {sessionData.refundPolicy === 'full'
                  ? 'Full refund available if you don\'t attend or within 24 hours after session starts.'
                  : sessionData.refundPolicy === 'partial'
                    ? 'Partial refund (50%) available within 7 days.'
                    : 'No refunds available once purchased.'}
              </p>
            </Card>
          </div>

          {/* Right: Payment Form */}
          <div className="col-span-5">
            <Card className="p-6 space-y-6 sticky top-6">
              <h2 className="text-lg font-semibold text-text">Order Summary</h2>

              {/* Price Breakdown */}
              <div className="space-y-3 border-b border-stroke/30 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Session Price</span>
                  <span className="font-medium text-text">${sessionData.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>Platform fee (20%)</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>Creator earns (80%)</span>
                  <span className="text-accent">${creatorEarns.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-text">Total</span>
                <span className="font-bold text-accent">${total.toFixed(2)}</span>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <h3 className="font-medium text-text">Payment Method</h3>

                <label className="flex items-center p-3 border border-stroke/50 rounded-lg cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => setPaymentMethod('card')}
                >
                  <input type="radio" checked={paymentMethod === 'card'} readOnly className="mr-3" />
                  <div>
                    <p className="font-medium text-sm text-text">Credit / Debit Card</p>
                    <p className="text-xs text-muted">Visa, Mastercard, American Express</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-stroke/50 rounded-lg cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <input type="radio" checked={paymentMethod === 'paypal'} readOnly className="mr-3" />
                  <div>
                    <p className="font-medium text-sm text-text">PayPal</p>
                    <p className="text-xs text-muted">Fast and secure</p>
                  </div>
                </label>

                <label className={`flex items-center p-3 border border-stroke/50 rounded-lg cursor-pointer hover:bg-accent/5 transition-colors ${!session ? 'opacity-50' : ''}`}
                  onClick={() => setPaymentMethod('wallet')}
                >
                  <input type="radio" checked={paymentMethod === 'wallet'} readOnly className="mr-3" disabled={!session} />
                  <div>
                    <p className="font-medium text-sm text-text">LivePay Wallet</p>
                    <p className="text-xs text-muted">Balance: $0.00</p>
                  </div>
                </label>
              </div>

              {/* Card Details (conditionally shown) */}
              {paymentMethod === 'card' && (
                <div className="space-y-3 pt-3 border-t border-stroke/30">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">Card Number</label>
                    <Input placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium block">Expiry</label>
                      <Input placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium block">CVC</label>
                      <Input placeholder="123" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">Cardholder Name</label>
                    <Input placeholder="Your name" />
                  </div>
                </div>
              )}

              {/* Terms */}
              <Checkbox
                label="I agree to the terms of service and privacy policy"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
              />

              {/* CTA */}
              <Button
                onClick={() => purchaseMutation.mutate({ sessionId: sessionId!, paymentMethod })}
                disabled={!agreeToTerms || purchaseMutation.isPending}
                className="w-full"
              >
                {purchaseMutation.isPending ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </Button>

              {/* Security Note */}
              <p className="text-xs text-muted text-center">
                🔒 Your payment information is secure and encrypted
              </p>
            </Card>
          </div>
        </div>
      </AppShell>
    </PageFrame>
  );
}
