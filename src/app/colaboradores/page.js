'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { QrCodeIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PartnerDashboard() {
  const [partner, setPartner] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
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
        await supabase.auth.signOut();
        router.push('/colaboradores/login');
        return;
      }

      setPartner(collabData || adminData);
      fetchReservations(session.user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/colaboradores/login');
    }
  };

  const fetchReservations = async (partnerId) => {
    try {
      const res = await fetch(`/api/partner/reservations?partnerId=${partnerId}`);
      if (!res.ok) throw new Error('Error fetching reservations');
      
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Error al cargar las reservas recientas');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/colaboradores/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">
                {partner?.company_name || 'Portal Colaboradores'}
              </h1>
              <p className="text-zinc-400 text-xs">Gestión de reservas</p>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="Cerrar sesión"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <section className="mb-12">
          <Link 
            href="/colaboradores/validar"
            className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-6 text-center shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
          >
            <QrCodeIcon className="h-12 w-12 mx-auto mb-4 text-white" />
            <h2 className="text-xl font-bold text-white mb-1">Validar Entrada</h2>
            <p className="text-purple-100 text-sm">Escanea el QR o introduce el localizador</p>
          </Link>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-100">Reservas Recientes</h2>
            <span className="text-sm text-zinc-500 font-mono">{reservations.length} total</span>
          </div>

          {reservations.length === 0 ? (
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 text-center">
              <p className="text-zinc-500">No hay reservas recientes para tus planes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((res) => (
                <div 
                  key={res.id} 
                  className={`bg-zinc-900/60 backdrop-blur-sm border rounded-2xl p-4 transition-colors ${
                    res.validated_at ? 'border-zinc-800 opacity-60' : 'border-zinc-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-white mb-1">
                        {res.customer_name || 'Cliente'} 
                        <span className="text-zinc-500 font-normal ml-2 text-sm">{res.customer_email}</span>
                      </h3>
                      <p className="text-sm text-zinc-400 line-clamp-1">
                        {res.plans?.title} {res.plan_tickets?.name ? `— ${res.plan_tickets.name}` : ''}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold text-white bg-zinc-800 px-3 py-1 rounded-lg">
                        {res.localizador || '---'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs font-semibold">
                        {res.quantity} {res.quantity === 1 ? 'PAX' : 'PAX'}
                      </span>
                      {res.total_amount > 0 && (
                        <span className="text-green-400 font-medium">
                          {(res.total_amount / 100).toFixed(2)}€
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {res.validated_at ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Consumido {format(new Date(res.validated_at), 'HH:mm', { locale: es })}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-medium flex items-center gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
