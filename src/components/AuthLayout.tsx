import { ReactNode } from 'react';
import { Hexagon } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F5F5] text-gray-900 flex items-center justify-center font-sans p-4 sm:p-8">
      <div className="w-full max-w-[1200px] min-h-[700px] flex flex-col lg:flex-row rounded-[2rem] overflow-hidden shadow-xl bg-white border border-gray-100">
        
        {/* Left Side (Visuals) */}
        <div className="hidden lg:flex w-1/2 flex-col relative p-12 bg-gradient-to-br from-[#FFF5F0] via-[#FFEDDA] to-[#FFF5F0] overflow-hidden justify-center items-start">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#EC5E2A] opacity-10 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3"></div>
           <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#EC5E2A] opacity-10 rounded-full blur-[100px] transform -translate-x-1/3 translate-y-1/3"></div>

           <div className="z-10 relative mb-12">
             <h1 className="text-4xl leading-tight font-bold mb-4 tracking-tight text-gray-900">Get Started<br/>with Us</h1>
             <p className="text-gray-600 text-sm max-w-[240px]">Complete these easy steps to register your account and manage your policies.</p>
           </div>
           
           {/* Steps Area */}
           <div className="z-10 relative flex gap-4 w-full">
             <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold mb-4">1</div>
                <p className="text-gray-900 font-medium text-sm">Sign up your<br/>account</p>
             </div>
             
             <div className="flex-1 bg-white/60 backdrop-blur-md border border-white/40 rounded-xl p-5 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold mb-4">2</div>
                <p className="text-gray-500 font-medium text-sm">Set up your<br/>workspace</p>
             </div>
             
             <div className="flex-1 bg-white/60 backdrop-blur-md border border-white/40 rounded-xl p-5 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold mb-4">3</div>
                <p className="text-gray-500 font-medium text-sm">Set up your<br/>profile</p>
             </div>
           </div>

        </div>

        {/* Right Side (Form) */}
        <div className="w-full lg:w-1/2 flex flex-col relative py-8 px-6 sm:px-12 md:px-16 lg:px-24 justify-center bg-white">
          <div className="hidden sm:block absolute top-6 right-6 sm:top-8 sm:right-8">
            <a href="/" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to Home
            </a>
          </div>
          <div className="w-full max-w-sm mx-auto">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}

