import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Sale } from '../../types';
import { formatRupee, formatDate } from '../../lib/formatters';
import {
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Flame,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Eye,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { StatusChip } from '../../components/ui/StatusChip';
import { Button } from '../../components/ui/Button';
import { BillPreviewModal } from '../../components/modals/BillPreviewModal';
import { ServerTimestampNotice } from '../../components/ui/ServerTimestampNotice';

export const StaffHomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [selectedSaleForPreview, setSelectedSaleForPreview] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecent = async () => {
    setIsLoading(true);
    try {
      const sales = await api.sales.getSales({ limit: 6 });
      setRecentSales(sales);
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const actionButtons = [
    {
      to: '/sales/new',
      title: 'New Sale',
      desc: 'Sell jewellery to customer',
      icon: <ShoppingBag className="h-6 w-6 text-white" />,
      bg: 'bg-[#9B1C31] hover:bg-[#84192B]',
      border: 'border-[#9B1C31]',
      text: 'text-white',
    },
    {
      to: '/purchases/new',
      title: 'New Purchase',
      desc: 'Stock purchase from supplier',
      icon: <ShoppingCart className="h-6 w-6 text-[#9B1C31]" />,
      bg: 'bg-white hover:bg-[#FDF2F4]',
      border: 'border-[#E8DFD5] hover:border-[#9B1C31]',
      text: 'text-[#2B2B2B]',
    },
    {
      to: '/job-work/new?type=POLISH',
      title: 'Polish Work',
      desc: 'Issue or receive polish ornaments',
      icon: <Sparkles className="h-6 w-6 text-[#B8893B]" />,
      bg: 'bg-white hover:bg-[#FAF6EF]',
      border: 'border-[#E8DFD5] hover:border-[#B8893B]',
      text: 'text-[#2B2B2B]',
    },
    {
      to: '/job-work/new?type=MEENA',
      title: 'Meena Work',
      desc: 'Enamel art issue or receive',
      icon: <Flame className="h-6 w-6 text-cyan-600" />,
      bg: 'bg-white hover:bg-cyan-50/50',
      border: 'border-[#E8DFD5] hover:border-cyan-300',
      text: 'text-[#2B2B2B]',
    },
    {
      to: '/vouchers/new?type=RECEIPT',
      title: 'Receipt (Money In)',
      desc: 'Cash or bank payment from party',
      icon: <ArrowDownLeft className="h-6 w-6 text-emerald-600" />,
      bg: 'bg-white hover:bg-emerald-50/50',
      border: 'border-[#E8DFD5] hover:border-emerald-300',
      text: 'text-[#2B2B2B]',
    },
    {
      to: '/vouchers/new?type=PAYMENT',
      title: 'Payment (Money Out)',
      desc: 'Pay supplier or artisan',
      icon: <ArrowUpRight className="h-6 w-6 text-rose-600" />,
      bg: 'bg-white hover:bg-rose-50/50',
      border: 'border-[#E8DFD5] hover:border-rose-300',
      text: 'text-[#2B2B2B]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header & Server Invariant Notice */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#2B2B2B]">
              Namaste, {user?.name || 'Staff Member'}
            </h1>
            <p className="text-xs text-[#66615C]">
              Kumkum Payal Rapid Accounting & Job Work Console
            </p>
          </div>
          <div className="shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/sales/new')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Rapid New Sale
            </Button>
          </div>
        </div>

        {/* Server Timestamp Invariant Banner */}
        <ServerTimestampNotice />
      </div>

      {/* 6 Big Action Buttons */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#AFA190]">
          Quick Entry Operations
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {actionButtons.map((btn) => (
            <button
              key={btn.title}
              onClick={() => navigate(btn.to)}
              className={`p-4 sm:p-5 rounded-2xl border text-left shadow-soft transition-all duration-150 active:scale-[0.98] flex flex-col justify-between min-h-[110px] ${btn.bg} ${btn.border} ${btn.text}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-black/5 shrink-0">{btn.icon}</div>
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold leading-tight">{btn.title}</div>
                <div className="text-[11px] opacity-75 mt-0.5 truncate">{btn.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Self-Created Entries List with 1-Click WhatsApp Send */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-[#F5EFE6] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#2B2B2B]">My Recent Sales</h3>
            <p className="text-xs text-[#8C857E]">
              Entries created by your login with current payment status
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/staff/entries')}
          >
            View All My Entries &rarr;
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#8C857E]">
            Loading your entries...
          </div>
        ) : recentSales.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8C857E]">
            You have not recorded any sales yet today. Click "New Sale" above to get started!
          </div>
        ) : (
          <div className="divide-y divide-[#F5EFE6]">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF6EF]/50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#2B2B2B]">
                      Bill #{sale.bill_no || sale.bill_number}
                    </span>
                    <StatusChip status={sale.payment_status || 'OPEN'} />
                  </div>
                  <div className="text-xs text-[#66615C]">
                    Party: <span className="font-semibold text-[#2B2B2B]">{sale.party_name}</span>
                    {sale.party_phone && (
                      <span className="ml-2 text-[#8C857E]">({sale.party_phone})</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#8C857E]">
                    Due: {formatDate(sale.due_date)}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-[#F5EFE6]">
                  <div className="text-right sm:mr-3">
                    <div className="text-sm font-bold text-[#9B1C31] tabular-nums">
                      {formatRupee(sale.total_amount)}
                    </div>
                    {sale.outstanding_amount !== undefined && Number(sale.outstanding_amount) > 0 && (
                      <div className="text-[11px] text-rose-600 font-semibold tabular-nums">
                        Due: {formatRupee(sale.outstanding_amount)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedSaleForPreview(sale)}
                      title="Preview Invoice JPG"
                      className="p-2 rounded-xl text-[#8C857E] hover:text-[#2B2B2B] hover:bg-[#F5EFE6] transition"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => setSelectedSaleForPreview(sale)}
                      leftIcon={<Send className="h-3.5 w-3.5" />}
                    >
                      Send Bill
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Preview & WhatsApp Modal */}
      {selectedSaleForPreview && (
        <BillPreviewModal
          isOpen={!!selectedSaleForPreview}
          onClose={() => setSelectedSaleForPreview(null)}
          sale={selectedSaleForPreview}
          onSentSuccess={() => fetchRecent()}
        />
      )}
    </div>
  );
};
