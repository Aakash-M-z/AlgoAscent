import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { staggerContainer, fadeUp, fadeIn } from '@/animations/variants';
import { PricingModal } from '@/components/PricingModal';
import type { PricingTier } from '@/types';

interface PricingTierWithPlan extends PricingTier {
  planId: 'free' | 'annual' | 'lifetime';
}

const TIERS: PricingTierWithPlan[] = [
  {
    name: 'Free Starter',
    price: '₹0',
    period: 'forever',
    description: 'Explore foundational coding challenges and track your daily streak.',
    features: [
      '50+ Curated DSA Challenges',
      'Basic Problem Categorization & Tags',
      'Daily Activity Streak Tracking',
      'Community Discussion Board',
      'Standard Solution Submissions',
    ],
    highlighted: false,
    ctaLabel: 'Start free',
    planId: 'free',
  },
  {
    name: 'Pro Annual',
    price: '₹2,499',
    period: 'year (Save 30%)',
    description: 'Comprehensive 1-year prep pack with full AI guidance and zero queue wait.',
    features: [
      'Unlimited AI Code Explanations & Hints',
      'Unlimited AI Coding & Behavioral Mock Interviews',
      'Full Assessment Studio & Proctoring Reports',
      'Priority AI GPU Queuing (Zero wait-time)',
      'Verified Pro Crown Badge on Leaderboards',
      'Direct Access to Curated Top-Company Question Banks',
    ],
    highlighted: true,
    ctaLabel: 'Start with Pro',
    planId: 'annual',
  },
  {
    name: 'Lifetime Pass',
    price: '₹4,999',
    period: 'one-time payment',
    description: 'Pay once, unlock unlimited lifetime access to all current and future features.',
    features: [
      'Lifetime Unlimited Access to all Pro features',
      'All Future Product Updates & AI Models included',
      'Exclusive Lifetime Elite Discord/Community Role',
      'Dedicated 1-on-1 Candidate Resume Review Guide',
      'Priority 24/7 Developer Support',
    ],
    highlighted: false,
    ctaLabel: 'Get Lifetime Pass',
    planId: 'lifetime',
  },
];

export function Pricing() {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-10%' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>('annual');

  const handleCtaClick = (tier: PricingTierWithPlan) => {
    if (tier.planId === 'free') {
      navigate('/dashboard');
    } else {
      setSelectedPlan(tier.planId);
      setModalOpen(true);
    }
  };

  return (
    <section
      ref={ref}
      id="pricing"
      className="relative py-32 lg:py-40 px-6 lg:px-12"
      data-testid="pricing-section"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-white/[0.012] blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeIn}
            className="inline-block text-white/35 text-[11px] font-medium letter-widest uppercase tracking-[0.2em] mb-5"
          >
            Pricing
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="text-[40px] sm:text-[52px] font-bold leading-[1.0] letter-tight text-white mb-5"
          >
            Invest in yourself.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-md mx-auto">
            Less than a gym membership. Infinitely more career-defining.
          </motion.p>
        </motion.div>

        {/* Tiers */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch"
          data-testid="pricing-grid"
        >
          {TIERS.map((tier) => (
            <motion.div
              key={tier.name}
              variants={fadeUp}
              className={`
                relative p-8 lg:p-10 rounded-2xl flex flex-col justify-between
                transition-all duration-500
                ${tier.highlighted
                  ? 'bg-[#0E0E14] border-2 border-[#FF3B1F] shadow-[0_0_40px_rgba(255,59,31,0.18)]'
                  : 'bg-white/[0.02] border border-white/[0.08] hover:border-white/20'
                }
              `}
              data-testid={`pricing-card-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-8 px-3.5 py-1 bg-[#FF3B1F] text-white text-[11px] font-bold letter-wider uppercase tracking-[0.14em] rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div>
                <div className="mb-4">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                    {tier.name}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                      {tier.price}
                    </span>
                    <span className="text-white/40 text-xs font-medium">
                      / {tier.period}
                    </span>
                  </div>
                </div>

                <p className="text-white/45 text-sm mb-8 leading-relaxed min-h-[40px]">
                  {tier.description}
                </p>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={() => handleCtaClick(tier)}
                className={`
                  block w-full py-3.5 rounded-xl text-sm font-bold text-center mb-8 cursor-pointer
                  transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                  ${tier.highlighted
                    ? 'bg-[#FF3B1F] text-white hover:bg-[#E63219] shadow-lg shadow-[#FF3B1F]/20'
                    : 'border border-white/12 text-white/70 hover:border-white/25 hover:text-white bg-white/[0.02]'
                  }
                `}
                data-testid={`pricing-cta-${tier.planId}`}
              >
                {tier.ctaLabel}
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {tier.features.map((feature: string) => (
                  <li key={feature} className="flex items-start gap-3 text-white/55 text-sm">
                    <svg className="w-4 h-4 text-[#FF3B1F] flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer & Guarantees */}
        <div className="text-center mt-12 space-y-3">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors underline underline-offset-4"
          >
            Want month-to-month billing? View full pricing & FAQs →
          </Link>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-white/30 text-sm"
          >
            Instant activation • Secure payment via Razorpay / UPI • 30-day money-back guarantee.
          </motion.p>
        </div>

        {/* Pricing Checkout Modal */}
        <PricingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialPlan={selectedPlan}
        />
      </div>
    </section>
  );
}
