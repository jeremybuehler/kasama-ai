import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Alert, AlertDescription } from '../ui/Alert';
import { stripeService, type BillingInfo, type SubscriptionPlan } from '../../services/payments/stripeService';
import { useAuth } from '../../hooks/useAuth';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Check,
  X,
  Download
} from 'lucide-react';

interface UsageBarProps {
  label: string;
  current: number;
  limit: number;
  className?: string;
}

const UsageBar: React.FC<UsageBarProps> = ({ label, current, limit, className = '' }) => {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isUnlimited = limit === -1;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {current}/{isUnlimited ? '∞' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className={`h-2 ${percentage > 80 ? 'bg-red-100' : 'bg-gray-100'}`}
        />
      )}
      {isUnlimited && (
        <div className="h-2 bg-green-100 rounded-full">
          <div className="h-full bg-green-500 rounded-full w-full" />
        </div>
      )}
    </div>
  );
};

export const BillingDashboard: React.FC = () => {
  const { user } = useAuth();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [billing, plans] = await Promise.all([
        stripeService.getBillingInfo(user.id),
        Promise.resolve(stripeService.getPlans())
      ]);

      setBillingInfo(billing);
      setAvailablePlans(plans);
    } catch (err) {
      setError('Failed to load billing information');
      console.error('Billing load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) return;

    try {
      setProcessingPlan(planId);
      
      const session = await stripeService.createCheckoutSession(
        user.id,
        planId,
        `${window.location.origin}/billing?success=true`,
        `${window.location.origin}/billing?canceled=true`
      );

      // Redirect to Stripe Checkout
      window.location.href = `https://checkout.stripe.com/pay/${session.sessionId}`;
    } catch (err) {
      setError('Failed to initiate upgrade process');
      console.error('Upgrade error:', err);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !billingInfo?.subscriptionId) return;

    if (confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      try {
        await stripeService.cancelSubscription(user.id, false);
        await loadBillingData(); // Refresh data
      } catch (err) {
        setError('Failed to cancel subscription');
        console.error('Cancel error:', err);
      }
    }
  };

  const downloadInvoice = (invoiceUrl: string) => {
    window.open(invoiceUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      {billingInfo ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg">{billingInfo.currentPlan.name}</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${billingInfo.currentPlan.price}/{billingInfo.currentPlan.interval}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Next billing: {billingInfo.nextBillingDate?.toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Payment Method</h4>
                {billingInfo.paymentMethod ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-5 bg-gray-800 rounded text-white text-xs flex items-center justify-center">
                      {billingInfo.paymentMethod.card?.brand?.toUpperCase()}
                    </div>
                    <span>**** **** **** {billingInfo.paymentMethod.card?.last4}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">No payment method on file</span>
                )}
              </div>
            </div>

            {/* Usage Metrics */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Current Usage</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <UsageBar
                  label="AI Interactions"
                  current={billingInfo.usage.aiInteractions}
                  limit={billingInfo.currentPlan.maxAIInteractions}
                />
                <UsageBar
                  label="Assessments"
                  current={billingInfo.usage.assessments}
                  limit={billingInfo.currentPlan.maxAssessments}
                />
                <UsageBar
                  label="Learning Modules"
                  current={billingInfo.usage.learningModules}
                  limit={billingInfo.currentPlan.maxLearningModules}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                className="text-red-600 hover:bg-red-50"
              >
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">You don't have an active subscription</p>
            <p className="text-sm text-gray-500">Choose a plan below to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => (
            <Card key={plan.id} className={`relative ${billingInfo?.currentPlan.id === plan.id ? 'ring-2 ring-blue-500' : ''}`}>
              {billingInfo?.currentPlan.id === plan.id && (
                <Badge className="absolute -top-2 left-4 bg-blue-500">Current Plan</Badge>
              )}
              
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>AI Interactions: {plan.maxAIInteractions === -1 ? 'Unlimited' : plan.maxAIInteractions}</div>
                    <div>Assessments: {plan.maxAssessments === -1 ? 'Unlimited' : plan.maxAssessments}</div>
                    <div>Learning Modules: {plan.maxLearningModules === -1 ? 'Unlimited' : plan.maxLearningModules}</div>
                  </div>
                </div>

                {billingInfo?.currentPlan.id !== plan.id && (
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={processingPlan === plan.id}
                    className="w-full"
                  >
                    {processingPlan === plan.id ? 'Processing...' : 
                     billingInfo ? 'Switch Plan' : 'Choose Plan'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Invoices */}
      {billingInfo?.invoices && billingInfo.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {billingInfo.invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">
                      ${(invoice.amount_paid / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(invoice.created * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={invoice.status === 'paid' ? 'success' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                    {invoice.invoice_pdf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadInvoice(invoice.invoice_pdf!)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
