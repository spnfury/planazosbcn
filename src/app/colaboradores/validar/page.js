'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { QrCodeIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ValidateReservation() {
  const [partner, setPartner] = useState(null);
  const [localizador, setLocalizador] = useState('');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null); // { success: boolean, message: string, reservation: object }
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/colaboradores/login');
      return;
    }

    try {
      const { data: collabData } = await supabase
        .from('collaborators')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!collabData && !adminData) {
        router.push('/colaboradores/login');
        return;
      }

      setPartner(collabData || adminData);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/colaboradores/login');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!localizador.trim() || localizador.length < 5) {
      toast.error('Introduce un localizador válido');
      return;
    }

    setValidating(true);
    setResult(null);

    try {
      const res = await fetch('/api/partner/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localizador,
          partnerId: partner.id
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: data.message,
          reservation: data.reservation
        });
        toast.success('¡Entrada validada correctamente!');
        setLocalizador(''); // Reset for next scan
      } else {
        setResult({
          success: false,
          message: data.error,
          reservation: data.reservation // Might be null or contain the already validated info
        });
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Error al conectar con el servidor');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 flex flex-col">
        <Link 
          href="/colaboradores" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors self-start"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Volver al panel</span>
        </Link>

        {/* Validation Form */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-4">
              <QrCodeIcon className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Validar Entrada</h1>
            <p className="text-zinc-400 text-sm">Introduce el código localizador de 6 caracteres del cliente.</p>
          </div>

          <form onSubmit={handleValidate} className="space-y-6">
            <div>
              <input
                type="text"
                value={localizador}
                onChange={(e) => setLocalizador(e.target.value.toUpperCase())}
                placeholder="Ej. PLN-8B4X"
                autoComplete="off"
                className="w-full text-center text-3xl font-mono tracking-widest px-4 py-6 bg-zinc-950 border border-zinc-800 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all uppercase"
                disabled={validating}
              />
            </div>

            <button
              type="submit"
              disabled={validating || localizador.length < 3}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95"
            >
              {validating ? (
                <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
              ) : (
                'Validar Entrada'
              )}
            </button>
          </form>
        </div>

        {/* Validation Result */}
        {result && (
          <div className={`p-6 rounded-2xl border backdrop-blur-md animate-fade-in-up ${
            result.success 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-start gap-4">
              {result.success ? (
                <CheckCircleIcon className="h-10 w-10 text-emerald-400 shrink-0" />
              ) : (
                <XCircleIcon className="h-10 w-10 text-red-400 shrink-0" />
              )}
              
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-1 ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.success ? 'Reserva Válida' : 'Error en la validación'}
                </h3>
                <p className="text-zinc-300 text-sm mb-4">
                  {result.message}
                </p>

                {result.reservation && (
                  <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 space-y-2 mt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">Cliente</span>
                      <span className="font-semibold text-white">{result.reservation.customer_name || 'Anónimo'}</span>
                    </div>
                    {result.reservation.plans?.title && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500">Plan</span>
                        <span className="text-right text-zinc-300 max-w-[200px] truncate">
                          {result.reservation.plans.title}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm border-t border-zinc-800 pt-2 mt-2">
                      <span className="text-zinc-500">Cantidad</span>
                      <span className="font-bold text-lg text-white">
                        {result.reservation.quantity} {result.reservation.quantity === 1 ? 'PAX' : 'PAX'}
                      </span>
                    </div>
                    
                    {/* If it was an error because already validated */}
                    {!result.success && result.reservation.validated_at && (
                      <div className="mt-4 pt-4 border-t border-red-500/20">
                        <p className="text-xs text-red-300 bg-red-500/10 p-3 rounded-lg flex flex-col gap-1">
                          <span className="font-bold uppercase tracking-wider">⚠️ Atención</span>
                          <span>Esta entrada se marcó como consumida el:</span>
                          <span className="font-mono mt-1 text-red-200">
                            {format(new Date(result.reservation.validated_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
