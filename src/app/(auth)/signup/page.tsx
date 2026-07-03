import Image from 'next/image'
import Link from 'next/link'
import { Hanken_Grotesk } from 'next/font/google'
import { SignupForm } from '@/features/auth/ui/SignupForm'

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function SignupPage() {
  return (
    <div className={`${hanken.className} flex min-h-screen w-full`}>

      {/* ── Left Panel ── */}
      <div className="flex flex-col w-full lg:w-[58%] bg-[#F8F9FB] px-10 py-10">

        {/* Brand mark */}
        <div>
          <Image
            src="/assets/logo/asceoft-logo-black.svg"
            alt="Asceoft"
            width={91}
            height={18}
            unoptimized
          />
          <p className="text-[9px] font-semibold tracking-[0.18em] text-gray-400 uppercase mt-1.5">
            Studio Portal
          </p>
        </div>

        {/* Form — vertically centred */}
        <div className="flex flex-col justify-center flex-1">
          <div className="w-full max-w-[340px] mx-auto">

            <div className="mb-7">
              <h1 className="text-[22px] font-semibold text-gray-900 leading-snug">
                Create your account
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Start managing your projects and clients with precision.
              </p>
            </div>

            <SignupForm />

          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            By signing up, you agree to our{' '}
            <Link href="#" className="underline hover:text-gray-500 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="underline hover:text-gray-500 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden bg-[#060D1C]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0f2044_0%,_#060D1C_70%)]" />
        <div className="relative z-10 flex flex-col items-center">
          <Image
            src="/assets/logo/asceoft-logo-white.svg"
            alt="Asceoft"
            width={162}
            height={32}
            unoptimized
          />
          <p className="text-gray-500 text-xs mt-3">[transclucent graphic placeholder]</p>
          <div className="mt-3 w-8 h-[2px] bg-indigo-500 rounded-full" />
        </div>
      </div>

    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 600,
    margin: 0,
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    color: '#000',
    border: '1px solid #ddd',
    borderRadius: '6px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  button: {
    padding: '10px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '4px',
  },
  error: {
    fontSize: '13px',
    color: '#c0392b',
    margin: 0,
  },
  success: {
    fontSize: '13px',
    color: '#27ae60',
    margin: 0,
  },
  footer: {
    fontSize: '13px',
    textAlign: 'center',
    color: '#555',
    margin: 0,
  },
  link: {
    color: '#000',
    fontWeight: 500,
  },
}