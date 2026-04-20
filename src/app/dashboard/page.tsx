import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { supabase } from '@/lib/supabase';

export default async function Dashboard() {
  const session = await auth0.getSession();

  if (!session) {
    redirect('/');
  }

  let initialScanData = null;
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock')) {
    const { data: logs, error } = await supabase
      .from('carbon_logs')
      .select('*')
      .eq('user_email', session.user.email)
      .order('created_at', { ascending: false });

    if (!error && logs && logs.length > 0) {
      const total_co2 = logs.reduce((sum, log) => sum + Number(log.co2_kg), 0);
      
      const breakdown = {
        Travel: logs.filter(l => l.category === 'Travel').reduce((s, l) => s + Number(l.co2_kg), 0),
        Food: logs.filter(l => l.category === 'Food').reduce((s, l) => s + Number(l.co2_kg), 0),
        Shopping: logs.filter(l => l.category === 'Shopping').reduce((s, l) => s + Number(l.co2_kg), 0),
      };

      const receipts = logs.slice(0, 10).map((log) => ({
        id: log.id,
        activity: log.activity,
        category: log.category,
        co2_kg: Number(log.co2_kg),
        confidence: Number(log.confidence || 1.0),
        spend_amount: log.spend_amount || null,
        date: log.receipt_date || new Date(log.created_at).toLocaleDateString(undefined, {month: 'long', day: 'numeric'})
      }));

      initialScanData = {
        total_co2,
        breakdown,
        receipts,
        ai_nudge: "You are making strong progress. Continue limiting flights and substituting shopping purchases with local equivalents.",
      };
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden p-6 md:p-12">
      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <DashboardClient user={session.user} initialData={initialScanData} />
      </div>
    </main>
  );
}