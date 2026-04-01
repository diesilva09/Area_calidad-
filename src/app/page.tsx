'use client';

import { ShieldCheck, Users, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
        <div className="text-center animate-slide-down">
          <div className="flex justify-center animate-scale-in">
            <img 
              src="/logo.jpg" 
              alt="CalidadCoruña Logo" 
              className="h-28 w-auto max-w-[210px] sm:h-32 sm:max-w-[280px] md:h-40 md:max-w-[320px] lg:h-44 lg:max-w-[360px] object-contain"
            />
          </div>
          <h1 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900 animate-slide-up">
            Area de calidad 
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-600 animate-slide-up-delay">
            Sistema de Gestión de Calidad
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4 animate-slide-up-delay-2">
          <Button asChild className="w-full h-12 sm:h-14 md:h-16 text-sm sm:text-base md:text-lg hover:scale-105 transition-transform duration-300">
            <Link href="/login-simple?role=jefe">
              <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              <span className="text-xs sm:text-sm md:text-base">Jefe de Calidad</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full h-12 sm:h-14 md:h-16 text-sm sm:text-base md:text-lg hover:scale-105 transition-transform duration-300">
            <Link href="/login-simple?role=tecnico">
              <Wrench className="mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              <span className="text-xs sm:text-sm md:text-base">Supervisor de Calidad</span>
            </Link>
          </Button>
        </div>

        <div className="text-center animate-fade-in-delay">
          <p className="text-xs text-gray-500">
            Seleccione su rol para acceder al sistema
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.8);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fadeIn 0.8s ease-out 0.6s both;
        }
        
        .animate-slide-down {
          animation: slideDown 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.6s ease-out 0.2s both;
        }
        
        .animate-slide-up-delay {
          animation: slideUp 0.6s ease-out 0.4s both;
        }
        
        .animate-slide-up-delay-2 {
          animation: slideUp 0.6s ease-out 0.6s both;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}
