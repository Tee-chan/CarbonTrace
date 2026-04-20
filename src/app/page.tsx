import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth0.getSession();
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Dynamic Earthy Background Blobs */}
      <div className="glow-leaf w-[600px] h-[600px] top-[-100px] left-[-200px]"></div>
      <div className="glow-leaf w-[400px] h-[400px] bottom-[-50px] right-[-100px] bg-gradient-to-tr from-accent-sun to-earth-200"></div>

      <nav className="absolute top-0 w-full p-8 flex justify-between items-center max-w-6xl mx-auto z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-earth-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span className="font-logo font-bold text-2xl text-earth-900 tracking-tight">CarbonTrace</span>
        </div>
        <a href="/auth/login" className="btn-outline">
          Sign In
        </a>
      </nav>

      <div className="glass-panel p-10 md:p-14 max-w-2xl text-center z-10 animate-float">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-earth-100 text-earth-700 text-sm font-semibold mb-8">
          <span className="text-xl">🌍</span> Earth Day 2026 Challenge 
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-earth-950 tracking-tight leading-tight mb-6">
          Your AI carbon footprint <br/> agent.
        </h1>
        
        <p className="text-earth-700 text-lg md:text-xl mb-10 leading-relaxed max-w-lg mx-auto">
          Connect your Gmail and watch the Gemini agent surface your environmental impact in seconds—no manual entry required. We scan your receipts to track your real footprint.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/auth/login" className="btn-primary w-full sm:w-auto">
            <span>Get Started with Google</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        <div className="mt-8 text-sm text-earth-500 font-medium">
          Privately scans <span className="font-semibold text-earth-700">gmail.readonly</span>. We never store your emails.
        </div>
      </div>
    </main>
  );
}