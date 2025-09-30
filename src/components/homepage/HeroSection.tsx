
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import predictlabIcon from '@/assets/predictlab-icon.png';

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-vet-blue-50 via-white to-vet-green-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header/Navbar */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-3">
            <img src={predictlabIcon} alt="PredictLab" className="w-12 h-12" />
            <span className="text-2xl font-bold text-gray-800">PredictLab</span>
          </div>
          <Link to="/login">
            <Button variant="outline" className="text-vet-blue-600 border-vet-blue-600 hover:bg-vet-blue-50">
              Login
            </Button>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              PredictLab: A Inteligência Artificial a Serviço do{' '}
              <span className="bg-gradient-to-r from-vet-blue-600 to-vet-green-600 bg-clip-text text-transparent">
                Diagnóstico Veterinário
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              O assistente de IA que otimiza seu tempo e aprimora suas decisões clínicas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-vet-blue-600 to-vet-green-600 hover:from-vet-blue-700 hover:to-vet-green-700 text-white px-8 py-4 text-lg"
                >
                  Experimentar PredictLab Grátis
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto border-vet-blue-600 text-vet-blue-600 hover:bg-vet-blue-50 px-8 py-4 text-lg"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-vet-blue-600 to-vet-green-600 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-white font-bold text-xl">🎥</span>
                  </div>
                  <p className="text-gray-600">Vídeo demonstrativo da interface do PredictLab em ação</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
