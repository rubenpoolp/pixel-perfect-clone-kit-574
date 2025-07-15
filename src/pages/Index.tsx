import React from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { FeatureShowcase } from '@/components/FeatureShowcase';
import { Benefits } from '@/components/Benefits';
import { GettingStarted } from '@/components/GettingStarted';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="bg-white flex flex-col items-stretch py-[17px] min-h-screen">
      <Header />
      
      <main className="self-center flex w-full max-w-[1504px] flex-col max-md:max-w-full">
        <Hero />
        <FeatureShowcase />
        <Benefits />
        <GettingStarted />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
