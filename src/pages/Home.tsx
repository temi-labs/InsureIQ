import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, ArrowRight, Activity, Users, Lock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { appConfig } from '../config';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-[var(--color-primary)] selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-[var(--color-primary)]"
          >
            <Shield className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-gray-900">{appConfig.name}</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="text-sm font-medium bg-[var(--color-primary)] text-white px-4 py-2 rounded-full hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm hover:shadow">
              Get Started
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            
            {/* Hero Text */}
            <motion.div 
              className="lg:col-span-6 text-center lg:text-left mb-16 lg:mb-0"
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[var(--color-primary)] text-sm font-semibold mb-6 border border-orange-100 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-[var(--color-primary)]"></span>
                Next-Gen Insurance Management
              </motion.div>
              
              <motion.h1 variants={fadeIn} className="text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                Manage your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-gray-900">policies &amp; claims</span> with ease.
              </motion.h1>
              
              <motion.p variants={fadeIn} className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                A unified, secure, and intelligent platform designed to simplify how you track policies, process claims, and analyze financial performance.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-full text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] shadow-lg shadow-[var(--color-primary)]/20 transition-all hover:-translate-y-0.5">
                  Start for free <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-full text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Sign in to your account
                </Link>
              </motion.div>

              <motion.div variants={fadeIn} className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card required</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Encrypted data</div>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <div className="lg:col-span-6 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, delay: 0.2, type: 'spring' }}
                className="relative z-10 bg-white rounded-3xl shadow-2xl p-4 sm:p-6 border border-gray-100"
              >
                {/* Mock UI Dashboard Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-gray-100 overflow-hidden shadow-sm">
                      <img src={'https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-dashboard/assets/img/bruce-mars.jpg'} alt="User" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Welcome back</div>
                      <div className="text-xs text-gray-500">Your dashboard is ready</div>
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-orange-50 rounded-full border border-orange-100"></div>
                </div>

                {/* Mock Financials */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-2xl p-5 text-white shadow-md">
                    <div className="text-orange-100 text-xs font-medium mb-1">Total Income</div>
                    <div className="truncate text-xl sm:text-2xl font-bold" title="$42,500.00">$42,500.00</div>
                    <div className="mt-4 text-xs font-medium text-orange-200">Active Policies: 12</div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="text-gray-500 text-xs font-medium mb-1">Total Paid</div>
                    <div className="truncate text-xl sm:text-2xl font-bold text-gray-900" title="$18,200.00">$18,200.00</div>
                    <div className="mt-4 text-xs font-medium text-gray-400">Approved Claims: 4</div>
                  </div>
                </div>

                {/* Mock Activity */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/80">
                  <div className="text-sm font-bold text-gray-900 mb-4">Recent Activity</div>
                  <div className="space-y-3">
                     {[1, 2, 3].map((i) => (
                       <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                         <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center text-[var(--color-primary)]">
                           <Activity className="w-4 h-4" />
                         </div>
                         <div className="flex-1">
                           <div className="h-2 w-24 bg-gray-200 rounded-full mb-2"></div>
                           <div className="h-1.5 w-16 bg-gray-100 rounded-full"></div>
                         </div>
                         <div className="h-4 w-4 text-gray-300"><ChevronRight className="w-4 h-4"/></div>
                       </div>
                     ))}
                  </div>
                </div>
              </motion.div>

              {/* Decorative Blur blobs */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-sm max-h-sm bg-orange-300 rounded-full blur-[100px] opacity-20 -z-10 pointer-events-none"></div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#EFDEC7] rounded-full blur-[80px] opacity-40 -z-10 pointer-events-none"></div>
            </div>
            
          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-gray-600">A complete suite of tools to manage your insurance portfolio securely and efficiently.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-[var(--color-primary)] mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Bank-grade Security</h3>
              <p className="text-gray-600 text-sm">Your data is encrypted and stored securely. We take privacy seriously so you can rest easy.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-[var(--color-primary)] mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Real-time Analytics</h3>
              <p className="text-gray-600 text-sm">Track your income, paid claims, and projected yearly performance all in one place.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-[var(--color-primary)] mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Multi-user Support</h3>
              <p className="text-gray-600 text-sm">Whether you're an individual or an admin managing multiple profiles, we've got you covered.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 pt-16 pb-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6 text-white">
                <Shield className="w-6 h-6 text-[var(--color-primary)]" />
                <span className="text-xl font-bold">{appConfig.name}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                A comprehensive insurance management dashboard and portal for policies, claims, and activity tracking. Designed for modern administrative needs.
              </p>
            </div>
            
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <h4 className="text-white font-semibold mb-4">Platform</h4>
                <ul className="space-y-3">
                  <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Sign in</Link></li>
                  <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Create account</Link></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Resources</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} {appConfig.companyDetails.name}. All rights reserved.</p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              Designed by{' '}
              <a 
                href="https://github.com/temilawal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-white hover:text-[var(--color-primary)] transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1px] auto after:w-full after:origin-bottom-right after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300 after:bg-[var(--color-primary)]"
                title="View Temi's GitHub"
              >
                Temi lawal
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

